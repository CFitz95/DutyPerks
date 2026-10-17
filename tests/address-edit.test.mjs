import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAddressEdit} from '../lib/address-edit.mjs';
function form(overrides={}) {
  const values={location:'00000000-0000-0000-0000-000000002201',address:' 123 Example St ',city:' Oak Harbor ',state:'wa',postal_code:'98277',country:'US',expected:JSON.stringify({address:null,city:'Oak Harbor',state:'WA',postal_code:null,country:'US'}),...overrides};
  const f=new FormData();for(const [k,v] of Object.entries(values)) f.set(k,v);return f;
}
test('address edit normalizes text while preserving original nulls for concurrency checks',()=>{
  const r=parseAddressEdit(form());assert.equal(r.values.address,'123 Example St');assert.equal(r.values.city,'Oak Harbor');assert.equal(r.values.state,'WA');assert.equal(r.expected.address,null);
});
test('invalid fields, IDs and missing original values are rejected',()=>{
  for(const overrides of [{location:'wrong'},{address:' '},{state:'Washington'},{postal_code:'9827'},{country:'CA'},{city:'x'.repeat(101)},{expected:'{}'},{expected:'null'},{expected:'bad json'}]) assert.throws(()=>parseAddressEdit(form(overrides)));
});
test('blank ZIP stays unknown rather than becoming a guessed value',()=>assert.equal(parseAddressEdit(form({postal_code:''})).values.postal_code,null));
test('address editor never accepts coordinate or role changes',()=>{
  const r=parseAddressEdit(form({coordinates:'POINT(1 2)',coordinate_role:'purchase_office'}));assert.equal('coordinates' in r.values,false);assert.equal('coordinate_role' in r.values,false);
});
