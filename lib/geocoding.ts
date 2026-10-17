import "server-only";
import { privateSupabase } from "./private-supabase";
import { lookup, snapshot } from "./geocoding-core.mjs";

export async function runGeocoding() {
  const db=privateSupabase();
  const [locations,reviews]=await Promise.all([
    db.from("locations").select("id,name,address,city,state,postal_code,country,coordinate_role").eq("coordinate_role","destination").is("coordinates",null).order("created_at").limit(500),
    db.from("location_geocode_reviews").select("location_id,snapshot,status,attempts,checked_at").limit(1000)
  ]);
  if(locations.error || reviews.error) throw new Error("Geocoding setup unavailable");
  let checked=0,stored=0,failed=0;
  for(const l of locations.data ?? []) {
    const prior=reviews.data?.find(r=>r.location_id===l.id);
    const same=prior && Object.entries(snapshot(l)).every(([k,v])=>prior.snapshot?.[k]===v);
    if(same && (prior.status!=="failed" || prior.attempts>=3 || Date.now()-Date.parse(prior.checked_at)<86400000)) continue;
    if(checked>=10) break;
    checked++;
    let proposal;
    try { proposal=await lookup(l); } catch { failed++;proposal={status:"failed",note:"Lookup unavailable. Automatic retries are limited to three attempts, at least a day apart."}; }
    const result=await db.rpc("store_geocode_proposal",{p_location:l.id,p_snapshot:snapshot(l),p_proposal:proposal});
    if(result.error) throw new Error("Proposal could not be stored");
    if(result.data) stored++;
  }
  return {checked,stored,failed,limit:10};
}
