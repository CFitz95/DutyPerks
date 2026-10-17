import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { currentCruisePrograms, cruiseTypes } from '../lib/cruises-core.mjs';
const programs = JSON.parse(readFileSync(new URL('../lib/cruise-programs.json', import.meta.url), 'utf8'));
const now = new Date('2026-10-17T12:00:00Z');

test('only explicitly published, reviewed programs are public; inbox records cannot leak through', () => {
  const fixtures = [programs[0], {...programs[0], published:false}, {stage:'ready',business_name:'Private research',research_notes:'Private'}];
  assert.equal(currentCruisePrograms(fixtures,now).length,1);
});
test('terms disappear at review deadline without depending on a new deployment', () => {
  assert.equal(currentCruisePrograms(programs,new Date('2026-11-15T23:59:59Z')).length,8);
  assert.equal(currentCruisePrograms(programs,new Date('2026-11-16T00:00:00Z')).length,0);
  assert.equal(currentCruisePrograms(programs,new Date('2026-10-16T23:59:59Z')).length,0);
});
test('invalid or excessive review windows fail closed', () => {
  for (const reviewBy of ['invalid','2027-01-01','2026-10-16']) {
    assert.equal(currentCruisePrograms([{...programs[0],reviewBy}],now).length,0);
  }
  assert.equal(currentCruisePrograms(programs,new Date('invalid')).length,0);
});
test('published catalogue separates credits and fare offers and supplies costs and official HTTPS sources', () => {
  assert.equal(new Set(programs.map(p=>p.id)).size,8);
  for(const p of programs) {
    assert.ok(cruiseTypes.some(t=>t.value===p.type));
    const url=new URL(p.url);assert.equal(url.protocol,'https:');assert.equal(url.username,'');
    for(const key of ['eligibility','costs','redemption','restrictions']) assert.ok(p[key].length>30);
    assert.equal('research_notes' in p,false);
  }
  assert.equal(programs.filter(p=>p.type==='onboard_credit').length,2);
  assert.equal(programs.filter(p=>p.type==='zero_fare').length,1);
});
