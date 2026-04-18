import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calcLineItem, calcInvoiceTotals, isIntraState } from "@/lib/gst";
import { prisma } from "@/lib/db";

const BUSINESS_STATE_CODE = process.env.BUSINESS_STATE_CODE ?? "07";

const calcItemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().positive(),
  unitPrice: z.number().positive(),
  discountPct: z.number().min(0).max(100).default(0),
});

const calcRequestSchema = z.object({
  partyStateCode: z.string().length(2),
  items: z.array(calcItemSchema).min(1),
});

export interface CalcLineResult {
  productId: number;
  productName: string;
  hsnCode: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  taxTotal: number;
  lineTotal: number;
}

export interface CalcResponse {
  isIntraState: boolean;
  businessStateCode: string;
  partyStateCode: string;
  lines: CalcLineResult[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalTax: number;
  grandTotal: number;
}

// POST /api/invoices/calculate — live GST preview (no DB write)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = calcRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { partyStateCode, items } = parsed.data;
  const intra = isIntraState(BUSINESS_STATE_CODE, partyStateCode);

  // Fetch products + GST configs
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { gstConfig: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Validate all products found
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return NextResponse.json(
        { error: `Product ID ${item.productId} not found` },
        { status: 404 }
      );
    }
  }

  // Calculate each line
  const lines: CalcLineResult[] = items.map((item) => {
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
      isIntraState: intra,
      taxInclusive: product.taxInclusive,
    });

    return {
      productId: item.productId,
      productName: product.name,
      hsnCode: product.hsnCode,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discountPct: item.discountPct,
      taxableValue: result.taxableValue,
      cgstRate: Number(gst.cgstRate),
      sgstRate: Number(gst.sgstRate),
      igstRate: Number(gst.igstRate),
      cgstAmount: result.cgstAmount,
      sgstAmount: result.sgstAmount,
      igstAmount: result.igstAmount,
      cessAmount: result.cessAmount,
      taxTotal: result.taxTotal,
      lineTotal: result.lineTotal,
    };
  });

  const totals = calcInvoiceTotals(
    lines.map((l) => ({
      taxableValue: l.taxableValue,
      cgstAmount: l.cgstAmount,
      sgstAmount: l.sgstAmount,
      igstAmount: l.igstAmount,
      cessAmount: l.cessAmount,
      taxTotal: l.taxTotal,
      lineTotal: l.lineTotal,
    }))
  );

  const response: CalcResponse = {
    isIntraState: intra,
    businessStateCode: BUSINESS_STATE_CODE,
    partyStateCode,
    lines,
    subtotal: totals.subtotal,
    cgstTotal: totals.cgstTotal,
    sgstTotal: totals.sgstTotal,
    igstTotal: totals.igstTotal,
    cessTotal: totals.cessTotal,
    totalTax: totals.cgstTotal + totals.sgstTotal + totals.igstTotal + totals.cessTotal,
    grandTotal: totals.totalAmount,
  };

  return NextResponse.json(response);
}
