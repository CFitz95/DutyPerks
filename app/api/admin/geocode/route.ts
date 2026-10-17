import { NextResponse } from "next/server";
import { getAdmin,sameOrigin } from "../../../../lib/admin-auth";
import { privateSupabase } from "../../../../lib/private-supabase";
import { runGeocoding } from "../../../../lib/geocoding";
import { parseAddressEdit } from "../../../../lib/address-edit.mjs";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request) {
  if(!sameOrigin(request) || !await getAdmin()) return new Response("Forbidden",{status:403});
  if(Number(request.headers.get("content-length") ?? 0)>4096) return new Response("Too large",{status:413});
  let notice="unavailable";
  try {
    const form=await request.formData();
    if(form.get("action")==="run") { const result=await runGeocoding();notice=result.failed ? "partial" : "checked"; }
    else if(form.get("action")==="edit_address") {
      let edit;
      try { edit=parseAddressEdit(form); } catch { return NextResponse.redirect(new URL('/admin/locations?notice=address_invalid',request.url),303); }
      let query=privateSupabase().from('locations').update(edit.values).eq('id',edit.id).eq('coordinate_role','destination').is('coordinates',null);
      for(const [key,value] of Object.entries(edit.expected)) query=value===null ? query.is(key,null) : query.eq(key,value);
      const result=await query.select('id');
      notice=result.error ? 'unavailable' : result.data?.length===1 ? 'address_updated' : 'address_stale';
    }
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
