import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/bank-accounts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (isNaN(accountId)) {
    return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    include: {
      _count: { select: { payments: true } },
      payments: {
        include: { invoice: { select: { docNumber: true, docType: true } } },
        orderBy: { paymentDate: "desc" },
        take: 50,
      },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}

// DELETE /api/bank-accounts/[id] — only if no payments are linked
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accountId = parseInt(id, 10);
  if (isNaN(accountId)) {
    return NextResponse.json({ error: "Invalid account ID" }, { status: 400 });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    include: { _count: { select: { payments: true } } },
  });

  if (!account) {
    return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
  }

  if (account._count.payments > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete account — it has ${account._count.payments} payment(s) linked. Unlink payments first or archive instead.`,
      },
      { status: 409 }
    );
  }

  await prisma.bankAccount.delete({ where: { id: accountId } });
  return NextResponse.json({ success: true });
}
