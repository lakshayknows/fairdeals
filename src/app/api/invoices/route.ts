import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createInvoiceSchema, invoiceListQuerySchema } from "@/lib/validators";
import { calcLineItem, calcInvoiceTotals, isIntraState } from "@/lib/gst";
import { getNextDocNumber, DOC_PREFIXES } from "@/lib/docNumber";
import { logError } from "@/lib/logger";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

const BUSINESS_STATE_CODE = process.env.BUSINESS_STATE_CODE ?? "07";

// GET /api/invoices — list with optional filters
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "invoices:GET"), 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = invoiceListQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status, partyId, from, to, page, limit, docType, financialYear } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(partyId && { partyId }),
    ...(docType && { docType }),
    ...(financialYear && { financialYear }),
    ...(from || to
      ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { party: { select: { name: true, gstin: true, stateCode: true } } },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ data: invoices, total, page, limit });
}

// POST /api/invoices — create invoice with GST calculation + stock deduction
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "invoices:POST"), 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { docType, date, dueDate, partyId, notes, items, affectStock } = parsed.data;

  try {
    // Fetch party for state comparison
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const intraState = isIntraState(BUSINESS_STATE_CODE, party.stateCode);

    // Fetch products + GST configs in one query
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { gstConfig: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Only INVOICE and DEBIT_NOTE consume stock — validate sufficiency for those if affectStock is true
    const consumesStock = (docType === "INVOICE" || docType === "DEBIT_NOTE") && affectStock !== false;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} not found` },
          { status: 404 }
        );
      }
      if (
        consumesStock &&
        !product.allowNegativeStock &&
        Number(product.stockQty) < item.qty
      ) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available: ${product.stockQty}, Requested: ${item.qty}`,
          },
          { status: 422 }
        );
      }
    }

    // Calculate line items
    const calculatedItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const gst = product.gstConfig;

      const result = calcLineItem({
        unitPrice: item.unitPrice,
        qty: item.qty,
        discountPct: item.discountPct,
        gstRates: {
          cgstRate: Number(gst.cgstRate),
          sgstRate: Number(gst.sgstRate),
          igstRate: Number(gst.igstRate),
          cessRate: Number(gst.cessRate),
          cessEnabled: gst.cessEnabled,
        },
        isIntraState: intraState,
        taxInclusive: product.taxInclusive,
      });

      return { ...item, ...result };
    });

    const totals = calcInvoiceTotals(calculatedItems);

    // Generate document number
    const prefix = DOC_PREFIXES[docType] ?? "INV";
    const docNumber = await getNextDocNumber(prefix, parsed.data.financialYear);

    // Create invoice in a transaction (also deducts stock)
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          docNumber,
          docType,
          date: new Date(date),
          dueDate: dueDate ? new Date(dueDate) : null,
          partyId,
          partyStateCode: party.stateCode,
          businessStateCode: BUSINESS_STATE_CODE,
          subtotal: totals.subtotal,
          cgstTotal: totals.cgstTotal,
          sgstTotal: totals.sgstTotal,
          igstTotal: totals.igstTotal,
          cessTotal: totals.cessTotal,
          totalAmount: totals.totalAmount,
          balanceDue: totals.totalAmount,
          status: "UNPAID",
          financialYear: parsed.data.financialYear,
          notes,
          affectStock: affectStock !== false,
          items: {
            create: calculatedItems.map((ci) => ({
              productId: ci.productId,
              qty: ci.qty,
              unitPrice: ci.unitPrice,
              discountPct: ci.discountPct,
              taxableValue: ci.taxableValue,
              cgstAmount: ci.cgstAmount,
              sgstAmount: ci.sgstAmount,
              igstAmount: ci.igstAmount,
              cessAmount: ci.cessAmount,
              taxTotal: ci.taxTotal,
              lineTotal: ci.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      // Adjust stock based on doc type
      // INVOICE / DEBIT_NOTE  → decrement (goods leave our inventory)
      // PURCHASE / CREDIT_NOTE → increment (goods enter our inventory)
      // ESTIMATE               → no change
      if (affectStock !== false) {
        if (docType === "INVOICE" || docType === "DEBIT_NOTE") {
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.qty } },
            });
          }
        } else if (docType === "PURCHASE" || docType === "CREDIT_NOTE") {
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.qty } },
            });
          }
        }
      }

      // Update party balance
      // currentBalance > 0 = receivable (they owe us)
      // currentBalance < 0 = payable (we owe them)
      // INVOICE / DEBIT_NOTE  → increment (customer owes us more)
      // PURCHASE / CREDIT_NOTE → decrement (we owe supplier, or credit reduces receivable)
      // ESTIMATE               → no change
      if (docType === "INVOICE" || docType === "DEBIT_NOTE") {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { increment: totals.totalAmount } },
        });
      } else if (docType === "PURCHASE" || docType === "CREDIT_NOTE") {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { decrement: totals.totalAmount } },
        });
      }

      return inv;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: unknown) {
    logError("InvoiceCreate", error);
    return NextResponse.json({
      error: "Failed to create invoice",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
