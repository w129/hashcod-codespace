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
      panel:document.getElementById('hashcodToolbookBranchedMenuPanel') ? {
        left:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().left,
        top:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().top,
        width:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().width,
        bg:getComputedStyle(document.getElementById('hashcodToolbookBranchedMenuPanel')).backgroundColor
      } : null,
      menu:document.getElementById('hashcodToolbookBranchedMenu') ? {
        width:document.getElementById('hashcodToolbookBranchedMenu').getBoundingClientRect().width,
        active:document.querySelector('.branched-menu__item[aria-current="true"]')?.dataset.value||'',
        firstOpen:document.querySelector('.branched-menu__section[data-group-index="0"]')?.hasAttribute('data-open')||false,
        secondOpen:document.querySelector('.branched-menu__section[data-group-index="1"]')?.hasAttribute('data-open')||false,
        labels:Array.from(document.querySelectorAll('.branched-menu__label')).map(n=>n.textContent.trim()),
        basePaths:document.querySelectorAll('.branched-menu__base').length,
        reachPaths:document.querySelectorAll('.branched-menu__reach').length,
        markerOn:document.querySelector('.branched-menu__marker')?.hasAttribute('data-on')||false
      } : null
    }));

    assert.equal(state.childCount,1,'blank Toolbook page must remain the only body child');
    assert.equal(state.blankId,'hashcodToolbookBlankPage','blank Toolbook root missing');
    assert.equal(state.toolbox,null,'legacy 4x4 Toolbook must stay removed');
    assert(state.bg==='rgb(255, 255, 255)'||state.bg==='rgba(255, 255, 255, 1)','workspace must remain white');
    assert.equal(state.overflow,'hidden','workspace must not scroll');
    assert(state.panel,'dark reference panel must exist');
    assert(Math.abs(state.panel.left-32)<=2,'reference panel must stay on the left side');
    assert(Math.abs(state.panel.top-96)<=2,'reference panel top placement must be 96px');
    assert(Math.abs(state.panel.width-300)<=2,'reference panel width must be 300px');
    assert(state.panel.bg==='rgb(16, 14, 21)'||state.panel.bg==='rgba(16, 14, 21, 1)','reference panel must use the dark background');
    assert(state.menu,'BranchedMenu must exist inside the blank workspace');
    assert(state.menu.width<=240.5,'BranchedMenu must respect width=240');
    assert.equal(state.menu.active,'quick','Quick start must be active by default');
    assert.equal(state.menu.firstOpen,true,'Getting started must be open');
    assert.equal(state.menu.secondOpen,true,'Components must be open to match the reference');
    assert.deepEqual(state.menu.labels,['Installation','Quick start','Configuration','Theming','Buttons','Typography','Overlays','Toasts'],'reference item order must match');
    assert.equal(state.menu.basePaths,10,'SVG base tree paths must be rendered for both groups');
    assert.equal(state.menu.reachPaths,8,'SVG active reach paths must be rendered for all items');
    assert.equal(state.menu.markerOn,true,'active section marker must be visible');

    const eventPromise=page.evaluate(()=>new Promise(resolve=>{
      window.addEventListener('hashcod:branched-menu-select',event=>resolve(event.detail),{once:true});
    }));

    await page.locator('.branched-menu__item[data-value="overlays"]').click();

    const detail=await eventPromise;
    assert.equal(detail.value,'overlays','selection event must expose overlays');

    const after=await page.evaluate(()=>({
      active:window.HashcodBranchedMenu.getActive(),
      open:window.HashcodBranchedMenu.getOpen(),
      hash:location.hash,
      current:document.querySelector('.branched-menu__item[aria-current="true"]')?.dataset.value||''
    }));
    assert.equal(after.active,'overlays','public API must update active item');
    assert.equal(after.current,'overlays','ARIA active state must update');
    assert(after.open.includes(0)&&after.open.includes(1),'both sections must remain open after selection');
    assert.equal(after.hash,'#overlays','default navigate must update location hash');

    console.log('✓ Blank Toolbook workspace matches the supplied BranchedMenu reference');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
