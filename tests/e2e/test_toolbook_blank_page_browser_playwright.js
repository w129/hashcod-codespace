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

    await page.waitForFunction(()=>window.__hashcodToolbookPageResetLoaded===true,{timeout:15000});

    await page.evaluate(()=>{
      const panel=document.createElement('section');
      panel.className='toolbox-panel';
      Object.assign(panel.style,{
        position:'fixed',
        left:'320px',
        top:'140px',
        width:'960px',
        height:'784px',
        display:'block',
        visibility:'visible',
        opacity:'1'
      });
      document.body.appendChild(panel);
    });

    await page.waitForFunction(()=>document.documentElement.dataset.hashcodToolbookPageBlank==='true',{timeout:10000});
    await page.waitForSelector('#hashcodToolbookBlankPage',{state:'visible',timeout:5000});

    const state=await page.evaluate(()=>({
      childCount:document.body.children.length,
      blankId:document.body.firstElementChild&&document.body.firstElementChild.id,
      blankChildren:document.getElementById('hashcodToolbookBlankPage')?.children.length??-1,
      branchedMenus:document.querySelectorAll('.branched-menu').length,
      branchedPanels:document.querySelectorAll('#hashcodToolbookBranchedMenuPanel').length,
      branchedMounts:document.querySelectorAll('#hashcodToolbookBranchedMenuMount').length,
      text:(document.body.innerText||'').trim(),
      bg:getComputedStyle(document.getElementById('hashcodToolbookBlankPage')).backgroundColor,
      overflow:getComputedStyle(document.body).overflow,
      emptyFlag:window.HashcodToolbookBlankPage?.empty===true
    }));

    assert.equal(state.childCount,1,'blank Toolbook page must be the only body child');
    assert.equal(state.blankId,'hashcodToolbookBlankPage','blank Toolbook root missing');
    assert.equal(state.blankChildren,0,'blank Toolbook root must contain no UI');
    assert.equal(state.branchedMenus,0,'BranchedMenu must not render on the cleaned screen');
    assert.equal(state.branchedPanels,0,'old BranchedMenu panel must be removed');
    assert.equal(state.branchedMounts,0,'old React mount point must be removed');
    assert.equal(state.text,'','cleaned Toolbook screen must contain no visible text');
    assert(state.bg==='rgb(255, 255, 255)'||state.bg==='rgba(255, 255, 255, 1)','workspace must remain white');
    assert.equal(state.overflow,'hidden','workspace must not scroll');
    assert.equal(state.emptyFlag,true,'blank-screen runtime marker must report empty=true');

    console.log('✓ Toolbook screen is completely blank and contains no saved BranchedMenu UI');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
