/** @typedef {{id:string,title:string,business_name:string,city:string,state:string,source_url:string,verified_at:string,expires_at:string|null,requirements:string}} SavedOffer */
/** @typedef {{offer:SavedOffer,day:number,time:string,notes:string}} TripItem */
/** @typedef {{version:1,name:string,destination:string,startDate:string,days:number,notes:string,items:TripItem[]}} Trip */
export const PLAN_KEY='dutyperks-trip-v1';
/** @returns {Trip} */
export function emptyTrip(){return {version:1,name:'My trip',destination:'San Diego',startDate:'',days:1,notes:'',items:[]};}
const uuid=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
function text(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Invalid saved trip');return v;}
export function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
/** Copy only public offer fields. @returns {SavedOffer} */
export function savedOffer(v){
 if(!v||typeof v.id!=='string'||!uuid.test(v.id))throw Error('Invalid offer');const url=new URL(v.source_url);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Invalid source');
 if(typeof v.verified_at!=='string'||v.verified_at.length>100||!Number.isFinite(Date.parse(v.verified_at))||(v.expires_at!==null&&!validDate(v.expires_at)))throw Error('Invalid offer dates');
 return {id:v.id,title:text(v.title,200,true),business_name:text(v.business_name,160,true),city:text(v.city,120,true),state:text(v.state,30,true),source_url:text(url.href,1500,true),verified_at:v.verified_at,expires_at:v.expires_at,requirements:text(v.requirements??'',3000)};
}
/** Reject damaged storage without overwriting it. @returns {Trip} */
export function parseTrip(raw){
 if(raw===null)return emptyTrip();if(typeof raw!=='string'||raw.length>300000)throw Error('Saved trip cannot be read');const p=JSON.parse(raw);
 if(!p||p.version!==1||!Number.isInteger(p.days)||p.days<1||p.days>14||!Array.isArray(p.items)||p.items.length>50||(p.startDate!==''&&!validDate(p.startDate)))throw Error('Invalid saved trip');
 const seen=new Set();const items=p.items.map(i=>{
  if(!Number.isInteger(i.day)||i.day<1||i.day>p.days||typeof i.time!=='string'||(i.time!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time)))throw Error('Invalid day or time');
  const offer=savedOffer(i.offer);if(seen.has(offer.id))throw Error('Duplicate saved offer');seen.add(offer.id);
  return {offer,day:i.day,time:i.time,notes:text(i.notes,500)};
 });
 return {version:1,name:text(p.name,100,true),destination:text(p.destination,120),startDate:p.startDate,days:p.days,notes:text(p.notes,1000),items};
}
/** @param {Trip} trip @returns {Trip} */
export function addOffer(trip,value){
 const offer=savedOffer(value);if(trip.items.some(i=>i.offer.id===offer.id))return trip;
 if(trip.items.length>=50)throw Error('Your trip holds up to 50 offers. Remove one before adding another.');
 return {...trip,items:[...trip.items,{offer,day:1,time:'',notes:''}]};
}
/** @param {Trip} trip @returns {Trip} */
export function reorderItem(trip,id,direction){
 if(![-1,1].includes(direction))return trip;const items=[...trip.items],index=items.findIndex(i=>i.offer.id===id);if(index<0)return trip;
 let other=index+direction;while(other>=0&&other<items.length&&items[other].day!==items[index].day)other+=direction;
 if(other<0||other>=items.length)return trip;[items[index],items[other]]=[items[other],items[index]];return {...trip,items};
}
export function dayDate(startDate,day){if(!validDate(startDate))return '';const d=new Date(`${startDate}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+day-1);return d.toISOString().slice(0,10);}
export function savedOfferStatus(offer,visitDate='',now=new Date()){
 const today=now.toISOString().slice(0,10);if(offer.expires_at&&offer.expires_at<(visitDate>today?visitDate:today))return 'Offer ends before this visit — check alternatives';
 if(now.getTime()-Date.parse(offer.verified_at)>=30*86400000)return 'Saved terms need a fresh check';
 return 'Saved offer — confirm current terms before visiting';
}
export function directionsUrl(offer){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${offer.business_name}, ${offer.city}, ${offer.state}`)}`;}
