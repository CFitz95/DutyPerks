import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function setup(network){
 const handlers={},writes=[],deleted=[];
 const fallback=new Response('Reconnect instead of old offers');
 const context={self:{location:{origin:'https://fixture.example'},addEventListener:(name,handler)=>handlers[name]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}},URL,Request:class{constructor(request,options){Object.assign(this,request,options);}},Response,fetch:network,
 caches:{open:async()=>({add:async path=>writes.push(path)}),keys:async()=>['dutyperks-shell-old','dutyperks-shell-v1','another-app-cache'],delete:async key=>deleted.push(key),match:async()=>fallback}};
 vm.runInNewContext(code,context);return{handlers,writes,deleted};
}
test('worker caches only the reconnect page and preserves other apps caches',async()=>{
 const fixture=setup(async()=>new Response('fresh'));let task;
 fixture.handlers.install({waitUntil:promise=>task=promise});await task;assert.deepEqual(fixture.writes,['/offline.html']);
 fixture.handlers.activate({waitUntil:promise=>task=promise});await task;assert.deepEqual(fixture.deleted,['dutyperks-shell-old']);
});
test('worker does not intercept admin, credentials, feedback submissions or external requests',()=>{
 const fixture=setup(async()=>new Response('fresh'));
 for(const [path,method,mode] of [['/admin','GET','navigate'],['/admin/reset-password','GET','navigate'],['/api/feedback','POST','navigate'],['/explore','POST','navigate'],['/api/admin/login','POST','navigate'],['/explore','GET','cors'],['https://other.example/explore','GET','navigate']]){
  let intercepted=false;fixture.handlers.fetch({request:{url:new URL(path,'https://fixture.example').href,method,mode},respondWith:()=>intercepted=true});assert.equal(intercepted,false,path);
 }
});
test('public navigation uses fresh network results and reconnects without stale offers',async()=>{
 let received;const fresh=setup(async request=>{received=request;return new Response('fresh verified result');});let task;
 fresh.handlers.fetch({request:{url:'https://fixture.example/explore?location=Whidbey',method:'GET',mode:'navigate'},respondWith:promise=>task=promise});assert.equal(await(await task).text(),'fresh verified result');assert.equal(received.cache,'no-store');assert.deepEqual(fresh.writes,[]);
 const offline=setup(async()=>{throw new Error('offline');});offline.handlers.fetch({request:{url:'https://fixture.example/explore',method:'GET',mode:'navigate'},respondWith:promise=>task=promise});assert.match(await(await task).text(),/Reconnect/);assert.deepEqual(offline.writes,[]);
});
