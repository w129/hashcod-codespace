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
        mounted:Boolean(window.HashcodFirstScreenBranchedMenu?.mounted),
        secondEntry:document.getElementById('hashcodEntryHold')!==null,
        toolbook:document.getElementById('hashcodToolbookBlankPage')!==null
      };
    });

    assert.deepEqual(componentErrors,[],'BranchedMenu must mount without component runtime errors');
    assert.deepEqual(state.formerWindow,{accessCard:false,enter:false,revenue:false},'old white access window must be completely gone');
    assert.deepEqual(state.removedCards,{tilt:false,savedChat:false,tiltText:false,savedText:false},'removed price and Saved Messages cards must not exist in the live page');
    assert(Math.abs(state.stage.width-300)<=2,'BranchedMenu host width must be 300px');
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

    await page.getByRole('button',{name:'Workspace'}).click();
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

    await page.getByRole('button',{name:'Workspace'}).click();
    await page.waitForSelector('#d5TextEditorCard',{state:'visible',timeout:5000});
    assert.equal(await page.locator('#d5TextEditorInput').inputValue(),'Workspace modal test','Workspace content must survive close/reopen in the same session');
    await page.locator('#d5WorkspaceModalBackdrop').click({position:{x:5,y:5}});
    await page.waitForSelector('#d5TextEditorCard',{state:'hidden',timeout:5000});
    assert.equal(new URL(page.url()).hash,'','clicking outside Workspace must close it');

    await page.getByRole('button',{name:'Workspace'}).click();
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

    console.log('✓ FAQ, Card, Workspace, Text Card and Documents open only from the BranchedMenu and remain functional');
  }finally{
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
