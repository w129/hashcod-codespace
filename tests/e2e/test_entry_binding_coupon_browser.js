'use strict';
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const { createServer } = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const phpBin = process.env.PHP_BIN || 'php';
// An isolated server-side verifier fixture, never a client bypass or CI-only path.
async function waitFor(page, predicate) {
  const deadline=Date.now()+8000;
  while(Date.now()<deadline){if(await page.evaluate(predicate))return;await page.waitForTimeout(50);}
  throw new Error('Timed out waiting for browser state: '+predicate.toString());
}
const series = Array(9865).fill('1 2 3 4 5 6 7 8').join('\n');
(async () => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(),'hashcod-entry-'));
  for(const item of fs.readdirSync(root,{withFileTypes:true})) {
    if(item.isFile()&&/\.(php|svg|png|webp)$/.test(item.name)) fs.copyFileSync(path.join(root,item.name),path.join(runtime,item.name));
    else if(item.name==='components') fs.cpSync(path.join(root,item.name),path.join(runtime,item.name),{recursive:true});
    else if(item.isDirectory()&&!['data_storage','node_modules','.git'].includes(item.name)) fs.symlinkSync(path.join(root,item.name),path.join(runtime,item.name),'dir');
  }
  fs.mkdirSync(path.join(runtime,'sessions'));
  const reservation = createServer(); await new Promise(r => reservation.listen(0, '127.0.0.1', r));
  const port = reservation.address().port; await new Promise(r => reservation.close(r));
  const base = `http://127.0.0.1:${port}`;
  const env = { ...process.env, APP_ENV: 'test', GITHUB_ACTIONS: 'true', L8_CODE_ACCESS_REQUIRED: '1',
    SUPABASE_URL: base+'/unavailable-test-cloud', SUPABASE_PUBLISHABLE_KEY: 'isolated-test-key',
    SUPABASE_SECRET_KEY: 'isolated-test-key', SUPABASE_ANON_KEY: 'isolated-test-key', SUPABASE_SERVICE_ROLE_KEY: 'isolated-test-key',
    L8_NUMERIC_SERIES_SHA256: crypto.createHash('sha256').update(series).digest('hex'),
    L8_COUPON_SIGNING_KEY: crypto.randomBytes(48).toString('hex'),
    L8_ACCESS_GATE_COOKIE_SECRET: crypto.randomBytes(48).toString('hex') };
  const seal = payload => execFileSync(phpBin, ['-r', `$_SERVER['HTTP_HOST']='127.0.0.1:${port}'; require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));`, JSON.stringify(payload)], { cwd: runtime, env, encoding: 'utf8' }).trim();
  const period = seal({ kind: 'platform-period-v1', host: `127.0.0.1:${port}`, state: 'active', days: 10, expiresAt: Math.floor(Date.now()/1000)+86400, token: 'server-test-period' });
  // No PHP controller can transmit to a cloud service during this local suite.
  const php = spawn(phpBin, ['-d','allow_url_fopen=0','-d','disable_functions=curl_exec,fsockopen,pfsockopen,stream_socket_client,socket_connect,exec,shell_exec,passthru,system,proc_open',
    '-d','session.save_path='+path.join(runtime,'sessions'),'-S', `127.0.0.1:${port}`, '-t', runtime, path.join(runtime, 'router.php')], { cwd: runtime, env, stdio: 'ignore' });
  let browser;
  try {
    for (let i=0; i<80; i++) { try { if ((await fetch(base+'/api/code-access')).ok) break; } catch {} await new Promise(r=>setTimeout(r,100)); }
    const state = await (await fetch(base+'/api/code-access')).json();
    assert.equal(state.authorized, false); assert.equal(state.bound, false); assert.equal(state.protocol, 'HASHCOD-NUMERIC-SERIES/1');
    const legacy = await fetch(base+'/api/code-access', { method:'POST', headers:{'Content-Type':'application/json','X-Hashcod-Mesh':'1'}, body:JSON.stringify({fields:{TYPE:'anything'}}) });
    assert.equal(legacy.status,400,'arbitrary mesh fields must not grant access, even in CI');
    browser = await chromium.launch({ headless:true });
    for (const viewport of [{width:390,height:844},{width:1440,height:900}]) {
      const context = await browser.newContext({ viewport, reducedMotion:'reduce', hasTouch:viewport.width<500 });
      await context.addCookies([{name:'hashcod_platform_period_v1', value:period, url:base, httpOnly:true, sameSite:'Strict'}]);
      const page = await context.newPage(), errors=[];
      await page.addInitScript(()=>{
        window.__faqCloseTrace=[];
        const remove=DOMTokenList.prototype.remove;
        DOMTokenList.prototype.remove=function(...tokens){
          if(tokens.includes('faq-modal-open')&&this.contains('faq-modal-open'))
            window.__faqCloseTrace.push({stack:new Error().stack,event:window.event?.type,target:window.event?.target?.id});
          return remove.apply(this,tokens);
        };
      });
      page.setDefaultTimeout(8000);
      page.on('pageerror', e=>errors.push(e.message));
      // Access, coupon and period reach the real local PHP server. Every other
      // background controller is an isolated fixture; external traffic is denied.
      await page.route('**/*', route=>{
        const url=new URL(route.request().url());
        if(url.origin!==base)return route.abort();
        const real=['/api/code-access','/api/hashcod-coupon','/api/platform-period'];
        if((url.pathname.startsWith('/api/')&&!real.includes(url.pathname))||/^\/(?:hashcod-|toolbox-secure).*\.php$/.test(url.pathname))
          return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,files:[],state:{},text:'',updatedAt:0})});
        return route.continue();
      });
      await page.goto(base, {waitUntil:'domcontentloaded'});
      await page.waitForTimeout(200);
      await page.locator('#d5AccessSeries').waitFor({state:'visible'});
      assert(!await page.locator('#d5CodeAccessMount').innerText().then(t=>/\<\?php|Access\.php|FIRST-USE|Mesh/.test(t)));
      const gate = await page.locator('#d5CodeAccessGate').boundingBox();
      assert(gate.x>=0 && gate.x+gate.width<=viewport.width+1,'access form must fit');
      await page.locator('#d5AccessSeries').fill('incorrect'); await page.locator('#d5AccessSubmit').click();
      await page.getByRole('alert').filter({hasText:'Credencial incorrecta'}).waitFor();
      assert.equal((await context.request.get(base+'/api/code-access').then(r=>r.json())).authorized,false);
      await page.locator('#d5AccessFile').setInputFiles({name:'test-credential.txt',mimeType:'text/plain',buffer:Buffer.from(series)});
      await waitFor(page,()=>document.getElementById('d5AccessSeries').value.length>100000); await page.locator('#d5AccessSubmit').click();
      await page.locator('#d5CodeAccessGate').waitFor({state:'detached'});
      const confirmed = await context.request.get(base+'/api/code-access').then(r=>r.json());
      assert.equal(confirmed.bound,true); assert.equal(confirmed.authorized,true);
      const binding = (await context.cookies()).find(c=>c.name==='l8_numeric_series_access_v1');
      assert(binding?.httpOnly,'binding must be a signed HttpOnly cookie');
      await page.reload({waitUntil:'domcontentloaded'});
      await waitFor(page,()=>document.getElementById('d5CodeAccessMount')?.dataset.reactMounted==='true');
      await page.locator('#d5CodeAccessGate').waitFor({state:'detached'});
      assert.equal(await page.evaluate(()=>window.HashcodCodeAccess.bound),true,'persisted proof must resolve on reload');
      if(await page.locator('.branched-menu__head').first().getAttribute('aria-expanded')!=='true') await page.locator('.branched-menu__head').first().click();
      await page.getByRole('button',{name:'FAQ',exact:true}).click();
      await page.locator('#d5FaqCard').waitFor({state:'visible'});
      for(const label of ['General','Desarrollo','Objetivos']) {
        await page.getByRole('tab',{name:label,exact:true}).click();
        await waitFor(page,()=>!document.getElementById('d5FaqAccordion')?.classList.contains('switching'));
        const questions = page.locator('.faq-question'); assert(await questions.count()>=3);
        for(let i=0;i<await questions.count();i++) {
          if(await questions.nth(i).getAttribute('aria-expanded')!=='true') await questions.nth(i).click().catch(async error=>{
            console.error('FAQ layout diagnostic',JSON.stringify(await page.evaluate(()=>{
              const card=document.getElementById('d5FaqCard'),accordion=document.getElementById('d5FaqAccordion');
              const describe=node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return {id:node.id,display:s.display,visibility:s.visibility,width:r.width,height:r.height,scrollHeight:node.scrollHeight,overflow:s.overflow,flex:s.flex};};
              return {closeTrace:window.__faqCloseTrace,bodyClass:document.body.className,card:describe(card),accordion:describe(accordion),questions:Array.from(card.querySelectorAll('.faq-question')).map(describe)};
            })));
            throw error;
          });
          assert((await page.locator('.faq-item.open .faq-answer').innerText()).length>80,'all FAQ answers must be complete');
        }
      }
      await page.locator('#d5FaqClose').click();
      if(viewport.width<500){
        let failed=false; await page.route('**/api/hashcod-coupon?action=issue',async route=>{
          if(!failed){failed=true; await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'});} else await route.continue();
        });
      }
      await page.getByRole('button',{name:'Documents',exact:true}).click();
      if(viewport.width<500){await page.locator('#d5ScratchCouponRetry').waitFor({state:'visible'});await page.locator('#d5ScratchCouponRetry').click();}
      await page.locator('#d5ScratchCanvas').waitFor({state:'visible'});
      await waitFor(page,()=>document.getElementById('d5ScratchCopy')?.disabled===false);
      await page.locator('#d5ScratchCanvas').focus(); await page.keyboard.press('Enter');
      await waitFor(page,()=>document.getElementById('d5ScratchFoil')?.hidden===true);
      const code = (await page.locator('#d5ScratchCouponCode').innerText()).trim();
      assert.match(code,/^HC20-[A-Z0-9]+-[A-Z2-9]{8}-[A-F0-9]{12}$/);
      const issued = await context.request.get(base+'/api/hashcod-coupon?action=issue').then(r=>r.json());
      assert.equal(issued.reused,true); assert.equal(issued.coupon.code,code);
      const validate = code => context.request.post(base+'/api/hashcod-coupon',{data:{action:'validate',code},headers:{Origin:base}});
      assert.equal((await validate(code)).status(),200);
      assert.equal((await validate(code.slice(0,-1)+(code.endsWith('0')?'1':'0'))).status(),422);
      const expired = execFileSync(phpBin, ['-r', `require 'secrets.php'; $key=hash_hmac('sha256','hashcod|coupon-validation|v1',secretGet('L8_COUPON_SIGNING_KEY'),true); $exp=strtoupper(base_convert((string)(time()-60),10,36)); $nonce='ABCDEFGH'; echo 'HC20-'.$exp.'-'.$nonce.'-'.strtoupper(substr(hash_hmac('sha256','HC20|'.$exp.'|'.$nonce,$key),0,12));`], {cwd:runtime,env,encoding:'utf8'}).trim();
      const expiredResponse=await validate(expired);
      assert.equal(expiredResponse.status(),422,'expired signed coupons must be rejected');
      assert.equal((await expiredResponse.json()).coupon.reason,'expired');
      await page.locator('#d5ScratchCopy').click();
      await waitFor(page,()=>document.getElementById('d5ScratchCopySr')?.textContent==='Copiado al portapapeles');
      assert((await page.locator('#d5ScratchCouponStatus').innerText()).includes('Válido hasta'));
      await page.locator('#d5DocumentsHubClose').click();
      // Include every rotating word in layout verification, including long Spanish phrases.
      const words = await page.locator('#d5RotatingTextHero').getAttribute('data-texts').then(t=>t.split('|'));
      for(let i=0;i<words.length;i++) {
        await page.evaluate(i=>window.HashcodRotatingText.jumpTo(i),i); await page.waitForTimeout(20);
        const box = await page.locator('#d5RotatingTextHero').boundingBox();
        assert(box.x>=-1 && box.x+box.width<=viewport.width+1,'rotating headline must fit');
      }
      assert.equal(await page.locator('.entry-rotating-text-prefix').innerText(),'Crea con');
      assert.deepEqual(errors,[],'no uncaught browser errors');
      console.log(`${viewport.width}x${viewport.height}: real binding/reload, invalid credential, all FAQ tabs, signed coupon/reuse/tamper/copy, responsive headline OK`);
      await context.close();
    }
    const badOrigin = await fetch(base+'/api/hashcod-coupon', {headers:{Origin:'https://evil.test',Cookie:'hashcod_platform_period_v1='+period}});
    assert.equal(badOrigin.status,403);
    const spoof = await fetch(base+'/api/code-access',{headers:{Cookie:'l8_numeric_series_access_v1=forged'}}).then(r=>r.json());
    assert.equal(spoof.authorized,false); assert.equal(spoof.bound,false);
  } finally { await browser?.close(); php.kill(); fs.rmSync(runtime,{recursive:true,force:true}); }
})().catch(e=>{console.error((e.stack||String(e)).slice(0,1500));process.exitCode=1;});
