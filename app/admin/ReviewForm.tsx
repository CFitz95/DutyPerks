"use client";
import { useState } from "react";
export interface EditableOffer {
  id: string; title: string; description: string; requirements: string | null;
  category: string; starts_at: string | null; expires_at: string | null;
  normal_price: number | null; military_price: number | null; eligibility: string[];
}
const statuses = [["active_duty","Active Duty"],["reserve_guard","Reserve / Guard"],["veteran","Veteran"],["retired","Retired"],["family","Military Family"]];
const categories = ["food","hotel","attraction","tour","entertainment","shopping","automotive","fitness","education","financial"];
export default function ReviewForm({ candidate, offers }: { candidate: string; offers: EditableOffer[] }) {
  const [selected, setSelected] = useState("");
  const offer = offers.find(o => o.id === selected);
  return <form key={selected} action="/api/admin/review" method="post" style={{ display: "grid", gap: 10 }}>
    <input type="hidden" name="candidate" value={candidate} />
    <input type="hidden" name="action" value="approve" />
    <label>Update an existing offer, or add a distinct one<br />
      <select name="benefit" value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">New offer</option>{offers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
      </select>
    </label>
    {!selected && <label><input type="checkbox" name="newOffer" required /> This is a distinct offer, not a duplicate of one listed above.</label>}
    <label>Offer title<br /><input name="title" required minLength={3} maxLength={200} defaultValue={offer?.title ?? ""} style={{ width: "100%" }} /></label>
    <label>Description and prices by purchase method<br /><textarea name="description" required minLength={10} maxLength={3000} rows={4} defaultValue={offer?.description ?? ""} style={{ width: "100%" }} /></label>
    <label>Eligibility restrictions, required ID, guest limits, exclusions<br /><textarea name="requirements" required minLength={5} maxLength={3000} rows={4} defaultValue={offer?.requirements ?? ""} style={{ width: "100%" }} /></label>
    <label>Category <select name="category" defaultValue={offer?.category ?? "attraction"}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <fieldset><legend>Eligible groups (explain any narrower conditions above)</legend>{statuses.map(([key,label]) => <label key={key} style={{ display: "block" }}><input type="checkbox" name="eligibility" value={key} defaultChecked={offer?.eligibility.includes(key) ?? false} /> {label}</label>)}</fieldset>
    <label>Starts on, if stated <input name="startsAt" type="date" defaultValue={offer?.starts_at ?? ""} /></label>
    <label>Expires on <input name="expiresAt" type="date" defaultValue={offer?.expires_at ?? ""} /></label>
    <label><input type="checkbox" name="noExpiry" /> Source does not publish an expiration date (leave date empty).</label>
    <label>Comparable normal price, if confirmed <input name="normalPrice" type="number" min="0" step="0.01" max="9999999" defaultValue={offer?.normal_price ?? ""} /></label>
    <label>Eligible price, if confirmed <input name="militaryPrice" type="number" min="0" step="0.01" max="9999999" defaultValue={offer?.military_price ?? ""} /></label>
    <p>Use prices for the same ticket and purchase method. Leave unknown prices blank. Never assume a year, discount, or eligibility.</p>
    <label><input type="checkbox" name="confirm" required /> I opened the official source and confirmed every term above, including dates and any conflicting wording.</label>
    <button type="submit">Save verified offer</button>
  </form>;
}
