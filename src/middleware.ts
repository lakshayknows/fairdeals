import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const USERNAME = process.env.AUTH_USERNAME;
  const PASSWORD = process.env.AUTH_PASSWORD;

  if (!USERNAME || !PASSWORD) {
    return new NextResponse("Server misconfiguration: auth credentials not set.", { status: 500 });
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const colon = decoded.indexOf(":");
    const user = decoded.slice(0, colon);
    const pass = decoded.slice(colon + 1);

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
