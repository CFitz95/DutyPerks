import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyTrip,parseTrip,savedOffer,addOffer,reorderItem,dayDate,savedOfferStatus,directionsUrl} from '../lib/itinerary-core.mjs';
const offer=(n=1)=>({id:`00000000-0000-0000-0000-${n.toString(16).padStart(12,'0')}`,title:'Military admission',business_name:'Test Venue',city:'San Diego',state:'CA',source_url:'https://example.com/military',verified_at:'2026-10-17T00:00:00Z',expires_at:null,requirements:'Qualifying ID required.'});
test('new trip round trips and adds public fields only, without duplicates or mutating the original',()=>{
 const empty=emptyTrip(),next=addOffer(empty,{...offer(),research_notes:'PRIVATE',user_id:'PRIVATE'});
 assert.equal(empty.items.length,0);assert.equal(next.items.length,1);assert.equal('research_notes' in next.items[0].offer,false);
 assert.deepEqual(parseTrip(JSON.stringify(next)),next);assert.equal(addOffer(next,offer()).items.length,1);assert.deepEqual(parseTrip(null),emptyTrip());
});
test('damaged, unsupported or oversized saved data is rejected rather than silently replaced',()=>{
 for(const raw of ['{','null',JSON.stringify({...emptyTrip(),version:2}),JSON.stringify({...emptyTrip(),days:15}),JSON.stringify({...emptyTrip(),startDate:'2026-02-30'}),'x'.repeat(300001)])assert.throws(()=>parseTrip(raw));
});
test('invalid day, time, notes and duplicate items are rejected before storage',()=>{
 const p=addOffer(emptyTrip(),offer());
 for(const fields of [{day:0},{day:2},{time:'24:01'},{notes:'x'.repeat(501)}])assert.throws(()=>parseTrip(JSON.stringify({...p,items:[{...p.items[0],...fields}]})));
 assert.throws(()=>parseTrip(JSON.stringify({...p,items:[p.items[0],p.items[0]]})));
});
test('a trip is limited to 50 distinct saved offers',()=>{let p=emptyTrip();for(let i=1;i<=50;i++)p=addOffer(p,offer(i));assert.throws(()=>addOffer(p,offer(51)));});
test('ordering changes only same-day neighbors and remains immutable at boundaries',()=>{
 let p={...emptyTrip(),days:2};for(let i=1;i<=3;i++)p=addOffer(p,offer(i));p={...p,items:p.items.map((x,i)=>({...x,day:i===1?2:1}))};
 const next=reorderItem(p,offer(3).id,-1);assert.deepEqual(next.items.map(i=>i.offer.id),[offer(3).id,offer(2).id,offer(1).id]);assert.equal(p.items[0].offer.id,offer(1).id);assert.deepEqual(reorderItem(p,offer(1).id,-1),p);
});
test('visit dates and expiry checks use calendar days without timezone shifts',()=>{
 assert.equal(dayDate('2026-12-31',2),'2027-01-01');assert.equal(dayDate('2028-02-28',2),'2028-02-29');assert.equal(dayDate('',2),'');
 const o={...offer(),expires_at:'2026-10-20'},now=new Date('2026-10-17T12:00:00Z');
 assert.match(savedOfferStatus(o,'2026-10-21',now),/ends before/);assert.doesNotMatch(savedOfferStatus(o,'2026-10-20',now),/ends before/);
 assert.match(savedOfferStatus(offer(),'',new Date('2026-11-16T00:00:00Z')),/fresh check/);
});
test('source links reject executable schemes and map destinations remain encoded',()=>{
 assert.throws(()=>savedOffer({...offer(),id:[offer().id]}));assert.throws(()=>savedOffer({...offer(),verified_at:2026}));
 for(const source_url of ['javascript:alert(1)','http://example.com','https://user:pass@example.com'])assert.throws(()=>savedOffer({...offer(),source_url}));
 const url=new URL(directionsUrl({...offer(),business_name:'Cafe A&B #2'}));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('destination'),'Cafe A&B #2, San Diego, CA');assert.equal(url.searchParams.size,2);
});
