'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.HASHCOD_FIRST_SCREEN_URL||'http://127.0.0.1:8097/';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  try{
    let response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'root must return 200');

    await page.waitForSelector('[data-entry-single-screen="true"]',{state:'visible',timeout:10000});
    await page.waitForSelector('#d5Verify',{state:'visible',timeout:5000});

    let state=await page.evaluate(()=>({
      title:document.querySelector('[data-entry-panel="1"] h1')?.textContent.trim()||'',
      panels:Array.from(document.querySelectorAll('[data-entry-panel]')).map(n=>n.getAttribute('data-entry-panel')),
      secondEntry:document.getElementById('hashcodEntryHold')!==null,
      toolbook:document.getElementById('hashcodToolbookBlankPage')!==null,
      toolbookScript:Array.from(document.scripts).some(s=>/toolbook-page-blank|toolbook-branched-menu/i.test(s.src||'')),
      holdScript:Array.from(document.scripts).some(s=>/platform-entry-hold/i.test(s.src||'')),
      url:location.href,
      wizard:window.HashcodEntryWizard||null
    }));

    assert.equal(state.title,'Acceso a Hashcod Codespace','first screen title must remain');
    assert.deepEqual(state.panels,['1'],'only data-entry-panel=1 may exist');
    assert.equal(state.secondEntry,false,'second entry screen must not exist');
    assert.equal(state.toolbook,false,'Toolbook screen must not exist');
    assert.equal(state.toolbookScript,false,'Toolbook runtime must not load on the root');
    assert.equal(state.holdScript,false,'second-entry runtime must not load on the root');
    assert.equal(state.wizard?.singleScreen,true,'entry runtime must report single-screen mode');

    const before=page.url();
    await page.locator('#d5Verify').click();
    await page.waitForTimeout(350);

    state=await page.evaluate(()=>({
      panels:Array.from(document.querySelectorAll('[data-entry-panel]')).map(n=>n.getAttribute('data-entry-panel')),
      secondEntry:document.getElementById('hashcodEntryHold')!==null,
      toolbook:document.getElementById('hashcodToolbookBlankPage')!==null,
      level:window.HashcodEntryWizard?.getLevel?.()
    }));
    assert.equal(page.url(),before,'clicking Entrar must not navigate away from the first screen');
    assert.deepEqual(state.panels,['1'],'clicking Entrar must not create another entry panel');
    assert.equal(state.secondEntry,false,'clicking Entrar must not create the retired second screen');
    assert.equal(state.toolbook,false,'clicking Entrar must not create Toolbook');
    assert.equal(state.level,1,'entry level must remain 1');

    response=await page.goto(target+'?hashcod_enter=1',{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'legacy hashcod_enter URL must still return 200');
    await page.waitForSelector('[data-entry-single-screen="true"]',{state:'visible',timeout:10000});
    const legacy=await page.evaluate(()=>({
      title:document.querySelector('[data-entry-panel="1"] h1')?.textContent.trim()||'',
      panels:document.querySelectorAll('[data-entry-panel]').length,
      secondEntry:document.getElementById('hashcodEntryHold')!==null,
      toolbook:document.getElementById('hashcodToolbookBlankPage')!==null
    }));
    assert.equal(legacy.title,'Acceso a Hashcod Codespace','legacy query must remain on first screen');
    assert.equal(legacy.panels,1,'legacy query must not unlock hidden screens');
    assert.equal(legacy.secondEntry,false,'legacy query must not unlock second entry screen');
    assert.equal(legacy.toolbook,false,'legacy query must not unlock Toolbook');

    console.log('✓ Only the first Hashcod screen remains reachable');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
