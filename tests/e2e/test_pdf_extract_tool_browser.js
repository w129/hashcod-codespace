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
  // Needs Java + the OpenDataLoader jar (OPENDATALOADER_JAR on the server) and a sample PDF.
  const pdf=process.env.PDF_EXTRACT_TEST_PDF;
  if(!pdf){console.log('SKIP: set PDF_EXTRACT_TEST_PDF (and run the server with OPENDATALOADER_JAR)');await browser.close();return;}
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#d5PdfExtractTrigger',{timeout:20000});
  const pos=await page.evaluate(()=>{const v=document.getElementById('d5FileVaultTrigger').getBoundingClientRect(),p=document.getElementById('d5PdfExtractTrigger').getBoundingClientRect();return{vaultRight:v.right,pdfLeft:p.left};});
  assert(pos.pdfLeft>=pos.vaultRight,'PDF button must sit to the right of the file-storage button');
  await page.click('#d5PdfExtractTrigger');
  await page.waitForSelector('#d5PdfExtractTool');
  assert.equal(await page.$eval('.hpx-publish',b=>b.disabled),true,'publish stays disabled before an analysis');
  await page.setInputFiles('#d5PdfExtractTool input[type=file]',pdf);
  await page.click('button:has-text("Analizar")');
  await page.waitForSelector('.hpx-results',{timeout:60000});
  const items=await page.$$eval('.hpx-results [data-slot=accordion-trigger]',b=>b.map(x=>x.textContent));
  assert(items.some(t=>t.startsWith('Markdown'))&&items.some(t=>t.startsWith('JSON')),'markdown and json results listed');
  await page.waitForSelector('.hpx-visual canvas',{timeout:20000});
  assert(await page.$eval('.hpx-visual canvas',c=>c.width>100&&c.height>100),'annotated PDF page renders as the visual view');
  await page.click('.hpx-results [data-slot=accordion-trigger]:has-text("Markdown")');
  await page.waitForSelector('.hpx-preview');
  assert((await page.textContent('.hpx-preview')).length>50,'markdown preview shows extracted text');
  assert.equal(await page.$eval('.hpx-publish',b=>b.disabled),false,'publish enables once a format is open');
  await page.click('.hpx-publish');
  await page.waitForSelector('.hfv-totp-backdrop',{timeout:5000});
  console.log('PDF extract tool: OK');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
