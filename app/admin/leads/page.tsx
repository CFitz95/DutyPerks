import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getAdmin} from '../../../lib/admin-auth';
import {privateSupabase} from '../../../lib/private-supabase';
import {markets,stages,safeLeadUrl} from '../../../lib/leads-core.mjs';
import LeadForm from './LeadForm';
export const dynamic='force-dynamic';
const labels:Record<string,string>={new:'New',researching:'Researching',ready:'Ready for offer review',dismissed:'Dismissed'};
const messages:Record<string,string>={created:'Private lead added.',saved:'Lead changes saved.',duplicate:'A lead already uses this source link and business name. Edit that lead instead.',invalid:'Not saved. Check required fields, public HTTPS links and the ready-for-review requirements.',stale:'Not saved. This lead changed in another tab. Reload before editing.',unavailable:'Lead inbox unavailable. Check database setup and server configuration.'};
export default async function LeadsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 if(!await getAdmin()) redirect('/admin');
 const params=await searchParams;
 const stage=typeof params.stage==='string' && stages.includes(params.stage)?params.stage:'';
 const market=typeof params.market==='string' && markets.includes(params.market)?params.market:'';
 let query=privateSupabase().from('social_leads').select('*').order('updated_at',{ascending:false}).limit(100);
 if(stage) query=query.eq('stage',stage);if(market) query=query.eq('market',market);
 const {data,error}=await query;
 if(error) return <main><Link href="/admin">← Admin</Link><h1>Lead inbox</h1><p>The private inbox could not load. Check the lead-inbox database setup.</p></main>;
 return <main><Link href="/admin">← Admin</Link><h1>Lead inbox</h1>
  <p>Save potential military discounts for research. Social posts are unverified leads. Confirm current official terms before using the existing offer review process.</p>
  {typeof params.notice==='string' && messages[params.notice] && <p role="status">{messages[params.notice]}</p>}
  <p>Starting account: <a href="https://www.instagram.com/militarybenefitsapp/" target="_blank" rel="noopener noreferrer">@militarybenefitsapp</a>. Open a post and copy its link. This inbox does not automatically fetch posts or monitor Instagram.</p>
  <details><summary style={{cursor:'pointer'}}>Add a lead</summary><LeadForm/></details>
  <h2>Research queue</h2>
  <form method="get" style={{display:'flex',gap:12,flexWrap:'wrap'}}>
   <label>Stage <select name="stage" defaultValue={stage}><option value="">All stages</option>{stages.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label>
   <label>Market <select name="market" defaultValue={market}><option value="">All markets</option>{markets.map(m=><option key={m}>{m}</option>)}</select></label><button>Filter leads</button><Link href="/admin/leads">Clear filters</Link>
  </form>
  <p>{data?.length ?? 0} matching leads shown, newest updated first (up to 100). Filter by market or stage to narrow the queue.</p>
  {!data?.length && <p>No leads in this view. Add the first lead or change your filters.</p>}
  {(data ?? []).map(lead=>{
   let source:string|null=null,official:string|null=null;
   try{source=safeLeadUrl(lead.source_url);official=safeLeadUrl(lead.official_url,true);}catch{/* Invalid stored links are never rendered as clickable URLs. */}
   return <article key={lead.id} style={{border:'1px solid #ddd',borderRadius:8,padding:16,margin:'20px 0'}}>
    <h2>{lead.business_name}</h2><p>{lead.market} · {labels[lead.stage]} · {lead.destination || 'Destination not recorded'}</p>
    <p>{lead.offer_summary || 'Offer details need research.'}</p>
    {source && <p><a href={source} target="_blank" rel="noopener noreferrer">Open discovery source</a></p>}
    {official && <p><a href={official} target="_blank" rel="noopener noreferrer">Open official offer source</a></p>}
    {lead.stage==='ready' && <p>Research is ready, but the offer is still unpublished. Use the <Link href="/admin">offer review queue</Link> when the official business/source has been added to the existing monitoring workflow. This lead does not automatically create a business, destination or benefit.</p>}
    <details><summary style={{cursor:'pointer'}}>Edit lead and research notes</summary><LeadForm lead={lead}/></details>
   </article>;
  })}
 </main>;
}
