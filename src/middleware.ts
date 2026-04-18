import { NextRequest, NextResponse } from "next/server";

const USERNAME = process.env.AUTH_USERNAME!;
const PASSWORD = process.env.AUTH_PASSWORD!;

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const base64 = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const [user, pass] = decoded.split(":");

    if (user === USERNAME && pass === PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="FairDeals Billing"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
