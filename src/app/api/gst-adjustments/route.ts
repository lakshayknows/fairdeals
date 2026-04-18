import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  type: z.enum(["INPUT", "OUTPUT"]),
  description: z.string().min(1).max(255),
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
});

// GET /api/gst-adjustments?financialYear=2024-25
export async function GET(req: NextRequest) {
  const fy = req.nextUrl.searchParams.get("financialYear");
  if (!fy) {
    return NextResponse.json({ error: "financialYear is required" }, { status: 400 });
  }
  const adjustments = await prisma.gstAdjustment.findMany({
    where: { financialYear: fy },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(adjustments);
}

// POST /api/gst-adjustments
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { date, amount, type, description, financialYear } = parsed.data;
  const adjustment = await prisma.gstAdjustment.create({
    data: {
      date: new Date(date),
      amount,
      type,
      description,
      financialYear,
    },
  });
  return NextResponse.json(adjustment, { status: 201 });
}

// DELETE /api/gst-adjustments?id=123
export async function DELETE(req: NextRequest) {
  const id = parseInt(req.nextUrl.searchParams.get("id") ?? "");
  if (isNaN(id)) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
  }
  await prisma.gstAdjustment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
