'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.TOOLBOOK_BLANK_TEST_URL||'http://127.0.0.1:8099/laragon-local-entry.php';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1784,height:896}});
  const browserErrors=[];
  page.on('pageerror',error=>browserErrors.push('pageerror: '+error.message));
  page.on('console',msg=>{
    if(msg.type()==='error')browserErrors.push('console.error: '+msg.text());
  });
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
    await page.waitForFunction(()=>document.querySelector('#hashcodToolbookBranchedMenuMount')?.dataset.hashcodReactBranchedMenuMounted==='true',{timeout:15000});
    try{
      await page.waitForSelector('.branched-menu',{state:'visible',timeout:5000});
    }catch(error){
      const debug=await page.evaluate(()=>({
        mount:document.getElementById('hashcodToolbookBranchedMenuMount')?.outerHTML||'',
        reactMarker:window.HashcodBranchedMenuReact||null,
        body:document.body.innerHTML.slice(0,2400)
      }));
      console.error('React BranchedMenu debug:',JSON.stringify({browserErrors,debug},null,2));
      throw error;
    }

    const state=await page.evaluate(()=>({
      childCount:document.body.children.length,
      blankId:document.body.firstElementChild&&document.body.firstElementChild.id,
      toolbox:document.querySelector('.toolbox-panel'),
      mount:document.getElementById('hashcodToolbookBranchedMenuMount')?.dataset.hashcodReactBranchedMenuMounted||'',
      text:(document.body.innerText||'').trim(),
      bg:getComputedStyle(document.getElementById('hashcodToolbookBlankPage')).backgroundColor,
      overflow:getComputedStyle(document.body).overflow,
      panel:document.getElementById('hashcodToolbookBranchedMenuPanel') ? {
        left:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().left,
        top:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().top,
        width:document.getElementById('hashcodToolbookBranchedMenuPanel').getBoundingClientRect().width,
        bg:getComputedStyle(document.getElementById('hashcodToolbookBranchedMenuPanel')).backgroundColor
      } : null,
      menu:document.querySelector('.branched-menu') ? {
        width:document.querySelector('.branched-menu').getBoundingClientRect().width,
        active:document.querySelector('.branched-menu__item[aria-current="true"]')?.textContent.trim()||'',
        heads:Array.from(document.querySelectorAll('.branched-menu__head')).map(n=>({
          label:n.textContent.trim(),
          expanded:n.getAttribute('aria-expanded')
        })),
        labels:Array.from(document.querySelectorAll('.branched-menu__label')).map(n=>n.textContent.trim()),
        basePaths:document.querySelectorAll('.branched-menu__base').length,
        reachPaths:document.querySelectorAll('.branched-menu__reach').length,
        markerOn:document.querySelector('.branched-menu__marker')?.hasAttribute('data-on')||false,
        iconCount:document.querySelectorAll('.branched-menu__icon svg').length
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
    assert.equal(state.mount,'true','React BranchedMenu must mount into the Toolbook mount point');
    assert(state.menu,'real React BranchedMenu must exist inside the blank workspace');
    assert(state.menu.width<=240.5,'BranchedMenu must respect width=240');
    assert.equal(state.menu.active,'Quick start','Quick start must be active by default');
    assert.deepEqual(state.menu.heads,[{label:'Getting started',expanded:'true'},{label:'Components',expanded:'false'}],'defaultOpen={[0]} must match the usage example');
    assert.deepEqual(state.menu.labels,['Installation','Quick start','Configuration','Buttons','Overlays'],'usage-example item order must match exactly');
    assert.equal(state.menu.basePaths,7,'React component must render one trunk + branch paths for both groups');
    assert.equal(state.menu.reachPaths,5,'React component must render one animated reach per child');
    assert.equal(state.menu.markerOn,true,'active section marker must be visible');
    assert.equal(state.menu.iconCount,3,'usage example must use the three requested Hugeicons');

    const eventPromise=page.evaluate(()=>new Promise(resolve=>{
      window.addEventListener('hashcod:branched-menu-select',event=>resolve(event.detail),{once:true});
    }));

    await page.getByRole('button',{name:'Components'}).click();
    await page.getByRole('button',{name:'Overlays'}).click();

    const detail=await eventPromise;
    assert.equal(detail.value,'overlays','selection event must expose overlays');

    const after=await page.evaluate(()=>({
      mounted:Boolean(window.HashcodBranchedMenuReact?.mounted),
      hash:location.hash,
      current:document.querySelector('.branched-menu__item[aria-current="true"]')?.textContent.trim()||'',
      componentsExpanded:Array.from(document.querySelectorAll('.branched-menu__head')).find(n=>n.textContent.trim()==='Components')?.getAttribute('aria-expanded')
    }));
    assert.equal(after.mounted,true,'React island runtime marker must be present');
    assert.equal(after.current,'Overlays','React active state must update');
    assert.equal(after.componentsExpanded,'true','Components must unfold when its header is clicked');
    assert.equal(after.hash,'#overlays','onSelect navigate behavior must update location hash');

    console.log('✓ Exact React BranchedMenu usage example is mounted and functional');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
