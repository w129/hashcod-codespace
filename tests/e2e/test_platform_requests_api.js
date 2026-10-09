const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),phpBin=process.env.PHP_BIN||'php';
// /api/platform-requests: a visitor's own request flow. Identity only from the signed cookies; fail closed.
(async()=>{
 let calls=[],reply;
 const upstream=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));calls.push({action:new URL(req.url,'http://localhost').searchParams.get('action'),body});
  res.setHeader('Content-Type','application/json');res.statusCode=reply.status||200;res.end(JSON.stringify(reply.data));
 });await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
 const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const env={...process.env,APP_ENV:'test',L8_ACCESS_GATE_COOKIE_SECRET:'only-a-test-cookie-secret-'.repeat(3),HASHCOD_SHARED_CLOUD_URL:`http://127.0.0.1:${upstream.address().port}/functions/v1/hashcod-shared-cloud`};
 const base=`http://127.0.0.1:${port}`,host=JSON.stringify('127.0.0.1:'+port);
 const seal=body=>execFileSync(phpBin,['-r','$_SERVER["HTTP_HOST"]='+host+';require "policy-consent-lib.php";echo mldsaSeal('+body+');'],{cwd:root,env,encoding:'utf8'}).trim();
 const period=seal('["kind"=>"platform-period-v1","host"=>mldsaHost(),"state"=>"active","days"=>10,"expiresAt"=>time()+86400,"token"=>"server-period-token"]');
 const consent=seal('["kind"=>"policy-consent-v1","host"=>mldsaHost(),"version"=>POLICY_CONSENT_VERSION,"receipt"=>"0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f","acceptedAt"=>time()]');
 const both=`hashcod_platform_period_v1=${period}; hashcod_policy_consent_v1=${consent}`;
 const php=spawn(phpBin,['-S','127.0.0.1:'+port,'-t',root,path.join(root,'router.php')],{cwd:root,env,stdio:'ignore'});
 const get=(cookie=both,extra={})=>fetch(base+'/api/platform-requests?token=spoofed&period=spoofed',{headers:{Cookie:cookie,...extra}});
 try {
  for(let i=0;i<50;i++){try{if((await fetch(base+'/api/platform-requests')).status===403)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  // Fail closed without the policy acceptance or the signed period; storage is never reached.
  const noConsent=await get(`hashcod_platform_period_v1=${period}`);assert.equal(noConsent.status,403);assert.equal((await noConsent.json()).code,'policy_consent_required');
  const noPeriod=await get(`hashcod_policy_consent_v1=${consent}`);assert.equal(noPeriod.status,403);assert.equal((await noPeriod.json()).code,'platform_period_required');
  assert.equal(calls.length,0);
  assert.equal((await fetch(base+'/api/platform-requests',{method:'POST',headers:{Cookie:both,Origin:base,'Content-Type':'application/json'},body:'{}'})).status,405);
  assert.equal((await get(both,{Origin:'https://evil.test'})).status,403);assert.equal((await get(both,{'Sec-Fetch-Site':'cross-site'})).status,403);assert.equal(calls.length,0);
  // Happy path: only the cookie identity is forwarded and the answer is sanitized.
  const cert='cccccccc-cccc-cccc-cccc-cccccccccccc';
  reply={data:{ok:true,quota:{used:3,limit:99},requests:[
   {id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',name:'plan.pdf',status:'completed',createdAt:'2026-10-09T10:00:00Z',updatedAt:'2026-10-09T12:00:00Z',certificateId:cert,email:'leak@example.test',phone:'+18095551234'},
   {id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',name:'x'.repeat(400),status:'invented',createdAt:null,certificateId:'not-a-uuid'},
   {id:'not-a-uuid',name:'dropped',status:'pending'}]}};
  const ok=await get();assert.equal(ok.status,200);const data=await ok.json();
  assert.deepEqual(calls.map(c=>c.action),['tokenization.mine']);assert.deepEqual(calls[0].body,{token:'server-period-token'});
  assert.equal(data.quota.limit,25,'the monthly limit is fixed server-side');assert.equal(data.quota.used,3);
  assert.equal(data.requests.length,2,'malformed rows are dropped');assert.equal(data.requests[0].certificateId,cert);
  assert.equal(data.requests[1].status,'pending','unknown statuses fall back to pending');assert.equal(data.requests[1].name.length,255);assert.equal(data.requests[1].certificateId,null);
  assert(!JSON.stringify(data).includes('leak@example.test')&&!JSON.stringify(data).includes('+1809'),'contact data is never exposed');
  // Upstream failures become stable, generic errors.
  reply={status:500,data:{ok:false,error:'SQL exploded at /srv/secret.ts'}};const bad=await get();assert.equal(bad.status,503);assert(!(await bad.text()).includes('secret'));
  console.log('Platform requests API: cookie-only identity, consent/period guards, sanitized output and generic failures OK');
 } finally {php.kill();await new Promise(r=>upstream.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
