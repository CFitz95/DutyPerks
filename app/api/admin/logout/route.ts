import { NextResponse } from "next/server";
import { sameOrigin, sessionCookie } from "../../../../lib/admin-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.delete(sessionCookie);
  return response;
}
