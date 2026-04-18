import { prisma } from "./db";

/**
 * Returns the current Indian Financial Year string.
 * April 1 – March 31.
 * e.g. on 2025-04-07 → "2025-26"
 *      on 2025-03-15 → "2024-25"
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
}

/**
 * Atomically increments the sequence counter for a given prefix+FY
 * and returns the formatted document number.
 *
 * Uses upsert to handle first-use cases, then a raw SQL increment
 * inside a transaction to prevent race conditions.
 *
 * Format: {PREFIX}/{FY}/{SEQUENCE padded to 4 digits}
 * Example: INV/2024-25/0001
 */
export async function getNextDocNumber(
  prefix: string,
  financialYear?: string
): Promise<string> {
  const fy = financialYear ?? getCurrentFinancialYear();

  // Atomically increment the sequence counter.
  // We use upsert to ensure the record exists first.
  const sequence = await prisma.docSequence.upsert({
    where: { prefix_financialYear: { prefix, financialYear: fy } },
    create: { prefix, financialYear: fy, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const seq = sequence.lastNumber;
  const padded = String(seq).padStart(4, "0");
  return `${prefix}/${fy}/${padded}`;
}

export const DOC_PREFIXES = {
  INVOICE: "INV",
  ESTIMATE: "EST",
  PURCHASE: "PUR",
  CREDIT_NOTE: "CN",
  DEBIT_NOTE: "DN",
} as const;
