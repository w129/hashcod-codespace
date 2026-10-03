'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.BRANCHED_MENU_TEST_URL||'http://127.0.0.1:8099/laragon-local-entry.php';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1852,height:927}});
  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'Hashcod UI must return HTTP 200');

    await page.waitForFunction(()=>document.querySelector('.toolbox-panel'),{timeout:15000});
    await page.waitForFunction(()=>window.HashcodBranchedMenu&&document.getElementById('hashcodBranchedMenu'),{timeout:15000});
    await page.waitForFunction(()=>{
      const menu=document.getElementById('hashcodBranchedMenu');
      return menu&&!menu.hidden&&getComputedStyle(menu).display!=='none'&&menu.getAttribute('data-hashcod-toolbox-anchor')==='true';
    },{timeout:10000});

    const initial=await page.evaluate(()=>{
      const menu=document.getElementById('hashcodBranchedMenu');
      const rect=menu.getBoundingClientRect();
      const first=document.querySelector('.hashcod-branched-group[data-group-index="0"]');
      const second=document.querySelector('.hashcod-branched-group[data-group-index="1"]');
      const active=document.querySelector('.hashcod-branched-child[aria-current="page"]');
      const toolbox=document.querySelector('.toolbox-panel').getBoundingClientRect();
      return {
        left:rect.left,
        right:rect.right,
        width:rect.width,
        top:rect.top,
        toolboxLeft:toolbox.left,
        toolboxTop:toolbox.top,
        firstOpen:first&&first.dataset.open,
        secondOpen:second&&second.dataset.open,
        active:active&&active.dataset.value,
        apiActive:window.HashcodBranchedMenu.getActive()
      };
    });

    assert(Math.abs(initial.width-240)<=2,'BranchedMenu width must be 240px');
    assert(initial.right<=initial.toolboxLeft-12,'BranchedMenu must remain to the left of the Toolbook');
    assert(Math.abs(initial.top-(initial.toolboxTop+8))<=3,'BranchedMenu must align vertically with the Toolbook surface');
    assert.equal(initial.firstOpen,'true','Getting started must be open by default');
    assert.equal(initial.secondOpen,'false','Components must be folded by default');
    assert.equal(initial.active,'quick','Quick start must be active by default');
    assert.equal(initial.apiActive,'quick','public API active state must start at quick');

    const selectEvent=page.evaluate(()=>new Promise(resolve=>{
      window.addEventListener('hashcod:branched-menu-select',event=>resolve(event.detail),{once:true});
    }));

    const componentsParent=page.locator('.hashcod-branched-group[data-group-index="1"] .hashcod-branched-parent');
    await componentsParent.click();
    await page.waitForFunction(()=>document.querySelector('.hashcod-branched-group[data-group-index="1"]')?.dataset.open==='true');

    await page.locator('.hashcod-branched-child[data-value="overlays"]').click();
    const detail=await selectEvent;
    assert.equal(detail.value,'overlays','selection event must expose selected value');

    const after=await page.evaluate(()=>({
      active:window.HashcodBranchedMenu.getActive(),
      hash:location.hash,
      current:document.querySelector('.hashcod-branched-child[aria-current="page"]')?.dataset.value||''
    }));
    assert.equal(after.active,'overlays','public API must update selected item');
    assert.equal(after.current,'overlays','ARIA active state must update selected item');
    assert.equal(after.hash,'#overlays','default navigate must update location hash');

    await page.setViewportSize({width:620,height:850});
    await page.waitForTimeout(200);
    const mobile=await page.evaluate(()=>{
      const r=document.getElementById('hashcodBranchedMenu').getBoundingClientRect();
      return {left:r.left,right:r.right,width:r.width,viewport:innerWidth};
    });
    assert(mobile.left>=12,'mobile menu must retain left breathing room');
    assert(mobile.right<=mobile.viewport-12,'mobile menu must fit inside viewport');

    console.log('✓ Platform BranchedMenu browser interaction verified');
  } finally {
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
