'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const target=process.env.HASHCOD_FIRST_SCREEN_URL||'http://127.0.0.1:8097/';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const componentErrors=[];
  page.on('pageerror',error=>componentErrors.push('pageerror: '+error.message));
  page.on('console',msg=>{
    if(msg.type()==='error'&&/branched|react|hugeicon|referenceerror|typeerror/i.test(msg.text())){
      componentErrors.push('console.error: '+msg.text());
    }
  });

  try{
    let response=await page.goto(target,{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'root must return 200');

    await page.waitForSelector('#d5FirstBranchedMenuStage',{state:'visible',timeout:10000});
    await page.waitForFunction(()=>document.getElementById('d5FirstBranchedMenuMount')?.dataset.reactMounted==='true',{timeout:15000});
    await page.waitForSelector('.branched-menu',{state:'visible',timeout:5000});

    const state=await page.evaluate(()=>{
      const stage=document.getElementById('d5FirstBranchedMenuStage');
      const menu=document.querySelector('.branched-menu');
      const heads=Array.from(document.querySelectorAll('.branched-menu__head'));
      const active=document.querySelector('.branched-menu__item[aria-current="true"]');
      const firstItem=document.querySelector('.branched-menu__item');
      const icon=document.querySelector('.branched-menu__icon svg');
      const basePath=document.querySelector('.branched-menu__base');
      const stageStyle=getComputedStyle(stage);
      const menuStyle=getComputedStyle(menu);
      const itemStyle=getComputedStyle(firstItem);
      const headStyle=getComputedStyle(heads[0]);
      const activeStyle=getComputedStyle(active);
      const iconStyle=getComputedStyle(icon);
      const marker=document.querySelector('.branched-menu__marker');
      const markerStyle=getComputedStyle(marker);
      return {
        formerWindow:{
          accessCard:document.querySelector('.entry-access-card')!==null,
          enter:document.getElementById('d5Verify')!==null,
          revenue:document.getElementById('d5EntryStatCard')!==null
        },
        stage:{
          width:stage.getBoundingClientRect().width,
          background:stageStyle.backgroundColor,
          color:stageStyle.color,
          borderRadius:stageStyle.borderRadius,
          boxShadow:stageStyle.boxShadow
        },
        menu:{
          width:menu.getBoundingClientRect().width,
          display:menuStyle.display,
          paddingLeft:menuStyle.paddingLeft
        },
        heads:heads.map(h=>({label:h.textContent.trim(),expanded:h.getAttribute('aria-expanded')})),
        labels:Array.from(document.querySelectorAll('.branched-menu__label')).map(n=>n.textContent.trim()),
        active:active?.textContent.trim()||'',
        item:{
          display:itemStyle.display,
          height:itemStyle.height,
          borderTopWidth:itemStyle.borderTopWidth,
          background:itemStyle.backgroundColor,
          fontSize:itemStyle.fontSize,
          color:itemStyle.color
        },
        headColor:headStyle.color,
        activeColor:activeStyle.color,
        icon:{
          width:icon?iconStyle.width:'',
          height:icon?iconStyle.height:'',
          color:icon?iconStyle.color:''
        },
        svg:{
          fill:basePath?getComputedStyle(basePath).fill:'',
          stroke:basePath?getComputedStyle(basePath).stroke:'',
          strokeWidth:basePath?getComputedStyle(basePath).strokeWidth:''
        },
        markerBackground:markerStyle.backgroundColor,
        mounted:Boolean(window.HashcodFirstScreenBranchedMenu?.mounted),
        secondEntry:document.getElementById('hashcodEntryHold')!==null,
        toolbook:document.getElementById('hashcodToolbookBlankPage')!==null
      };
    });

    assert.deepEqual(componentErrors,[],'BranchedMenu must mount without component runtime errors');
    assert.deepEqual(state.formerWindow,{accessCard:false,enter:false,revenue:false},'old white access window must be completely gone');
    assert(Math.abs(state.stage.width-300)<=2,'BranchedMenu host width must be 300px');
    assert.equal(state.stage.background,'rgba(0, 0, 0, 0)','BranchedMenu host must be transparent with no black panel');
    assert.equal(state.stage.color,'rgb(10, 10, 10)','BranchedMenu host ink must be black');
    assert.equal(state.stage.borderRadius,'0px','replacement must not retain rounded window chrome');
    assert.equal(state.stage.boxShadow,'none','replacement must not retain window shadow');
    assert.equal(state.menu.display,'flex','BranchedMenu must use source flex layout');
    assert.equal(state.menu.paddingLeft,'14px','source rail offset must remain exact');
    assert(state.menu.width<=240.5,'BranchedMenu width prop must remain 240px');
    assert.deepEqual(state.heads,[{label:'Getting started',expanded:'true'},{label:'Components',expanded:'false'}],'defaultOpen={[0]} must remain exact');
    assert.deepEqual(state.labels,['Installation','Quick start','Configuration','Buttons','Overlays'],'menu labels must match the supplied usage exactly');
    assert.equal(state.active,'Quick start','defaultActive must remain quick');
    assert.equal(state.item.display,'flex','child row source layout changed');
    assert.equal(state.item.height,'36px','rowHeight=36 must remain exact');
    assert.equal(state.item.borderTopWidth,'0px','browser-default button border must not leak through');
    assert.equal(state.item.background,'rgba(0, 0, 0, 0)','source child rows must remain transparent');
    assert.equal(state.item.fontSize,'14px','fontSize=14 must remain exact');
    assert.equal(state.item.color,'rgb(10, 10, 10)','inactive child labels must be black');
    assert.equal(state.headColor,'rgb(10, 10, 10)','section labels must be black');
    assert.equal(state.activeColor,'rgb(10, 10, 10)','active label must be black');
    assert.equal(state.icon.width,'16px','Hugeicon width must be 16px');
    assert.equal(state.icon.height,'16px','Hugeicon height must be 16px');
    assert.equal(state.icon.color,'rgb(10, 10, 10)','Hugeicons must be black');
    assert.equal(state.svg.fill,'none','branch SVG must never render as filled polygons');
    assert.equal(state.svg.stroke,'rgb(10, 10, 10)','branch lines must be black');
    assert.equal(state.svg.strokeWidth,'1.5px','lineWidth=1.5 must remain exact');
    assert.equal(state.markerBackground,'rgb(10, 10, 10)','active rail marker must be black');
    assert.equal(state.mounted,true,'React island mount marker missing');
    assert.equal(state.secondEntry,false,'retired second screen must remain absent');
    assert.equal(state.toolbook,false,'retired Toolbook screen must remain absent');

    await page.getByRole('button',{name:'Components'}).click();
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.branched-menu__head')).find(n=>n.textContent.trim()==='Components')?.getAttribute('aria-expanded')==='true');
    await page.getByRole('button',{name:'Overlays'}).click();
    assert.equal(new URL(page.url()).hash,'#overlays','onSelect navigate(value) must update the selected destination');

    const selected=await page.locator('.branched-menu__item[aria-current="true"]').textContent();
    assert.equal(selected.trim(),'Overlays','selected item must become active');

    response=await page.goto(target+'?hashcod_enter=1',{waitUntil:'domcontentloaded',timeout:15000});
    assert(response&&response.status()===200,'legacy query must still return first screen');
    await page.waitForFunction(()=>document.getElementById('d5FirstBranchedMenuMount')?.dataset.reactMounted==='true',{timeout:15000});
    assert.equal(await page.locator('.branched-menu').count(),1,'legacy query must still show exactly one BranchedMenu');
    assert.equal(await page.locator('.entry-access-card').count(),0,'legacy query must not restore old window');

    console.log('✓ Exact React Bits BranchedMenu replaces the first-screen white window and is interactive');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
