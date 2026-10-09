import { sql, json, fail, storage, objectPath, rate, openTicket } from './core.ts';
import { activePeriod } from './tokenization.ts';
import { requirePro } from './subscription.ts';

const encoder = new TextEncoder();
export function canonical(value: any): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function uuid(value: any) { if (typeof value !== 'string' || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value)) fail(400,'Identificador incorrecto.'); return value; }
function bytes(value: string) { try { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); } catch { fail(403,'Firma incorrecta.'); } }
async function signature(keyId: string, data: any, sig: string, domain: string) {
  const keys = await sql`select public_key from hashcod_shared.review_keyring where id=${keyId} and not revoked`;
  if (!keys[0]) fail(403,'Firma no disponible.');
  const key = await crypto.subtle.importKey('raw',bytes(keys[0].public_key),{name:'Ed25519'},false,['verify']);
  if (!await crypto.subtle.verify('Ed25519',key,bytes(sig),encoder.encode(domain+'\n'+canonical(data)))) fail(403,'Firma incorrecta.');
}
async function proof(body: any) {
  if (!body || Object.keys(body).sort().join(',') !== 'data,key_id,nonce,signature,timestamp' || body.key_id !== 'review-backend-v1'
      || !Number.isSafeInteger(body.timestamp) || Math.abs(Date.now()-body.timestamp)>90000 || !/^[a-f0-9]{32}$/.test(body.nonce)) fail(403,'Autenticación del servicio incorrecta.');
  await signature(body.key_id,{data:body.data,key_id:body.key_id,nonce:body.nonce,timestamp:body.timestamp},body.signature,'hashcod.review.bridge.v1');
  const inserted = await sql`insert into hashcod_shared.review_nonces(key_id,nonce) values (${body.key_id},${body.nonce}) on conflict do nothing returning nonce`;
  if (!inserted[0]) fail(409,'Solicitud ya utilizada.');
  await sql`delete from hashcod_shared.review_nonces where created_at < now()-interval '5 minutes'`;
  return body.data;
}
async function snapshot(id: string, period?: string) {
  const rows = period
    ? await sql`select r.id, r.period_id, r.file_name, r.status, f.object_path, f.size from hashcod_shared.tokenization_requests r join hashcod_shared.files f on f.id=r.file_id where r.id=${id} and r.period_id=${period} and f.status='ready'`
    : await sql`select r.id, r.period_id, r.file_name, r.status, f.object_path, f.size from hashcod_shared.tokenization_requests r join hashcod_shared.files f on f.id=r.file_id where r.id=${id} and f.status='ready'`;
  const row = rows[0]; if (!row) fail(404,'Solicitud o archivo no disponible.');
  if (Number(row.size)>2097152) fail(413,'La revisión admite archivos de hasta 2 MB.');
  const language = /\.py$/i.test(row.file_name) ? 'python' : /\.(?:js|mjs|cjs)$/i.test(row.file_name) ? 'javascript' : '';
  if (!language) fail(422,'La revisión admite Python y JavaScript.');
  const response = await storage('object/'+objectPath(row.object_path));
  if (!response.ok) fail(404,'El archivo ya no está disponible.');
  const raw = new Uint8Array(await response.arrayBuffer());
  if (raw.length>2097152 || raw.length!==Number(row.size)) fail(409,'El archivo cambió. Inicia una nueva revisión.');
  try { new TextDecoder('utf-8',{fatal:true}).decode(raw); } catch { fail(422,'El archivo debe contener texto UTF-8.'); }
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-512',raw)),n=>n.toString(16).padStart(2,'0')).join('');
  let encoded=''; for(let i=0;i<raw.length;i+=8192) encoded+=String.fromCharCode(...raw.subarray(i,i+8192));
  return {request_id:row.id,name:row.file_name,language,content_hash:hash,content:btoa(encoded),size:raw.length};
}
async function session(id: string, owner: string, active=false) {
  const rows=await sql`select * from hashcod_shared.review_sessions where id=${id} and period_id=${owner}`;
  const row=rows[0]; if (!row) fail(404,'Revisión no disponible.');
  if(active && (row.status!=='active' || new Date(row.expires_at).getTime()<=Date.now())) fail(409,'La sesión terminó. Inicia otra revisión.');
  return row;
}
export async function review(request: Request, body: any) {
  if (request.method!=='POST') fail(405,'Method not allowed.');
  const input=await proof(body), action=input?.action;
  if (action==='verify' || action==='revoked') {
    if(action==='revoked') { const rows=await sql`select id,revoked_at from hashcod_shared.certificates where revoked_at is not null order by revoked_at desc limit 1000`; return json({ok:true,revoked:rows}); }
    const id=uuid(input.id), rows=await sql`select * from hashcod_shared.certificates where id=${id}`;
    if(!rows[0]) fail(404,'Certificado no disponible.');
    const c=rows[0]; await signature(c.key_id,c.payload,c.signature,'hashcod.review.certificate.v1');
    let current=false; try { const file=await snapshot(c.request_id); current=file.content_hash===c.payload.content_hash; } catch { current=false; }
    return json({ok:true,valid:!c.revoked_at && current,revoked:!!c.revoked_at,current,payload:c.payload,signature:c.signature,key_id:c.key_id});
  }
  const owner=await activePeriod(input.token);
  if (action !== 'revoke') await requirePro(owner);
  await rate('review-'+String(action)+'|'+owner,action==='create'?6:60);
  if(action==='list') {
    const rows=await sql`select r.id,r.file_name,r.size,r.status,r.created_at,coalesce(f.status='ready',false) as available,
      (select s.id from hashcod_shared.review_sessions s where s.request_id=r.id and s.period_id=${owner} order by s.created_at desc limit 1) as session_id
      from hashcod_shared.tokenization_requests r left join hashcod_shared.files f on f.id=r.file_id where r.period_id=${owner} order by r.created_at desc limit 100`;
    return json({ok:true,owner,requests:rows.map(r=>({id:r.id,name:r.file_name,size:Number(r.size),status:r.status,createdAt:r.created_at,available:r.available,sessionId:r.session_id}))});
  }
  if(action==='snapshot') return json({ok:true,owner,...await snapshot(uuid(input.id),owner)});
  if(action==='create') {
    const file=await snapshot(uuid(input.id),owner);
    if(file.content_hash!==input.content_hash || !['claude-sonnet-5-5','claude-opus-5-5'].includes(input.model) || !Number.isSafeInteger(input.budget_micros) || input.budget_micros<100000 || input.budget_micros>20000000) fail(409,'Configuración de revisión incorrecta.');
    const row=await sql.begin(async tx=>{
      await tx`select id from hashcod_shared.tokenization_requests where id=${file.request_id} for update`;
      await tx`update hashcod_shared.review_sessions set status='closed',updated_at=now() where request_id=${file.request_id} and status='active'`;
      const saved=await tx`insert into hashcod_shared.review_sessions(request_id,period_id,content_hash,language,model,budget_micros) values (${file.request_id},${owner},${file.content_hash},${file.language},${input.model},${input.budget_micros}) returning *`;
      await tx`update hashcod_shared.tokenization_requests set status='under_review',updated_at=now() where id=${file.request_id}`;
      return saved[0];
    }); return json({ok:true,owner,session:row});
  }
  if(action==='revoke') {
    const auth=await openTicket(input.adminTicket), settings=(await sql`select revision from hashcod_shared.tokenization_config where id=1`)[0];
    if(auth.kind!=='tokenization-admin' || auth.period!==owner || auth.revision!==settings?.revision) fail(403,'Se requiere acceso administrativo.');
    const reason=typeof input.reason==='string'?input.reason.trim():''; if(!reason || reason.length>500) fail(400,'Introduce el motivo de revocación.');
    const rows=await sql`update hashcod_shared.certificates set revoked_at=now(),revocation_reason=${reason} where id=${uuid(input.id)} and revoked_at is null returning id`;
    if(!rows[0]) fail(404,'Certificado no disponible o ya revocado.'); return json({ok:true});
  }
  const id=uuid(input.session_id), s=await session(id,owner,['load','reserve','checks','messages','finish'].includes(action));
  if(action==='history') {
    const messages=await sql`select role,body,created_at from hashcod_shared.review_messages where session_id=${id} order by id limit 80`;
    const checks=(await sql`select checks from hashcod_shared.review_checks where session_id=${id}`)[0]?.checks||[];
    const certificates=await sql`select id,revoked_at,payload,signature,key_id from hashcod_shared.certificates where session_id=${id}`;
    return json({ok:true,session:s,messages,checks,certificate:certificates[0]||null});
  }
  if(action==='close') { await sql`update hashcod_shared.review_sessions set status='closed',updated_at=now() where id=${id} and status='active'`; return json({ok:true}); }
  if(action==='load') {
    const file=await snapshot(s.request_id,owner);
    if(file.content_hash!==s.content_hash) { await sql`update hashcod_shared.review_sessions set status='stale',updated_at=now() where id=${id}`; fail(409,'El archivo cambió. Inicia otra revisión.'); }
    return json({ok:true,owner,session:s,...file});
  }
  if(action==='reserve') {
    const cost=input.cost_micros; if(!Number.isSafeInteger(cost)||cost<1||cost>20000000) fail(400,'Estimación incorrecta.');
    const rows=await sql`update hashcod_shared.review_sessions set reserved_micros=reserved_micros+${cost},updated_at=now() where id=${id} and status='active' and reserved_micros+${cost}<=budget_micros and (select count(*) from hashcod_shared.review_messages where session_id=${id})<80 returning id`;
    if(!rows[0]) fail(402,'Se alcanzó el presupuesto o el límite de mensajes.'); return json({ok:true});
  }
  if(action==='checks') {
    const a=input.attestation;
    if(a?.key_id!=='review-sandbox-v1' || a.data?.session_id!==id || a.data?.content_hash!==s.content_hash) fail(403,'Comprobaciones no verificadas.');
    await signature(a.key_id,{data:a.data,key_id:a.key_id,nonce:a.nonce,timestamp:a.timestamp},a.signature,'hashcod.review.checks.v1');
    await sql`insert into hashcod_shared.review_checks(session_id,attestation,checks) values (${id},${sql.json(a)},${sql.json(a.data.checks)}) on conflict(session_id) do nothing`;
    return json({ok:true});
  }
  if(action==='messages') {
    if(!Array.isArray(input.messages)||input.messages.length<1||input.messages.length>2) fail(400,'Mensajes incorrectos.');
    await sql.begin(async tx=>{ for(const m of input.messages) { if(!['user','assistant'].includes(m.role)||typeof m.body!=='string'||m.body.length>20000||/sk-ant-[A-Za-z0-9_-]{12,}/.test(m.body)) fail(400,'Mensaje incorrecto.'); await tx`insert into hashcod_shared.review_messages(session_id,role,body) values(${id},${m.role},${m.body})`; } });
    return json({ok:true});
  }
  if(action==='finish') {
    const file=await snapshot(s.request_id,owner); if(file.content_hash!==s.content_hash) fail(409,'El archivo cambió.');
    const result=input.result; if(!['pass','fail','needs_human'].includes(result)) fail(400,'Resultado incorrecto.');
    const c=input.certificate;
    if(result==='pass') {
      const checks=(await sql`select checks from hashcod_shared.review_checks where session_id=${id}`)[0]?.checks;
      if(!Array.isArray(checks)||checks.length!==5||new Set(checks.map(x=>x.kind)).size!==5||!['sandbox','tests','sast','secrets','deps'].every(kind=>checks.some(x=>x.kind===kind&&x.status==='complete'&&x.passed===true&&x.severity_counts?.critical===0&&x.severity_counts?.high===0))) fail(409,'Las comprobaciones no permiten certificar.');
      if(!c || c.key_id!=='review-backend-v1'||c.payload?.session_id!==id||c.payload.request_id!==s.request_id||c.payload.content_hash!==s.content_hash||c.payload.model!==s.model||c.payload.verdict!=='pass') fail(400,'Certificado incorrecto.');
      uuid(c.payload.certificate_id); await signature(c.key_id,c.payload,c.signature,'hashcod.review.certificate.v1');
    } else if(c) fail(400,'Certificado incorrecto.');
    await sql.begin(async tx=>{
      const valid=await tx`update hashcod_shared.review_sessions set status=${result},updated_at=now() where id=${id} and status='active' and exists(select 1 from hashcod_shared.files f join hashcod_shared.tokenization_requests r on r.file_id=f.id where r.id=${s.request_id} and f.status='ready') returning id`;
      if(!valid[0]) fail(409,'La revisión terminó o el archivo ya no está disponible.');
      if(c) await tx`insert into hashcod_shared.certificates(id,session_id,request_id,payload,signature,key_id) values(${c.payload.certificate_id},${id},${s.request_id},${sql.json(c.payload)},${c.signature},${c.key_id})`;
      await tx`update hashcod_shared.tokenization_requests set status=${result==='pass'?'certified':result==='fail'?'rejected':'under_review'},updated_at=now() where id=${s.request_id}`;
    }); return json({ok:true,result,certificate:c||null});
  }
  fail(400,'Acción de revisión incorrecta.');
}
