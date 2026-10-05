import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3322';
const adminId='22222222-2222-4222-8222-222222222222';
const candidateId='33333333-3333-4333-8333-333333333333';
const sourceId='44444444-4444-4444-8444-444444444444';
const secret='fixture-cron-'+'a'.repeat(40);
let databaseCalls=0,lastReview,lastSnapshot,lastFinish,leaseBusy=true,robotsBlocked=false;
const mock=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json');
  if(u.pathname==='/fixture'){
    res.setHeader('Content-Type','text/html');
    if(new URL(u.searchParams.get('url')).pathname==='/robots.txt') res.end(robotsBlocked?'User-agent: *\nDisallow: /':'User-agent: *\nAllow: /');
    else res.end('<title>Official Fixture</title><p>Military admission with ID</p><a href="/military/">Military offers</a>');
    return;
  }
  if(u.pathname==='/auth/v1/user'){
    const permitted=req.headers.authorization==='Bearer allowed-admin-token';
    res.end(JSON.stringify({id:adminId,email:permitted?'admin@example.com':'other@example.com',email_confirmed_at:'2026-10-04T00:00:00Z'}));return;
  }
  databaseCalls++;
  if(u.pathname==='/rest/v1/rpc/begin_discovery_run'){res.end(JSON.stringify(leaseBusy?null:adminId));return;}
  if(u.pathname==='/rest/v1/rpc/record_discovery_snapshot'){let s='';for await(const c of req)s+=c;lastSnapshot=JSON.parse(s);res.end('true');return;}
  if(u.pathname==='/rest/v1/rpc/finish_discovery_run'){let s='';for await(const c of req)s+=c;lastFinish=JSON.parse(s);res.end('null');return;}
  if(u.pathname==='/rest/v1/rpc/review_discovery_offer'){let s='';for await(const c of req)s+=c;lastReview=JSON.parse(s);res.end(JSON.stringify(adminId));return;}
  const rows={
   discovery_sources:[{id:sourceId,url:'https://navysealmuseumsd.org/visit/',business_id:adminId,location_id:adminId,last_hash:'a'.repeat(64),last_checked_at:null,last_error:null,enabled:true}],
   discovery_candidates:[{id:candidateId,source_id:sourceId,fingerprint:'a'.repeat(64),title:'Private candidate fixture',excerpt:'Unverified military source evidence',kind:'new',state:'pending',discovered_at:'2026-10-04T00:00:00Z'}],
   discovery_runs:[],benefits:[],benefit_eligibility:[],businesses:[{id:adminId,name:'Fixture Museum'}]
  };
  res.end(JSON.stringify(rows[u.pathname.split('/').at(-1)]??[]));
});
await new Promise(r=>mock.listen(3321,'127.0.0.1',r));
const preload=new URL('./mock-discovery-fetch.cjs',import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1');
const app=spawn(process.execPath,['--require',decodeURIComponent(preload),'node_modules/next/dist/bin/next','start','-p','3322'],{cwd:new URL('../',import.meta.url),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:3321',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-public-key',SUPABASE_SECRET_KEY:'fixture-server-key',ADMIN_EMAIL:'admin@example.com',CRON_SECRET:secret},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('start timeout')),30000);app.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timer);resolve();}});app.on('exit',code=>reject(Error('App exited '+code)));});
 let r=await fetch(origin+'/admin');let html=await r.text();assert.match(html,/Offer review sign-in/);assert.doesNotMatch(html,/Private candidate fixture/);assert.equal(databaseCalls,0);console.log('Anonymous admin page exposes no queue or database requests');
 r=await fetch(origin+'/admin',{headers:{Cookie:'dutyperks-admin=other-token'}});html=await r.text();assert.doesNotMatch(html,/Private candidate fixture/);assert.equal(databaseCalls,0);console.log('Authenticated non-admin is blocked');
 r=await fetch(origin+'/admin',{headers:{Cookie:'dutyperks-admin=allowed-admin-token'}});html=await r.text();assert.match(html,/Private candidate fixture/);assert.doesNotMatch(html,/fixture-server-key/);console.log('Verified configured admin can read the private queue');
 for(const headers of [{},{authorization:'Bearer wrong'}]){r=await fetch(origin+'/api/cron/discover',{headers});assert.equal(r.status,401);}console.log('Missing and wrong cron credentials rejected');
 r=await fetch(origin+'/api/cron/discover',{headers:{authorization:'Bearer '+secret}});assert.equal(r.status,200);assert.equal((await r.json()).skipped,true);console.log('Authorized cron observes database overlap guard');
 leaseBusy=false;
 r=await fetch(origin+'/api/cron/discover',{headers:{authorization:'Bearer '+secret}});assert.equal(r.status,200);
 assert.equal((await r.json()).queued,1);assert.equal(lastSnapshot.p_found,true);assert.match(lastSnapshot.p_excerpt,/Military admission with ID/);assert.equal(lastFinish.p_checked,1);console.log('Offline weekly run fetches evidence and finalizes its private queue result');
 robotsBlocked=true;lastSnapshot=null;
 r=await fetch(origin+'/api/cron/discover',{headers:{authorization:'Bearer '+secret}});assert.equal(r.status,502);assert.equal(lastSnapshot,null);assert.ok(lastFinish.p_errors.some(e=>e.includes('robots.txt')));console.log('Robots-blocked source records a partial run without saving misleading evidence');
 for(const path of ['/api/admin/review','/api/admin/run','/api/admin/logout','/api/admin/login']){
   r=await fetch(origin+path,{method:'POST',headers:{origin:'https://attacker.example',Cookie:'dutyperks-admin=allowed-admin-token'},redirect:'manual'});assert.equal(r.status,403);
 }console.log('Cross-origin login, logout, review and run requests rejected');
 const before=databaseCalls;
 r=await fetch(origin+'/api/admin/review',{method:'POST',headers:{origin},redirect:'manual'});assert.equal(r.status,401);assert.equal(databaseCalls,before);console.log('Unauthenticated review rejected before database access');
 const body=new URLSearchParams({candidate:candidateId,action:'approve',title:'Fixture offer',description:'Verified official fixture only',requirements:'Veteran ID is required',category:'attraction',eligibility:'veteran',startsAt:'',expiresAt:'',noExpiry:'on',normalPrice:'',militaryPrice:'0',confirm:'on',newOffer:'on'});
 r=await fetch(origin+'/api/admin/review',{method:'POST',headers:{origin,Cookie:'dutyperks-admin=allowed-admin-token'},body,redirect:'manual'});assert.equal(r.status,303);assert.match(r.headers.get('location'),/notice=saved/);assert.equal(lastReview.p_actor,adminId);assert.equal(lastReview.p_offer.militaryPrice,'0');console.log('Approved review uses server-verified actor and validated payload');
 body.delete('confirm');lastReview=null;
 r=await fetch(origin+'/api/admin/review',{method:'POST',headers:{origin,Cookie:'dutyperks-admin=allowed-admin-token'},body,redirect:'manual'});assert.match(r.headers.get('location'),/notice=review/);assert.equal(lastReview,null);console.log('Missing explicit source confirmation cannot publish');
}finally{app.kill();await new Promise(r=>mock.close(r));}
