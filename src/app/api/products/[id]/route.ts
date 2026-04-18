import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validators";

// PUT /api/products/[id] — update product fields
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { gstConfig: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If gstRate or cessRate changed, find or create a matching GstConfig
    let gstConfigId = existing.gstConfigId;
    if (data.gstRate !== undefined || data.cessRate !== undefined) {
      const gstRate = data.gstRate ?? Number(existing.gstConfig.cgstRate) * 2;
      const cessRate = data.cessRate ?? Number(existing.gstConfig.cessRate);
      const half = gstRate / 2;

      let gstConfig = await prisma.gstConfig.findFirst({
        where: {
          cgstRate: half,
          sgstRate: half,
          igstRate: gstRate,
          cessRate,
        },
      });

      if (!gstConfig) {
        gstConfig = await prisma.gstConfig.create({
          data: {
            name: `GST ${gstRate}%${cessRate > 0 ? ` + Cess ${cessRate}%` : ""}`,
            cgstRate: half,
            sgstRate: half,
            igstRate: gstRate,
            cessRate,
            cessEnabled: cessRate > 0,
          },
        });
      }
      gstConfigId = gstConfig.id;
    }

    const { gstRate: _g, cessRate: _c, ...rest } = data;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { ...rest, gstConfigId },
      include: { gstConfig: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 });
  }
}
