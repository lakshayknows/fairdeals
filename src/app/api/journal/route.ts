import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createJournalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  entries: z.array(z.object({
    accountId: z.number().int().positive(),
    amount: z.number().positive(),
    type: z.enum(["DEBIT", "CREDIT"]),
  })).min(2, "At least two entries are required for double-entry bookkeeping"),
  referenceType: z.string().max(50).optional().nullable(),
  referenceId: z.number().int().optional().nullable(),
  description: z.string().optional().nullable(),
  financialYear: z.string().max(10),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const entries = await prisma.journalEntry.findMany({
      include: {
        account: {
          select: { name: true, type: true }
        }
      },
      orderBy: [
        { date: "desc" },
        { id: "desc" }
      ],
      take: limit,
    });
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch journal entries", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createJournalEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { date, entries, referenceType, referenceId, description, financialYear } = parsed.data;

    // Verify double-entry equation (Debits = Credits)
    let totalDebit = 0;
    let totalCredit = 0;
    for (const entry of entries) {
      if (entry.type === "DEBIT") totalDebit += entry.amount;
      if (entry.type === "CREDIT") totalCredit += entry.amount;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({ error: "Debits must equal Credits" }, { status: 400 });
    }

    const createdEntries = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const entry of entries) {
        // 1. Create Journal Entry
        const record = await tx.journalEntry.create({
          data: {
            date: new Date(date),
            accountId: entry.accountId,
            amount: entry.amount,
            type: entry.type,
            referenceType,
            referenceId,
            description,
            financialYear,
          },
        });
        records.push(record);

        // 2. Update Ledger Account Balance
        // For Assets and Expenses, Debit = Increase, Credit = Decrease
        // For Liabilities, Equity, and Income, Credit = Increase, Debit = Decrease
        const account = await tx.ledgerAccount.findUnique({
          where: { id: entry.accountId }
        });

        if (account) {
          let incrementAmount = 0;
          if (["ASSET", "EXPENSE"].includes(account.type)) {
            incrementAmount = entry.type === "DEBIT" ? entry.amount : -entry.amount;
          } else {
            incrementAmount = entry.type === "CREDIT" ? entry.amount : -entry.amount;
          }

          if (incrementAmount !== 0) {
            await tx.ledgerAccount.update({
              where: { id: entry.accountId },
              data: {
                currentBalance: {
                  increment: incrementAmount
                }
              }
            });
          }
        }
      }

      return records;
    });

    return NextResponse.json(createdEntries, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create journal entries", details: error.message }, { status: 500 });
  }
}
