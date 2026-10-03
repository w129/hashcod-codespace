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
      const faqItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='FAQ');
      const faqIcon=faqItem?.querySelector('svg');
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
        faq:{
          exists:Boolean(faqItem),
          width:faqIcon?getComputedStyle(faqIcon).width:'',
          height:faqIcon?getComputedStyle(faqIcon).height:'',
          fill:faqIcon?getComputedStyle(faqIcon).fill:'',
          viewBox:faqIcon?.getAttribute('viewBox')||''
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
    assert.deepEqual(state.labels,['FAQ','Quick start','Configuration','Buttons','Overlays'],'menu labels must match the supplied usage exactly');
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
    assert.equal(state.icon.color,'rgb(10, 10, 10)','menu icons must be black');
    assert.equal(state.faq.exists,true,'FAQ must be the first menu item');
    assert.equal(state.faq.width,'16px','FAQ SVG width must be adapted to 16px');
    assert.equal(state.faq.height,'16px','FAQ SVG height must be adapted to 16px');
    assert.equal(state.faq.fill,'rgb(10, 10, 10)','FAQ SVG must inherit black menu ink');
    assert.equal(state.faq.viewBox,'0 0 48 48','FAQ SVG must preserve the supplied viewBox');
    assert.equal(state.svg.fill,'none','branch SVG must never render as filled polygons');
    assert.equal(state.svg.stroke,'rgb(10, 10, 10)','branch lines must be black');
    assert.equal(state.svg.strokeWidth,'1.5px','lineWidth=1.5 must remain exact');
    assert.equal(state.markerBackground,'rgb(10, 10, 10)','active rail marker must be black');
    assert.equal(state.mounted,true,'React island mount marker missing');
    assert.equal(state.secondEntry,false,'retired second screen must remain absent');
    assert.equal(state.toolbook,false,'retired Toolbook screen must remain absent');

    assert.equal(await page.locator('#d5FaqCard').isVisible(),false,'FAQ card must stay hidden until the menu item is selected');
    assert.equal(await page.locator('#d5FaqModalBackdrop').isVisible(),false,'FAQ backdrop must stay hidden initially');

    await page.getByRole('button',{name:'FAQ'}).click();
    assert.equal(new URL(page.url()).hash,'#faq','FAQ selection must navigate to #faq');
    await page.waitForSelector('#d5FaqCard',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5FaqModalBackdrop',{state:'visible',timeout:5000});

    const modalState=await page.evaluate(()=>{
      const card=document.getElementById('d5FaqCard');
      const backdrop=document.getElementById('d5FaqModalBackdrop');
      const close=document.getElementById('d5FaqClose');
      const rect=card.getBoundingClientRect();
      const backdropStyle=getComputedStyle(backdrop);
      return {
        bodyOpen:document.body.classList.contains('faq-modal-open'),
        ariaHidden:card.getAttribute('aria-hidden'),
        role:card.getAttribute('role'),
        ariaModal:card.getAttribute('aria-modal'),
        centerX:rect.left+rect.width/2,
        centerY:rect.top+rect.height/2,
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        backdropFilter:backdropStyle.backdropFilter||backdropStyle.webkitBackdropFilter||'',
        closeFocused:document.activeElement===close
      };
    });
    assert.equal(modalState.bodyOpen,true,'FAQ open state class must be applied');
    assert.equal(modalState.ariaHidden,'false','FAQ dialog must be exposed while open');
    assert.equal(modalState.role,'dialog','FAQ must use dialog semantics');
    assert.equal(modalState.ariaModal,'true','FAQ must be modal');
    assert(Math.abs(modalState.centerX-modalState.viewportX)<=2,'FAQ dialog must be horizontally centered');
    assert(Math.abs(modalState.centerY-modalState.viewportY)<=2,'FAQ dialog must be vertically centered');
    assert(modalState.backdropFilter.includes('blur(12px)'),'FAQ backdrop must blur the page behind it');
    assert.equal(modalState.closeFocused,true,'FAQ close control must receive focus');

    await page.locator('#d5FaqClose').click();
    await page.waitForSelector('#d5FaqCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','close button must clear the FAQ hash');

    await page.getByRole('button',{name:'FAQ'}).click();
    await page.waitForSelector('#d5FaqModalBackdrop',{state:'visible',timeout:5000});
    await page.locator('#d5FaqModalBackdrop').click({position:{x:5,y:5}});
    await page.waitForSelector('#d5FaqCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','clicking outside the FAQ must close it');

    await page.getByRole('button',{name:'FAQ'}).click();
    await page.waitForSelector('#d5FaqCard',{state:'visible',timeout:5000});
    await page.keyboard.press('Escape');
    await page.waitForSelector('#d5FaqCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','Escape must close the FAQ modal');

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

    console.log('✓ FAQ opens centered with blurred backdrop and all close interactions work');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
