import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPartySchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "parties:GET"), 120);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const type = req.nextUrl.searchParams.get("type");
  const search = req.nextUrl.searchParams.get("search");

  const parties = await prisma.party.findMany({
    where: {
      deletedAt: null,
      ...(type && { type: type as "CUSTOMER" | "SUPPLIER" | "BOTH" }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { gstin: { contains: search } },
        ],
      }),
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json(parties);
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(rateLimitKey(req, "parties:POST"), 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json();
  const parsed = createPartySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const party = await prisma.party.create({ data: parsed.data });
    return NextResponse.json(party, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A party with this GSTIN already exists" },
        { status: 409 }
      );
    }
    logError("PartyCreate", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create party" },
      { status: 500 }
    );
  }
}
