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
      toolbox:document.querySelector('.toolbox-panel'),
      branched:document.getElementById('hashcodBranchedMenu'),
      text:(document.body.innerText||'').trim(),
      bg:getComputedStyle(document.getElementById('hashcodToolbookBlankPage')).backgroundColor,
      overflow:getComputedStyle(document.body).overflow,
      menu:document.getElementById('hashcodToolbookBranchedMenu') ? {
        left:document.getElementById('hashcodToolbookBranchedMenu').getBoundingClientRect().left,
        top:document.getElementById('hashcodToolbookBranchedMenu').getBoundingClientRect().top,
        width:document.getElementById('hashcodToolbookBranchedMenu').getBoundingClientRect().width,
        active:document.querySelector('.hashcod-bm-child[aria-current="page"]')?.dataset.value||'',
        firstOpen:document.querySelector('.hashcod-bm-group[data-group-index="0"]')?.dataset.open||'',
        secondOpen:document.querySelector('.hashcod-bm-group[data-group-index="1"]')?.dataset.open||''
      } : null
    }));

    assert.equal(state.childCount,1,'blank Toolbook page must remain the only body child');
    assert.equal(state.blankId,'hashcodToolbookBlankPage','blank Toolbook root missing');
    assert.equal(state.toolbox,null,'legacy 4x4 Toolbook must stay removed');
    assert(state.bg==='rgb(255, 255, 255)'||state.bg==='rgba(255, 255, 255, 1)','workspace must remain white');
    assert.equal(state.overflow,'hidden','workspace must not scroll');
    assert(state.menu,'BranchedMenu must exist inside the blank workspace');
    assert(Math.abs(state.menu.left-32)<=2,'BranchedMenu must stay on the left side');
    assert(Math.abs(state.menu.top-120)<=2,'BranchedMenu top placement must be 120px');
    assert(Math.abs(state.menu.width-240)<=2,'BranchedMenu width must be 240px');
    assert.equal(state.menu.active,'quick','Quick start must be active by default');
    assert.equal(state.menu.firstOpen,'true','Getting started must be open by default');
    assert.equal(state.menu.secondOpen,'false','Components must be folded by default');

    const eventPromise=page.evaluate(()=>new Promise(resolve=>{
      window.addEventListener('hashcod:branched-menu-select',event=>resolve(event.detail),{once:true});
    }));

    await page.locator('.hashcod-bm-group[data-group-index="1"] .hashcod-bm-parent').click();
    await page.waitForFunction(()=>document.querySelector('.hashcod-bm-group[data-group-index="1"]')?.dataset.open==='true');
    await page.locator('.hashcod-bm-child[data-value="overlays"]').click();

    const detail=await eventPromise;
    assert.equal(detail.value,'overlays','selection event must expose overlays');

    const after=await page.evaluate(()=>({
      active:window.HashcodBranchedMenu.getActive(),
      open:window.HashcodBranchedMenu.getOpen(),
      hash:location.hash,
      current:document.querySelector('.hashcod-bm-child[aria-current="page"]')?.dataset.value||''
    }));
    assert.equal(after.active,'overlays','public API must update active item');
    assert.equal(after.current,'overlays','ARIA active state must update');
    assert(after.open.includes(1),'Components must remain open after selection');
    assert.equal(after.hash,'#overlays','default navigate must update location hash');

    console.log('✓ Blank Toolbook workspace shows only the functional BranchedMenu');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
