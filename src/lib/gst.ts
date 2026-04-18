/**
 * GST Calculation Engine
 * Handles CGST/SGST (intra-state) vs IGST (inter-state) + optional Cess
 */

export interface GstRates {
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  cessEnabled: boolean;
}

export interface LineItemInput {
  unitPrice: number;
  qty: number;
  discountPct: number; // 0–100
  gstRates: GstRates;
  isIntraState: boolean; // same state = CGST+SGST, else IGST
  taxInclusive: boolean; // price already includes GST
}

export interface LineItemResult {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  taxTotal: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalAmount: number;
}

/**
 * Calculate GST for a single line item.
 * All rates are percentages (e.g., 9.00 for 9%).
 */
export function calcLineItem(input: LineItemInput): LineItemResult {
  const { unitPrice, qty, discountPct, gstRates, isIntraState, taxInclusive } = input;

  const grossValue = unitPrice * qty;
  const discountAmount = grossValue * (discountPct / 100);
  const valueAfterDiscount = grossValue - discountAmount;

  // If price is tax-inclusive, back-calculate taxable value
  const applicableRate = isIntraState
    ? gstRates.cgstRate + gstRates.sgstRate
    : gstRates.igstRate;

  let taxableValue: number;
  if (taxInclusive && applicableRate > 0) {
    taxableValue = valueAfterDiscount / (1 + applicableRate / 100);
  } else {
    taxableValue = valueAfterDiscount;
  }

  taxableValue = round2(taxableValue);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstAmount = round2(taxableValue * (gstRates.cgstRate / 100));
    sgstAmount = round2(taxableValue * (gstRates.sgstRate / 100));
  } else {
    igstAmount = round2(taxableValue * (gstRates.igstRate / 100));
  }

  const cessAmount = gstRates.cessEnabled
    ? round2(taxableValue * (gstRates.cessRate / 100))
    : 0;

  const taxTotal = cgstAmount + sgstAmount + igstAmount + cessAmount;
  const lineTotal = round2(taxableValue + taxTotal);

  return { taxableValue, cgstAmount, sgstAmount, igstAmount, cessAmount, taxTotal, lineTotal };
}

/**
 * Aggregate line item results into invoice totals.
 */
export function calcInvoiceTotals(items: LineItemResult[]): InvoiceTotals {
  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.taxableValue,
      cgstTotal: acc.cgstTotal + item.cgstAmount,
      sgstTotal: acc.sgstTotal + item.sgstAmount,
      igstTotal: acc.igstTotal + item.igstAmount,
      cessTotal: acc.cessTotal + item.cessAmount,
    }),
    { subtotal: 0, cgstTotal: 0, sgstTotal: 0, igstTotal: 0, cessTotal: 0 }
  );

  return {
    ...totals,
    subtotal: round2(totals.subtotal),
    cgstTotal: round2(totals.cgstTotal),
    sgstTotal: round2(totals.sgstTotal),
    igstTotal: round2(totals.igstTotal),
    cessTotal: round2(totals.cessTotal),
    totalAmount: round2(
      totals.subtotal + totals.cgstTotal + totals.sgstTotal + totals.igstTotal + totals.cessTotal
    ),
  };
}

/**
 * Determine if a transaction is intra-state (CGST+SGST) or inter-state (IGST).
 * Compares the first 2 characters of each state code.
 */
export function isIntraState(businessStateCode: string, partyStateCode: string): boolean {
  return businessStateCode.trim().slice(0, 2) === partyStateCode.trim().slice(0, 2);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
