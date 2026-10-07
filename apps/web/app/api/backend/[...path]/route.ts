import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: { path: string[] } };

async function proxy(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin && request.method !== "GET") {
    return NextResponse.json({ detail: "Invalid request origin" }, { status: 403 });
  }
  const token = request.cookies.get("advocatepro_session")?.value;
  const apiBase = (process.env.API_INTERNAL_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
  const target = `${apiBase}/${context.params.path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    if (response.ok && context.params.path.join("/") === "auth/change-password") {
      const data = await response.json();
      const result = NextResponse.json({ status: "ok" });
      result.cookies.set("advocatepro_session", data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 30 * 60,
      });
      return result;
    }
    const responseHeaders = new Headers();
    const responseType = response.headers.get("content-type");
    if (responseType) responseHeaders.set("content-type", responseType);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: "API service unavailable" }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
