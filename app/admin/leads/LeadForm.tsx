'use client';
import {useState} from 'react';
import {markets,stages,parseLead} from '../../../lib/leads-core.mjs';
type Lead={id:string;revision:string;business_name:string;market:string;stage:string;source_url:string;official_url:string|null;destination:string;offer_summary:string;eligibility_notes:string;redemption_notes:string;research_notes:string};
const labels:Record<string,string>={new:'New',researching:'Researching',ready:'Ready for offer review',dismissed:'Dismissed'};
export default function LeadForm({lead}:{lead?:Lead}) {
 const [error,setError]=useState('');
 return <form action="/api/admin/leads" method="post" onSubmit={event=>{try{parseLead(new FormData(event.currentTarget));setError('');}catch{event.preventDefault();setError('Check the public HTTPS post/page link and required fields. Ready for offer review also needs an official offer link, summary, eligibility and redemption notes.');}}} style={{display:'grid',gap:12,maxWidth:720}}>
  {error && <p role="alert">{error}</p>}
  {lead && <><input type="hidden" name="id" value={lead.id}/><input type="hidden" name="revision" value={lead.revision}/></>}
  <label>Business name <input name="business_name" defaultValue={lead?.business_name} maxLength={160} required/></label>
  <label>Source post or page link <input name="source_url" type="url" defaultValue={lead?.source_url} maxLength={1500} placeholder="https://www.instagram.com/p/…/" required/></label>
  <label>Pilot market <select name="market" defaultValue={lead?.market ?? markets[0]}>{markets.map(m=><option key={m}>{m}</option>)}</select></label>
  <label>Actual city / destination <input name="destination" defaultValue={lead?.destination} maxLength={200}/></label>
  <label>Research stage <select name="stage" defaultValue={lead?.stage ?? 'new'}>{stages.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label>
  <label>Offer summary <textarea name="offer_summary" defaultValue={lead?.offer_summary} maxLength={2000} rows={3}/></label>
  <label>Official business offer link <input name="official_url" type="url" defaultValue={lead?.official_url ?? ''} maxLength={1500}/></label>
  <label>Eligibility and restrictions <textarea name="eligibility_notes" defaultValue={lead?.eligibility_notes} maxLength={2000} rows={3}/></label>
  <label>Redemption steps and expiration / review notes <textarea name="redemption_notes" defaultValue={lead?.redemption_notes} maxLength={2000} rows={3}/></label>
  <label>Research notes <textarea name="research_notes" defaultValue={lead?.research_notes} maxLength={5000} rows={4}/></label>
  <p>Ready for offer review requires the official link, offer summary, eligibility and redemption notes. Saving a lead never publishes an offer.</p>
  <button>{lead?'Save lead changes':'Add private lead'}</button>
 </form>;
}
