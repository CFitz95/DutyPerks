import { NextResponse } from "next/server";
import { authorizedCron } from "../../../../lib/discovery-core.mjs";
import { runDiscovery } from "../../../../lib/discovery";
export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!authorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) return new Response("Unauthorized", { status: 401 });
  try { const result = await runDiscovery(); return NextResponse.json(result, { status: result.errors.length ? 502 : 200 }); }
  catch { return NextResponse.json({ error: "Discovery configuration or database error" }, { status: 503 }); }
}
