import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const SECRET = process.env.AUTH_SECRET;

  if (!SECRET) {
    return new NextResponse("Server misconfiguration: AUTH_SECRET not set.", { status: 500 });
  }

  const { pathname } = req.nextUrl;

  // Allow login page and auth API through without a cookie check
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("fairdeals_auth")?.value;

  if (token === SECRET) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
