import { NextResponse } from "next/server";
import { getAdmin, sameOrigin } from "../../../../lib/admin-auth";
import { runDiscovery } from "../../../../lib/discovery";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await getAdmin()) return new Response("Forbidden", { status: 403 });
  try { const result = await runDiscovery(); return NextResponse.redirect(new URL(`/admin?notice=${result.skipped ? "busy" : result.errors.length ? "partial" : "run"}`, request.url), 303); }
  catch { return NextResponse.redirect(new URL("/admin?notice=setup", request.url), 303); }
}
