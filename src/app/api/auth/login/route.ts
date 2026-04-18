import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours

const attempts = new Map<string, { count: number; windowStart: number }>();

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const USERNAME = process.env.AUTH_USERNAME;
  const PASSWORD = process.env.AUTH_PASSWORD;
  const SECRET = process.env.AUTH_SECRET;

  if (!USERNAME || !PASSWORD || !SECRET) {
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const ip = getIP(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  // Check rate limit
  if (entry && now - entry.windowStart < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  const { username, password } = await req.json();

  if (username === USERNAME && password === PASSWORD) {
    attempts.delete(ip);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("fairdeals_auth", SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  }

  // Record failure
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }

  return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
}
