'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.TOOLBOOK_MENU_TEST_URL||'http://127.0.0.1:8099/laragon-local-entry.php';

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

    // Trigger the same blank Toolbook transition used by the real screen.
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
    await page.waitForSelector('#hashcodToolbookBranchedMenuMount',{state:'attached',timeout:5000});
    await page.waitForFunction(()=>document.querySelector('#hashcodToolbookBranchedMenuMount')?.dataset.hashcodReactBranchedMenuMounted==='true',{timeout:15000});
    await page.waitForSelector('.branched-menu',{state:'visible',timeout:5000});

    assert.deepEqual(browserErrors,[],'React BranchedMenu must mount without browser/runtime errors');

    const state=await page.evaluate(()=>{
      const workspace=document.getElementById('hashcodToolbookBlankPage');
      const panel=document.getElementById('hashcodToolbookBranchedMenuPanel');
      const menu=document.querySelector('.branched-menu');
      const firstHead=document.querySelectorAll('.branched-menu__head')[0];
      const secondHead=document.querySelectorAll('.branched-menu__head')[1];
      const active=document.querySelector('.branched-menu__item[aria-current="true"]');
      const firstItem=document.querySelector('.branched-menu__item');
      const firstIcon=document.querySelector('.branched-menu__icon svg');
      const basePath=document.querySelector('.branched-menu__base');

      const panelStyle=getComputedStyle(panel);
      const menuStyle=getComputedStyle(menu);
      const headStyle=getComputedStyle(firstHead);
      const itemStyle=getComputedStyle(firstItem);
      const iconStyle=getComputedStyle(firstIcon);

      return {
        bodyChildren:document.body.children.length,
        workspaceChildren:workspace.children.length,
        panel:{
          left:panel.getBoundingClientRect().left,
          top:panel.getBoundingClientRect().top,
          width:panel.getBoundingClientRect().width,
          background:panelStyle.backgroundColor,
          color:panelStyle.color
        },
        menu:{
          width:menu.getBoundingClientRect().width,
          display:menuStyle.display,
          paddingLeft:menuStyle.paddingLeft,
          color:menuStyle.color
        },
        heads:[
          {label:firstHead.textContent.trim(),expanded:firstHead.getAttribute('aria-expanded')},
          {label:secondHead.textContent.trim(),expanded:secondHead.getAttribute('aria-expanded')}
        ],
        active:active?.textContent.trim()||'',
        labels:Array.from(document.querySelectorAll('.branched-menu__label')).map(n=>n.textContent.trim()),
        headStyle:{
          display:headStyle.display,
          background:headStyle.backgroundColor,
          borderTopWidth:headStyle.borderTopWidth,
          fontSize:headStyle.fontSize
        },
        itemStyle:{
          display:itemStyle.display,
          height:itemStyle.height,
          background:itemStyle.backgroundColor,
          borderTopWidth:itemStyle.borderTopWidth,
          fontSize:itemStyle.fontSize
        },
        icon:{
          width:iconStyle.width,
          height:iconStyle.height
        },
        paths:{
          base:document.querySelectorAll('.branched-menu__base').length,
          reach:document.querySelectorAll('.branched-menu__reach').length,
          fill:getComputedStyle(basePath).fill,
          strokeWidth:getComputedStyle(basePath).strokeWidth
        },
        markerOn:document.querySelector('.branched-menu__marker')?.hasAttribute('data-on')||false,
        mounted:Boolean(window.HashcodBranchedMenuReact?.mounted),
        workspaceFlag:Boolean(window.HashcodToolbookBlankPage?.reactMount)
      };
    });

    assert.equal(state.bodyChildren,1,'Toolbook reset must leave a single workspace root');
    assert.equal(state.workspaceChildren,1,'workspace must contain only the BranchedMenu panel');
    assert(Math.abs(state.panel.left-32)<=2,'BranchedMenu panel must sit at the requested left position');
    assert(Math.abs(state.panel.top-96)<=2,'BranchedMenu panel must sit at the requested top position');
    assert(Math.abs(state.panel.width-300)<=2,'BranchedMenu host panel must be 300px wide');
    assert.equal(state.panel.background,'rgb(16, 14, 21)','BranchedMenu host must use the dark reference background');
    assert.equal(state.menu.display,'flex','BranchedMenu must use the supplied flex-column layout');
    assert.equal(state.menu.paddingLeft,'14px','BranchedMenu rail offset must match source CSS');
    assert(state.menu.width<=240.5,'BranchedMenu must respect width=240');
    assert.deepEqual(state.heads,[{label:'Getting started',expanded:'true'},{label:'Components',expanded:'false'}],'defaultOpen={[0]} must be respected');
    assert.equal(state.active,'Quick start','Quick start must be active by default');
    assert.deepEqual(state.labels,['Installation','Quick start','Configuration','Buttons','Overlays'],'usage example items must match exactly');
    assert.equal(state.headStyle.display,'block','headers must be source-styled, not browser-default buttons');
    assert.equal(state.headStyle.background,'rgba(0, 0, 0, 0)','headers must have transparent background');
    assert.equal(state.headStyle.borderTopWidth,'0px','headers must have no default button border');
    assert.equal(state.headStyle.fontSize,'15px','headers must be fontSize + 1px');
    assert.equal(state.itemStyle.display,'flex','child rows must use flex layout');
    assert.equal(state.itemStyle.height,'36px','child rows must respect rowHeight=36');
    assert.equal(state.itemStyle.background,'rgba(0, 0, 0, 0)','child rows must have transparent background');
    assert.equal(state.itemStyle.borderTopWidth,'0px','child rows must have no default button border');
    assert.equal(state.itemStyle.fontSize,'14px','child rows must respect fontSize=14');
    assert.equal(state.icon.width,'16px','Hugeicons must render at 16px');
    assert.equal(state.icon.height,'16px','Hugeicons must render at 16px');
    assert.equal(state.paths.base,7,'usage example must render expected trunk/branch base paths');
    assert.equal(state.paths.reach,5,'usage example must render one reach path per child');
    assert.equal(state.paths.fill,'none','SVG branches must not become filled black polygons');
    assert.equal(state.paths.strokeWidth,'1.5px','SVG branches must respect lineWidth=1.5');
    assert.equal(state.markerOn,true,'active section marker must be visible');
    assert.equal(state.mounted,true,'React island marker must be present');
    assert.equal(state.workspaceFlag,true,'Toolbook runtime must report a React mount');

    const eventPromise=page.evaluate(()=>new Promise(resolve=>{
      window.addEventListener('hashcod:branched-menu-select',event=>resolve(event.detail),{once:true});
    }));

    await page.getByRole('button',{name:'Components'}).click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.branched-menu__head')).find(n=>n.textContent.trim()==='Components')?.getAttribute('aria-expanded')==='true');
    await page.getByRole('button',{name:'Overlays'}).click();

    const detail=await eventPromise;
    assert.equal(detail.value,'overlays','onSelect must expose the selected value');

    const after=await page.evaluate(()=>({
      current:document.querySelector('.branched-menu__item[aria-current="true"]')?.textContent.trim()||'',
      hash:location.hash,
      componentsExpanded:Array.from(document.querySelectorAll('.branched-menu__head')).find(n=>n.textContent.trim()==='Components')?.getAttribute('aria-expanded')
    }));
    assert.equal(after.current,'Overlays','selected row must become active');
    assert.equal(after.hash,'#overlays','default navigate behavior must update location hash');
    assert.equal(after.componentsExpanded,'true','Components section must remain open after selection');

    console.log('✓ React BranchedMenu is mounted, styled exactly, and interactive');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
