import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "../../../lib/admin-auth";
import { privateSupabase } from "../../../lib/private-supabase";
import AddressEditForm from "./AddressEditForm";
export const dynamic="force-dynamic";
const notices:Record<string,string>={address_updated:"Address saved. Click Check missing addresses now for a fresh proposal.",address_invalid:"Address not saved. Enter a street address, city, two-letter state and optional five-digit ZIP.",address_stale:"Nothing saved. The location changed or already has coordinates. Reload before editing.",checked:"Address check complete. Proposals need your review.",partial:"Some lookups failed. See the notes below.",saved:"Reviewed coordinates saved.",dismissed:"Proposal dismissed without changing coordinates.",stale:"Nothing saved. This proposal is old, already reviewed, or the location has changed.",unavailable:"The queue is unavailable. Check the geocoding migration and server settings."};
export default async function LocationsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  if(!await getAdmin()) redirect("/admin");
  const params=await searchParams;const notice=typeof params.notice==="string" ? notices[params.notice] : null;
  const db=privateSupabase();
  const [queue,locations]=await Promise.all([
    db.from("location_geocode_reviews").select("*").order("checked_at",{ascending:false}).limit(500),
    db.from("locations").select("id,name,address,city,state,postal_code,country,coordinate_role").eq("coordinate_role","destination").is("coordinates",null).limit(500)
  ]);
  if(queue.error || locations.error) return <main><Link href="/admin">← Admin</Link><h1>Location review</h1><p>The queue could not load. Apply supabase/geocoding.sql and check the server settings.</p></main>;
  const current=new Map((locations.data ?? []).map(l=>[l.id,l]));
  const pending=(queue.data ?? []).filter(r=>!['saved','dismissed'].includes(r.status) && current.has(r.location_id));
  return <main><Link href="/admin">← Admin</Link><h1>Location review</h1>
    <p>Address lookups run weekly on Mondays at 13:30 UTC (9:30 AM Eastern in summer, 8:30 AM in winter), up to 10 records per run. Saving a pin requires your map check. Existing coordinates are never overwritten.</p>
    {notice && <p role="status">{notice}</p>}
    <form action="/api/admin/geocode" method="post"><button name="action" value="run">Check missing addresses now</button></form>
    <p>MWR is an offer organization, not an attraction. Organization resources stay unpinned. Ticket purchase offices are excluded here; each offer needs its actual attraction or activity destination.</p>
    <p>{locations.data?.length ?? 0} destinations without coordinates (up to 500 shown). {pending.length} review entries.</p>
    {!pending.length && <p>No proposals yet. Run an address check to begin.</p>}
    {(locations.data ?? []).map(l=>{
      const r=pending.find(review=>review.location_id===l.id);
      if(!r) return <article key={l.id} style={{border:"1px solid #ddd",padding:16,margin:"20px 0",borderRadius:8}}><h2>{l.name ?? "Location"}</h2><p>{[l.address,l.city,l.state,l.postal_code].filter(Boolean).join(", ")}</p><p>No active proposal. Edit the address or run an address check.</p><AddressEditForm location={l}/></article>;
      const s=r.snapshot;const p=r.proposal;
      const stale=Object.keys(s).some(k=>s[k]!==l[k as keyof typeof l]);
      const point=typeof p.latitude==='number' && typeof p.longitude==='number' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
      const map=point ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.latitude+','+p.longitude)}` : null;
      return <article key={r.location_id} style={{border:"1px solid #ddd",padding:16,margin:"20px 0",borderRadius:8}}>
        <h2>{l.name ?? "Location"}</h2><p>{[l.address,l.city,l.state,l.postal_code].filter(Boolean).join(", ")}</p>
        <p>Status: {r.status} · Checked {r.checked_at.slice(0,16)} UTC</p><p>{p.note}</p>
        {p.matched_address && <p>Returned address: {p.matched_address}</p>}
        {map && <p><a href={map} target="_blank" rel="noopener noreferrer">Open proposed map pin</a> · {p.latitude}, {p.longitude}</p>}
        {stale ? <p>The address changed. Run another check before reviewing.</p> : <form action="/api/admin/geocode" method="post">
          <input type="hidden" name="location" value={r.location_id}/><input type="hidden" name="revision" value={r.revision}/>
          {r.status==='review' && point && <><label><input type="checkbox" name="confirmed" value="yes"/> I checked the full returned address and map pin, including the correct entrance or activity departure point.</label><p><button name="action" value="approve">Save reviewed coordinates</button></p></>}
          <button name="action" value="dismiss">Dismiss proposal</button>
        </form>}
        <AddressEditForm location={l}/>
      </article>;
    })}
  </main>;
}
