import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createBankAccountSchema } from "@/lib/validators";

// GET /api/bank-accounts
export async function GET() {
  const accounts = await prisma.bankAccount.findMany({
    include: {
      _count: { select: { payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(accounts);
}

// POST /api/bank-accounts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createBankAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
