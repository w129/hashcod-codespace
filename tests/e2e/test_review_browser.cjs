'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const owned='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',sid='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',cert='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const checks=['sandbox','tests','sast','secrets','deps'].map(kind=>({kind,tool:'Fixture',tool_version:'1',status:'complete',passed:true,scope:'Prueba del flujo visual.'}));
(async()=>{
 const server=http.createServer((req,res)=>{
  if(req.url.startsWith('/components/')){const file=path.join(root,req.url);res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');return res.end(fs.readFileSync(file));}
  const now=Math.floor(Date.now()/1000);res.setHeader('Content-Type','text/html');res.end(`<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/components/center-empty-state.bundle.css"></head><body data-hashcod-period-days="10" data-hashcod-period-expires-at="${now+864000}" data-hashcod-period-now="${now}"><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer><script src="/components/center-empty-state.bundle.js"></script></body></html>`);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
   const page=await browser.newPage({viewport});let starts=0,keyRejected=true,revoked=false,result='pass',finals=0;
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url());let data;
    if(url.pathname==='/api/platform-period')data={ok:true,state:'active',days:10,expiresAt:Math.floor(Date.now()/1000)+864000,serverNow:Math.floor(Date.now()/1000)};
    else if(url.pathname.includes('hashcod-shared'))data={ok:true,files:[]};
    else if(url.pathname==='/api/hashcod-review/verify')data={ok:true,valid:!revoked};
    else if(request.method()==='GET')data={ok:true,csrf:'fixture-csrf',requests:[{id:owned,name:'<img onerror=alert(1)>.py',size:48,status:'pending',available:true}],config:{models:[{id:'claude-sonnet-5-5',inputUsdPerMillion:2,outputUsdPerMillion:10}],scope:'Archivo único en WASI.'}};
    else{
     const body=request.postDataJSON();assert.equal(request.headers()['x-hashcod-review-csrf'],'fixture-csrf');assert.equal(request.headers()['x-requested-with'],'XMLHttpRequest');assert(!('token' in body));
     if(body.action==='start'){starts++;assert.equal(body.id,owned);assert.equal(body.consent,true);if(keyRejected)return route.fulfill({status:403,json:{ok:false,error:'API key incorrecta.'}});data={ok:true,session_id:sid,checks,reply:'Archivo comprobado. <img src=x onerror=alert(1)>'};}
     else if(body.action==='message')data={ok:true,reply:'Respuesta del revisor.',reservedUsd:.01};
     else if(body.action==='finalize'){finals++;data={ok:true,result,summary:'Dictamen guardado.',certificate:result==='pass'?{payload:{certificate_id:cert}}:null};}
     else if(body.action==='close')data={ok:true};else throw Error('Unexpected action '+body.action);
    }
    await route.fulfill({json:data});
   });
   await page.goto(base);
   const access=page.locator('#d5RecommendationCard'),drawer=access.locator('.hrc-drawer');
   await page.locator('#d5RecommendationCard[data-accepted="true"]').waitFor();
   await access.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
   const closed=await access.boundingBox(),footer=await access.locator('.hrc-footer').boundingBox();
   assert(closed.y+closed.height-footer.y-footer.height<=2,'Collapsed access card must end at its footer without a blank panel');
   assert((await drawer.boundingBox()).height<=1,'Collapsed alternatives must occupy no space');
   for(let toggle=0;toggle<2;toggle++){
    await access.getByRole('button',{name:'Alternatives',exact:true}).click();
    await access.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
    assert.equal(await drawer.getAttribute('aria-hidden'),'false');
    const expanded=await access.boundingBox(),area=await drawer.boundingBox();
    assert(expanded.height>closed.height+50,'Opening alternatives must expand the access card');
    assert.equal(await drawer.evaluate(n=>getComputedStyle(n).opacity),'1','Expanded alternatives must display their text');
    for(const days of [20,30,60]){
     const option=drawer.locator(`[data-option="${days}"]`),box=await option.boundingBox();
     assert.match(await option.textContent(),new RegExp(days+' days'));
     assert(box.height>0&&box.y>=area.y-1&&box.y+box.height<=area.y+area.height+1,'Every alternative must fit inside the expanded drawer');
     assert.equal(await option.isDisabled(),true,'Inspecting alternatives must not change an active access period');
    }
    if(toggle===0&&process.env.REVIEW_SCREENSHOT_DIR){fs.mkdirSync(process.env.REVIEW_SCREENSHOT_DIR,{recursive:true});await access.screenshot({path:path.join(process.env.REVIEW_SCREENSHOT_DIR,`access-open-${viewport.width}.png`)});}
    await access.getByRole('button',{name:'Alternatives',exact:true}).click();
    await access.evaluate(async n=>{await Promise.all(n.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
    assert.equal(await drawer.getAttribute('aria-hidden'),'true');assert.equal(await drawer.evaluate(n=>n.inert),true);
    assert((await drawer.boundingBox()).height<=1);assert(Math.abs((await access.boundingBox()).height-closed.height)<=1,'Closing alternatives must restore the compact card');
   }
   if(process.env.REVIEW_SCREENSHOT_DIR)await access.screenshot({path:path.join(process.env.REVIEW_SCREENSHOT_DIR,`access-closed-${viewport.width}.png`)});
   await page.locator('#d5ExpandingAction2').click();const dialog=page.locator('#d5ReviewChat');await dialog.waitFor();
   await page.getByLabel('API key de Anthropic').fill('sk-ant-synthetic-fixture-key-1234567890');await page.locator('.hrc-consent input').check();
   await page.getByRole('button',{name:'Validar clave y comenzar'}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByLabel('API key de Anthropic').inputValue(),'');assert.equal(await page.locator('.hrc-whatsapp').count(),0);
   keyRejected=false;await page.getByLabel('API key de Anthropic').fill('sk-ant-synthetic-fixture-key-1234567890');await page.getByRole('button',{name:'Validar clave y comenzar'}).click();await page.locator('.hrc-review-card').waitFor();assert.equal(await dialog.locator('img').count(),0);
   assert.equal(await dialog.locator('.hrc-review-card').evaluate(n=>n.getBoundingClientRect().height),288,'Review chat must retain its fixed conversation height');
   await page.getByLabel('Mensaje para el revisor').fill('Explica mi archivo');await page.getByRole('button',{name:'Enviar mensaje'}).click();await page.getByText('Respuesta del revisor.',{exact:true}).waitFor();assert.equal(await page.locator('.hrc-whatsapp').count(),0);
   await page.getByRole('button',{name:'Solicitar dictamen final'}).click();await page.locator('.hrc-whatsapp').waitFor();assert.match(await page.locator('.hrc-whatsapp').getAttribute('href'),/^https:\/\/wa.me\/18294721257\?text=/);assert.equal(finals,1);
   const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=viewport.width&&box.y>=0&&box.y+box.height<=viewport.height);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
   if(process.env.REVIEW_SCREENSHOT_DIR){fs.mkdirSync(process.env.REVIEW_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.REVIEW_SCREENSHOT_DIR,`review-${viewport.width}.png`)});}
   await page.getByRole('button',{name:'Nueva revisión'}).click();await page.getByLabel('API key de Anthropic').waitFor();result='needs_human';
   await page.getByLabel('API key de Anthropic').fill('sk-ant-synthetic-fixture-key-1234567890');await page.locator('.hrc-consent input').check();await page.getByRole('button',{name:'Validar clave y comenzar'}).click();await page.locator('.hrc-review-card').waitFor();await page.getByRole('button',{name:'Solicitar dictamen final'}).click();await page.getByText('Se requiere revisión humana',{exact:true}).waitFor();assert.equal(await page.locator('.hrc-whatsapp').count(),0);
   await page.getByRole('button',{name:'Cerrar revisión'}).click();await dialog.waitFor({state:'detached'});assert.equal(await page.locator('#d5ExpandingAction2').evaluate(n=>document.activeElement===n),true);
   await page.close();console.log(`Review browser ${viewport.width}x${viewport.height}: key failure, clearing, consent, chat, verified-only WhatsApp, human review, XSS, focus and layout OK`);
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
