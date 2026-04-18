import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updatePartySchema } from "@/lib/validators";
import { INDIAN_STATES } from "@/types";
import { logError } from "@/lib/logger";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

// DELETE /api/parties/[id] — soft-delete (sets deleted_at, preserves record)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(rateLimitKey(req, "parties:DELETE"), 20);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { id } = await params;
  const partyId = parseInt(id, 10);
  if (isNaN(partyId)) {
    return NextResponse.json({ error: "Invalid party ID" }, { status: 400 });
  }

  const party = await prisma.party.findUnique({
    where: { id: partyId, deletedAt: null },
  });

  if (!party) {
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  // Soft-delete: stamp deleted_at, keep the record intact
  await prisma.party.update({
    where: { id: partyId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "Party moved to trash. Contact admin to restore." });
}

// PATCH /api/parties/[id]/restore — undelete a soft-deleted party
// (call PATCH with body {} to restore)
export async function PATCH(
  req: NextRequest,
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
  if (!party.deletedAt) {
    return NextResponse.json({ error: "Party is not deleted" }, { status: 400 });
  }

  const restored = await prisma.party.update({
    where: { id: partyId },
    data: { deletedAt: null },
  });

  return NextResponse.json(restored);
}

// PUT /api/parties/[id] — update party details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(rateLimitKey(req, "parties:PUT"), 30);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const { id } = await params;
  const partyId = parseInt(id, 10);
  if (isNaN(partyId)) {
    return NextResponse.json({ error: "Invalid party ID" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updatePartySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Derive stateName from stateCode if stateCode was provided but stateName wasn't
  if (data.stateCode && !data.stateName) {
    const stateObj = INDIAN_STATES.find(s => s.code === data.stateCode);
    if (stateObj) {
      (data as any).stateName = stateObj.name;
    }
  }

  try {
    const existing = await prisma.party.findUnique({ where: { id: partyId, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const updated = await prisma.party.update({
      where: { id: partyId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "GSTIN already registered to another party" }, { status: 409 });
    }
    logError("PartyUpdate", error);
    return NextResponse.json({
      error: "Failed to update party",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
