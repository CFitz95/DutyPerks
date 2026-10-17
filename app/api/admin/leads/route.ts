import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {getAdmin,sameOrigin} from '../../../../lib/admin-auth';
import {privateSupabase} from '../../../../lib/private-supabase';
import {parseLead} from '../../../../lib/leads-core.mjs';
export const runtime='nodejs';
export async function POST(request:Request) {
  if(!sameOrigin(request)) return new Response('Forbidden',{status:403});
  const admin=await getAdmin();if(!admin) return new Response('Unauthorized',{status:401});
  let notice='invalid';
  try {
    // Bound the actual body, including requests without Content-Length.
    const reader=request.body?.getReader();if(!reader) throw Error('Missing body');
    const parts:Uint8Array[]=[];let size=0;
    try {while(true){const {done,value}=await reader.read();if(done) break;size+=value.byteLength;if(size>24000) return new Response('Too large',{status:413});parts.push(value);}}
    finally {await reader.cancel().catch(()=>{});}
    const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
    const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type') ?? ''}}).formData();
    const lead=parseLead(form),db=privateSupabase(),id=form.get('id'),revision=form.get('revision');
    if(id) {
      const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
      if(typeof id!=='string' || !uuid.test(id) || typeof revision!=='string' || !uuid.test(revision)) throw Error('Invalid lead');
      const r=await db.from('social_leads').update({...lead,revision:randomUUID(),updated_by:admin.id,updated_at:new Date().toISOString()}).eq('id',id).eq('revision',revision).select('id');
      notice=r.error ? (r.error.code==='23505'?'duplicate':'unavailable') : r.data?.length===1?'saved':'stale';
    } else {
      const r=await db.from('social_leads').insert({...lead,created_by:admin.id,updated_by:admin.id});
      notice=r.error ? (r.error.code==='23505'?'duplicate':'unavailable'):'created';
    }
  } catch { /* Do not return private research text or credentials in errors. */ }
  return NextResponse.redirect(new URL(`/admin/leads?notice=${notice}`,request.url),303);
}
