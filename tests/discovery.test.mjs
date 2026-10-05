import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizedCron, extractEvidence, robotsAllows, safeSourceUrl } from '../lib/discovery-core.mjs';
test('scheduler fails closed on missing, short, and wrong secrets',()=>{
 const secret='a'.repeat(40);
 assert.equal(authorizedCron(null,secret),false);
 assert.equal(authorizedCron('Bearer undefined',undefined),false);
 assert.equal(authorizedCron('Bearer short','short'),false);
 assert.equal(authorizedCron('Bearer '+secret,secret),true);
 assert.equal(authorizedCron('Bearer '+'b'.repeat(40),secret),false);
});
test('fetch targets exclude private endpoints, arbitrary hosts, ports and other parks',()=>{
 for(const value of ['http://seaworld.com/san-diego/','https://127.0.0.1/','https://example.com/','https://seaworld.com:444/san-diego/','https://me:password@seaworld.com/san-diego/','https://seaworld.com/san-diego/login','https://seaworld.com/orlando/']) assert.throws(()=>safeSourceUrl(value));
 assert.equal(safeSourceUrl('https://navysealmuseumsd.org/visit/#prices'),'https://navysealmuseumsd.org/visit/');
});
test('excerpts are bounded and stable across unrelated navigation and whitespace changes',()=>{
 const a=extractEvidence('<nav>Veteran nav</nav><p>Military admission $10</p>','https://navysealmuseumsd.org/visit/');
 const b=extractEvidence('<nav>Different menu</nav><p>Military   admission $10</p>','https://navysealmuseumsd.org/visit/');
 assert.equal(a.fingerprint,b.fingerprint);assert.equal(a.found,true);
 assert.notEqual(a.fingerprint,extractEvidence('<p>Military admission $13</p>','https://navysealmuseumsd.org/visit/').fingerprint);
 assert.equal(extractEvidence('<script>military free</script><p>No offers</p>','https://navysealmuseumsd.org/visit/').found,false);
 assert.ok(extractEvidence('<p>military '.repeat(10000),'https://navysealmuseumsd.org/visit/').excerpt.length<=16000);
});
test('only same-site public offer links are followed',()=>{
 const result=extractEvidence('<a href="/military/">Military</a><a href="https://example.com/military">Military</a><a href="/login">Veteran login</a>','https://navysealmuseumsd.org/visit/');
 assert.deepEqual(result.links,['https://navysealmuseumsd.org/military/']);
});
test('robots rules honor specific agents, longest matches, wildcard, and allow precedence',()=>{
 assert.equal(robotsAllows('User-agent: *\nDisallow: /','/visit/'),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /private\nAllow: /private/public','/private/public'),true);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /\nUser-agent: DutyPerksBot\nAllow: /','/visit/'),true);
 assert.equal(robotsAllows('User-agent: *\nDisallow: /*?','/visit/?x=1'),false);
 assert.equal(robotsAllows('User-agent: *\nDisallow:','/visit/'),true);
});
