import http from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3342',id='99999999-9999-4999-8999-999999999999';
let submissions=0,reads=0,updates=0,lastSubmission,lastUpdate,rateLimited=false;
const mock=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json');let raw='';for await(const part of req)raw+=part;
 if(url.pathname==='/auth/v1/user'){res.end(JSON.stringify({id,email:req.headers.authorization==='Bearer admin-token'?'admin@example.com':'other@example.com',email_confirmed_at:'2026-10-04T00:00:00Z'}));return;}
 if(url.pathname==='/rest/v1/rpc/submit_tester_feedback'){submissions++;lastSubmission=JSON.parse(raw);res.end(JSON.stringify(rateLimited?null:id));return;}
 if(url.pathname==='/rest/v1/tester_feedback'){
   if(req.method==='PATCH'){updates++;lastUpdate=JSON.parse(raw);res.end('[]');return;}
   reads++;res.end(JSON.stringify([{id,kind:'problem',region:'whidbey',message:'Private tester feedback fixture <script>bad()</script>',contact_email:'tester@example.com',rating:2,state:'new',created_at:'2026-10-04T00:00:00Z'}]));return;
 }
 res.end('[]');
});
await new Promise(resolve=>mock.listen(3341,'127.0.0.1',resolve));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3342'],{cwd:new URL('../',import.meta.url),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:3341',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-public',SUPABASE_SECRET_KEY:'fixture-server-secret',ADMIN_EMAIL:'admin@example.com',CRON_SECRET:'fixture-signing-'+ 'a'.repeat(40)},stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Start timeout')),30000);app.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timer);resolve();}});app.on('exit',c=>reject(Error('App exited '+c)));});
 let response=await fetch(origin+'/manifest.webmanifest');const manifest=await response.json();assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'/');assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable'));
 for(const size of [180,192,512]){response=await fetch(origin+'/app-icon/'+size);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);}console.log('Home-screen manifest and actual PNG icon dimensions verified');
 response=await fetch(origin+'/sw.js');assert.match(response.headers.get('cache-control'),/no-store/);assert.match(response.headers.get('content-type'),/javascript/);response=await fetch(origin+'/offline.html');assert.match(await response.text(),/Offers aren’t displayed offline/);
 response=await fetch(origin+'/install');assert.match(await response.text(),/Add to Home Screen/);console.log('Installation instructions, worker headers and reconnect page available');
 response=await fetch(origin+'/feedback');let html=await response.text();assert.match(html,/Send feedback/);assert.doesNotMatch(html,/fixture-server-secret|Private tester feedback fixture/);assert.equal(reads,0);
 const endpoint=origin+'/api/feedback';const body=new URLSearchParams({kind:'experience',region:'whidbey',message:'I found an offer during the fixture test.',email:'tester@example.com',rating:'4',website:''});
 const headers={Origin:origin,Accept:'application/json','x-forwarded-for':'192.0.2.10'};
 response=await fetch(endpoint,{method:'POST',headers:{...headers,Origin:'https://attacker.example'},body});assert.equal(response.status,403);assert.equal(submissions,0);
 response=await fetch(endpoint,{method:'POST',headers,body:new URLSearchParams({...Object.fromEntries(body),message:'short'})});assert.equal(response.status,400);assert.equal(submissions,0);
 response=await fetch(endpoint,{method:'POST',headers,body:new URLSearchParams({...Object.fromEntries(body),website:'spam'})});assert.equal(response.status,200);assert.equal(submissions,0);
 response=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},body:'x'.repeat(17000)});assert.equal(response.status,413);assert.equal(submissions,0);
 response=await fetch(endpoint,{method:'POST',headers,body});assert.equal(response.status,200);assert.equal(submissions,1);assert.match(lastSubmission.p_bucket,/^[a-f0-9]{64}$/);assert.doesNotMatch(JSON.stringify(lastSubmission),/192\.0\.2\.10/);assert.equal(lastSubmission.p_rating,4);assert.equal(lastSubmission.p_email,'tester@example.com');console.log('Feedback validates input, limits body size, blocks bots and stores no raw IP');
 rateLimited=true;response=await fetch(endpoint,{method:'POST',headers,body});assert.equal(response.status,429);rateLimited=false;
 response=await fetch(endpoint,{method:'POST',headers:{Origin:origin},body:new URLSearchParams({...Object.fromEntries(body),email:'',rating:''}),redirect:'manual'});assert.equal(response.status,303);assert.match(response.headers.get('location'),/notice=sent/);assert.equal(lastSubmission.p_email,null);assert.equal(lastSubmission.p_rating,null);console.log('Rate limits propagate and feedback also works without JavaScript or optional contact data');
 for(const cookie of [undefined,'dutyperks-admin=other-token']){response=await fetch(origin+'/admin/feedback',{headers:cookie?{Cookie:cookie}:{}});html=await response.text();assert.doesNotMatch(html,/Private tester feedback fixture/);assert.equal(reads,0);}
 response=await fetch(origin+'/admin/feedback',{headers:{Cookie:'dutyperks-admin=admin-token'}});html=await response.text();assert.match(html,/Private tester feedback fixture/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/fixture-server-secret/);assert.equal(reads,1);console.log('Only the configured admin can read feedback, and submitted markup is escaped');
 response=await fetch(origin+'/api/admin/feedback',{method:'POST',headers:{Origin:origin},body:new URLSearchParams({id})});assert.equal(response.status,401);assert.equal(updates,0);
 response=await fetch(origin+'/api/admin/feedback',{method:'POST',headers:{Origin:'https://attacker.example',Cookie:'dutyperks-admin=admin-token'},body:new URLSearchParams({id})});assert.equal(response.status,403);assert.equal(updates,0);
 response=await fetch(origin+'/api/admin/feedback',{method:'POST',headers:{Origin:origin,Cookie:'dutyperks-admin=admin-token'},body:new URLSearchParams({id}),redirect:'manual'});assert.equal(response.status,303);assert.equal(updates,1);assert.equal(lastUpdate.reviewed_by,id);assert.equal(lastUpdate.state,'reviewed');console.log('Marking feedback reviewed requires a same-origin authenticated administrator');
}finally{app.kill();await new Promise(resolve=>mock.close(resolve));}
