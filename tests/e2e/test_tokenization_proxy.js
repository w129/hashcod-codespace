const assert=require('node:assert/strict'),http=require('node:http'),path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),phpBin=process.env.PHP_BIN||'php';
(async()=>{
 let calls=[],adminTicket='private-test-ticket';
 const upstream=http.createServer(async(req,res)=>{
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));calls.push(body);
  const action=new URL(req.url,'http://localhost').searchParams.get('action');assert.equal(body.token,'server-period-token');
  if(action==='tokenization.auth'){assert.equal(body.key,'test-admin-key');res.end(JSON.stringify({ok:true,adminTicket,expiresAt:Math.floor(Date.now()/1000)+900}));}
  else if(action==='tokenization.list'){assert.equal(body.adminTicket,adminTicket);res.end('{"ok":true,"requests":[],"hasMore":false}');}
  else if(action==='tokenization.update'){assert.equal(body.adminTicket,adminTicket);assert.equal(body.id,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');assert.equal(body.status,'completed');assert.equal(body.expectedStatus,'pending');assert(!('phone' in body));res.end(JSON.stringify({ok:true,request:{id:body.id,status:body.status}}));}
  else if(action==='tokenization.submit'){assert.equal(body.code,'chosen-code');res.end('{"ok":true,"request":{"id":"fixture","status":"pending"}}');}
  else {res.statusCode=400;res.end('{"ok":false}');}
 });await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
 const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const env={...process.env,APP_ENV:'test',L8_ACCESS_GATE_COOKIE_SECRET:'only-a-test-cookie-secret-'.repeat(3),HASHCOD_TOKENIZATION_ALLOW_TEST_HTTP:'1',HASHCOD_SHARED_CLOUD_URL:`http://127.0.0.1:${upstream.address().port}/functions/v1/hashcod-shared-cloud`};
 const base=`http://127.0.0.1:${port}`;
 const script='$_SERVER["HTTP_HOST"]='+JSON.stringify('127.0.0.1:'+port)+';require "platform-period-lib.php";echo mldsaSeal(["kind"=>"platform-period-v1","host"=>mldsaHost(),"state"=>"active","days"=>10,"expiresAt"=>time()+86400,"token"=>"server-period-token"]);';
 let cookie='hashcod_platform_period_v1='+execFileSync(phpBin,['-r',script],{cwd:root,env,encoding:'utf8'}).trim();
 const php=spawn(phpBin,['-S','127.0.0.1:'+port,'-t',root,path.join(root,'router.php')],{cwd:root,env,stdio:'ignore'});
 const post=(body,extra={})=>fetch(base+'/api/hashcod-tokenization',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest',Cookie:cookie,...extra},body:JSON.stringify(body)});
 try {
  for(let i=0;i<50;i++){try{if((await fetch(base+'/api/hashcod-tokenization')).status===403)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  const noPeriod=await post({action:'submit'},{Cookie:''});assert.equal(noPeriod.status,403);assert.equal(calls.length,0);
  for(const extra of [{Origin:'https://evil.test'},{'X-Requested-With':''},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await post({action:'submit'},extra)).status,403);
  assert.equal((await post({action:'list',adminTicket:'spoofed'})).status,403);assert.equal(calls.length,0);
  assert.equal((await post({action:'update',id:'fixture',status:'completed',adminTicket:'spoofed'})).status,403);assert.equal(calls.length,0);
  const submit=await post({action:'submit',token:'spoofed',id:'fv_testfile123',code:'chosen-code',phone:'+1 809 555 1234',email:'fixture@example.test'});assert.equal(submit.status,200);assert((await submit.json()).ok);
  const auth=await post({action:'auth',key:'test-admin-key'});assert.equal(auth.status,200);assert(!(await auth.text()).includes(adminTicket));const setCookie=auth.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Strict/);cookie+='; '+setCookie.split(';')[0];
  assert.equal((await post({action:'list',adminTicket:'spoofed',token:'spoofed'})).status,200);
  assert.equal((await post({action:'update',id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',status:'completed',expectedStatus:'pending',adminTicket:'spoofed',token:'spoofed',phone:'must-not-forward'})).status,200);
  assert.equal((await post({action:'logout'})).status,200);
  assert.equal((await fetch(base+'/hashcod-tokenization.php',{method:'POST',headers:{Origin:base,'X-Requested-With':'XMLHttpRequest','Content-Type':'application/json'},body:'{}'})).status,403);
  console.log('Tokenization facade: actual Requests process, period, CSRF, private cookie and browser identity/ticket spoof protection OK');
 } finally {php.kill();await new Promise(r=>upstream.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
