import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const fy = req.nextUrl.searchParams.get("financialYear") || "2024-25";

  const [invoices, purchases, payments, gstAdjustments] = await Promise.all([
    // Sales invoices
    prisma.invoice.findMany({
      where: { docType: "INVOICE", status: { not: "CANCELLED" }, financialYear: fy },
    }),
    // Purchase invoices
    prisma.invoice.findMany({
      where: { docType: "PURCHASE", status: { not: "CANCELLED" }, financialYear: fy },
    }),
    // All payments for the period — join to invoice to get FY
    prisma.payment.findMany({
      include: {
        invoice: { select: { financialYear: true, docType: true } },
      },
    }),
    // Manual GST adjustments for the period
    prisma.gstAdjustment.findMany({ where: { financialYear: fy } }),
  ]);

  // Filter payments by FY via their invoice
  const fyPayments = payments.filter(p => p.invoice.financialYear === fy);

  const totalSales = invoices.reduce((acc, inv) => acc + Number(inv.subtotal), 0);
  const totalPurchases = purchases.reduce((acc, inv) => acc + Number(inv.subtotal), 0);
  const totalTax = invoices.reduce(
    (acc, inv) =>
      acc +
      Number(inv.cgstTotal) +
      Number(inv.sgstTotal) +
      Number(inv.igstTotal) +
      Number(inv.cessTotal),
    0
  );
  const totalCollections = invoices.reduce(
    (acc, inv) => acc + (Number(inv.totalAmount) - Number(inv.balanceDue)),
    0
  );

  const cgst = invoices.reduce((acc, inv) => acc + Number(inv.cgstTotal), 0);
  const sgst = invoices.reduce((acc, inv) => acc + Number(inv.sgstTotal), 0);
  const igst = invoices.reduce((acc, inv) => acc + Number(inv.igstTotal), 0);
  const cess = invoices.reduce((acc, inv) => acc + Number(inv.cessTotal), 0);

  // Cash flow breakdown by payment method
  // "Cash in Hand"  = net CASH payments (received − paid)
  // "Cash in Bank"  = net BANK + UPI + CHEQUE payments
  const cashPayments = fyPayments.filter(p => p.paymentMethod === "CASH");
  const bankPayments = fyPayments.filter(
    p => p.paymentMethod === "BANK" || p.paymentMethod === "UPI" || p.paymentMethod === "CHEQUE"
  );

  const calcNet = (list: typeof fyPayments) =>
    list.reduce((acc, p) => {
      const amt = Number(p.amountPaid);
      const isReceived =
        p.invoice.docType === "INVOICE" || p.invoice.docType === "DEBIT_NOTE";
      return isReceived ? acc + amt : acc - amt;
    }, 0);

  const cashInHand = calcNet(cashPayments);
  const cashInBank = calcNet(bankPayments);

  // GST Input = GST on purchases + INPUT adjustments
  const purchaseInputGst = purchases.reduce(
    (acc, inv) =>
      acc +
      Number(inv.cgstTotal) +
      Number(inv.sgstTotal) +
      Number(inv.igstTotal) +
      Number(inv.cessTotal),
    0
  );
  const inputAdjustments = gstAdjustments
    .filter((a) => a.type === "INPUT")
    .reduce((acc, a) => acc + Number(a.amount), 0);
  const outputAdjustments = gstAdjustments
    .filter((a) => a.type === "OUTPUT")
    .reduce((acc, a) => acc + Number(a.amount), 0);

  const totalInputGst = purchaseInputGst + inputAdjustments;
  const totalOutputGst = totalTax + outputAdjustments;
  const netGstPayable = totalOutputGst - totalInputGst;

  return NextResponse.json({
    totalSales,
    totalPurchases,
    totalTax,
    totalCollections,
    cgst,
    sgst,
    igst,
    cess,
    invoiceCount: invoices.length,
    purchaseCount: purchases.length,
    cashInHand,
    cashInBank,
    totalInputGst,
    totalOutputGst,
    netGstPayable,
    inputAdjustments,
    outputAdjustments,
    purchaseInputGst,
  });
}
