import { NextRequest, NextResponse } from "next/server";

const publicPaths = new Set(["/login", "/signup"]);

export function middleware(request: NextRequest): NextResponse {
  if (publicPaths.has(request.nextUrl.pathname)) return NextResponse.next();
  if (!request.cookies.has("advocatepro_session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
