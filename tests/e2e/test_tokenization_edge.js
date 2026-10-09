const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), crypto = require('node:crypto');
const esbuild = require('../../center-empty-state-build/node_modules/esbuild');
const root = path.resolve(__dirname, '../../supabase/functions/hashcod-shared-cloud');
const period = '12345678-1234-1234-1234-123456789abc';
const mac = async value => crypto.createHmac('sha256', 'only-a-test-secret').update(value).digest('hex');
let active = true, revision = 'test-revision', saved = null, inserts = 0; const mineQueries = [];
const key = 'only-a-test-administrator-key';
const core = {
  fail: (status, message) => { throw Object.assign(Error(message), { status }); }, json: data => Response.json(data),
  mac, equal: (a,b) => a === b, rate: async () => {}, fileId: v => v, code: v => v,
  ticket: async data => JSON.stringify(data), openTicket: async value => {
    if (!value) core.fail(403, 'Missing session');
    const data = JSON.parse(value); if (data.expires <= Date.now()) core.fail(403,'Expired session'); return data;
  },
  sql: async (parts, ...values) => {
    const query = parts.join('?');
    if (query.includes('tokenization_requests r where r.period_id')) { mineQueries.push(values); return saved ? [{id:saved.id,file_name:saved.file_name,status:saved.status,created_at:saved.created_at,updated_at:saved.updated_at||saved.created_at,certificate_id:null,phone:saved.phone,email:saved.email}] : []; }
    if (query.includes('from hashcod_shared.subscriptions')) return [{plan:'monthly',expires_at:9999999999,period_id:period}];
    if (query.includes('count(*)')) return [{total:0}];
    if (query.includes('access_periods')) return active ? [{ id: period }] : [];
    if (query.includes('tokenization_config')) return [{ admin_hash: crypto.createHash('sha256').update(key).digest('hex'), revision }];
    if (query.includes('from hashcod_shared.files')) return [{ id: 'fv_testfile123', name: '<script>alert(1)</script>.pdf', mime:'application/pdf',size:4,price_usd_cents:1000,code_hash:await mac('code|fv_testfile123|chosen-code') }];
    if (query.startsWith('update')) {
      if (!saved || saved.id !== values[1] || saved.status !== values[2]) return [];
      saved = { ...saved, status: values[0], updated_at: new Date().toISOString() }; return [saved];
    }
    if (query.startsWith('insert')) {
      if (saved) return [];
      inserts++; saved = {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',file_id:values[1],file_name:values[2],mime:values[3],size:values[4],price_usd_cents:values[5],phone:values[6],email:values[7],status:'pending',created_at:'2026-10-07T00:00:00Z',file_available:true}; return [saved];
    }
    return saved ? [saved] : [];
  }
};
core.sql.begin=fn=>fn(core.sql);
function load(name) {
  const module = { exports: {} };
  const source = esbuild.transformSync(fs.readFileSync(path.join(root,name),'utf8'), {loader:'ts',format:'cjs'}).code;
  vm.runInNewContext(source,{ module, exports: module.exports, require:p=>p==='./core.ts'?core:load(p.replace('./','')), crypto:crypto.webcrypto, TextEncoder, Request, Response, Date, console });
  return module.exports;
}
(async()=>{
 const { tokenization } = load('tokenization.ts');
 const token = period + '.' + await mac('period|'+period), request = new Request('https://test.invalid',{method:'POST'});
 const body = {token,id:'fv_testfile123',code:'chosen-code',phone:'+1 809 555 1234',email:'fixture@example.test',name:'Spoofed name'};
 await assert.rejects(tokenization('submit',request,{...body,token:''}),e=>e.status===403);
 active=false; await assert.rejects(tokenization('submit',request,body),e=>e.status===403);active=true;
 for(const invalid of [{phone:'abc'},{phone:'+1 2'},{email:'bad'},{email:'a\n@example.test'}]) await assert.rejects(tokenization('submit',request,{...body,...invalid}),e=>e.status===400);
 await assert.rejects(tokenization('submit',request,{...body,code:'wrong'}),e=>e.status===403);assert.equal(inserts,0);
 const result=await (await tokenization('submit',request,body)).json();
 assert.equal(result.request.status,'pending'); assert(!JSON.stringify(result).includes(body.email));assert(!JSON.stringify(result).includes(body.phone));assert(!JSON.stringify(result).includes(body.code));
 await tokenization('submit',request,body);assert.equal(inserts,1,'retry must not duplicate requests');assert.notEqual(saved.file_name,body.name);
 const mineEmpty=await(await tokenization('mine',request,{token})).json();assert.deepEqual(mineEmpty.requests.length,1,'the submitted request is listed for its own period');
 await assert.rejects(tokenization('mine',request,{token:''}),e=>e.status===403);
 active=false;await assert.rejects(tokenization('mine',request,{token}),e=>e.status===403);active=true;
 const mineText=JSON.stringify(mineEmpty);assert(!mineText.includes(body.email)&&!mineText.includes(body.phone)&&!mineText.includes('chosen-code'),'own-request view never returns contact data or the file code');
 assert.deepEqual(mineQueries.at(-1),[period],'the view is scoped to the signed period only');assert.equal(mineEmpty.quota.limit,25);
 await assert.rejects(tokenization('list',request,{token}),e=>e.status===403);
 await assert.rejects(tokenization('auth',request,{token,key:'wrong'}),e=>e.status===403);
 await assert.rejects(tokenization('auth',request,{token,key:'a'.repeat(8193)}),e=>e.status===403);
 const auth=await(await tokenization('auth',request,{token,key})).json();
 const list=await(await tokenization('list',request,{token,adminTicket:auth.adminTicket})).json();assert.equal(list.requests[0].email,body.email);assert.equal(list.requests[0].phone,body.phone);assert.equal(list.requests[0].priceUsdCents,1000);
 const change = {token, adminTicket:auth.adminTicket, id:saved.id, expectedStatus:'pending', status:'in_progress'};
 await assert.rejects(tokenization('update',request,{...change,adminTicket:undefined}),e=>e.status===403);
 for (const invalid of [{id:'not-a-uuid'},{status:'invented'},{expectedStatus:'invented'}]) await assert.rejects(tokenization('update',request,{...change,...invalid}),e=>e.status===400);
 for (const status of ['in_progress','delayed','awaiting_payment','completed','pending']) {
   const updated = await(await tokenization('update',request,{...change,expectedStatus:saved.status,status})).json();
   assert.equal(updated.request.status,status);assert(updated.request.updatedAt);assert(!JSON.stringify(updated).includes(body.email));
   const refreshed=await(await tokenization('list',request,{token,adminTicket:auth.adminTicket})).json();assert.equal(refreshed.requests[0].status,status);
 }
 await tokenization('update',request,change);
 await assert.rejects(tokenization('update',request,{...change,status:'completed'}),e=>e.status===409);
 await assert.rejects(tokenization('update',request,{...change,id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'}),e=>e.status===409);
 const expired=JSON.stringify({...JSON.parse(auth.adminTicket),expires:Date.now()-1});await assert.rejects(tokenization('list',request,{token,adminTicket:expired}),e=>e.status===403);
 await assert.rejects(tokenization('update',request,{...change,adminTicket:expired}),e=>e.status===403);
 revision='rotated';await assert.rejects(tokenization('list',request,{token,adminTicket:auth.adminTicket}),e=>e.status===403);
 await assert.rejects(tokenization('update',request,change),e=>e.status===403);
 active=false;await assert.rejects(tokenization('list',request,{token,adminTicket:auth.adminTicket}),e=>e.status===403);
 console.log('Tokenization Edge: period, code, contacts, canonical metadata, idempotency, private list, expiry and rotation OK');
})().catch(e=>{console.error(e);process.exitCode=1});
