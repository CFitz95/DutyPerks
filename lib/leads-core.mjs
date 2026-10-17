export const markets=['San Diego / Oceanside','San Antonio','Norfolk / Virginia Beach','Fayetteville','Killeen / Copperas Cove','Orlando / Kissimmee','Whidbey Island','Other / nationwide'];
export const stages=['new','researching','ready','dismissed'];
export function safeLeadUrl(value,optional=false) {
  const raw=String(value ?? '').trim();if(!raw && optional) return null;
  if(raw.length>1500) throw Error('URL too long');
  const u=new URL(raw);
  if(u.protocol!=='https:' || u.username || u.password || (u.port && u.port!=='443') || !u.hostname.includes('.') || /^\d+\./.test(u.hostname) || u.hostname.includes(':') || /\.(local|localhost|internal|test)$/i.test(u.hostname)) throw Error('Use a public HTTPS source');
  u.hash='';
  for(const key of [...u.searchParams.keys()]) if(/^(utm_|fbclid$|igsh$|igshid$)/i.test(key)) u.searchParams.delete(key);
  if(['instagram.com','www.instagram.com'].includes(u.hostname)) {
    const match=u.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/);
    if(!match) throw Error('Use the Instagram post or reel link');
    u.hostname='www.instagram.com';u.pathname=`/${match[1]}/${match[2]}/`;u.search='';
  }
  return u.toString();
}
export function parseLead(form) {
  function text(key,max,required=false) { const v=form.get(key);if(v!==null && typeof v!=='string') throw Error('Invalid field');const s=String(v ?? '').trim();if(s.length>max || (required&&!s)) throw Error('Check required fields');return s; }
  const business_name=text('business_name',160,true),market=text('market',100,true),stage=text('stage',20,true);
  if(!markets.includes(market) || !stages.includes(stage)) throw Error('Invalid market or stage');
  const source_url=safeLeadUrl(text('source_url',1500,true));
  const official_url=safeLeadUrl(text('official_url',1500),true);
  const offer_summary=text('offer_summary',2000),eligibility_notes=text('eligibility_notes',2000),redemption_notes=text('redemption_notes',2000),research_notes=text('research_notes',5000),destination=text('destination',200);
  if(stage==='ready' && (!official_url || !offer_summary || !eligibility_notes || !redemption_notes)) throw Error('Ready leads need an official source, summary, eligibility and redemption notes');
  return {business_name,market,stage,source_url,official_url,offer_summary,eligibility_notes,redemption_notes,research_notes,destination};
}
