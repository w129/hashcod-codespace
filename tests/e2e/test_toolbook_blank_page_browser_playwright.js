'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.TOOLBOOK_BLANK_TEST_URL||'http://127.0.0.1:8099/laragon-local-entry.php';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1784,height:896}});
  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'Hashcod local entry must return 200');

    await page.waitForFunction(()=>document.querySelector('.toolbox-panel'),{timeout:15000});
    await page.waitForFunction(()=>document.documentElement.dataset.hashcodToolbookPageBlank==='true',{timeout:10000});
    await page.waitForSelector('#hashcodToolbookBlankPage',{state:'visible',timeout:5000});

    const state=await page.evaluate(()=>({
      childCount:document.body.children.length,
      blankId:document.body.firstElementChild&&document.body.firstElementChild.id,
      toolbox:document.querySelector('.toolbox-panel'),
      branched:document.getElementById('hashcodBranchedMenu'),
      text:(document.body.innerText||'').trim(),
      bg:getComputedStyle(document.getElementById('hashcodToolbookBlankPage')).backgroundColor,
      overflow:getComputedStyle(document.body).overflow
    }));

    assert.equal(state.childCount,1,'blank Toolbook page must be the only body child');
    assert.equal(state.blankId,'hashcodToolbookBlankPage','blank Toolbook root missing');
    assert.equal(state.toolbox,null,'4x4 Toolbook must be removed');
    assert.equal(state.branched,null,'BranchedMenu must be removed');
    assert.equal(state.text,'','blank Toolbook page must contain no text');
    assert(state.bg==='rgb(255, 255, 255)'||state.bg==='rgba(255, 255, 255, 1)','blank page must be white');
    assert.equal(state.overflow,'hidden','blank page must not scroll');

    console.log('✓ Toolbook page is completely blank');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
