import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createInvoiceSchema } from "@/lib/validators";
import { calcLineItem, calcInvoiceTotals, isIntraState } from "@/lib/gst";

const BUSINESS_STATE_CODE = process.env.BUSINESS_STATE_CODE ?? "07";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const oldInv = await tx.invoice.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!oldInv) throw new Error("Invoice not found");

      // Reverse Stock
      if (oldInv.affectStock) {
        if (oldInv.docType === "INVOICE" || oldInv.docType === "DEBIT_NOTE") {
          for (const item of oldInv.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.qty } }
            });
          }
        } else if (oldInv.docType === "PURCHASE" || oldInv.docType === "CREDIT_NOTE") {
          for (const item of oldInv.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.qty } }
            });
          }
        }
      }

      // Reverse Party Balance
      if (oldInv.docType === "INVOICE" || oldInv.docType === "DEBIT_NOTE") {
        await tx.party.update({
          where: { id: oldInv.partyId },
          data: { currentBalance: { decrement: oldInv.totalAmount } }
        });
      } else if (oldInv.docType === "PURCHASE" || oldInv.docType === "CREDIT_NOTE") {
        await tx.party.update({
          where: { id: oldInv.partyId },
          data: { currentBalance: { increment: oldInv.totalAmount } }
        });
      }

      // Soft delete
      await tx.invoice.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete invoice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const retainHistoric = body.retainHistoric === true;

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { docType, date, dueDate, partyId, notes, items, affectStock } = parsed.data;

  try {
    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    const intraState = isIntraState(BUSINESS_STATE_CODE, party.stateCode);

    const oldInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!oldInvoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { gstConfig: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Calculates
    const calculatedItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      let gst = product.gstConfig;
      let cessEnabled = gst.cessEnabled;

      // Retain historic tax logic: Look up old item and use its strict pct if it exists
      if (retainHistoric) {
        const oldMatch = oldInvoice.items.find(oi => oi.productId === item.productId);
        if (oldMatch) {
          gst = {
            ...gst,
            cgstRate: oldMatch.cgstPct,
            sgstRate: oldMatch.sgstPct,
            igstRate: oldMatch.igstPct,
            cessRate: oldMatch.cessPct
          };
          cessEnabled = Number(oldMatch.cessPct) > 0;
        }
      }

      const result = calcLineItem({
        unitPrice: item.unitPrice,
        qty: item.qty,
        discountPct: item.discountPct,
        gstRates: {
          cgstRate: Number(gst.cgstRate),
          sgstRate: Number(gst.sgstRate),
          igstRate: Number(gst.igstRate),
          cessRate: Number(gst.cessRate),
          cessEnabled: cessEnabled,
        },
        isIntraState: intraState,
        taxInclusive: product.taxInclusive,
      });
      return { ...item, ...result, pct: gst };
    });

    const totals = calcInvoiceTotals(calculatedItems);

    await prisma.$transaction(async (tx) => {
      // 1. REVERSE OLD STOCK
      if (oldInvoice.affectStock) {
        if (oldInvoice.docType === "INVOICE" || oldInvoice.docType === "DEBIT_NOTE") {
          for (const oi of oldInvoice.items) {
            await tx.product.update({
              where: { id: oi.productId },
              data: { stockQty: { increment: oi.qty } }
            });
          }
        } else if (oldInvoice.docType === "PURCHASE" || oldInvoice.docType === "CREDIT_NOTE") {
          for (const oi of oldInvoice.items) {
            await tx.product.update({
              where: { id: oi.productId },
              data: { stockQty: { decrement: oi.qty } }
            });
          }
        }
      }

      // 2. REVERSE OLD PARTY BALANCE
      if (oldInvoice.docType === "INVOICE" || oldInvoice.docType === "DEBIT_NOTE") {
        await tx.party.update({
          where: { id: oldInvoice.partyId },
          data: { currentBalance: { decrement: oldInvoice.totalAmount } }
        });
      } else if (oldInvoice.docType === "PURCHASE" || oldInvoice.docType === "CREDIT_NOTE") {
        await tx.party.update({
          where: { id: oldInvoice.partyId },
          data: { currentBalance: { increment: oldInvoice.totalAmount } }
        });
      }

      // 3. DELETE OLD MEMORY ITEMS
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // 4. UPDATE INVOICE
      await tx.invoice.update({
        where: { id },
        data: {
          docType, date: new Date(date), dueDate: dueDate ? new Date(dueDate) : null,
          partyId, partyStateCode: party.stateCode, notes, affectStock: affectStock !== false,
          subtotal: totals.subtotal, cgstTotal: totals.cgstTotal, sgstTotal: totals.sgstTotal,
          igstTotal: totals.igstTotal, cessTotal: totals.cessTotal,
          totalAmount: totals.totalAmount,
          // Recalculate balance due based on total payments
          balanceDue: Number(totals.totalAmount) - (Number(oldInvoice.totalAmount) - Number(oldInvoice.balanceDue)),
          items: {
            create: calculatedItems.map(ci => ({
              productId: ci.productId, qty: ci.qty, unitPrice: ci.unitPrice, discountPct: ci.discountPct,
              taxableValue: ci.taxableValue,
              cgstPct: ci.pct.cgstRate, sgstPct: ci.pct.sgstRate, igstPct: ci.pct.igstRate, cessPct: ci.pct.cessRate,
              cgstAmount: ci.cgstAmount, sgstAmount: ci.sgstAmount, igstAmount: ci.igstAmount, cessAmount: ci.cessAmount,
              taxTotal: ci.taxTotal, lineTotal: ci.lineTotal,
            })),
          }
        }
      });

      // 5. APPLY NEW STOCK
      if (affectStock !== false) {
        if (docType === "INVOICE" || docType === "DEBIT_NOTE") {
          for (const ci of calculatedItems) {
             await tx.product.update({
              where: { id: ci.productId },
              data: { stockQty: { decrement: ci.qty } }
            });
          }
        } else if (docType === "PURCHASE" || docType === "CREDIT_NOTE") {
          for (const ci of calculatedItems) {
             await tx.product.update({
              where: { id: ci.productId },
              data: { stockQty: { increment: ci.qty } }
            });
          }
        }
      }

      // 6. APPLY NEW PARTY BALANCE
      if (docType === "INVOICE" || docType === "DEBIT_NOTE") {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { increment: totals.totalAmount } }
        });
      } else if (docType === "PURCHASE" || docType === "CREDIT_NOTE") {
        await tx.party.update({
          where: { id: partyId },
          data: { currentBalance: { decrement: totals.totalAmount } }
        });
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
