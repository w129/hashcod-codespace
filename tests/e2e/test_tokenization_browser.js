const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const width of [1280,390]) {
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
   const now=Math.floor(Date.now()/1000),file={id:'fv_browser123',name:'Contrato de prueba.pdf',size:1200,type:'application/pdf',priceUsdCents:1250};
   let status='pending';
   await page.route('https://app.test/**',async route=>{
    const url=route.request().url();
    if(url==='https://app.test/')return route.fulfill({contentType:'text/html',body:`<body data-hashcod-period-days="10" data-hashcod-period-expires-at="${now+864000}" data-hashcod-period-now="${now}"><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer></body>`});
    if(url.includes('platform-period'))return route.fulfill({json:{ok:true,state:'active',days:10,expiresAt:now+864000,serverNow:now}});
    if(url.includes('action=list'))return route.fulfill({json:{ok:true,files:[file]}});
    if(url.includes('hashcod-tokenization')) {
     const body=route.request().postDataJSON();
     if(body.action==='auth')return route.fulfill({json:{ok:true,expiresAt:now+900}});
     if(body.action==='update'){assert.equal(body.expectedStatus,status);status=body.status;return route.fulfill({json:{ok:true,request:{id:body.id,status}}});}
     if(body.action==='list')return route.fulfill({json:{ok:true,hasMore:false,requests:[{...file,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',status,name:'Contrato de prueba.pdf',mime:'application/pdf',phone:'+1 809 555 1234',email:'fixture@example.test',createdAt:new Date().toISOString(),fileAvailable:true}]}});
     return route.fulfill({json:{ok:true,request:{id:'fixture-request',status:'pending'}}});
    }
    return route.fulfill({json:{ok:true}});
   });
   await page.goto('https://app.test/');
   await page.addStyleTag({path:path.resolve(__dirname,'../../components/center-empty-state.bundle.css')});
   await page.addScriptTag({path:path.resolve(__dirname,'../../components/center-empty-state.bundle.js')});
   await page.locator('#d5ExpandingAction1').click();
   await page.locator('.htk-send').click();await page.locator('#htk-phone').fill('+1 809 555 1234');await page.locator('#htk-email').fill('fixture@example.test');await page.locator('#htk-code').fill('chosen-code');
   const out=process.env.HASHCOD_TOKENIZATION_SCREENSHOT_DIR;
   if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,`tokenization-form-${width}.png`)});}
   await page.getByRole('button',{name:'Enviar solicitud',exact:true}).click();await page.locator('.htk-notice').waitFor();
   await page.getByRole('button',{name:'Área de solicitudes ↗'}).click();await page.locator('#htk-admin-key').fill('fixture-key');await page.getByRole('button',{name:'Ver solicitudes',exact:true}).click();await page.locator('.htk-records-table').waitFor();
   const state=page.getByRole('combobox');
   for(const value of ['in_progress','delayed','awaiting_payment','completed']) {
    await state.selectOption(value);await page.getByRole('status').filter({hasText:'Estado guardado:'}).waitFor();
    assert.equal(await state.inputValue(),value);
   }
   await page.getByRole('button',{name:'Actualizar',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.htk-status-select').disabled);
   assert.equal(await state.evaluate(n=>n.value),'completed');
   if(out)await page.screenshot({path:path.join(out,`tokenization-requests-${width}.png`)});
   assert.equal(await page.locator('.htk-records-table td').first().evaluate(n=>getComputedStyle(n).fontSize),'13px');
   assert(await page.locator('.htk-records-table').textContent().then(s=>s.includes('fixture@example.test')));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflows horizontally');
   assert(await page.locator('.htk-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth),'Records overflow horizontally');
   await page.getByRole('button',{name:'Cerrar tokenización'}).click();await page.locator('#d5TokenizationTool').waitFor({state:'detached'});
   assert.equal(await page.locator('main').evaluate(n=>n.inert),false);
   console.log(`Tokenization Chromium ${width}px: contact form, submission, private records, focus and no horizontal overflow OK`);await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
