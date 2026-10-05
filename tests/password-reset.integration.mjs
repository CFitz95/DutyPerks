import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const origin = 'http://127.0.0.1:3332';
const token = [Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:'fixture',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'fixture'].join('.');
let recoveries=0, updates=0, revoked=0, lastRedirect, lastPassword;
const mock=http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');
  const path=new URL(req.url,'http://localhost').pathname;
  let raw=''; for await(const c of req) raw+=c;
  if(path==='/auth/v1/recover'){recoveries++;lastRedirect=new URL(req.url,'http://localhost').searchParams.get('redirect_to');res.end('{}');return;}
  if(path==='/auth/v1/user'){
    const admin=req.headers.authorization===`Bearer ${token}`;
    if(req.method==='PUT'){updates++;lastPassword=JSON.parse(raw).password;}
    res.end(JSON.stringify({id:'fixture',email:admin?'admin@example.com':'other@example.com',email_confirmed_at:'2026-10-04T00:00:00Z'}));return;
  }
  if(path==='/auth/v1/logout'){revoked++;res.statusCode=204;res.end();return;}
  res.statusCode=404;res.end('{}');
});
await new Promise(r=>mock.listen(3331,'127.0.0.1',r));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3332'],{cwd:new URL('../',import.meta.url),env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:3331',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-public',ADMIN_EMAIL:'admin@example.com'},stdio:['ignore','pipe','pipe']});
try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Start timeout')),30000);app.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timer);resolve();}});app.on('exit',c=>reject(Error('App exited '+c)));});
  const endpoint=origin+'/api/admin/password-reset';
  for(const method of ['POST','PUT']){const r=await fetch(endpoint,{method,headers:{Origin:'https://attacker.example'},redirect:'manual'});assert.equal(r.status,403);}
  let r=await fetch(endpoint,{method:'POST',headers:{Origin:origin},body:new URLSearchParams({email:'other@example.com'}),redirect:'manual'});assert.match(r.headers.get('location'),/reset-sent/);assert.equal(recoveries,0);
  r=await fetch(endpoint,{method:'POST',headers:{Origin:origin},body:new URLSearchParams({email:'admin@example.com'}),redirect:'manual'});assert.match(r.headers.get('location'),/reset-sent/);assert.equal(recoveries,1);assert.equal(lastRedirect,origin+'/admin/reset-password');
  for(const authorization of [undefined,'Bearer non-admin']){r=await fetch(endpoint,{method:'PUT',headers:{Origin:origin,'Content-Type':'application/json',...(authorization?{Authorization:authorization}:{})},body:JSON.stringify({password:'fixture-password-123',refreshToken:'fixture'})});assert.equal(r.status,401);assert.equal(updates,0);}
  const headers={Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${token}`};
  r=await fetch(endpoint,{method:'PUT',headers,body:JSON.stringify({password:'short',refreshToken:'fixture'})});assert.equal(r.status,400);assert.equal(updates,0);
  r=await fetch(endpoint,{method:'PUT',headers,body:JSON.stringify({password:'fixture-password-123',refreshToken:'fixture'})});assert.equal(r.status,200);assert.equal(updates,1);assert.equal(lastPassword,'fixture-password-123');assert.equal(revoked,1);assert.match(r.headers.get('set-cookie'),/dutyperks-admin=;/);
  r=await fetch(origin+'/admin/reset-password');assert.match(await r.text(),/Choose a new admin password/);
  console.log('Password reset checks passed: origin protection, admin-only email, redirect, token authorization, password rules, password update and session revocation.');
}finally{app.kill();await new Promise(r=>mock.close(r));}
