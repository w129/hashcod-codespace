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
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#d5FormsTrigger',{timeout:20000});
  const pos=await page.evaluate(()=>{const v=document.getElementById('d5FileVaultTrigger').getBoundingClientRect(),f=document.getElementById('d5FormsTrigger').getBoundingClientRect();return{vaultBottom:v.bottom,formsTop:f.top};});
  assert(pos.formsTop>=pos.vaultBottom-1,'forms button sits below the toolbar row');
  await page.click('#d5FormsTrigger');
  await page.waitForSelector('#d5FormsTool');
  assert.equal(await page.$$eval('#d5FormsTool [data-slot=accordion-trigger]',b=>b.length),9,'nine categories (account + A-H)');
  await page.waitForSelector('#d5FormsTool .hfm-sheet canvas',{timeout:30000});
  assert(await page.$eval('.hfm-sheet canvas',c=>c.width>100&&c.height>100),'the first form renders as a visual preview');
  // search narrows the list and opens the match
  await page.fill('.hfm-search','KYC');
  await page.waitForSelector('.hfm-form:has-text("A01")');
  assert.equal(await page.$$eval('.hfm-form',b=>b.length),1,'search finds exactly the KYC form');
  await page.click('.hfm-form:has-text("A01")');
  await page.waitForSelector('.hfm-view-head h3:has-text("A01")');
  await page.waitForSelector('.hfm-sheet canvas',{timeout:30000});
  // the real PDF downloads with its code in the name
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('button:has-text("Descargar PDF")')]);
  assert(/^A01_.*\.pdf$/.test(download.suggestedFilename()),'download keeps the form code in its name: '+download.suggestedFilename());
  // every catalog entry is served as a PDF
  const bad=await page.evaluate(async()=>{const codes=[...document.querySelectorAll('.hfm-form')].map(b=>b.querySelector('b').textContent);return codes.length;});
  assert(bad>=1);
  const sample=await page.evaluate(async()=>{const r=await fetch('/api/forms-library/U02',{credentials:'same-origin'});return{ok:r.ok,type:r.headers.get('content-type'),head:new TextDecoder().decode((await r.arrayBuffer()).slice(0,5))};});
  assert.deepEqual(sample,{ok:true,type:'application/pdf',head:'%PDF-'},'the API serves the PDF inline');
  assert.equal((await page.evaluate(async()=>(await fetch('/api/forms-library/..%2Frouter',{credentials:'same-origin'})).status)),404,'path tricks are rejected');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#d5FormsTool').count(),0,'Escape closes the library');
  console.log('Forms tool: OK');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
