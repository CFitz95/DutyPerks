import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLead,safeLeadUrl,markets} from '../lib/leads-core.mjs';
function form(overrides={}){const f=new FormData();for(const [k,v] of Object.entries({business_name:'Example business',market:markets[0],stage:'new',source_url:'https://www.instagram.com/p/Example123/?igsh=tracking',...overrides})) f.set(k,v);return f;}
test('Instagram tracking variants normalize without changing shortcode case',()=>{
 assert.equal(safeLeadUrl('https://instagram.com/reel/AbC_12/?igsh=abc#x'),'https://www.instagram.com/reel/AbC_12/');
 assert.equal(parseLead(form()).source_url,'https://www.instagram.com/p/Example123/');
});
test('unsafe URLs and account profiles cannot be submitted as post leads',()=>{
 for(const u of ['javascript:alert(1)','http://example.com','https://localhost','https://127.0.0.1/a','https://[::1]/','https://user:pass@example.com','https://example.com:444/a','https://www.instagram.com/militarybenefitsapp/']) assert.throws(()=>safeLeadUrl(u));
});
test('new lead can be saved with unknown offer details and is not published',()=>{const r=parseLead(form());assert.equal(r.stage,'new');assert.equal(r.official_url,null);assert.equal('status' in r,false);});
test('ready stage requires official evidence, eligibility and redemption notes',()=>{
 assert.throws(()=>parseLead(form({stage:'ready'})));
 const r=parseLead(form({stage:'ready',official_url:'https://example.com/military',offer_summary:'Unverified research summary',eligibility_notes:'Needs official eligibility check',redemption_notes:'Official terms to review'}));assert.equal(r.stage,'ready');
});
test('invalid markets, stages, blank businesses and oversized notes are rejected',()=>{
 for(const o of [{market:'unknown'},{stage:'published'},{business_name:' '},{research_notes:'x'.repeat(5001)}]) assert.throws(()=>parseLead(form(o)));
});
test('official links preserve meaningful query parameters and remove tracking',()=>assert.equal(safeLeadUrl('https://example.com/offer?id=42&utm_source=test#top'),'https://example.com/offer?id=42'));
