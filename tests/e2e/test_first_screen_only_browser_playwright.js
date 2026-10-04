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
    await page.waitForFunction(()=>document.getElementById('d5CenterEmptyStateMount')?.dataset.reactMounted==='true',{timeout:15000});
    await page.waitForSelector('#d5CenterEmptyStateAction',{state:'visible',timeout:5000});
    await page.waitForFunction(()=>window.HashcodAnimateCursor?.mounted===true,{timeout:5000});
    await page.waitForSelector('#d5AnimateCursor',{state:'attached',timeout:5000});
    await page.waitForSelector('#d5AnimateCursorFollow',{state:'attached',timeout:5000});
    await page.waitForFunction(()=>document.querySelector('#d5AnimateCursorFollow img')?.complete===true&&document.querySelector('#d5AnimateCursorFollow img')?.naturalWidth>0,{timeout:5000});
    await page.mouse.move(700,450);
    await page.waitForTimeout(500);

    const cursorState=await page.evaluate(()=>{
      const cursor=document.getElementById('d5AnimateCursor');
      const follow=document.getElementById('d5AnimateCursorFollow');
      const action=document.getElementById('d5CenterEmptyStateAction');
      const cursorRect=cursor.getBoundingClientRect();
      const followRect=follow.getBoundingClientRect();
      return {
        smokeHost:Boolean(document.getElementById('d5SplashCursorBackground')),
        smokeCanvas:Boolean(document.getElementById('d5SplashCursorCanvas')),
        rootActive:document.documentElement.classList.contains('hashcod-animate-cursor-active'),
        mounted:Boolean(window.HashcodAnimateCursor?.mounted),
        global:window.HashcodAnimateCursor?.global===true,
        side:window.HashcodAnimateCursor?.side||'',
        sideOffset:window.HashcodAnimateCursor?.sideOffset,
        align:window.HashcodAnimateCursor?.align||'',
        alignOffset:window.HashcodAnimateCursor?.alignOffset,
        followText:follow.textContent.trim(),
        followImageSrc:follow.querySelector('img')?.getAttribute('src')||'',
        followImageNaturalWidth:follow.querySelector('img')?.naturalWidth||0,
        followImageNaturalHeight:follow.querySelector('img')?.naturalHeight||0,
        cursorOpacity:getComputedStyle(cursor).opacity,
        followOpacity:getComputedStyle(follow).opacity,
        nativeCursor:getComputedStyle(action).cursor,
        cursorCenterX:cursorRect.left+(cursorRect.width/2),
        cursorCenterY:cursorRect.top+(cursorRect.height/2),
        followCenterX:followRect.left+(followRect.width/2),
        followCenterY:followRect.top+(followRect.height/2)
      };
    });

    assert.equal(cursorState.smokeHost,false,'retired smoke cursor host must not exist');
    assert.equal(cursorState.smokeCanvas,false,'retired WebGL smoke canvas must not exist');
    assert.equal(cursorState.rootActive,true,'Animate UI cursor must activate globally on desktop');
    assert.equal(cursorState.mounted,true,'Animate UI cursor runtime must mount');
    assert.equal(cursorState.global,true,'Animate UI cursor must run in global mode');
    assert.equal(cursorState.side,'bottom','CursorFollow side must be bottom');
    assert.equal(cursorState.sideOffset,15,'CursorFollow sideOffset must be 15');
    assert.equal(cursorState.align,'end','CursorFollow align must be end');
    assert.equal(cursorState.alignOffset,5,'CursorFollow alignOffset must be 5');
    assert.equal(cursorState.followText,'','CursorFollow must not render Designer text');
    assert(cursorState.followImageSrc.endsWith('/components/dominican-cursor-follow.svg'),'CursorFollow must load the supplied Dominican flag SVG');
    assert(cursorState.followImageNaturalWidth>0&&cursorState.followImageNaturalHeight>0,'Dominican CursorFollow icon must load successfully');
    assert.equal(cursorState.cursorOpacity,'1','custom cursor must be visible after mouse movement');
    assert.equal(cursorState.followOpacity,'1','CursorFollow must be visible after mouse movement');
    assert.equal(cursorState.nativeCursor,'none','native cursor must be hidden across the platform');
    assert(Math.abs(cursorState.cursorCenterX-700)<=2,'custom cursor must follow pointer X directly');
    assert(Math.abs(cursorState.cursorCenterY-450)<=2,'custom cursor must follow pointer Y directly');
    assert(Math.abs(cursorState.followCenterX-717)<=10,'end-aligned CursorFollow must settle near pointer X + alignOffset + cursor half-width');
    assert(Math.abs(cursorState.followCenterY-477)<=10,'bottom CursorFollow must settle near pointer Y + sideOffset + cursor half-height');

    const state=await page.evaluate(()=>{
      const stage=document.getElementById('d5FirstBranchedMenuStage');
      const menu=document.querySelector('.branched-menu');
      const heads=Array.from(document.querySelectorAll('.branched-menu__head'));
      const active=document.querySelector('.branched-menu__item[aria-current="true"]');
      const firstItem=document.querySelector('.branched-menu__item');
      const icon=document.querySelector('.branched-menu__icon svg');
      const faqItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='FAQ');
      const faqIcon=faqItem?.querySelector('svg');
      const cardItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='Card');
      const cardIcon=cardItem?.querySelector('svg');
      const workspaceItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='Workspace');
      const workspaceIcon=workspaceItem?.querySelector('svg');
      const textCardItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='Text Card');
      const textCardIcon=textCardItem?.querySelector('svg');
      const documentsItem=Array.from(document.querySelectorAll('.branched-menu__item')).find(n=>n.textContent.trim()==='Documents');
      const documentsIcon=documentsItem?.querySelector('svg');
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
        removedCards:{
          tilt:document.getElementById('d5TiltCardDemo')!==null,
          savedChat:document.getElementById('d5SavedChatDemo')!==null,
          tiltText:(document.body.innerText||'').includes('Current price to purchase a slot'),
          savedText:(document.body.innerText||'').includes('Saved Messages')
        },
        stage:{
          width:stage.getBoundingClientRect().width,
          left:stage.getBoundingClientRect().left,
          top:stage.getBoundingClientRect().top,
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
        cardMenu:{
          exists:Boolean(cardItem),
          width:cardIcon?getComputedStyle(cardIcon).width:'',
          height:cardIcon?getComputedStyle(cardIcon).height:'',
          fill:cardIcon?getComputedStyle(cardIcon).fill:'',
          viewBox:cardIcon?.getAttribute('viewBox')||''
        },
        workspaceMenu:{
          exists:Boolean(workspaceItem),
          width:workspaceIcon?getComputedStyle(workspaceIcon).width:'',
          height:workspaceIcon?getComputedStyle(workspaceIcon).height:'',
          fill:workspaceIcon?getComputedStyle(workspaceIcon).fill:'',
          viewBox:workspaceIcon?.getAttribute('viewBox')||''
        },
        textCardMenu:{
          exists:Boolean(textCardItem),
          width:textCardIcon?getComputedStyle(textCardIcon).width:'',
          height:textCardIcon?getComputedStyle(textCardIcon).height:'',
          fill:textCardIcon?getComputedStyle(textCardIcon).fill:'',
          viewBox:textCardIcon?.getAttribute('viewBox')||''
        },
        documentsMenu:{
          exists:Boolean(documentsItem),
          width:documentsIcon?getComputedStyle(documentsIcon).width:'',
          height:documentsIcon?getComputedStyle(documentsIcon).height:'',
          fill:documentsIcon?getComputedStyle(documentsIcon).fill:'',
          viewBox:documentsIcon?.getAttribute('viewBox')||''
        },
        svg:{
          fill:basePath?getComputedStyle(basePath).fill:'',
          stroke:basePath?getComputedStyle(basePath).stroke:'',
          strokeWidth:basePath?getComputedStyle(basePath).strokeWidth:''
        },
        markerBackground:markerStyle.backgroundColor,
        calendar:{
          exists:Boolean(document.getElementById('d5FirstScreenCalendar')),
          belowMenu:(document.getElementById('d5FirstScreenCalendar')?.getBoundingClientRect().top||0)>menu.getBoundingClientRect().bottom,
          month:document.getElementById('d5CalendarMonthLabel')?.textContent?.trim()||'',
          selected:document.querySelector('.v-calendar__day[data-selected="true"]')?.getAttribute('data-calendar-date')||'',
          unavailable:document.querySelector('[data-calendar-date="2026-09-20"]')?.disabled===true,
          accent:document.querySelector('.v-calendar')?.getAttribute('data-calendar-accent')||''
        },
        mounted:Boolean(window.HashcodFirstScreenBranchedMenu?.mounted),
        secondEntry:document.getElementById('hashcodEntryHold')!==null,
        toolbook:document.getElementById('hashcodToolbookBlankPage')!==null
      };
    });

    assert.deepEqual(componentErrors,[],'BranchedMenu must mount without component runtime errors');
    assert.deepEqual(state.formerWindow,{accessCard:false,enter:false,revenue:false},'old white access window must be completely gone');
    assert.deepEqual(state.removedCards,{tilt:false,savedChat:false,tiltText:false,savedText:false},'removed price and Saved Messages cards must not exist in the live page');
    assert(Math.abs(state.stage.width-300)<=2,'BranchedMenu host width must be 300px');
    assert(Math.abs(state.stage.left-18)<=2,'BranchedMenu must be inset from the left edge');
    assert(Math.abs(state.stage.top-8)<=2,'BranchedMenu must sit higher on the first screen');
    assert.equal(state.stage.background,'rgba(0, 0, 0, 0)','BranchedMenu host must be transparent with no black panel');
    assert.equal(state.stage.color,'rgb(10, 10, 10)','BranchedMenu host ink must be black');
    assert.equal(state.stage.borderRadius,'0px','replacement must not retain rounded window chrome');
    assert.equal(state.stage.boxShadow,'none','replacement must not retain window shadow');
    assert.equal(state.menu.display,'flex','BranchedMenu must use source flex layout');
    assert.equal(state.menu.paddingLeft,'14px','source rail offset must remain exact');
    assert(state.menu.width<=240.5,'BranchedMenu width prop must remain 240px');
    assert.deepEqual(state.heads,[{label:'Getting started',expanded:'true'},{label:'Components',expanded:'false'}],'defaultOpen={[0]} must remain exact');
    assert.deepEqual(state.labels,['FAQ','Card','Workspace','Text Card','Documents','Quick start','Configuration','Buttons','Overlays'],'menu labels must include Documents in the requested structure');
    assert.equal(state.active,'Quick start','defaultActive must remain quick');
    assert.equal(state.calendar.exists,true,'calendar must render below the BranchedMenu');
    assert.equal(state.calendar.belowMenu,true,'calendar must be positioned below the BranchedMenu');
    assert.equal(state.calendar.month,'September 2026','calendar must open on September 2026');
    assert.equal(state.calendar.selected,'2026-09-12','calendar default appointment must be 12 September');
    assert.equal(state.calendar.unavailable,true,'20 September must remain unavailable');
    assert.equal(state.calendar.accent,'black','calendar accent must be black');
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
    assert.equal(state.cardMenu.exists,true,'Card must be present in the BranchedMenu');
    assert.equal(state.cardMenu.width,'16px','Card SVG width must be 16px');
    assert.equal(state.cardMenu.height,'16px','Card SVG height must be 16px');
    assert.equal(state.cardMenu.fill,'rgb(10, 10, 10)','Card SVG must inherit black menu ink');
    assert.equal(state.cardMenu.viewBox,'0 0 16 16','Card SVG must preserve the supplied viewBox');
    assert.equal(state.workspaceMenu.exists,true,'Workspace must be present in the BranchedMenu');
    assert.equal(state.workspaceMenu.width,'16px','Workspace SVG width must be 16px');
    assert.equal(state.workspaceMenu.height,'16px','Workspace SVG height must be 16px');
    assert.equal(state.workspaceMenu.fill,'rgb(10, 10, 10)','Workspace SVG must inherit black menu ink');
    assert.equal(state.workspaceMenu.viewBox,'0 0 24 24','Workspace SVG must preserve the supplied viewBox');
    assert.equal(state.textCardMenu.exists,true,'Text Card must be present in the BranchedMenu');
    assert.equal(state.textCardMenu.width,'16px','Text Card SVG width must be 16px');
    assert.equal(state.textCardMenu.height,'16px','Text Card SVG height must be 16px');
    assert.equal(state.textCardMenu.fill,'rgb(10, 10, 10)','Text Card SVG must inherit black menu ink');
    assert.equal(state.textCardMenu.viewBox,'0 0 64 64','Text Card SVG must preserve the supplied viewBox');
    assert.equal(state.documentsMenu.exists,true,'Documents must be present in the BranchedMenu');
    assert.equal(state.documentsMenu.width,'16px','Documents SVG width must be 16px');
    assert.equal(state.documentsMenu.height,'16px','Documents SVG height must be 16px');
    assert.equal(state.documentsMenu.fill,'rgb(10, 10, 10)','Documents SVG must inherit black menu ink');
    assert.equal(state.documentsMenu.viewBox,'0 0 24 24','Documents SVG must preserve the supplied viewBox');

    await page.locator('[data-calendar-date="2026-09-18"]').click();
    await page.waitForFunction(()=>document.getElementById('d5CalendarSummary')?.textContent?.includes('Studio review'));
    assert.equal(await page.locator('[data-calendar-date="2026-09-18"]').getAttribute('data-selected'),'true','18 September must become selected');
    const selectedCalendarBackground=await page.locator('[data-calendar-date="2026-09-18"]').evaluate(node=>getComputedStyle(node).backgroundColor);
    assert.equal(selectedCalendarBackground,'rgb(10, 10, 10)','selected calendar day must use black rather than pink');

    await page.locator('#d5CalendarPreviousMonth').click();
    await page.waitForFunction(()=>document.getElementById('d5CalendarMonthLabel')?.textContent?.trim()==='August 2026');
    await page.locator('#d5CalendarNextMonth').click();
    await page.waitForFunction(()=>document.getElementById('d5CalendarMonthLabel')?.textContent?.trim()==='September 2026');

    await page.locator('#d5CalendarClear').click();
    await page.waitForFunction(()=>document.getElementById('d5CalendarSummary')?.textContent?.trim()==='Choose an appointment day.');
    assert.equal(await page.locator('.v-calendar__day[data-selected="true"]').count(),0,'Clear selection must remove the appointment day');
    assert.equal(state.svg.fill,'none','branch SVG must never render as filled polygons');
    assert.equal(state.svg.stroke,'rgb(10, 10, 10)','branch lines must be black');
    assert.equal(state.svg.strokeWidth,'1.5px','lineWidth=1.5 must remain exact');
    assert.equal(state.markerBackground,'rgb(10, 10, 10)','active rail marker must be black');
    assert.equal(state.mounted,true,'React island mount marker missing');
    assert.equal(state.secondEntry,false,'retired second screen must remain absent');
    assert.equal(state.toolbook,false,'retired Toolbook screen must remain absent');

    assert.equal(await page.locator('#d5FaqCard').isVisible(),false,'FAQ card must stay hidden until the menu item is selected');
    assert.equal(await page.locator('#d5FaqModalBackdrop').isVisible(),false,'FAQ backdrop must stay hidden initially');

    assert.equal(await page.locator('#d5ToolDeck').isVisible(),false,'source card deck must not be visible before touching Card');
    assert.equal(await page.locator('#d5ToolDeck').getAttribute('hidden'),'','source card deck must be natively hidden before Card is selected');
    assert.equal(await page.locator('#d5ToolDeck').getAttribute('aria-hidden'),'true','source card deck must stay out of the accessibility tree');
    const visibleSpotlightBefore=await page.locator('h2').evaluateAll(nodes=>nodes.filter(node=>node.textContent.trim()==='Spotlight Code'&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden').length);
    assert.equal(visibleSpotlightBefore,0,'Spotlight Code must not be visible before Card is selected');
    const backgroundBefore=await page.locator('#d5ToolDeck').boundingBox();
    assert.equal(backgroundBefore,null,'hidden source deck must have no visible bounding box');

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
        backdropBackground:backdropStyle.backgroundColor,
        backdropZ:backdropStyle.zIndex,
        cardZ:getComputedStyle(card).zIndex,
        backdropParent:backdrop.parentElement===document.body,
        cardParent:card.parentElement===document.body,
        backdropRect:(()=>{
          const r=backdrop.getBoundingClientRect();
          return {left:r.left,top:r.top,width:r.width,height:r.height};
        })(),
        topLeftElement:document.elementFromPoint(5,5)?.id||'',
        closeFocused:document.activeElement===close
      };
    });
    assert.equal(modalState.bodyOpen,true,'FAQ open state class must be applied');
    assert.equal(modalState.ariaHidden,'false','FAQ dialog must be exposed while open');
    assert.equal(modalState.role,'dialog','FAQ must use dialog semantics');
    assert.equal(modalState.ariaModal,'true','FAQ must be modal');
    assert(Math.abs(modalState.centerX-modalState.viewportX)<=2,'FAQ dialog must be horizontally centered');
    assert(Math.abs(modalState.centerY-modalState.viewportY)<=2,'FAQ dialog must be vertically centered');
    assert(modalState.backdropFilter.includes('blur(24px)'),'FAQ backdrop must strongly blur the page behind it');
    assert.equal(modalState.backdropBackground,'rgba(255, 255, 255, 0.88)','FAQ backdrop must heavily veil background content');
    assert.equal(modalState.backdropZ,'2147483646','FAQ backdrop must be above all page UI');
    assert.equal(modalState.cardZ,'2147483647','FAQ card must be above the full-screen backdrop');
    assert.equal(modalState.backdropParent,true,'FAQ backdrop must be portaled directly under body');
    assert.equal(modalState.cardParent,true,'FAQ card must be portaled directly under body');
    assert(Math.abs(modalState.backdropRect.left)<=1&&Math.abs(modalState.backdropRect.top)<=1,'FAQ backdrop must start at viewport origin');
    assert(Math.abs(modalState.backdropRect.width-modalState.viewportX*2)<=2,'FAQ backdrop must span full viewport width');
    assert(Math.abs(modalState.backdropRect.height-modalState.viewportY*2)<=2,'FAQ backdrop must span full viewport height');
    assert.equal(modalState.topLeftElement,'d5FaqModalBackdrop','FAQ backdrop must physically cover background UI outside the dialog');
    assert.equal(modalState.closeFocused,true,'FAQ close control must receive focus');

    const backgroundAfter=await page.locator('#d5ToolDeck').boundingBox();
    assert.equal(backgroundAfter,null,'source card deck must remain hidden behind FAQ');

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

    assert.equal(await page.locator('#d5CardModalShell').isVisible(),false,'Card modal must stay hidden initially');
    assert.equal(await page.locator('#d5CardModalShell').getAttribute('hidden'),'','Card modal shell must have native hidden before selection');
    assert.equal(await page.locator('#d5CardModalBackdrop').isVisible(),false,'Card backdrop must stay hidden initially');

    assert.equal(await page.locator('#d5ToolDeck').isVisible(),false,'Spotlight cards must still be hidden immediately before Card is selected');
    const originalDeckBefore=await page.locator('#d5ToolDeck').boundingBox();
    assert.equal(originalDeckBefore,null,'source card deck must have no visible layout box');

    await page.getByRole('button',{name:'Card',exact:true}).click();
    assert.equal(new URL(page.url()).hash,'#card','Card selection must navigate to #card');
    await page.waitForSelector('#d5CardModalShell',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5CardModalBackdrop',{state:'visible',timeout:5000});
    await page.waitForFunction(()=>document.activeElement?.id==='d5CardClose',{timeout:5000});

    const cardModalState=await page.evaluate(()=>{
      const shell=document.getElementById('d5CardModalShell');
      const backdrop=document.getElementById('d5CardModalBackdrop');
      const modalDeck=document.getElementById('d5CardModalDeck');
      const close=document.getElementById('d5CardClose');
      const shellRect=shell.getBoundingClientRect();
      const backdropStyle=getComputedStyle(backdrop);
      const front=modalDeck.querySelector('.card-0');
      return {
        bodyOpen:document.body.classList.contains('card-modal-open'),
        ariaHidden:shell.getAttribute('aria-hidden'),
        hidden:shell.hidden,
        role:shell.getAttribute('role'),
        ariaModal:shell.getAttribute('aria-modal'),
        centerX:shellRect.left+shellRect.width/2,
        centerY:shellRect.top+shellRect.height/2,
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        backdropFilter:backdropStyle.backdropFilter||backdropStyle.webkitBackdropFilter||'',
        backdropBackground:backdropStyle.backgroundColor,
        backdropZ:backdropStyle.zIndex,
        shellZ:getComputedStyle(shell).zIndex,
        backdropParent:backdrop.parentElement===document.body,
        shellParent:shell.parentElement===document.body,
        closeFocused:document.activeElement===close,
        cards:Array.from(modalDeck.querySelectorAll('.tool-card')).map(card=>card.querySelector('h2')?.textContent.trim()||''),
        frontTitle:front?.querySelector('h2')?.textContent.trim()||'',
        expanded:modalDeck.classList.contains('expanded')
      };
    });

    assert.equal(cardModalState.bodyOpen,true,'Card modal open state class must be applied');
    assert.equal(cardModalState.ariaHidden,'false','Card dialog must be exposed while open');
    assert.equal(cardModalState.hidden,false,'Card dialog must remove native hidden only after Card is selected');
    assert.equal(cardModalState.role,'dialog','Card modal must use dialog semantics');
    assert.equal(cardModalState.ariaModal,'true','Card modal must be modal');
    assert(Math.abs(cardModalState.centerX-cardModalState.viewportX)<=2,'Card modal must be horizontally centered');
    assert(Math.abs(cardModalState.centerY-cardModalState.viewportY)<=2,'Card modal must be vertically centered');
    assert(cardModalState.backdropFilter.includes('blur(24px)'),'Card backdrop must strongly blur the page behind it');
    assert.equal(cardModalState.backdropBackground,'rgba(255, 255, 255, 0.88)','Card backdrop must veil background content');
    assert.equal(cardModalState.backdropZ,'2147483646','Card backdrop must be above page UI');
    assert.equal(cardModalState.shellZ,'2147483647','Card modal must be above its backdrop');
    assert.equal(cardModalState.backdropParent,true,'Card backdrop must be portaled directly under body');
    assert.equal(cardModalState.shellParent,true,'Card modal must be portaled directly under body');
    assert.equal(cardModalState.closeFocused,true,'Card close control must receive focus');
    assert.deepEqual(cardModalState.cards,['Spotlight Code','Pit Barriers','Single bed base','Tokenized certification'],'Card modal must clone the complete tool deck');
    assert.equal(cardModalState.frontTitle,'Spotlight Code','Spotlight Code must remain the front card after Card is selected');
    assert.equal(await page.locator('#d5CardModalShell').isVisible(),true,'Card modal must be the only visible card presentation after selection');
    const visibleSpotlightAfter=await page.locator('h2').evaluateAll(nodes=>nodes.filter(node=>node.textContent.trim()==='Spotlight Code'&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden').length);
    assert.equal(visibleSpotlightAfter,1,'Spotlight Code must become visible only inside the Card modal');
    assert.equal(cardModalState.expanded,false,'Card modal must open stacked');

    const originalDeckAfter=await page.locator('#d5ToolDeck').boundingBox();
    assert.equal(originalDeckAfter,null,'source card deck must remain hidden while the Card modal is open');

    await page.locator('#d5CardModalDeck').click({position:{x:480,y:340}});
    await page.waitForFunction(()=>document.getElementById('d5CardModalDeck')?.classList.contains('expanded'));
    assert.equal(await page.locator('#d5CardModalDeck').getAttribute('aria-expanded'),'true','modal card deck must keep expand/collapse functionality');

    await page.locator('#d5CardClose').click();
    await page.waitForSelector('#d5CardModalShell',{state:'hidden',timeout:5000});
    assert.equal(await page.locator('#d5CardModalShell').getAttribute('hidden'),'','Card close button must restore native hidden');
    assert.equal(new URL(page.url()).hash,'','Card close button must clear the hash');

    await page.getByRole('button',{name:'Card',exact:true}).click();
    await page.waitForSelector('#d5CardModalBackdrop',{state:'visible',timeout:5000});
    await page.locator('#d5CardModalBackdrop').click({position:{x:5,y:5}});
    await page.waitForSelector('#d5CardModalShell',{state:'hidden',timeout:5000});
    assert.equal(await page.locator('#d5CardModalShell').getAttribute('hidden'),'','outside click must restore native hidden');
    assert.equal(new URL(page.url()).hash,'','clicking outside Card must close it');

    await page.getByRole('button',{name:'Card',exact:true}).click();
    await page.waitForSelector('#d5CardModalShell',{state:'visible',timeout:5000});
    await page.keyboard.press('Escape');
    await page.waitForSelector('#d5CardModalShell',{state:'hidden',timeout:5000});
    assert.equal(await page.locator('#d5CardModalShell').getAttribute('hidden'),'','Escape must restore native hidden');
    assert.equal(new URL(page.url()).hash,'','Escape must close Card modal');

    assert.equal(await page.locator('#d5TextEditorCard').isVisible(),false,'Workspace editor must stay hidden before Workspace is selected');
    assert.equal(await page.locator('#d5TextEditorCard').getAttribute('hidden'),'','Workspace editor must be natively hidden initially');
    assert.equal(await page.locator('#d5WorkspaceModalBackdrop').isVisible(),false,'Workspace backdrop must stay hidden initially');

    await page.getByRole('button',{name:'Workspace',exact:true}).click();
    assert.equal(new URL(page.url()).hash,'#workspace','Workspace selection must navigate to #workspace');
    await page.waitForSelector('#d5TextEditorCard',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5WorkspaceModalBackdrop',{state:'visible',timeout:5000});

    const workspaceState=await page.evaluate(()=>{
      const editor=document.getElementById('d5TextEditorCard');
      const backdrop=document.getElementById('d5WorkspaceModalBackdrop');
      const close=document.getElementById('d5WorkspaceClose');
      const rect=editor.getBoundingClientRect();
      const backdropStyle=getComputedStyle(backdrop);
      return {
        bodyOpen:document.body.classList.contains('workspace-modal-open'),
        hidden:editor.hidden,
        ariaHidden:editor.getAttribute('aria-hidden'),
        role:editor.getAttribute('role'),
        ariaModal:editor.getAttribute('aria-modal'),
        centerX:rect.left+rect.width/2,
        centerY:rect.top+rect.height/2,
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        width:rect.width,
        backdropFilter:backdropStyle.backdropFilter||backdropStyle.webkitBackdropFilter||'',
        backdropBackground:backdropStyle.backgroundColor,
        backdropParent:backdrop.parentElement===document.body,
        editorParent:editor.parentElement===document.body,
        closeFocused:document.activeElement===close,
        title:editor.querySelector('.liquid-editor-heading h3')?.textContent.trim()||'',
        promptStudio:Boolean(document.getElementById('d5TextEditorPromptStudio')),
        controls:Array.from(editor.querySelectorAll('.liquid-editor-toolbar button')).map(n=>n.textContent.trim()).filter(Boolean),
        firstScreenPointer:getComputedStyle(document.getElementById('d5FirstBranchedMenuStage')).pointerEvents
      };
    });
    assert.equal(workspaceState.bodyOpen,true,'Workspace modal state class must be applied');
    assert.equal(workspaceState.hidden,false,'Workspace must remove native hidden only after selection');
    assert.equal(workspaceState.ariaHidden,'false','Workspace dialog must be exposed while open');
    assert.equal(workspaceState.role,'dialog','Workspace must expose dialog semantics');
    assert.equal(workspaceState.ariaModal,'true','Workspace must be modal');
    assert(Math.abs(workspaceState.centerX-workspaceState.viewportX)<=2,'Workspace must be horizontally centered');
    assert(Math.abs(workspaceState.centerY-workspaceState.viewportY)<=2,'Workspace must be vertically centered');
    assert(workspaceState.width<=470.5,'Workspace width must stay adapted to the reference editor size');
    assert(workspaceState.backdropFilter.includes('blur(28px)'),'Workspace backdrop must strongly blur the page');
    assert.equal(workspaceState.backdropBackground,'rgba(255, 255, 255, 0.94)','Workspace backdrop must strongly veil background content');
    assert.equal(workspaceState.backdropParent,true,'Workspace backdrop must be portaled directly under body');
    assert.equal(workspaceState.editorParent,true,'Workspace editor must be portaled directly under body');
    assert.equal(workspaceState.closeFocused,true,'Workspace close control must receive focus');
    assert.equal(workspaceState.title,'Workspace draft','Workspace must reuse the real editor from the reference image');
    assert.equal(workspaceState.promptStudio,true,'Workspace must preserve Skill Studio integration');
    assert(workspaceState.controls.includes('Open'),'Workspace must preserve Open control');
    assert(workspaceState.controls.includes('NFKC'),'Workspace must preserve NFKC control');
    assert(workspaceState.controls.includes('Clean'),'Workspace must preserve Clean control');
    assert(workspaceState.controls.includes('TXT'),'Workspace must preserve TXT control');
    assert.equal(workspaceState.firstScreenPointer,'none','underlying first-screen content must not remain interactive while Workspace is open');

    await page.locator('#d5TextEditorInput').fill('Workspace modal test');
    assert.equal(await page.locator('#d5TextEditorInput').inputValue(),'Workspace modal test','Workspace must keep the real editable text area functional');

    await page.locator('#d5WorkspaceClose').click();
    await page.waitForSelector('#d5TextEditorCard',{state:'hidden',timeout:5000});
    assert.equal(await page.locator('#d5TextEditorCard').getAttribute('hidden'),'','Workspace close must restore native hidden');
    assert.equal(new URL(page.url()).hash,'','Workspace close must clear the hash');

    await page.getByRole('button',{name:'Workspace',exact:true}).click();
    await page.waitForSelector('#d5TextEditorCard',{state:'visible',timeout:5000});
    assert.equal(await page.locator('#d5TextEditorInput').inputValue(),'Workspace modal test','Workspace content must survive close/reopen in the same session');
    await page.locator('#d5WorkspaceModalBackdrop').click({position:{x:5,y:5}});
    await page.waitForSelector('#d5TextEditorCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','clicking outside Workspace must close it');

    await page.getByRole('button',{name:'Workspace',exact:true}).click();
    await page.waitForSelector('#d5TextEditorCard',{state:'visible',timeout:5000});
    await page.keyboard.press('Escape');
    await page.waitForSelector('#d5TextEditorCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','Escape must close Workspace');

    assert.equal(await page.locator('#d5BeamCardDemo').isVisible(),false,'Text Card cards must stay hidden before Text Card is selected');
    assert.equal(await page.locator('#d5BeamCardDemo').getAttribute('hidden'),'','Text Card source must be natively hidden initially');
    assert.equal(await page.locator('#d5TextCardBackdrop').isVisible(),false,'Text Card backdrop must stay hidden initially');

    await page.getByRole('button',{name:'Text Card',exact:true}).click();
    assert.equal(new URL(page.url()).hash,'#text-card','Text Card selection must navigate to #text-card');
    await page.waitForSelector('#d5BeamCardDemo',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5TextCardBackdrop',{state:'visible',timeout:5000});
    await page.waitForFunction(()=>document.activeElement===document.getElementById('d5TextCardClose'),{timeout:5000});

    const textCardState=await page.evaluate(()=>{
      const demo=document.getElementById('d5BeamCardDemo');
      const backdrop=document.getElementById('d5TextCardBackdrop');
      const close=document.getElementById('d5TextCardClose');
      const rect=demo.getBoundingClientRect();
      const style=getComputedStyle(backdrop);
      return {
        open:document.body.classList.contains('text-card-modal-open'),
        hidden:demo.hidden,
        ariaHidden:demo.getAttribute('aria-hidden'),
        centerX:rect.left+rect.width/2,
        centerY:rect.top+rect.height/2,
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        blur:style.backdropFilter||style.webkitBackdropFilter||'',
        backdropBackground:style.backgroundColor,
        closeFocused:document.activeElement===close,
        cards:Array.from(demo.querySelectorAll('.beam-card-title')).map(n=>n.textContent.trim())
      };
    });
    assert.equal(textCardState.open,true,'Text Card modal state class must be applied');
    assert.equal(textCardState.hidden,false,'Text Card must remove native hidden after selection');
    assert.equal(textCardState.ariaHidden,'false','Text Card must be exposed while open');
    assert(Math.abs(textCardState.centerX-textCardState.viewportX)<=2,'Text Card must be horizontally centered');
    assert(Math.abs(textCardState.centerY-textCardState.viewportY)<=2,'Text Card must be vertically centered');
    assert(textCardState.blur.includes('blur(28px)'),'Text Card must strongly blur the page behind it');
    assert.equal(textCardState.backdropBackground,'rgba(255, 255, 255, 0.94)','Text Card backdrop must strongly veil the page');
    assert.equal(textCardState.closeFocused,true,'Text Card close control must receive focus');
    assert.deepEqual(textCardState.cards,[
      'Custom Toolbook',
      'Goal-driven building',
      'Development requests',
      'Unique validation codes',
      'Modular environment',
      'Everything in one space'
    ],'Text Card must show exactly the six existing text cards');

    await page.locator('#d5TextCardClose').click();
    await page.waitForSelector('#d5BeamCardDemo',{state:'hidden',timeout:5000});
    assert.equal(await page.locator('#d5BeamCardDemo').getAttribute('hidden'),'','Text Card close must restore native hidden');
    assert.equal(new URL(page.url()).hash,'','Text Card close must clear the hash');

    await page.getByRole('button',{name:'Text Card',exact:true}).click();
    await page.waitForSelector('#d5TextCardBackdrop',{state:'visible',timeout:5000});
    await page.locator('#d5TextCardBackdrop').click({position:{x:5,y:5}});
    await page.waitForSelector('#d5BeamCardDemo',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','clicking outside Text Card must close it');

    await page.getByRole('button',{name:'Text Card',exact:true}).click();
    await page.waitForSelector('#d5BeamCardDemo',{state:'visible',timeout:5000});
    await page.keyboard.press('Escape');
    await page.waitForSelector('#d5BeamCardDemo',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','Escape must close Text Card');

    assert.equal(await page.locator('#d5DocumentsHubShell').isVisible(),false,'Documents hub must stay hidden until selected');
    assert.equal(await page.locator('#d5DocumentsHubBackdrop').isVisible(),false,'Documents blur backdrop must stay hidden initially');
    assert.equal(await page.locator('#d5NumberTickerDemo').isVisible(),false,'NumberTicker must not be visible before Documents is selected');
    assert.equal(await page.locator('#d5ScratchCardDemo').isVisible(),false,'ScratchCard must not be visible before Documents is selected');
    const visibleCredentialsBefore=await page.locator('.nav-list-card').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length>0).length);
    assert.equal(visibleCredentialsBefore,0,'Documents navigation cards must not be visible before Documents is selected');

    await page.getByRole('button',{name:'Documents'}).click();
    assert.equal(new URL(page.url()).hash,'#documents','Documents selection must navigate to #documents');
    await page.waitForSelector('#d5DocumentsHubShell',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5DocumentsHubBackdrop',{state:'visible',timeout:5000});

    const documentsState=await page.evaluate(()=>{
      const shell=document.getElementById('d5DocumentsHubShell');
      const backdrop=document.getElementById('d5DocumentsHubBackdrop');
      const content=document.getElementById('d5DocumentsHubContent');
      const close=document.getElementById('d5DocumentsHubClose');
      const rect=shell.getBoundingClientRect();
      const style=getComputedStyle(backdrop);
      return {
        open:document.body.classList.contains('documents-hub-open'),
        ariaHidden:shell.getAttribute('aria-hidden'),
        centerX:rect.left+rect.width/2,
        centerY:rect.top+rect.height/2,
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        blur:style.backdropFilter||style.webkitBackdropFilter||'',
        closeFocused:document.activeElement===close,
        navCards:content.querySelectorAll('.nav-list-card').length,
        ticker:Boolean(content.querySelector('#d5NumberTickerDemo')),
        scratch:Boolean(content.querySelector('#d5ScratchCardDemo')),
        sourceGridStillInDemo:Boolean(document.querySelector('#d5NavListDemo .nav-list-grid'))
      };
    });
    assert.equal(documentsState.open,true,'Documents hub open state must be applied');
    assert.equal(documentsState.ariaHidden,'false','Documents hub must be exposed while open');
    assert(Math.abs(documentsState.centerX-documentsState.viewportX)<=2,'Documents hub must be horizontally centered');
    assert(Math.abs(documentsState.centerY-documentsState.viewportY)<=2,'Documents hub must be vertically centered');
    assert(documentsState.blur.includes('blur(24px)'),'Documents hub must blur the page behind it');
    assert.equal(documentsState.closeFocused,true,'Documents close control must receive focus');
    assert.equal(documentsState.navCards,2,'Documents hub must show the two navigation cards from the reference image');
    assert.equal(documentsState.ticker,true,'Documents hub must show the real NumberTicker');
    assert.equal(documentsState.scratch,true,'Documents hub must show the real ScratchCard');
    assert.equal(documentsState.sourceGridStillInDemo,false,'Documents navigation cards must be moved out of the background while open');

    const tickerBefore=await page.locator('#d5NumberTicker').getAttribute('aria-label');
    await page.locator('#d5TickerIncrease').click();
    await page.waitForTimeout(50);
    const tickerAfter=await page.locator('#d5NumberTicker').getAttribute('aria-label');
    assert.notEqual(tickerAfter,tickerBefore,'NumberTicker must remain functional inside Documents');

    await page.locator('#d5DocumentsHubClose').click();
    await page.waitForSelector('#d5DocumentsHubShell',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','Documents close must clear the hash');
    assert.equal(await page.locator('#d5NumberTickerDemo').isVisible(),false,'NumberTicker must hide again after Documents closes');
    assert.equal(await page.locator('#d5ScratchCardDemo').isVisible(),false,'ScratchCard must hide again after Documents closes');

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
    await page.waitForFunction(()=>document.getElementById('d5CenterEmptyStateMount')?.dataset.reactMounted==='true',{timeout:15000});

    const centerPosition=await page.evaluate(()=>{
      const stage=document.getElementById('d5CenterEmptyStateStage');
      const rect=stage.getBoundingClientRect();
      const svg=stage.querySelector('.center-empty-state-glyph svg');
      return {
        centerX:rect.left+(rect.width/2),
        viewportCenterX:window.innerWidth/2,
        headingCount:stage.querySelectorAll('h3').length,
        paragraphCount:stage.querySelectorAll('p').length,
        launcherIconCount:stage.querySelectorAll('.center-empty-state-root > .center-empty-state-icon svg').length,
        iconViewBox:svg?.getAttribute('viewBox')||'',
        iconWidth:svg?getComputedStyle(svg).width:'',
        button:document.getElementById('d5CenterEmptyStateAction')?.textContent?.trim()||'',
        expandingGroupCount:stage.querySelectorAll('[data-hashcod-expanding-group="true"]').length,
        expandingItemCount:stage.querySelectorAll('[data-ebg-item]').length,
        actionRight:document.getElementById('d5CenterEmptyStateAction')?.getBoundingClientRect().right||0,
        expandingLeft:stage.querySelector('[data-hashcod-expanding-group="true"]')?.getBoundingClientRect().left||0,
        expandingRight:stage.querySelector('[data-hashcod-expanding-group="true"]')?.getBoundingClientRect().right||0,
        vaultTriggerCount:stage.querySelectorAll('#d5FileVaultTrigger').length,
        vaultLeft:document.getElementById('d5FileVaultTrigger')?.getBoundingClientRect().left||0,
        javaLauncherExists:Boolean(document.getElementById('d5JavaHatchAction'))
      };
    });
    assert(Math.abs(centerPosition.centerX-centerPosition.viewportCenterX)<=3,'center EmptyState must stay centered in the viewport');
    assert.equal(centerPosition.headingCount,0,'center layout must not render a title');
    assert.equal(centerPosition.paragraphCount,0,'center layout must not render a subtitle');
    assert.equal(centerPosition.launcherIconCount,1,'there must be only one Hatch launcher icon');
    assert.equal(centerPosition.iconViewBox,'0 0 48 48','retained launcher icon must preserve its supplied viewBox');
    assert.equal(centerPosition.iconWidth,'30px','launcher icon must keep the adapted 30px size');
    assert.equal(centerPosition.button,'Open Hatch','Open Hatch action label changed');
    assert.equal(centerPosition.expandingGroupCount,1,'there must be exactly one ExpandingButtonGroup beside Open Hatch');
    assert.equal(centerPosition.expandingItemCount,3,'ExpandingButtonGroup must expose the three temporary action slots');
    assert(centerPosition.expandingLeft>centerPosition.actionRight,'ExpandingButtonGroup must remain to the right of Open Hatch');
    assert.equal(centerPosition.vaultTriggerCount,1,'there must be exactly one FileVault trigger');
    assert(centerPosition.vaultLeft>=centerPosition.expandingRight,'FileVault must remain to the right of ExpandingButtonGroup');
    assert.equal(centerPosition.javaLauncherExists,false,'Java must not create a second Hatch launcher');

    await page.locator('#d5FileVaultTrigger').click();
    await page.waitForSelector('#d5FileVault',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5FileVaultDropzone',{state:'visible',timeout:5000});
    assert.equal(await page.locator('#d5FileVaultInput[type="file"][multiple]').count(),1,'FileVault must expose one real multiple file input');
    await page.locator('#d5FileVaultClose').click();
    await page.waitForSelector('#d5FileVault',{state:'detached',timeout:5000});

    await page.locator('#d5CenterEmptyStateAction').click();
    await page.waitForSelector('#d5HatchCodeEditor',{state:'visible',timeout:5000});
    await page.waitForSelector('#d5HatchBackdrop',{state:'visible',timeout:5000});
    await page.waitForFunction(()=>{
      const editor=document.getElementById('d5HatchCodeEditor');
      if(!editor)return false;
      const rect=editor.getBoundingClientRect();
      return Math.abs((rect.left+rect.width/2)-(innerWidth/2))<=2
        && Math.abs((rect.top+rect.height/2)-(innerHeight/2))<=2;
    },{timeout:5000});
    await page.waitForFunction(()=>{
      const editor=document.getElementById('d5HatchCodeEditor');
      if(!editor)return false;
      return Math.abs(editor.getBoundingClientRect().width-editor.offsetWidth)<=0.5;
    },{timeout:5000});

    const hatchState=await page.evaluate(()=>{
      const editor=document.getElementById('d5HatchCodeEditor');
      const backdrop=document.getElementById('d5HatchBackdrop');
      const tsxInput=document.getElementById('d5HatchCodeInput');
      const javaInput=document.getElementById('d5JavaHatchCodeInput');
      const javascriptInput=document.getElementById('d5JavaScriptHatchCodeInput');
      const cssInput=document.getElementById('d5CssHatchCodeInput');
      const htmlInput=document.getElementById('d5HtmlHatchCodeInput');
      const pythonInput=document.getElementById('d5PythonHatchCodeInput');
      const grid=document.getElementById('d5HatchCodeGrid');
      const rect=editor.getBoundingClientRect();
      const gridRect=grid.getBoundingClientRect();
      const backdropStyle=getComputedStyle(backdrop);
      const gridStyle=getComputedStyle(grid);
      const panes=Array.from(editor.querySelectorAll('.hatch-code-pane')).map((pane)=>({
        key:pane.getAttribute('data-code-pane')||'',
        file:pane.querySelector('.hatch-code-file span')?.textContent?.trim()||'',
        left:pane.getBoundingClientRect().left,
        right:pane.getBoundingClientRect().right,
        top:pane.getBoundingClientRect().top,
        bottom:pane.getBoundingClientRect().bottom
      }));
      return {
        bodyOpen:document.body.classList.contains('hashcod-hatch-open'),
        role:editor.getAttribute('role'),
        ariaModal:editor.getAttribute('aria-modal'),
        centerX:rect.left+(rect.width/2),
        centerY:rect.top+(rect.height/2),
        viewportX:innerWidth/2,
        viewportY:innerHeight/2,
        width:rect.width,
        height:rect.height,
        blur:backdropStyle.backdropFilter||backdropStyle.webkitBackdropFilter||'',
        gridClientHeight:grid.clientHeight,
        gridScrollHeight:grid.scrollHeight,
        gridOverflowY:gridStyle.overflowY,
        gridRight:gridRect.right,
        editorRight:rect.right,
        panes,
        tsxValue:tsxInput?.value||'',
        javaValue:javaInput?.value||'',
        javascriptValue:javascriptInput?.value||'',
        cssValue:cssInput?.value||'',
        htmlValue:htmlInput?.value||'',
        pythonValue:pythonInput?.value||'',
        tsxFocused:document.activeElement===tsxInput,
        javaIconViewBox:editor.querySelector('.hatch-code-java-icon')?.getAttribute('viewBox')||'',
        javascriptIconViewBox:editor.querySelector('.hatch-code-javascript-icon')?.getAttribute('viewBox')||'',
        javascriptIconYellow:editor.querySelector('.hatch-code-javascript-icon path[fill="#f7df1e"]')?.getAttribute('d')||'',
        cssIconViewBox:editor.querySelector('.hatch-code-css-icon')?.getAttribute('viewBox')||'',
        cssGradientCount:editor.querySelectorAll('.hatch-code-css-icon linearGradient').length,
        cssBlueShield:editor.querySelector('.hatch-code-css-icon path[fill="#2062af"]')?.getAttribute('d')||'',
        htmlIconViewBox:editor.querySelector('.hatch-code-html-icon')?.getAttribute('viewBox')||'',
        htmlPolygonCount:editor.querySelectorAll('.hatch-code-html-icon polygon').length,
        htmlOuterPolygon:editor.querySelector('.hatch-code-html-icon polygon[fill="#e7a42b"]')?.getAttribute('points')||'',
        pythonIconViewBox:editor.querySelector('.hatch-code-python-icon')?.getAttribute('viewBox')||'',
        pythonBluePath:editor.querySelector('.hatch-code-python-icon path[fill="#0277BD"]')?.getAttribute('d')||'',
        pythonYellowPath:editor.querySelector('.hatch-code-python-icon path[fill="#FFC107"]')?.getAttribute('d')||'',
        copyReact:Boolean(document.getElementById('d5HatchCopy')),
        copyJava:Boolean(document.getElementById('d5JavaHatchCopy')),
        copyJavaScript:Boolean(document.getElementById('d5JavaScriptHatchCopy')),
        copyCss:Boolean(document.getElementById('d5CssHatchCopy')),
        cssHtmlLink:Boolean(document.getElementById('d5CssHtmlLink')),
        cssHtmlLinkPressed:document.getElementById('d5CssHtmlLink')?.getAttribute('aria-pressed')||'',
        cssHtmlLinkViewBox:document.querySelector('#d5CssHtmlLink svg')?.getAttribute('viewBox')||'',
        cssHtmlLinkPath:document.querySelector('#d5CssHtmlLink path')?.getAttribute('d')||'',
        cssHtmlLinkRight:document.getElementById('d5CssHtmlLink')?.getBoundingClientRect().right||0,
        cssCopyLeft:document.getElementById('d5CssHatchCopy')?.getBoundingClientRect().left||0,
        copyHtml:Boolean(document.getElementById('d5HtmlHatchCopy')),
        copyPython:Boolean(document.getElementById('d5PythonHatchCopy')),
        pythonRun:Boolean(document.getElementById('d5PythonRun')),
        pythonRunPressed:document.getElementById('d5PythonRun')?.getAttribute('aria-pressed')||'',
        pythonRunViewBox:document.querySelector('#d5PythonRun svg')?.getAttribute('viewBox')||'',
        pythonRunPath:document.querySelector('#d5PythonRun path')?.getAttribute('d')||'',
        pythonRunRight:document.getElementById('d5PythonRun')?.getBoundingClientRect().right||0,
        pythonCopyLeft:document.getElementById('d5PythonHatchCopy')?.getBoundingClientRect().left||0,
        htmlPreview:Boolean(document.getElementById('d5HtmlHatchPreview')),
        htmlPreviewPressed:document.getElementById('d5HtmlHatchPreview')?.getAttribute('aria-pressed')||'',
        htmlPreviewIconViewBox:document.querySelector('#d5HtmlHatchPreview svg')?.getAttribute('viewBox')||'',
        htmlPreviewIconPath:document.querySelector('#d5HtmlHatchPreview path')?.getAttribute('d')||'',
        htmlCopyRight:document.getElementById('d5HtmlHatchCopy')?.getBoundingClientRect().right||0,
        htmlPreviewLeft:document.getElementById('d5HtmlHatchPreview')?.getBoundingClientRect().left||0,
        close:Boolean(document.getElementById('d5HatchClose'))
      };
    });

    assert.equal(hatchState.bodyOpen,true,'Open Hatch must mark its modal state');
    assert.equal(hatchState.role,'dialog','shared Hatch must expose dialog semantics');
    assert.equal(hatchState.ariaModal,'true','shared Hatch must be modal');
    assert(Math.abs(hatchState.centerX-hatchState.viewportX)<=2,'shared Hatch must be horizontally centered');
    assert(Math.abs(hatchState.centerY-hatchState.viewportY)<=2,'shared Hatch must be vertically centered');
    assert(Math.abs(hatchState.width-864)<=2,'shared Hatch must contain both 420px-class editors');
    assert(Math.abs(hatchState.height-Math.min(744,(hatchState.viewportY*2)-112))<=2,'shared Hatch viewport must remain centered and responsive');
    assert.equal(hatchState.gridOverflowY,'auto','Hatch must expose a vertical scrollbar');
    assert(hatchState.gridScrollHeight>hatchState.gridClientHeight,'Hatch content must scroll instead of shrinking blocks');
    assert(Math.abs(hatchState.gridRight-hatchState.editorRight)<=3,'Hatch scrollbar must sit on the right edge');
    assert(hatchState.blur.includes('blur(24px)'),'Hatch must blur the platform behind it');
    assert.equal(hatchState.panes.length,6,'shared Hatch must contain React, JavaScript, CSS, Java, HTML and Python panes');
    for(const pane of hatchState.panes){
      assert(Math.abs((pane.bottom-pane.top)-372)<=2,`${pane.key} pane must keep the same 372px height`);
    }
    const reactPane=hatchState.panes.find(p=>p.key==='tsx');
    const javascriptPane=hatchState.panes.find(p=>p.key==='javascript');
    const cssPane=hatchState.panes.find(p=>p.key==='css');
    const javaPane=hatchState.panes.find(p=>p.key==='java');
    const htmlPane=hatchState.panes.find(p=>p.key==='html');
    const pythonPane=hatchState.panes.find(p=>p.key==='python');
    assert.equal(reactPane.file,'my-component.tsx','React editor must stay top-left');
    assert.equal(javascriptPane.file,'script.js','JavaScript editor must stay below React');
    assert.equal(cssPane.file,'styles.css','CSS editor must be below JavaScript');
    assert.equal(javaPane.file,'Main.java','Java editor must stay top-right');
    assert.equal(htmlPane.file,'index.html','HTML editor must stay below Java');
    assert.equal(pythonPane.file,'main.py','Python editor must be below HTML');
    assert(Math.abs(javascriptPane.left-reactPane.left)<=2,'JavaScript must align under React');
    assert(javascriptPane.top>=reactPane.bottom-2,'JavaScript must be positioned below React');
    assert(Math.abs(cssPane.left-javascriptPane.left)<=2,'CSS must align under JavaScript');
    assert(cssPane.top>=javascriptPane.bottom-2,'CSS must be positioned below JavaScript without shrinking');
    assert(javaPane.left>=reactPane.right-2,'Java pane must be positioned to the right of React');
    assert(Math.abs(htmlPane.left-javaPane.left)<=2,'HTML must align under Java');
    assert(htmlPane.top>=javaPane.bottom-2,'HTML must be positioned below Java');
    assert(Math.abs(pythonPane.left-htmlPane.left)<=2,'Python must align under HTML');
    assert(pythonPane.top>=htmlPane.bottom-2,'Python must be positioned below HTML without shrinking');
    assert.equal(hatchState.javaIconViewBox,'0 0 50 50','Java pane must use the supplied Java SVG');
    assert.equal(hatchState.javascriptIconViewBox,'0 0 48 48','JavaScript pane must preserve the supplied 48x48 SVG');
    assert.equal(hatchState.javascriptIconYellow,'M6,42V6h36v36H6z','JavaScript pane must use the supplied yellow JS icon');
    assert.equal(hatchState.cssIconViewBox,'0 0 256 256','CSS pane must preserve the supplied 256x256 SVG');
    assert.equal(hatchState.cssGradientCount,4,'CSS pane must preserve all four supplied gradients');
    assert(hatchState.cssBlueShield.startsWith('M20.667,21.666'),'CSS pane must use the supplied blue shield path');
    assert.equal(hatchState.htmlIconViewBox,'0 0 48 48','HTML pane must preserve the supplied 48x48 SVG');
    assert.equal(hatchState.htmlPolygonCount,6,'HTML pane must preserve all six supplied polygons');
    assert.equal(hatchState.htmlOuterPolygon,'8,5 42,5 38,39 25,43 11,39','HTML pane must use the supplied shield polygon');
    assert.equal(hatchState.pythonIconViewBox,'0 0 48 48','Python pane must preserve the supplied 48x48 SVG');
    assert(hatchState.pythonBluePath.startsWith('M24.047,5c-1.555,0.005'),'Python pane must use the supplied blue path');
    assert(hatchState.pythonYellowPath.startsWith('M23.078,43c1.555-0.005'),'Python pane must use the supplied yellow path');
    assert.equal(hatchState.copyReact,true,'React pane must keep its copy button');
    assert.equal(hatchState.copyJavaScript,true,'JavaScript pane must have its own copy button');
    assert.equal(hatchState.copyCss,true,'CSS pane must have its own copy button');
    assert.equal(hatchState.cssHtmlLink,true,'CSS pane must have a CSS to HTML link button');
    assert.equal(hatchState.cssHtmlLinkPressed,'false','CSS to HTML link must start disconnected');
    assert.equal(hatchState.cssHtmlLinkViewBox,'0 0 24 24','CSS to HTML link button must preserve the supplied 24x24 SVG');
    assert(hatchState.cssHtmlLinkPath.startsWith('M 19 3 C 17.35499 3 16 4.3549904 16 6'),'CSS to HTML link button must use the supplied SVG path');
    assert(hatchState.cssHtmlLinkRight<=hatchState.cssCopyLeft+2,'CSS to HTML link button must sit to the left of Copy');
    assert.equal(hatchState.copyJava,true,'Java pane must have its own copy button');
    assert.equal(hatchState.copyHtml,true,'HTML pane must have its own copy button');
    assert.equal(hatchState.copyPython,true,'Python pane must have its own copy button');
    assert.equal(hatchState.pythonRun,true,'Python pane must have a run button');
    assert.equal(hatchState.pythonRunPressed,'false','Python run button must start in editor mode');
    assert.equal(hatchState.pythonRunViewBox,'0 0 30 30','Python run button must preserve the supplied 30x30 SVG');
    assert(hatchState.pythonRunPath.startsWith('M 5 4 C 3.895 4 3 4.895 3 6'),'Python run button must use the supplied SVG path');
    assert(hatchState.pythonRunRight<=hatchState.pythonCopyLeft+2,'Python run button must sit to the left of Copy');
    assert.equal(hatchState.htmlPreview,true,'HTML pane must have a preview button beside Copy');
    assert.equal(hatchState.htmlPreviewPressed,'false','HTML preview must start in code mode');
    assert.equal(hatchState.htmlPreviewIconViewBox,'0 0 24 24','HTML preview button must preserve the supplied 24x24 SVG');
    assert(hatchState.htmlPreviewIconPath.startsWith('M 6 2 C 4.897 2 4 2.897 4 4'),'HTML preview button must use the supplied SVG path');
    assert(hatchState.htmlPreviewLeft>=hatchState.htmlCopyRight-2,'HTML preview button must sit beside the Copy control');
    assert.equal(hatchState.close,true,'shared Hatch must have one close button');
    assert.equal(hatchState.tsxFocused,true,'React code area must receive initial focus');
    assert(hatchState.tsxValue.includes("type MyComponentProps"),'React pane must keep the supplied TSX example');
    assert(hatchState.javaValue.includes('public class Main'),'Java pane must start with Java source');
    assert(hatchState.javascriptValue.includes("language: 'JavaScript'"),'JavaScript pane must start with JavaScript source');
    assert(hatchState.cssValue.includes(':root {'),'CSS pane must start with CSS source');
    assert(hatchState.htmlValue.includes('<!doctype html>'),'HTML pane must start with HTML source');
    assert(hatchState.pythonValue.includes('def main():'),'Python pane must start with Python source');

    const scrollState=await page.evaluate(()=>{
      const grid=document.getElementById('d5HatchCodeGrid');
      grid.scrollTop=grid.scrollHeight;
      return {scrollTop:grid.scrollTop,max:grid.scrollHeight-grid.clientHeight};
    });
    assert(scrollState.scrollTop>0,'Hatch side scrollbar must move vertically');
    assert(Math.abs(scrollState.scrollTop-scrollState.max)<=2,'Hatch must scroll far enough to reveal the last row');
    await page.locator('#d5HatchCodeGrid').evaluate(node=>{node.scrollTop=0;});

    const editedTsx=hatchState.tsxValue+'\n// hatch editable';
    const editedJavaScript=hatchState.javascriptValue+'\n// javascript hatch editable';
    const editedCss=hatchState.cssValue+'\nh1 { color: rgb(12, 34, 56); background: rgb(240, 241, 242); }\n/* css hatch editable */';
    const editedJava=hatchState.javaValue+'\n// java hatch editable';
    const editedHtml=hatchState.htmlValue+'\n<!-- html hatch editable -->';
    const editedPython=hatchState.pythonValue+'\n# python hatch editable';
    await page.locator('#d5HatchCodeInput').fill(editedTsx);
    await page.locator('#d5JavaScriptHatchCodeInput').fill(editedJavaScript);
    await page.locator('#d5CssHatchCodeInput').fill(editedCss);
    await page.locator('#d5JavaHatchCodeInput').fill(editedJava);
    await page.locator('#d5HtmlHatchCodeInput').fill(editedHtml);
    await page.locator('#d5PythonHatchCodeInput').fill(editedPython);

    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-code:v1')?.endsWith('// hatch editable')),true,'React edits must persist');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-javascript-code:v1')?.endsWith('// javascript hatch editable')),true,'JavaScript edits must persist independently');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-css-code:v1')?.endsWith('/* css hatch editable */')),true,'CSS edits must persist independently');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-java-code:v1')?.endsWith('// java hatch editable')),true,'Java edits must persist independently');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-html-code:v1')?.endsWith('<!-- html hatch editable -->')),true,'HTML edits must persist independently');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-python-code:v1')?.endsWith('# python hatch editable')),true,'Python edits must persist independently');

    await page.evaluate(()=>{
      window.__hashcodNativeWorker=window.Worker;
      window.Worker=class FakePythonWorker {
        constructor(){
          this.onmessage=null;
          this.onerror=null;
        }
        postMessage(){
          setTimeout(()=>{
            this.onmessage?.({data:{type:'stdout',text:'Hello from Hashcod Hatch'}});
            this.onmessage?.({data:{type:'done'}});
          },10);
        }
        terminate(){}
      };
    });

    await page.locator('#d5PythonRun').click();
    await page.waitForSelector('#d5PythonTerminal',{state:'visible',timeout:5000});
    await page.waitForFunction(()=>document.getElementById('d5PythonTerminalOutput')?.textContent?.includes('Hello from Hashcod Hatch'));
    assert.equal(await page.locator('#d5PythonRun').getAttribute('aria-pressed'),'true','Python run button must switch the pane to terminal mode');
    assert.equal(await page.locator('#d5PythonHatchCodeInput').count(),0,'Python textarea must be replaced by the terminal while running');
    const pythonTerminalText=await page.locator('#d5PythonTerminalOutput').textContent();
    assert(pythonTerminalText.includes('$ python main.py'),'Python terminal must show the executed file command');
    assert(pythonTerminalText.includes('Hello from Hashcod Hatch'),'Python terminal must show stdout from the runner');

    await page.locator('#d5PythonTerminalBack').click();
    await page.waitForSelector('#d5PythonHatchCodeInput',{state:'visible',timeout:5000});
    assert.equal((await page.locator('#d5PythonHatchCodeInput').inputValue()).endsWith('# python hatch editable'),true,'Python code must remain intact after terminal execution');
    assert.equal(await page.locator('#d5PythonRun').getAttribute('aria-pressed'),'false','returning to code must leave terminal mode');

    await page.evaluate(()=>{
      if(window.__hashcodNativeWorker){
        window.Worker=window.__hashcodNativeWorker;
        delete window.__hashcodNativeWorker;
      }
    });

    await page.locator('#d5CssHtmlLink').click();
    assert.equal(await page.locator('#d5CssHtmlLink').getAttribute('aria-pressed'),'true','CSS to HTML link button must connect styles');
    assert.equal(await page.evaluate(()=>localStorage.getItem('hashcod:hatch-css-html-linked:v1')), 'true','CSS to HTML link state must persist');

    await page.locator('#d5HtmlHatchPreview').click();
    await page.waitForSelector('#d5HtmlHatchPreviewFrame',{state:'visible',timeout:5000});
    assert.equal(await page.locator('#d5HtmlHatchPreview').getAttribute('aria-pressed'),'true','HTML preview button must enter preview mode');
    assert.equal(await page.locator('#d5HtmlHatchCodeInput').count(),0,'HTML textarea must be replaced by the page preview while previewing');
    assert.equal(await page.frameLocator('#d5HtmlHatchPreviewFrame').locator('h1').textContent(),'Hello from Hashcod Hatch','HTML preview must render the current index.html page');
    assert.equal(await page.frameLocator('#d5HtmlHatchPreviewFrame').locator('style[data-hashcod-hatch-css]').count(),1,'HTML preview must inject linked CSS');
    const linkedCssStyle=await page.frameLocator('#d5HtmlHatchPreviewFrame').locator('h1').evaluate(node=>{
      const style=getComputedStyle(node);
      return {color:style.color,background:style.backgroundColor};
    });
    assert.equal(linkedCssStyle.color,'rgb(12, 34, 56)','HTML preview must apply CSS editor color');
    assert.equal(linkedCssStyle.background,'rgb(240, 241, 242)','HTML preview must apply CSS editor background');

    await page.locator('#d5HtmlHatchPreview').click();
    await page.waitForSelector('#d5HtmlHatchCodeInput',{state:'visible',timeout:5000});
    assert.equal(await page.locator('#d5HtmlHatchPreviewFrame').count(),0,'HTML preview frame must close when toggled back to code');
    assert.equal((await page.locator('#d5HtmlHatchCodeInput').inputValue()).endsWith('<!-- html hatch editable -->'),true,'HTML code must remain intact after previewing');

    await page.keyboard.press('Escape');
    await page.waitForSelector('#d5HatchCodeEditor',{state:'detached',timeout:5000});
    assert.equal(await page.evaluate(()=>document.body.classList.contains('hashcod-hatch-open')),false,'Escape must clear Hatch modal state');

    await page.locator('#d5CenterEmptyStateAction').click();
    await page.waitForSelector('#d5HatchCodeEditor',{state:'visible',timeout:5000});
    assert.equal((await page.locator('#d5HatchCodeInput').inputValue()).endsWith('// hatch editable'),true,'React code must survive close and reopen');
    assert.equal((await page.locator('#d5JavaScriptHatchCodeInput').inputValue()).endsWith('// javascript hatch editable'),true,'JavaScript code must survive close and reopen in the same Hatch');
    assert.equal((await page.locator('#d5CssHatchCodeInput').inputValue()).endsWith('/* css hatch editable */'),true,'CSS code must survive close and reopen in the same Hatch');
    assert.equal(await page.locator('#d5CssHtmlLink').getAttribute('aria-pressed'),'true','CSS to HTML connection must survive close and reopen');
    assert.equal((await page.locator('#d5JavaHatchCodeInput').inputValue()).endsWith('// java hatch editable'),true,'Java code must survive close and reopen in the same Hatch');
    assert.equal((await page.locator('#d5HtmlHatchCodeInput').inputValue()).endsWith('<!-- html hatch editable -->'),true,'HTML code must survive close and reopen in the same Hatch');
    assert.equal((await page.locator('#d5PythonHatchCodeInput').inputValue()).endsWith('# python hatch editable'),true,'Python code must survive close and reopen in the same Hatch');
    await page.locator('#d5HatchClose').click();
    await page.waitForSelector('#d5HatchCodeEditor',{state:'detached',timeout:5000});

    assert.equal(await page.evaluate(()=>document.body.classList.contains('workspace-modal-open')),false,'Hatch must not set the Workspace modal state');
    assert.equal(await page.locator('#d5TextEditorCard').isVisible(),false,'Hatch must not open Workspace');

    console.log('✓ Python runs in an in-pane terminal while Hatch panes keep equal height, scrolling and CSS-linked preview');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
