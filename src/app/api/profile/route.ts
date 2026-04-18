import { NextResponse } from "next/server";
import { getBusinessProfile, setBusinessProfile } from "@/lib/businessProfile";

export async function GET() {
  const profile = await getBusinessProfile();
  return NextResponse.json(profile);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await setBusinessProfile(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
