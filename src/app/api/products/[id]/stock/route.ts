import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const stockAdjustSchema = z.object({
  adjustment: z.number().refine((n) => n !== 0, "Adjustment cannot be zero"),
  reason: z.string().max(255).optional(),
});

// PATCH /api/products/[id]/stock — manually adjust stock
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = stockAdjustSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { adjustment } = parsed.data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const newStock = Number(product.stockQty) + adjustment;

  if (!product.allowNegativeStock && newStock < 0) {
    return NextResponse.json(
      {
        error: `Stock adjustment would result in negative stock (${newStock}). Current stock: ${product.stockQty}`,
      },
      { status: 422 }
    );
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stockQty: newStock },
  });

  return NextResponse.json(updated);
}
