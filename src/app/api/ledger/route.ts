import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createLedgerAccountSchema = z.object({
  name: z.string().min(2).max(255),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  group: z.string().max(100).optional().nullable(),
  openingBalance: z.number().default(0),
  isBank: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where = type ? { type: type as any } : {};

    const accounts = await prisma.ledgerAccount.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch ledger accounts", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createLedgerAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, type, group, openingBalance, isBank } = parsed.data;

    const account = await prisma.ledgerAccount.create({
      data: {
        name,
        type,
        group,
        openingBalance,
        currentBalance: openingBalance,
        isBank,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create ledger account", details: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, group, openingBalance, isBank } = body;
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const existing = await prisma.ledgerAccount.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const oldOpening = existing.openingBalance;
    const newOpening = parseFloat(openingBalance);
    
    // adjust current balance by the difference in opening balance
    const diff = newOpening - Number(oldOpening);

    const updated = await prisma.ledgerAccount.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        group,
        openingBalance: newOpening,
        currentBalance: {
          increment: diff
        },
        isBank,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update ledger account", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Ensure it's not tied to journals
    const existingJournals = await prisma.journalEntry.count({
      where: { accountId: parseInt(id) }
    });

    if (existingJournals > 0) {
      return NextResponse.json({ error: "Cannot delete account with existing transactions. Delete the journal entries first." }, { status: 400 });
    }

    await prisma.ledgerAccount.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete ledger account", details: error.message }, { status: 500 });
  }
}
