import test from 'node:test';
import assert from 'node:assert/strict';
import {eligibility,interpret,lookup,snapshot} from '../lib/geocoding-core.mjs';
const location={name:'Restaurant',address:'353 Fifth Ave',city:'San Diego',state:'CA',postal_code:'92101',country:'US'};
const match=()=>({coordinates:{y:32.70888,x:-117.16003},matchedAddress:'353 5TH AVE, SAN DIEGO, CA, 92101',addressComponents:{city:'SAN DIEGO',state:'CA',zip:'92101'}});
const payload=(...m)=>({result:{addressMatches:m}});
test('full street address is eligible; venue and area names are not',()=>{
  assert.equal(eligibility(location),null);
  for(const address of ['Coronado Cays','H&M Landing',null,'']) assert.equal(eligibility({...location,address}),'address_needed');
});
test('multi-office resources and unsupported countries are excluded',()=>{
  assert.equal(eligibility({...location,name:'NBSD ticket offices; see official office map'}),'purchase_office');
  assert.equal(eligibility({...location,country:'CA'}),'unsupported_country');
});
test('MWR organizations and explicit purchase-office roles never trigger a lookup',async()=>{
  const never=()=>{throw Error('must not call');};
  assert.equal((await lookup({...location,coordinate_role:'organization_resource'},never)).status,'organization_resource');
  assert.equal((await lookup({...location,name:'Convergence Zone',coordinate_role:'purchase_office'},never)).status,'purchase_office');
  assert.equal((await lookup({...location,name:'MWR Tickets & Travel'},never)).status,'organization_resource');
});
test('an attraction remains eligible when its offer is supplied by MWR',()=>{
  assert.equal(eligibility({...location,name:'Actual attraction',coordinate_role:'destination',offer_provider:'MWR'}),null);
});
test('changing a location role invalidates its proposal snapshot',()=>{
  assert.notDeepEqual(snapshot(location),snapshot({...location,coordinate_role:'purchase_office'}));
  assert.equal(eligibility({...location,coordinate_role:'unknown'}),'unsupported_role');
});
test('excluded records never call the lookup service',async()=>{
  const result=await lookup({...location,address:null},()=>{throw Error('must not call');});
  assert.equal(result.status,'address_needed');
});
test('single matching address yields review, never automatic approval',()=>{
  const result=interpret(location,payload(match()));assert.equal(result.status,'review');
  assert.equal(result.latitude,32.70888);assert.equal(result.longitude,-117.16003);
});
test('multiple matches do not choose a coordinate',()=>{
  const r=interpret(location,payload(match(),match()));assert.equal(r.status,'ambiguous');assert.equal(r.latitude,undefined);
});
test('no match remains unresolved',()=>assert.equal(interpret(location,payload()).status,'no_match'));
test('city, ZIP and state mismatches block approval',()=>{
  for(const [key,value] of [['city','EL CAJON'],['state','WA'],['zip','92020']]) {
    const m=match();m.addressComponents[key]=value;
    const r=interpret(location,payload(m));assert.equal(r.status,'address_mismatch');assert.equal(r.latitude,undefined);
  }
});
test('malformed coordinates or responses fail closed',()=>{
  assert.throws(()=>interpret(location,{}));
  for(const value of [null,NaN,Infinity,91,'32.7']) { const m=match();m.coordinates.y=value;assert.throws(()=>interpret(location,payload(m))); }
});
test('lookup uses only the Census HTTPS endpoint and preserves x/y order',async()=>{
  const r=await lookup(location,async(url,options)=>{
    assert.equal(url.hostname,'geocoding.geo.census.gov');assert.equal(url.protocol,'https:');assert.equal(options.redirect,'error');
    return new Response(JSON.stringify(payload(match())));
  });assert.equal(r.status,'review');assert.equal(r.longitude,-117.16003);
});
test('service errors and oversized responses are rejected',async()=>{
  await assert.rejects(lookup(location,async()=>new Response('',{status:503})));
  await assert.rejects(lookup(location,async()=>new Response('x'.repeat(1000001))));
});
test('snapshot captures address and destination changes without coordinates',()=>{
  assert.notDeepEqual(snapshot(location),snapshot({...location,address:'Another address'}));
  assert.notDeepEqual(snapshot(location),snapshot({...location,name:'Departure office'}));
  assert.deepEqual(snapshot(location),snapshot({...location,coordinates:'existing point'}));
});
