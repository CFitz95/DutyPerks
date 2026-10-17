import { NextResponse } from "next/server";
import { getAdmin,sameOrigin } from "../../../../lib/admin-auth";
import { privateSupabase } from "../../../../lib/private-supabase";
import { runGeocoding } from "../../../../lib/geocoding";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request) {
  if(!sameOrigin(request) || !await getAdmin()) return new Response("Forbidden",{status:403});
  if(Number(request.headers.get("content-length") ?? 0)>4096) return new Response("Too large",{status:413});
  let notice="unavailable";
  try {
    const form=await request.formData();
    if(form.get("action")==="run") { const result=await runGeocoding();notice=result.failed ? "partial" : "checked"; }
    else {
      const action=form.get("action"),id=form.get("location"),revision=form.get("revision");
      const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if((action!=="approve" && action!=="dismiss") || typeof id!=="string" || !uuid.test(id) || typeof revision!=="string" || !uuid.test(revision) || (action==="approve" && form.get("confirmed")!=="yes")) return new Response("Invalid review",{status:400});
      const r=await privateSupabase().rpc("review_geocode_proposal",{p_location:id,p_revision:revision,p_action:action});
      notice=r.error ? "unavailable" : !r.data ? "stale" : action==="approve" ? "saved" : "dismissed";
    }
  } catch { /* Display a non-sensitive setup/error message. */ }
  return NextResponse.redirect(new URL(`/admin/locations?notice=${notice}`,request.url),303);
}
