import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ detail: "Invalid request origin" }, { status: 403 });
  }
  const apiBase = (process.env.API_INTERNAL_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    const { access_token: accessToken, ...safeResponse } = data;
    const result = NextResponse.json(safeResponse);
    result.cookies.set("advocatepro_session", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 60,
    });
    return result;
  } catch {
    return NextResponse.json({ detail: "API service unavailable" }, { status: 503 });
  }
}
