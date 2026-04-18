import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordPaymentSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

// POST /api/payments — record a payment against an invoice
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "payments:POST"), 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = recordPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { invoiceId, amount, method, referenceId, note, paymentDate, bankAccountId } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { party: true },
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "PAID") throw new Error("Invoice is already fully paid");
      if (invoice.status === "CANCELLED") throw new Error("Cannot record payment on a cancelled invoice");

      const balanceDue = Number(invoice.balanceDue);
      if (amount > balanceDue) {
        throw new Error(
          `Payment amount (₹${amount.toFixed(2)}) exceeds balance due (₹${balanceDue.toFixed(2)})`
        );
      }

      // Validate bank account exists if provided
      if (bankAccountId) {
        const bankAccount = await tx.bankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAccount) throw new Error("Bank account not found");
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amountPaid: amount,
          paymentMethod: method,
          referenceId: referenceId ?? null,
          note: note ?? null,
          bankAccountId: bankAccountId ?? null,
        },
      });

      const newBalance = Number((balanceDue - amount).toFixed(2));
      const newStatus = newBalance === 0 ? "PAID" : "PARTIAL";

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { balanceDue: newBalance, status: newStatus },
      });

      // Adjust party balance based on doc type
      // INVOICE/DEBIT_NOTE: receiving payment → decrement (reduce receivable)
      // PURCHASE/CREDIT_NOTE: making payment → increment (reduce payable)
      const receivingPayment =
        invoice.docType === "INVOICE" || invoice.docType === "DEBIT_NOTE";

      await tx.party.update({
        where: { id: invoice.partyId },
        data: receivingPayment
          ? { currentBalance: { decrement: amount } }
          : { currentBalance: { increment: amount } },
      });

      // Update bank account balance if associated
      if (bankAccountId) {
        await tx.bankAccount.update({
          where: { id: bankAccountId },
          data: receivingPayment
            ? { balance: { increment: amount } }  // money received into account
            : { balance: { decrement: amount } },  // money paid out from account
        });
      }

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    const status = msg.includes("not found") ? 404 :
                   msg.includes("exceeds") || msg.includes("already") ? 422 : 500;
    if (status === 500) logError("PaymentCreate", error);
    return NextResponse.json({ error: msg }, { status });
  }
}

// GET /api/payments — list payments (optional filter by invoiceId)
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "payments:GET"), 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const invoiceId = req.nextUrl.searchParams.get("invoiceId");
  const payments = await prisma.payment.findMany({
    where: invoiceId ? { invoiceId: parseInt(invoiceId, 10) } : undefined,
    include: {
      invoice: { select: { docNumber: true, party: { select: { name: true } } } },
      bankAccount: { select: { id: true, accountName: true, bankName: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });
  return NextResponse.json(payments);
}
