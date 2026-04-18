import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createProductSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "products:GET"), 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const search = req.nextUrl.searchParams.get("search");
  const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { hsnCode: { contains: search } },
        ],
      }),
      ...(lowStock && {
        // stock below alert threshold
        stockQty: { lte: prisma.product.fields.lowStockAlert },
      }),
    },
    include: { gstConfig: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "products:POST"), 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { gstRate, cessRate, sku: rawSku, ...restData } = parsed.data;
    const sku = rawSku || `PRD-${Date.now()}`;
    const cgstSgst = gstRate / 2;
    const configName = cessRate > 0 ? `GST ${gstRate}% + Cess ${cessRate}%` : `GST ${gstRate}%`;

    let gstConfig = await prisma.gstConfig.findFirst({
      where: { cgstRate: cgstSgst, sgstRate: cgstSgst, igstRate: gstRate, cessRate }
    });

    if (!gstConfig) {
      gstConfig = await prisma.gstConfig.create({
        data: { name: configName, cgstRate: cgstSgst, sgstRate: cgstSgst, igstRate: gstRate, cessRate, cessEnabled: cessRate > 0 }
      });
    }

    const product = await prisma.product.create({
      data: { ...restData, sku, gstConfigId: gstConfig.id },
      include: { gstConfig: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: `Product with SKU "${parsed.data.sku}" already exists` },
        { status: 409 }
      );
    }
    logError("ProductCreate", err);
    throw err;
  }
}
