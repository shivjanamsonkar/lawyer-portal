import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ detail: "Invalid request origin" }, { status: 403 });
  }
  const apiBase = (process.env.API_INTERNAL_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
  try {
    const response = await fetch(`${apiBase}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ detail: "API service unavailable" }, { status: 503 });
  }
}
