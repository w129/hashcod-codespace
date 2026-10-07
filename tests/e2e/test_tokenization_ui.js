const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { JSDOM } = require('jsdom');
const wait = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) { for (let n = 0; n < 150; n++) { if (check()) return; await wait(); } throw Error('Tokenization UI timeout'); }
async function scenario(origin) {
 const dom = new JSDOM('<body><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer></body>', { url:origin, runScripts:'dangerously', pretendToBeVisual:true });
 const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
 const now=Math.floor(Date.now()/1000);Object.assign(w.document.body.dataset,{hashcodPeriodDays:'10',hashcodPeriodExpiresAt:String(now+864000),hashcodPeriodNow:String(now)});
 const file={id:'fv_testfile123',name:'<img src=x onerror=alert(1)>.pdf',size:4,type:'application/pdf',totpProtected:true,priceUsdCents:1234};
 let loggedIn=false, failSave=true, saves=0, calls=[], status='pending', failUpdate=false;
 w.fetch=async(url,options={})=>{
  if(url==='/api/platform-period')return Response.json({ok:true,state:'active',days:10,expiresAt:now+864000,serverNow:now});
  if(url.includes('?action=list'))return Response.json({ok:true,files:[file]});
  const body=JSON.parse(options.body);calls.push(body);
  assert.equal(options.credentials,'same-origin');assert.equal(options.headers['X-Requested-With'],'XMLHttpRequest');
  if(body.action==='submit') {
   saves++;if(failSave)return Response.json({ok:false,error:'No se pudo guardar.'},{status:503});
   assert.equal(body.code,'chosen-code');assert.equal(body.email,'fixture@example.test');assert.equal(body.phone,'+1 809 555 1234');return Response.json({ok:true,request:{id:'abcdef12-fixture',status:'pending'}});
  }
  if(body.action==='auth'){if(body.key!=='test-admin-key')return Response.json({ok:false,error:'Clave incorrecta.'},{status:403});loggedIn=true;return Response.json({ok:true,expiresAt:now+900});}
  if(body.action==='logout'){loggedIn=false;return Response.json({ok:true});}
  if(body.action==='list'){assert(loggedIn,'Private list fetched without key');return Response.json({ok:true,hasMore:false,requests:[{...file,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',status,fileId:file.id,mime:file.type,phone:'+1 809 555 1234',email:'fixture@example.test',createdAt:new Date().toISOString(),fileAvailable:true}]});}
  if(body.action==='update'){assert(loggedIn);assert.equal(body.expectedStatus,status);if(failUpdate)return Response.json({ok:false,error:'No se pudo guardar el estado.'},{status:503});status=body.status;return Response.json({ok:true,request:{id:body.id,status}});}
  throw Error('Unexpected route');
 };
 const set=async(id,value)=>{const input=w.document.getElementById(id);Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new w.Event('input',{bubbles:true}));await wait();};
 const submit=()=>w.document.querySelector('#d5TokenizationTool form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const button=text=>Array.from(w.document.querySelectorAll('#d5TokenizationTool button')).find(n=>n.textContent.trim()===text);
 try {
  w.eval(fs.readFileSync(path.resolve(__dirname,'../../components/center-empty-state.bundle.js'),'utf8'));
  await until(()=>w.document.querySelector('#d5ExpandingAction1'));
  w.document.querySelector('#d5ExpandingAction1').click();await until(()=>w.document.querySelector('[data-htk-file-id]'));
  assert.equal(w.document.querySelector('main').inert,true);assert(!w.document.querySelector('#d5TokenizationTool img'),'Filename caused HTML injection');
  w.document.querySelector('.htk-send').click();await until(()=>w.document.querySelector('#htk-phone'));
  assert.equal(w.document.activeElement.id,'htk-phone');
  await set('htk-phone','+1 809 555 1234');await set('htk-email','fixture@example.test');await set('htk-code','chosen-code');submit();submit();
  await until(()=>w.document.querySelector('.htk-error'));assert.equal(saves,1,'Double submission was not prevented');assert(w.document.querySelector('#htk-code'),'Failure discarded form');
  failSave=false;submit();await until(()=>w.document.querySelector('.htk-notice'));assert(w.document.querySelector('.htk-send').disabled);assert(!w.document.querySelector('#htk-code'));
  button('Área de solicitudes ↗').click();await until(()=>w.document.querySelector('#htk-admin-key'));await set('htk-admin-key','wrong');submit();await until(()=>w.document.querySelector('.htk-error'));
  assert.equal(calls.filter(c=>c.action==='list').length,0);await set('htk-admin-key','test-admin-key');submit();await until(()=>w.document.querySelector('.htk-records-table'));
  assert(w.document.querySelector('.htk-records-table').textContent.includes('fixture@example.test'));assert(!w.document.querySelector('#d5TokenizationTool img'));assert(!w.document.querySelector('#htk-admin-key'));
  const change=async value=>{const input=w.document.querySelector('.htk-status-select');input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}));await wait();await until(()=>!w.document.querySelector('.htk-status-select').disabled);};
  assert.equal(w.document.querySelectorAll('.htk-status-select option').length,5);
  for(const value of ['in_progress','delayed','awaiting_payment','completed']){await change(value);assert.equal(w.document.querySelector('.htk-status-select').value,value);}
  button('Actualizar').click();await wait();await until(()=>!button('Actualizar').disabled);assert.equal(w.document.querySelector('.htk-status-select').value,'completed');
  failUpdate=true;await change('pending');assert.equal(w.document.querySelector('.htk-status-select').value,'completed');assert(w.document.querySelector('.htk-error'));failUpdate=false;
  button('Cerrar sesión').click();await until(()=>w.document.querySelector('.htk-files-table'));assert(!w.document.querySelector('#d5TokenizationTool').textContent.includes('fixture@example.test'));
  w.document.querySelector('[aria-label="Cerrar tokenización"]').click();await until(()=>!w.document.querySelector('#d5TokenizationTool'));assert.equal(w.document.querySelector('main').inert,undefined);
  console.log(`Tokenization UI ${origin}: file selection, contacts, failures, duplicate guard, private key, logout, XSS and focus OK`);
 } finally {dom.window.close();}
}
(async()=>{await scenario('https://hashcodcodespace.dev');await scenario('http://127.0.0.1:8000')})().catch(e=>{console.error(e);process.exitCode=1});
