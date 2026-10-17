// Address estimates always require a human map check before saving coordinates.
export const snapshot = l => ({name:l.name ?? null,address:l.address ?? null,city:l.city ?? null,state:l.state ?? null,postal_code:l.postal_code ?? null,country:l.country ?? null,coordinate_role:l.coordinate_role ?? 'destination'});
export const signature = l => JSON.stringify(snapshot(l));
export function eligibility(l) {
  if (l.coordinate_role === 'organization_resource') return 'organization_resource';
  if (l.coordinate_role === 'purchase_office') return 'purchase_office';
  if (l.coordinate_role && l.coordinate_role !== 'destination') return 'unsupported_role';
  if (l.country !== 'US') return 'unsupported_country';
  if (/ticket office/i.test(l.name ?? '')) return 'purchase_office';
  if (/\bMWR\b|regional resource|nationwide|online only/i.test(l.name ?? '')) return 'organization_resource';
  if (!/^\d+\s+\S+/.test(l.address ?? '') || !l.city || !l.state) return 'address_needed';
  return null;
}
export function interpret(l, payload) {
  const matches = payload?.result?.addressMatches;
  if (!Array.isArray(matches)) throw new Error('Unexpected geocoder response');
  if (matches.length !== 1) return {status:matches.length ? 'ambiguous' : 'no_match',note:matches.length ? 'Multiple matches; no pin selected.' : 'No Census match. Confirm the address or use another source.'};
  const m=matches[0], latitude=m.coordinates?.y, longitude=m.coordinates?.x;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude)>90 || Math.abs(longitude)>180) throw new Error('Invalid coordinates');
  const a=m.addressComponents;
  const normalize=s=>String(s ?? '').trim().toUpperCase().replace(/\s+/g,' ');
  if (!a || normalize(a.state)!==normalize(l.state) || normalize(a.city)!==normalize(l.city) || (l.postal_code && a.zip!==l.postal_code)) {
    return {status:'address_mismatch',note:'Returned city, state or ZIP differs. Correct or verify the address first.',matched_address:String(m.matchedAddress ?? '').slice(0,500)};
  }
  return {status:'review',latitude,longitude,matched_address:String(m.matchedAddress ?? '').slice(0,500),note:'Census address estimate, not a verified business entrance. Compare the complete street address and map pin. Confirm headquarters versus activity launch and building access where applicable.'};
}
export async function lookup(l, fetcher=fetch) {
  const blocked=eligibility(l);
  if (blocked) return {status:blocked,note:['organization_resource','purchase_office','unsupported_role'].includes(blocked) ? 'Not an offer destination. Keep organizations unpinned and ticket purchase offices separate. Link each offer to its actual attraction or activity location.' : 'A complete US street address is needed.'};
  const url=new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
  url.search=new URLSearchParams({benchmark:'Public_AR_Current',format:'json',address:`${l.address}, ${l.city}, ${l.state} ${l.postal_code ?? ''}`}).toString();
  const response=await fetcher(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error('Geocoder unavailable');
  if (!response.body) throw new Error('Empty geocoder response');
  const reader=response.body.getReader();let size=0;const chunks=[];
  try { while(true) { const {done,value}=await reader.read();if(done) break;size+=value.byteLength;if(size>1000000) throw new Error('Response too large');chunks.push(value); } }
  finally { await reader.cancel().catch(()=>{}); }
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return interpret(l,JSON.parse(new TextDecoder().decode(bytes)));
}
