import { NextResponse } from "next/server";
import { authorizedCron } from "../../../../lib/discovery-core.mjs";
import { runGeocoding } from "../../../../lib/geocoding";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
export async function GET(request:Request) {
  if(!authorizedCron(request.headers.get("authorization"),process.env.CRON_SECRET)) return new Response("Unauthorized",{status:401});
  try { return NextResponse.json(await runGeocoding()); }
  catch { return NextResponse.json({error:"Geocoding setup or database unavailable"},{status:503}); }
}
