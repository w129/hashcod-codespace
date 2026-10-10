'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const path=require('node:path');

const target=process.env.HASHCOD_FIRST_SCREEN_URL||'http://127.0.0.1:8097/';

// Poll through the isolated automation world without unsafe-eval under CSP.
async function waitFor(page,predicate,arg,options){
  if(arg&&typeof arg==='object'&&'timeout' in arg){options=arg;arg=undefined;}
  const deadline=Date.now()+(options?.timeout||15000);
  while(Date.now()<deadline){if(await page.evaluate(predicate,arg))return;await page.waitForTimeout(50);}
  throw new Error('Timed out waiting for browser state: '+predicate.toString());
}


(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  // Ordinary UI checks run after a legitimate local server-issued period.
  // Dedicated period/security suites test selection, renewal and forged cookies.
  const localUrl=new URL(target);
  if(['127.0.0.1','localhost'].includes(localUrl.hostname)){
    const expiry=Math.floor(Date.now()/1000)+86400;
    const payload={kind:'platform-period-v1',host:localUrl.host,state:'active',subscription:{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+864000},days:10,expiresAt:expiry,proExpiresAt:expiry,token:'first-screen-test-period'};
    const cookie=execFileSync(process.env.PHP_BIN||'php',['-r',"require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));",JSON.stringify(payload)],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}).trim();
    await page.context().addCookies([{name:'hashcod_platform_period_v1',value:cookie,url:localUrl.origin,httpOnly:true,sameSite:'Strict'}]);
    const consentPayload={kind:'policy-consent-v1',host:localUrl.host,version:'2026.09.18-2',receipt:'0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',acceptedAt:Math.floor(Date.now()/1000)};
    const consentCookie=execFileSync(process.env.PHP_BIN||'php',['-r',"require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));",JSON.stringify(consentPayload)],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}).trim();
    await page.context().addCookies([{name:'hashcod_policy_consent_v1',value:consentCookie,url:localUrl.origin,httpOnly:true,sameSite:'Strict'}]);
    await page.route('**/api/platform-period',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:'active',subscription:{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+864000},days:10,expiresAt:expiry,serverNow:Math.floor(Date.now()/1000)})}));
    await page.route('**/api/hashcod-shared-*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,files:[],state:{},text:'',updatedAt:0})}));
  }
  const KEY = 'sk-ant-test-' + 'x'.repeat(32), calls = { key: [], chat: [] };
  await page.route('**/api/notebook-ai/**', route => {
    const url = route.request().url(), method = route.request().method(), json = body => route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    if (url.endsWith('/status')) return json({ ok: true, configured: false });
    if (url.endsWith('/key') && method === 'POST') { calls.key.push(route.request().postDataJSON()); return json({ ok: true, provider: 'anthropic', model: 'claude-sonnet-5-5', expiresAt: Math.floor(Date.now() / 1000) + 1800 }); }
    if (url.endsWith('/chat')) { const body = route.request().postDataJSON(); calls.chat.push(body); return json({ ok: true, answer: '**Resultado** basado en la fuente [1]', sources: body.sources.map(s => s.title), expiresAt: Math.floor(Date.now() / 1000) + 1800 }); }
    return json({ ok: false, error: 'x' });
  });
  await page.route(/hashcod-(shared-files|file-vault)[^/]*\?action=list/, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, files: [
    { id: 'f1', name: 'notas.txt', type: 'text/plain', size: 400, cloud: true }, { id: 'f2', name: 'foto.png', type: 'image/png', size: 900, cloud: true }] }) }));
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.htb-slot--tool', { timeout: 20000 });
  assert.equal(await page.getAttribute('.htb-slot--tool', 'data-filled'), 'true', 'slot 1-1 is filled by the notebook tool');
  assert.equal(await page.getAttribute('[role=progressbar][aria-label="Avance de la Toolbook"]', 'aria-valuenow'), '6', 'Toolbook progress counts the first tool');
  await page.evaluate(() => { window.HashcodFileVaultTotp = { ...window.HashcodFileVaultTotp, preview: async () => new Blob(['Informe: las ventas subieron 12% en el trimestre.'], { type: 'text/plain' }) }; });
  await page.click('.htb-slot--tool');
  await page.waitForSelector('#d5NotebookTool');
  const sendDisabled = () => page.$eval('#d5NotebookTool .hnb-ask button', b => b.disabled);
  assert.equal(await sendDisabled(), true, 'cannot ask before connecting a key');
  // 1. API key: needs consent, is sent once and never shown again.
  await page.fill('#d5NotebookTool input[type=password]', KEY);
  assert.equal(await page.$eval('#d5NotebookTool .hnb-form button[type=submit]', b => b.disabled), true, 'consent is required');
  await page.click('#d5NotebookTool [aria-label=Consentimiento]');
  await page.click('#d5NotebookTool .hnb-form button[type=submit]');
  await page.waitForSelector('#d5NotebookTool .htk-notice');
  assert.equal(calls.key.length, 1); assert.equal(calls.key[0].apiKey, KEY); assert.equal(calls.key[0].consent, true);
  assert.equal(await page.evaluate(k => document.documentElement.innerHTML.includes(k) || [...document.querySelectorAll('input')].some(i => i.value.includes(k)), KEY), false, 'the key is gone from the page after saving');
  // 2. Sources come from Files and need their code (preview stub).
  await page.waitForSelector('#d5NotebookTool .hnb-sources');
  await page.click('#d5NotebookTool [aria-label="Usar notas.txt"]');
  await page.waitForFunction(() => document.querySelector('.hnb-sources')?.textContent.includes('caracteres'));
  // 3. Transformation + chat with history.
  await page.click('#d5NotebookTool button:has-text("Resumen")');
  await page.waitForSelector('#d5NotebookTool .hnb-md strong');
  assert.equal(calls.chat[0].mode, 'transform'); assert.equal(calls.chat[0].transform, 'summary');
  assert.equal(calls.chat[0].sources[0].title, 'notas.txt'); assert(calls.chat[0].sources[0].text.includes('ventas subieron'));
  await page.fill('#d5NotebookTool textarea', '¿Cuánto subieron las ventas?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.hnb-msg--ai:not(.hnb-thinking)').length === 2);
  assert.equal(calls.chat[1].mode, 'chat'); assert.equal(calls.chat[1].message, '¿Cuánto subieron las ventas?');
  assert(calls.chat[1].history.some(m => m.role === 'assistant'), 'the conversation history is sent');
  // 4. Notes are saved through the Files code flow.
  await page.click('#d5NotebookTool button:has-text("Guardar nota en Files")');
  await page.waitForSelector('.hfv-totp-backdrop', { timeout: 5000 });
  console.log('Notebook tool: OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
