import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizedCron, extractEvidence, pdfEvidence, robotsAllows, safeSourceUrl } from '../lib/discovery-core.mjs';
test('scheduler fails closed on missing, short, and wrong secrets',()=>{
 const secret='a'.repeat(40);
 assert.equal(authorizedCron(null,secret),false);
 assert.equal(authorizedCron('Bearer undefined',undefined),false);
 assert.equal(authorizedCron('Bearer short','short'),false);
 assert.equal(authorizedCron('Bearer '+secret,secret),true);
 assert.equal(authorizedCron('Bearer '+'b'.repeat(40),secret),false);
});
test('MWR PDF monitoring hashes documents without inventing offers or prices',()=>{
 const url='https://whidbey.navylifepnw.com/modules/media/?do=download&id=fixture';
 const a=pdfEvidence(Buffer.from('%PDF-1.7 fixture one'),url);
 const b=pdfEvidence(Buffer.from('%PDF-1.7 fixture two'),url);
 assert.notEqual(a.fingerprint,b.fingerprint);
 assert.equal(a.fingerprint,pdfEvidence(Buffer.from('%PDF-1.7 fixture one'),url).fingerprint);
 assert.match(a.excerpt,/does not extract PDF prices/);
 assert.deepEqual(a.links,[]);
 assert.throws(()=>pdfEvidence(Buffer.from('<html>military</html>'),url));
 assert.throws(()=>pdfEvidence(Buffer.from('%PDF-1.7'),'https://www.whidbeyislandkayaking.com/faq'));
});
test('MWR ticket links are followed and cache-busting URLs deduplicate',()=>{
 const result=extractEvidence('<p>MWR discount tickets</p><a href="/modules/media/?do=download&amp;id=fixture&amp;__cb=123">Ticket Price List</a>', 'https://sandiego.navylifesw.com/recreation/tickets-travel-itt');
 assert.equal(result.found,true);
 assert.deepEqual(result.links,['https://sandiego.navylifesw.com/modules/media/?do=download&id=fixture']);
 const ordinary=extractEvidence('<a href="/price-list">Price List</a>','https://www.whidbeyislandkayaking.com/faq');
 assert.deepEqual(ordinary.links,[]);
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
