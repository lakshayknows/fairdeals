import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/parties/[id]/ledger — transaction history for a party
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const partyId = parseInt(id, 10);
  if (isNaN(partyId)) {
    return NextResponse.json({ error: "Invalid party ID" }, { status: 400 });
  }

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { partyId, status: { not: "CANCELLED" } },
    include: {
      payments: { orderBy: { paymentDate: "asc" } },
    },
    orderBy: { date: "asc" },
  });

  type LedgerEntry = {
    date: string;
    type: "invoice" | "payment";
    docNumber: string;
    docType: string;
    debit: number;
    credit: number;
    balance: number;
    note: string | null;
  };

  const entries: LedgerEntry[] = [];
  let runningBalance = 0;
  let totalBilled = 0;
  let totalPaid = 0;

  for (const inv of invoices) {
    const amount = Number(inv.totalAmount);
    const isDebit = inv.docType === "INVOICE" || inv.docType === "DEBIT_NOTE";

    if (isDebit) {
      runningBalance += amount;
      totalBilled += amount;
    } else {
      runningBalance -= amount;
    }

    entries.push({
      date: inv.date.toISOString().slice(0, 10),
      type: "invoice",
      docNumber: inv.docNumber,
      docType: inv.docType,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      balance: runningBalance,
      note: inv.notes ?? null,
    });

    for (const pmt of inv.payments) {
      const pmtAmt = Number(pmt.amountPaid);
      if (isDebit) {
        runningBalance -= pmtAmt;
        totalPaid += pmtAmt;
      } else {
        runningBalance += pmtAmt;
        totalPaid += pmtAmt;
      }

      entries.push({
        date: pmt.paymentDate.toISOString().slice(0, 10),
        type: "payment",
        docNumber: inv.docNumber,
        docType: pmt.paymentMethod,
        debit: isDebit ? 0 : pmtAmt,
        credit: isDebit ? pmtAmt : 0,
        balance: runningBalance,
        note: pmt.note ?? null,
      });
    }
  }

  return NextResponse.json({
    party: {
      id: party.id,
      name: party.name,
      gstin: party.gstin,
      phone: party.phone,
      stateCode: party.stateCode,
      stateName: party.stateName,
      currentBalance: Number(party.currentBalance),
    },
    summary: {
      totalBilled,
      totalPaid,
      closingBalance: Number(party.currentBalance),
    },
    entries,
  });
}
