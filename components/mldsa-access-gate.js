(function(){
'use strict';

var ep='/api/mldsa-access';
var ch=document.getElementById('d5Challenge');
var sig=document.getElementById('d5Signature');
var btn=document.getElementById('d5Verify');
var verifyText=document.getElementById('d5VerifyText');
var renew=document.getElementById('d5NewChallenge');
var status=document.getElementById('d5Status');
var fp=document.getElementById('d5Fingerprint');
var description=document.getElementById('d5Description');
var stepOne=document.getElementById('d5StepOne');
var stepTwo=document.getElementById('d5StepTwo');
var deck=document.getElementById('d5ToolDeck');
var pill=ch&&ch.parentElement;
var exp=0;
var timer=null;
var phase=1;
var entryIntro=!!(document.body&&document.body.getAttribute('data-hashcod-entry-intro')==='1');
var entryAccessCard=document.querySelector('.entry-access-card');
var entryWizardPanels=Array.from(document.querySelectorAll('[data-entry-panel]'));
var entryWizardSteps=Array.from(document.querySelectorAll('[data-entry-step]'));
var entryLevel=1;
var entryProductSecurity=document.getElementById('d5EntryProductSecurity');
var entryProductTwoFactor=document.getElementById('d5EntryProductTwoFactor');
var entryProductCodeInputs=Array.from(document.querySelectorAll('[data-entry-code-index]'));
var entryProductVerify=document.getElementById('d5EntryProductVerify');
var entryProductResend=document.getElementById('d5EntryProductResend');
var entryProductCodeStatus=document.getElementById('d5EntryProductCodeStatus');
var entryProductProtected=document.getElementById('d5EntryProductProtected');
var entryProductCard=document.getElementById('d5EntryProductCard');
var entryProductTitle=document.getElementById('d5EntryProductTitle');
var entryProductSubtitle=document.getElementById('d5EntryProductSubtitle');
var entryProductPrice=document.getElementById('d5EntryProductPrice');
var entryProductBadge=document.getElementById('d5EntryProductBadge');
var entryProductAdd=document.getElementById('d5EntryProductAdd');
var entryProductImage=document.getElementById('d5EntryProductImage');
var entryProductIconWrap=document.getElementById('d5EntryProductIconWrap');
var entryProductEditButton=document.getElementById('d5EntryProductEditButton');
var entryProductUploadButton=document.getElementById('d5EntryProductUploadButton');
var entryProductFile=document.getElementById('d5EntryProductFile');
var entryProductTitleInput=document.getElementById('d5EntryProductTitleInput');
var entryProductSubtitleInput=document.getElementById('d5EntryProductSubtitleInput');
var entryProductImagePosition={x:50,y:50};
var entryProductImageDrag=null;
var entryLevel2Next=document.getElementById('d5EntryLevel2Next');
var entryUsageCard=document.getElementById('d5EntryUsageCard');
var entryUsageReset=document.getElementById('d5EntryUsageReset');
var entryHscuValue=document.getElementById('d5EntryHscuValue');
var entryHscuProgress=document.getElementById('d5EntryHscuProgress');
var entryTouchValue=document.getElementById('d5EntryTouchValue');
var entryTouchProgress=document.getElementById('d5EntryTouchProgress');
var entryLevel3Next=document.getElementById('d5EntryLevel3Next');
var entryFinish=document.getElementById('d5EntryFinish');
var entryBackButtons=Array.from(document.querySelectorAll('[data-entry-back]'));
var entryStatCard=document.getElementById('d5EntryStatCard');
var entryStatTitle=document.getElementById('d5EntryStatTitle');
var entryStatValue=document.getElementById('d5EntryStatValue');
var entryStatChange=document.getElementById('d5EntryStatChange');
var entryStatComparison=document.getElementById('d5EntryStatComparison');
var entryStatArea=document.getElementById('d5EntryStatArea');
var entryStatLine=document.getElementById('d5EntryStatLine');
var entryStatDot=document.getElementById('d5EntryStatDot');

function entryStatNormalizePoints(points){
  var source=Array.isArray(points)?points:String(points||'').split(',');
  return source.map(function(value){return Number(value);}).filter(function(value){return Number.isFinite(value);});
}
function entryStatPath(points){
  var values=entryStatNormalizePoints(points);
  if(!values.length)return {line:'',area:'',cx:100,cy:28};
  if(values.length===1)values=[values[0],values[0]];
  var max=Math.max.apply(Math,values);
  if(!Number.isFinite(max)||max<=0)max=1;
  var coords=values.map(function(point,index){
    var x=(index/(values.length-1))*100;
    var y=28-(point/max)*24;
    y=Math.max(0,Math.min(28,y));
    return {x:x,y:y};
  });
  var line=coords.map(function(point){return point.x.toFixed(3)+','+point.y.toFixed(3);}).join(' ');
  var last=coords[coords.length-1];
  return {
    line:line,
    area:'0,28 '+line+' 100,28',
    cx:last.x,
    cy:last.y
  };
}
function entryStatSetData(next){
  if(!entryStatCard)return;
  var data=next&&typeof next==='object'?next:{};
  if(Object.prototype.hasOwnProperty.call(data,'title'))entryStatCard.dataset.title=String(data.title);
  if(Object.prototype.hasOwnProperty.call(data,'value'))entryStatCard.dataset.value=String(data.value);
  if(Object.prototype.hasOwnProperty.call(data,'change'))entryStatCard.dataset.change=String(data.change);
  if(Object.prototype.hasOwnProperty.call(data,'comparison'))entryStatCard.dataset.comparison=String(data.comparison);
  if(Object.prototype.hasOwnProperty.call(data,'points')){
    var normalized=entryStatNormalizePoints(data.points);
    if(normalized.length)entryStatCard.dataset.points=normalized.join(',');
  }
  if(entryStatTitle)entryStatTitle.textContent=entryStatCard.dataset.title||'Monthly revenue';
  if(entryStatValue)entryStatValue.textContent=entryStatCard.dataset.value||'$45,231';
  if(entryStatChange)entryStatChange.textContent=entryStatCard.dataset.change||'+12.5%';
  if(entryStatComparison)entryStatComparison.textContent=entryStatCard.dataset.comparison||'from last month';
  var path=entryStatPath(entryStatCard.dataset.points||'12,18,14,24,21,32,28,38');
  if(entryStatArea)entryStatArea.setAttribute('points',path.area);
  if(entryStatLine)entryStatLine.setAttribute('points',path.line);
  if(entryStatDot){
    entryStatDot.setAttribute('cx',String(path.cx));
    entryStatDot.setAttribute('cy',String(path.cy));
  }
  entryStatCard.setAttribute('aria-label',(entryStatCard.dataset.title||'Statistic')+': '+(entryStatCard.dataset.value||''));
}
if(entryStatCard){
  entryStatSetData({});
  window.HashcodEntryStatCard={
    setData:entryStatSetData,
    getData:function(){
      return {
        title:entryStatCard.dataset.title||'',
        value:entryStatCard.dataset.value||'',
        change:entryStatCard.dataset.change||'',
        comparison:entryStatCard.dataset.comparison||'',
        points:entryStatNormalizePoints(entryStatCard.dataset.points||'')
      };
    }
  };
  window.addEventListener('hashcod:entry-stat-update',function(event){
    entryStatSetData(event&&event.detail?event.detail:{});
  });
}

function entryProductBasePath(){
  var match=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return match?'/'+match[1]:'';
}
var ENTRY_PRODUCT_VERIFY_API=entryProductBasePath()+'/api/entry-product-editor';
var ENTRY_USAGE_API=entryProductBasePath()+'/api/device-usage';
var ENTRY_PRODUCT_STORAGE_KEY='hashcod:entry-product-editor:v2';
var ENTRY_PRODUCT_LEGACY_STORAGE_KEY='hashcod:entry-product-editor:v1';
var ENTRY_PRODUCT_DB_NAME='hashcod-entry-product-media-v1';
var ENTRY_PRODUCT_DB_STORE='assets';
var ENTRY_PRODUCT_DB_IMAGE_KEY='product-image';
var entryProductUnlocked=false;
var entryProductHasSavedImage=false;
var entryProductImageObjectUrl='';
var entryProductFallbackImageData='';

function entryProductOpenDb(){
  return new Promise(function(resolve,reject){
    if(!('indexedDB' in window))return reject(new Error('indexeddb_unavailable'));
    var request=indexedDB.open(ENTRY_PRODUCT_DB_NAME,1);
    request.onupgradeneeded=function(){
      var db=request.result;
      if(!db.objectStoreNames.contains(ENTRY_PRODUCT_DB_STORE))db.createObjectStore(ENTRY_PRODUCT_DB_STORE);
    };
    request.onsuccess=function(){resolve(request.result);};
    request.onerror=function(){reject(request.error||new Error('indexeddb_open_failed'));};
  });
}
async function entryProductDbGetImage(){
  var db=await entryProductOpenDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(ENTRY_PRODUCT_DB_STORE,'readonly');
    var req=tx.objectStore(ENTRY_PRODUCT_DB_STORE).get(ENTRY_PRODUCT_DB_IMAGE_KEY);
    req.onsuccess=function(){resolve(req.result||null);};
    req.onerror=function(){reject(req.error||new Error('indexeddb_read_failed'));};
    tx.oncomplete=function(){db.close();};
    tx.onerror=function(){try{db.close();}catch(_){}};
  });
}
async function entryProductDbPutImage(file){
  var db=await entryProductOpenDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(ENTRY_PRODUCT_DB_STORE,'readwrite');
    tx.objectStore(ENTRY_PRODUCT_DB_STORE).put({
      blob:file,
      name:String(file.name||''),
      type:String(file.type||''),
      updatedAt:Date.now()
    },ENTRY_PRODUCT_DB_IMAGE_KEY);
    tx.oncomplete=function(){db.close();resolve(true);};
    tx.onerror=function(){try{db.close();}catch(_){};reject(tx.error||new Error('indexeddb_write_failed'));};
    tx.onabort=function(){try{db.close();}catch(_){};reject(tx.error||new Error('indexeddb_write_aborted'));};
  });
}
function entryProductSetImageFromBlob(blob){
  if(!entryProductImage||!blob)return false;
  if(entryProductImageObjectUrl){
    try{URL.revokeObjectURL(entryProductImageObjectUrl);}catch(_){}
    entryProductImageObjectUrl='';
  }
  try{
    entryProductImageObjectUrl=URL.createObjectURL(blob);
    entryProductImage.src=entryProductImageObjectUrl;
    entryProductImage.hidden=false;
    return true;
  }catch(_){return false;}
}
function entryProductSetMode(mode){
  var next=(mode==='view'||mode==='edit')?mode:'verify';
  entryProductUnlocked=next==='edit';
  if(entryProductSecurity){
    entryProductSecurity.dataset.mode=next;
    entryProductSecurity.dataset.unlocked=entryProductUnlocked?'true':'false';
  }
  if(entryProductTwoFactor)entryProductTwoFactor.hidden=next!=='verify';
  if(entryProductProtected){
    if(next==='verify'){
      entryProductProtected.setAttribute('inert','');
      entryProductProtected.setAttribute('aria-hidden','true');
    }else{
      entryProductProtected.removeAttribute('inert');
      entryProductProtected.setAttribute('aria-hidden','false');
    }
  }
  if(entryLevel2Next)entryLevel2Next.disabled=next==='verify';
  if(next!=='verify')entryProductResetCode('');
}
function entryProductRequestEdit(){
  if(!entryProductHasSavedImage)return;
  entryProductSetMode('verify');
  entryProductSetCodeStatus('Ingresa el código para editar la imagen.','');
  window.setTimeout(function(){if(entryProductCodeInputs[0])entryProductCodeInputs[0].focus();},30);
}
function entryProductSetCodeStatus(message,state){
  if(!entryProductCodeStatus)return;
  entryProductCodeStatus.textContent=message||'';
  entryProductCodeStatus.dataset.state=state||'';
}
function entryProductCodeValue(){
  return entryProductCodeInputs.map(function(input){return String(input.value||'').replace(/\D/g,'').slice(-1);}).join('');
}
function entryProductResetCode(message){
  entryProductCodeInputs.forEach(function(input){input.value='';});
  entryProductSetCodeStatus(message||'','');
  if(entryProductCodeInputs[0]&&entryProductTwoFactor&&!entryProductTwoFactor.hidden)entryProductCodeInputs[0].focus();
}
function entryProductUnlock(){
  entryProductSetMode('edit');
  entryProductSetCodeStatus('Código válido. Editor desbloqueado.','ok');
  if(entryProductTitleInput)entryProductTitleInput.focus();
  try{window.dispatchEvent(new CustomEvent('hashcod:entry-product-unlocked'));}catch(_){}
}
async function entryProductVerifyCode(){
  var code=entryProductCodeValue();
  if(code.length!==6){
    entryProductSetCodeStatus('Completa los 6 dígitos.','error');
    return false;
  }
  if(entryProductVerify)entryProductVerify.disabled=true;
  entryProductSetCodeStatus('Verificando…','');
  try{
    var response=await fetch(ENTRY_PRODUCT_VERIFY_API,{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({code:code})
    });
    var data={};
    try{data=await response.json();}catch(_){}
    if(!response.ok||!data.ok){
      if(response.status===429){
        throw new Error('Demasiados intentos. Intenta nuevamente más tarde.');
      }
      var remaining=Number(data.attempts_remaining);
      throw new Error(Number.isFinite(remaining)?'Código incorrecto. Intentos restantes: '+remaining+'.':'Código incorrecto.');
    }
    entryProductUnlock();
    return true;
  }catch(error){
    entryProductSetCodeStatus(error&&error.message?error.message:'No se pudo validar el código.','error');
    entryProductCodeInputs.forEach(function(input){input.value='';});
    if(entryProductCodeInputs[0])entryProductCodeInputs[0].focus();
    return false;
  }finally{
    if(entryProductVerify)entryProductVerify.disabled=false;
  }
}
function entryProductClampPosition(value){
  var n=Number(value);
  if(!Number.isFinite(n))return 50;
  return Math.max(0,Math.min(100,n));
}
function entryProductApplyImagePosition(x,y,shouldPersist){
  entryProductImagePosition.x=entryProductClampPosition(x);
  entryProductImagePosition.y=entryProductClampPosition(y);
  if(entryProductImage){
    entryProductImage.style.objectPosition=entryProductImagePosition.x.toFixed(2)+'% '+entryProductImagePosition.y.toFixed(2)+'%';
    entryProductImage.dataset.positionX=String(entryProductImagePosition.x);
    entryProductImage.dataset.positionY=String(entryProductImagePosition.y);
  }
  if(shouldPersist)entryProductPersist();
}
function entryProductPersist(){
  if(!entryProductCard)return;
  var payload={
    title:entryProductCard.dataset.title||'',
    subtitle:entryProductCard.dataset.subtitle||'',
    price:entryProductCard.dataset.price||'',
    badge:entryProductCard.dataset.badge||'',
    imagePosition:{x:entryProductImagePosition.x,y:entryProductImagePosition.y},
    hasImage:entryProductHasSavedImage
  };
  if(entryProductFallbackImageData&&entryProductFallbackImageData.indexOf('data:image/')===0){
    payload.image=entryProductFallbackImageData;
  }
  try{
    localStorage.setItem(ENTRY_PRODUCT_STORAGE_KEY,JSON.stringify(payload));
    localStorage.removeItem(ENTRY_PRODUCT_LEGACY_STORAGE_KEY);
  }catch(_){}
}
async function entryProductRestore(){
  var parsed={};
  var fromLegacy=false;
  try{
    var stored=localStorage.getItem(ENTRY_PRODUCT_STORAGE_KEY);
    if(!stored){
      stored=localStorage.getItem(ENTRY_PRODUCT_LEGACY_STORAGE_KEY);
      fromLegacy=!!stored;
    }
    parsed=JSON.parse(stored||'{}');
    if(!parsed||typeof parsed!=='object')parsed={};
  }catch(_){parsed={};}
  var restored={};
  if(typeof parsed.title==='string')restored.title=parsed.title;
  if(typeof parsed.subtitle==='string')restored.subtitle=parsed.subtitle;
  if(typeof parsed.price==='string')restored.price=parsed.price;
  if(typeof parsed.badge==='string')restored.badge=parsed.badge;
  entryProductSetData(restored);
  if(parsed.imagePosition&&typeof parsed.imagePosition==='object'){
    entryProductApplyImagePosition(parsed.imagePosition.x,parsed.imagePosition.y,false);
  }else{
    entryProductApplyImagePosition(50,50,false);
  }

  var restoredImage=false;
  try{
    var record=await entryProductDbGetImage();
    if(record&&record.blob instanceof Blob){
      restoredImage=entryProductSetImageFromBlob(record.blob);
    }
  }catch(_){}

  if(!restoredImage&&typeof parsed.image==='string'&&parsed.image.indexOf('data:image/')===0&&entryProductImage){
    entryProductFallbackImageData=parsed.image;
    entryProductImage.src=parsed.image;
    entryProductImage.hidden=false;
    restoredImage=true;
    try{
      var migratedBlob=await fetch(parsed.image).then(function(response){return response.blob();});
      if(migratedBlob&&/^image\//i.test(String(migratedBlob.type||''))){
        await entryProductDbPutImage(migratedBlob);
        entryProductFallbackImageData='';
      }
    }catch(_){}
  }

  entryProductHasSavedImage=restoredImage;
  if(restoredImage){
    entryProductSetMode('view');
  }else{
    entryProductSetMode('verify');
  }
  if(fromLegacy||parsed.hasImage!==entryProductHasSavedImage)entryProductPersist();
  return restoredImage;
}
async function entryProductApplyImage(file){
  if(!file)return;
  if(!/^image\//i.test(String(file.type||''))){
    entryProductSetCodeStatus('Selecciona un archivo de imagen válido.','error');
    return;
  }
  if(Number(file.size||0)>8*1024*1024){
    entryProductSetCodeStatus('La imagen debe pesar 8 MB o menos.','error');
    return;
  }
  if(!entryProductImage)return;
  entryProductSetImageFromBlob(file);
  entryProductHasSavedImage=true;
  entryProductFallbackImageData='';
  entryProductApplyImagePosition(50,50,false);
  entryProductSetCodeStatus('Imagen guardada. Arrástrala para ajustar el encuadre.','ok');
  var storedInDb=false;
  try{
    await entryProductDbPutImage(file);
    storedInDb=true;
  }catch(_){}
  if(!storedInDb){
    var reader=new FileReader();
    reader.onload=function(){
      var data=String(reader.result||'');
      if(data.indexOf('data:image/')===0&&data.length<6000000){
        entryProductFallbackImageData=data;
        entryProductPersist();
      }
    };
    reader.onerror=function(){};
    reader.readAsDataURL(file);
  }
  entryProductPersist();
  try{window.dispatchEvent(new CustomEvent('hashcod:entry-product-image',{detail:{name:file.name||'',type:file.type||'',size:file.size||0}}));}catch(_){}
}

function entryProductStartImageDrag(event){
  if(!entryProductUnlocked||!entryProductImage||entryProductImage.hidden)return;
  if(event.button!==undefined&&event.button!==0)return;
  var rect=entryProductImage.parentElement?entryProductImage.parentElement.getBoundingClientRect():null;
  if(!rect||rect.width<=0||rect.height<=0)return;
  entryProductImageDrag={
    pointerId:event.pointerId,
    startClientX:event.clientX,
    startClientY:event.clientY,
    startX:entryProductImagePosition.x,
    startY:entryProductImagePosition.y,
    width:rect.width,
    height:rect.height
  };
  entryProductImage.classList.add('is-dragging');
  try{entryProductImage.setPointerCapture(event.pointerId);}catch(_){}
  event.preventDefault();
}
function entryProductMoveImageDrag(event){
  if(!entryProductImageDrag||!entryProductImage||event.pointerId!==entryProductImageDrag.pointerId)return;
  var dx=event.clientX-entryProductImageDrag.startClientX;
  var dy=event.clientY-entryProductImageDrag.startClientY;
  var nextX=entryProductImageDrag.startX-(dx/entryProductImageDrag.width)*100;
  var nextY=entryProductImageDrag.startY-(dy/entryProductImageDrag.height)*100;
  entryProductApplyImagePosition(nextX,nextY,false);
  event.preventDefault();
}
function entryProductEndImageDrag(event){
  if(!entryProductImageDrag||event.pointerId!==entryProductImageDrag.pointerId)return;
  try{entryProductImage.releasePointerCapture(event.pointerId);}catch(_){}
  entryProductImageDrag=null;
  if(entryProductImage)entryProductImage.classList.remove('is-dragging');
  entryProductPersist();
}
function entryProductResetImagePosition(){
  entryProductApplyImagePosition(50,50,true);
  entryProductSetCodeStatus('Posición de imagen restablecida al centro.','ok');
}

function entryUsageNumber(value,maximumFractionDigits){
  var n=Number(value);
  if(!Number.isFinite(n))n=0;
  try{
    return n.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:maximumFractionDigits||0});
  }catch(_){return String(n);}
}
function entryUsagePercent(value){
  var n=Number(value);
  if(!Number.isFinite(n))n=0;
  return Math.max(0,Math.min(100,n));
}
function entryUsageResetLabel(iso){
  if(!iso)return 'Device-specific usage';
  var date=new Date(iso);
  if(!Number.isFinite(date.getTime()))return 'Device-specific usage';
  try{
    return 'Resets on '+date.toLocaleDateString(undefined,{month:'short',day:'numeric'})+'.';
  }catch(_){return 'Resets automatically each month.';}
}
function entryUsageRender(data){
  if(!entryUsageCard||!data||!data.ok)return;
  var h=data.hscus||{};
  var t=data.touches||{};
  var hUsed=Number(h.used)||0;
  var hLimit=Number(h.limit)||100;
  var tUsed=Number(t.used)||0;
  var tLimit=Number(t.limit)||1000;
  if(entryHscuValue)entryHscuValue.textContent=entryUsageNumber(hUsed,1)+' / '+entryUsageNumber(hLimit,1);
  if(entryTouchValue)entryTouchValue.textContent=entryUsageNumber(tUsed,0)+' / '+entryUsageNumber(tLimit,0);
  if(entryHscuProgress)entryHscuProgress.style.width=entryUsagePercent(h.percent)+'%';
  if(entryTouchProgress)entryTouchProgress.style.width=entryUsagePercent(t.percent)+'%';
  if(entryUsageReset)entryUsageReset.textContent=entryUsageResetLabel(data.resets_on);
  entryUsageCard.dataset.loading='false';
  entryUsageCard.dataset.month=String(data.month||'');
}
async function entryUsageLoad(){
  if(!entryUsageCard)return null;
  entryUsageCard.dataset.loading='true';
  try{
    var response=await fetch(ENTRY_USAGE_API,{
      method:'GET',
      credentials:'same-origin',
      headers:{Accept:'application/json','X-Requested-With':'XMLHttpRequest'}
    });
    var data=await response.json().catch(function(){return null;});
    if(!response.ok||!data||!data.ok)throw new Error('usage_unavailable');
    entryUsageRender(data);
    return data;
  }catch(_){
    entryUsageCard.dataset.loading='false';
    if(entryUsageReset)entryUsageReset.textContent='Usage unavailable right now.';
    return null;
  }
}

function entrySetLevel(nextLevel){
  if(!entryIntro)return;
  var next=Math.max(1,Math.min(4,Number(nextLevel)||1));
  if(entryLevel===2&&next!==2&&entryProductHasSavedImage){
    entryProductSetMode('view');
  }
  if(next===2&&entryLevel!==2&&entryProductHasSavedImage){
    entryProductSetMode('view');
  }
  entryLevel=next;
  if(next===3)entryUsageLoad();
  if(entryAccessCard)entryAccessCard.setAttribute('data-entry-level',String(next));
  entryWizardPanels.forEach(function(panel){
    var level=Number(panel.getAttribute('data-entry-panel')||0);
    var active=level===next;
    panel.hidden=!active;
    panel.classList.toggle('active',active);
    panel.setAttribute('aria-hidden',active?'false':'true');
  });
  entryWizardSteps.forEach(function(step){
    var level=Number(step.getAttribute('data-entry-step')||0);
    step.classList.toggle('active',level===next);
    step.classList.toggle('complete',level<next);
    if(level===next)step.setAttribute('aria-current','step');
    else step.removeAttribute('aria-current');
  });
  st('');
  try{
    window.dispatchEvent(new CustomEvent('hashcod:entry-level-change',{detail:{level:next}}));
  }catch(_){}
}
function entryProductSetData(next){
  if(!entryProductCard)return;
  var data=next&&typeof next==='object'?next:{};
  if(Object.prototype.hasOwnProperty.call(data,'title'))entryProductCard.dataset.title=String(data.title);
  if(Object.prototype.hasOwnProperty.call(data,'subtitle'))entryProductCard.dataset.subtitle=String(data.subtitle);
  if(Object.prototype.hasOwnProperty.call(data,'price'))entryProductCard.dataset.price=String(data.price);
  if(Object.prototype.hasOwnProperty.call(data,'badge'))entryProductCard.dataset.badge=String(data.badge);
  if(entryProductTitle)entryProductTitle.textContent=entryProductCard.dataset.title||'Series 8 watch';
  if(entryProductSubtitle)entryProductSubtitle.textContent=entryProductCard.dataset.subtitle||'Brushed titanium';
  if(entryProductPrice)entryProductPrice.textContent=entryProductCard.dataset.price||'$249';
  if(entryProductBadge)entryProductBadge.textContent=entryProductCard.dataset.badge||'New';
  if(entryProductTitleInput&&document.activeElement!==entryProductTitleInput)entryProductTitleInput.value=entryProductCard.dataset.title||'Series 8 watch';
  if(entryProductSubtitleInput&&document.activeElement!==entryProductSubtitleInput)entryProductSubtitleInput.value=entryProductCard.dataset.subtitle||'Brushed titanium';
}
if(entryIntro){
  entryLevel=1;
  if(entryAccessCard)entryAccessCard.setAttribute('data-entry-level','1');
  if(btn){
    btn.addEventListener('click',function(event){
      event.preventDefault();
      event.stopPropagation();
      st('');
      try{
        window.dispatchEvent(new CustomEvent('hashcod:first-screen-action',{
          detail:{screen:1,lockedToFirstScreen:true}
        }));
      }catch(_){}
    });
  }
  window.HashcodEntryWizard=Object.freeze({
    singleScreen:true,
    getLevel:function(){return 1;}
  });
}

function st(message,type){
  if(!status)return;
  status.textContent=message||'';
  status.dataset.type=type||'';
}
async function readJson(response){
  var type=(response.headers.get('content-type')||'').toLowerCase();
  var text=await response.text();
  if(!type.includes('application/json')){
    if(response.status===404)throw new Error('El endpoint ML-DSA-87 todavía no está disponible en este deployment.');
    throw new Error('Respuesta inválida del servidor ('+response.status+').');
  }
  try{return JSON.parse(text)}catch(_){throw new Error('El servidor devolvió JSON inválido.')}
}
function setPhase(nextPhase){
  phase=nextPhase===2?2:1;
  if(stepOne)stepOne.classList.toggle('complete',phase===2);
  if(stepTwo){
    stepTwo.classList.toggle('active',phase===2);
    stepTwo.classList.remove('complete');
  }
  if(description){
    description.textContent=phase===1
      ?'Paso 1 de 2 · Prueba inicial de posesión ML-DSA-87.'
      :'Paso 2 de 2 · Confirmación encadenada y anti-replay.';
  }
  if(verifyText)verifyText.textContent=phase===1?'VALIDAR PASO 1':'CONFIRMAR ACCESO';
  sig.placeholder=phase===1
    ?'Pega aquí la firma del reto actual'
    :'Firma el segundo reto y pega aquí la nueva firma';
}
function applyChallenge(data){
  setPhase(Number(data.phase||1));
  ch.textContent=data.challenge||'';
  exp=Number(data.expires_at||0);
  sig.value='';
  btn.disabled=false;
  if(pill)pill.classList.remove('active');
  clearInterval(timer);
  timer=setInterval(countdown,1000);
  countdown();
}
function countdown(){
  if(!exp)return;
  var seconds=Math.max(0,Math.ceil(exp-Date.now()/1000));
  renew.textContent=seconds>0?'NUEVO RETO · '+seconds+'S':'NUEVO RETO';
  if(seconds<=0){
    clearInterval(timer);
    resetProtocol('El reto caducó. Se generará un flujo nuevo.');
  }
}
async function load(){
  btn.disabled=true;
  setPhase(1);
  if(pill)pill.classList.add('active');
  ch.textContent='Generando reto…';
  st('Preparando protocolo de doble firma…','info');
  try{
    var response=await fetch(ep,{
      credentials:'same-origin',
      cache:'no-store',
      headers:{Accept:'application/json'}
    });
    var data=await readJson(response);
    if(!response.ok||!data.ok)throw new Error(data.error||'No se pudo generar el reto');
    if(data.authorized){location.replace('/');return;}
    if(fp)fp.textContent=(data.public_key_fingerprint||'').slice(0,16)+'…';
    applyChallenge(data);
    st('Firma el reto del Paso 1 con tu clave privada ML-DSA-87.','');
  }catch(error){
    ch.textContent='No disponible';
    if(pill)pill.classList.remove('active');
    st(error&&error.message?error.message:'Error generando reto','error');
  }
}
async function resetProtocol(message){
  sig.value='';
  exp=0;
  if(message)st(message,'info');
  await load();
}

if(!entryIntro&&renew){
  renew.addEventListener('click',function(){
    resetProtocol('Generando un protocolo nuevo desde el Paso 1…');
  });
}
if(!entryIntro&&sig){
  sig.addEventListener('focus',function(){
    if(pill)pill.classList.remove('active');
  });
}

function setDeckExpanded(expanded){
  if(!deck)return;
  deck.classList.toggle('expanded',!!expanded);
  deck.setAttribute('aria-expanded',expanded?'true':'false');
}
if(deck){
  deck.addEventListener('click',function(){
    setDeckExpanded(!deck.classList.contains('expanded'));
  });
  deck.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      setDeckExpanded(!deck.classList.contains('expanded'));
    }
  });
}

var faqCard=document.getElementById('d5FaqCard');
var faqAccordion=document.getElementById('d5FaqAccordion');
var faqFooter=document.getElementById('d5FaqFooter');
var faqBackdrop=document.getElementById('d5FaqModalBackdrop');
var faqClose=document.getElementById('d5FaqClose');
var faqLastFocus=null;
var faqTabs=faqCard?Array.from(faqCard.querySelectorAll('[data-faq-tab]')):[];

function ensureFaqModalPortal(){
  if(!document.body)return;
  if(faqBackdrop&&faqBackdrop.parentElement!==document.body){
    document.body.appendChild(faqBackdrop);
  }
  if(faqCard&&faqCard.parentElement!==document.body){
    document.body.appendChild(faqCard);
  }
}
ensureFaqModalPortal();

function openFaqModal(){
  if(!faqCard)return;
  ensureFaqModalPortal();
  faqLastFocus=document.activeElement;
  document.body.classList.add('faq-modal-open');
  faqCard.setAttribute('aria-hidden','false');
  if(faqBackdrop){
    faqBackdrop.hidden=false;
    faqBackdrop.setAttribute('aria-hidden','false');
  }
  window.requestAnimationFrame(function(){
    if(faqClose)faqClose.focus();
  });
}

function closeFaqModal(){
  if(!faqCard)return;
  document.body.classList.remove('faq-modal-open');
  faqCard.setAttribute('aria-hidden','true');
  if(faqBackdrop){
    faqBackdrop.hidden=true;
    faqBackdrop.setAttribute('aria-hidden','true');
  }
  if(window.location.hash==='#faq'){
    try{
      history.replaceState(history.state,'',location.pathname+location.search);
    }catch(_){}
  }
  if(faqLastFocus&&typeof faqLastFocus.focus==='function'){
    try{faqLastFocus.focus();}catch(_){}
  }
  faqLastFocus=null;
}

window.addEventListener('hashcod:first-screen-branched-menu-select',function(event){
  var detail=event&&event.detail?event.detail:{};
  if(detail.value==='faq')openFaqModal();
});
if(faqClose)faqClose.addEventListener('click',closeFaqModal);
if(faqBackdrop)faqBackdrop.addEventListener('click',closeFaqModal);
document.addEventListener('keydown',function(event){
  if(event.key==='Escape'&&document.body.classList.contains('faq-modal-open')){
    event.preventDefault();
    closeFaqModal();
  }
});
var faqActiveTab=0;
var faqOpenIndex=0;
var FAQ_TABS=[
  {
    label:'General',
    faqs:[
      {
        question:'¿Qué obtengo al entrar a Hashcod Codespace?',
        answer:'Al entrar a Hashcod Codespace obtienes acceso a un entorno digital diseñado para trabajar, organizar y desarrollar tu proyecto desde un mismo espacio. Podrás utilizar las herramientas disponibles de la plataforma, gestionar información relacionada con tu creación, guardar tu progreso y acceder a las funciones habilitadas para tu cuenta. La plataforma está pensada para acompañar el proceso desde la preparación de tu proyecto hasta los servicios de análisis, validación y certificación disponibles dentro del ecosistema Hashcod.'
      },
      {
        question:'¿Qué puedo hacer dentro de Hashcod Codespace?',
        answer:'Dentro de Hashcod Codespace puedes utilizar diferentes herramientas para crear, organizar, desarrollar y gestionar tu proyecto digital desde un solo entorno. La plataforma integra espacios de trabajo, herramientas técnicas, gestión de archivos, almacenamiento de información y funciones destinadas al análisis y validación de proyectos. Dependiendo de las funciones habilitadas en tu cuenta, también podrás registrar información de tu plataforma, conservar tu progreso y acceder a los diferentes recursos que forman parte del ecosistema Hashcod Codespace.'
      },
      {
        question:'¿Cómo funciona el proceso de validación de mi proyecto?',
        answer:'Cuando envías la información de tu proyecto a través de Hashcod Codespace, se genera un registro asociado a tu solicitud. Posteriormente, el proyecto puede pasar por un proceso de revisión y análisis según el servicio seleccionado. Durante esta evaluación se pueden comprobar aspectos técnicos, estructurales y funcionales del proyecto. Una vez completada la revisión y cumplidos los requisitos correspondientes, se podrá continuar con el proceso de validación o certificación disponible dentro del ecosistema Hashcod.'
      }
    ]
  },
  {
    label:'Building',
    faqs:[
      {
        question:'¿Por qué mi Toolbook está vacía cuando entro por primera vez?',
        answer:'Cuando accedes por primera vez a Hashcod Codespace, tu Toolbook estará vacía por defecto. Esto es completamente normal, ya que las herramientas y módulos de tu proyecto no se generan automáticamente. Para comenzar a llenarla, primero debes realizar una petición de desarrollo a Hashcod Codespace, explicando qué necesitas para tu plataforma, sistema o proyecto. Nuestro proceso parte de esa solicitud. A partir de ella se analizan tus necesidades, se determina qué herramientas, funciones o módulos deben desarrollarse y se organiza el trabajo correspondiente. A medida que Hashcod Codespace desarrolla e incorpora las soluciones solicitadas para tu proyecto, estas podrán aparecer dentro de tu Toolbook según las funciones habilitadas para tu cuenta. Esto permite que cada Toolbook sea diferente y se adapte al proyecto de cada usuario, en lugar de mostrar herramientas genéricas que posiblemente no necesite.'
      },
      {
        question:'¿Cómo solicito que Hashcod Codespace desarrolle una herramienta o función para mi proyecto?',
        answer:'Para solicitar una nueva herramienta, función o módulo, debes enviar una petición de desarrollo a Hashcod Codespace explicando qué deseas incorporar a tu proyecto y cuál es el objetivo de esa función. La petición será revisada para determinar los requerimientos técnicos, el alcance del desarrollo y los recursos necesarios para llevarla a cabo. Si se necesita información adicional, Hashcod Codespace podrá solicitar detalles sobre el funcionamiento esperado, diseño, integraciones, tecnologías o características específicas del proyecto. Una vez definida la solicitud, se podrá establecer el proceso de desarrollo correspondiente. Cuando la herramienta o función esté preparada y habilitada para tu cuenta, podrá integrarse dentro de tu entorno y aparecer en tu Toolbook. Cada petición se trabaja de acuerdo con las necesidades particulares del proyecto, por lo que las herramientas disponibles pueden variar entre diferentes usuarios de Hashcod Codespace.'
      },
      {
        question:'¿Qué tipo de herramientas o funciones puedo solicitar que se desarrollen?',
        answer:'En Hashcod Codespace puedes solicitar el desarrollo de herramientas, funciones o módulos adaptados a las necesidades de tu proyecto. Esto puede incluir interfaces, sistemas de gestión, automatizaciones, formularios, almacenamiento de información, paneles de control, herramientas técnicas, integraciones entre servicios y otras funciones relacionadas con el funcionamiento de tu plataforma. Cada solicitud se evalúa de forma individual para determinar si puede desarrollarse dentro del ecosistema de Hashcod Codespace, qué recursos requiere y cómo debe integrarse con el resto de tu proyecto. No todas las Toolbooks serán iguales. Las herramientas que aparezcan en tu espacio dependerán de las funciones que hayas solicitado y de los desarrollos que hayan sido habilitados específicamente para tu cuenta.'
      }
    ]
  },
  {
    label:'Goals',
    faqs:[
      {
        question:'¿Para qué sirven los Goals dentro de Hashcod Codespace?',
        answer:'Los Goals representan los objetivos que deseas alcanzar con tu proyecto dentro de Hashcod Codespace. Al definir tus objetivos, nos ayudas a comprender qué quieres construir, mejorar o solucionar en tu plataforma. Estos objetivos sirven como referencia para determinar qué herramientas, módulos y funciones pueden ser necesarias durante el desarrollo. Por ejemplo, un Goal puede ser automatizar un proceso, crear un nuevo sistema, mejorar una función existente, integrar una tecnología, organizar información o desarrollar una herramienta específica para tu proyecto. Los Goals permiten que el desarrollo tenga una dirección clara y que las soluciones incorporadas a tu Toolbook estén relacionadas directamente con las necesidades reales de tu proyecto.'
      },
      {
        question:'¿Cómo creo un Goal para mi proyecto?',
        answer:'Para crear un Goal, debes definir de forma clara qué deseas conseguir con tu proyecto. No es necesario explicar todos los detalles técnicos desde el principio; lo más importante es indicar cuál es el resultado que quieres alcanzar. Por ejemplo, puedes establecer como Goal crear una nueva función, automatizar un proceso, mejorar una parte de tu plataforma, conectar un servicio externo, organizar determinada información o desarrollar una herramienta específica. Mientras más claro sea el objetivo, más fácil será analizar qué recursos, módulos o herramientas pueden ser necesarios para desarrollarlo. Una vez definido el Goal, este puede servir como referencia para organizar las solicitudes de desarrollo y orientar las funciones que posteriormente podrán incorporarse a tu Toolbook.'
      },
      {
        question:'¿Puedo tener varios Goals al mismo tiempo?',
        answer:'Sí. Dentro de Hashcod Codespace puedes trabajar con varios Goals al mismo tiempo siempre que cada uno represente un objetivo claro dentro de tu proyecto. Por ejemplo, puedes tener un Goal enfocado en desarrollar una nueva herramienta, otro destinado a mejorar la interfaz de tu plataforma y otro relacionado con automatizar un proceso o integrar un servicio externo. Mantener los Goals separados ayuda a organizar mejor el desarrollo, identificar qué funciones pertenecen a cada objetivo y dar seguimiento al progreso de cada parte del proyecto. A medida que avances, cada Goal puede requerir distintas herramientas, módulos o soluciones, las cuales podrán incorporarse a tu Toolbook según el desarrollo realizado para tu cuenta.'
      }
    ]
  }
];

function faqChevronSvg(){
  return '<svg class="faq-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
}
function renderFaqAccordion(){
  if(!faqAccordion)return;
  var current=FAQ_TABS[faqActiveTab]||FAQ_TABS[0];
  faqAccordion.innerHTML=current.faqs.map(function(faq,index){
    var open=index===faqOpenIndex;
    return '<div class="faq-item'+(open?' open':'')+'" data-faq-index="'+index+'">'
      +'<button class="faq-question" type="button" aria-expanded="'+(open?'true':'false')+'">'
      +'<span class="faq-question-text">'+faq.question+'</span>'+faqChevronSvg()+'</button>'
      +'<div class="faq-answer-wrap"><div class="faq-answer-inner"><p class="faq-answer">'+faq.answer+'</p></div></div>'
      +'</div>';
  }).join('');
}
function setFaqTab(index){
  var next=Math.max(0,Math.min(FAQ_TABS.length-1,Number(index)||0));
  faqActiveTab=next;
  faqOpenIndex=0;
  faqTabs.forEach(function(tab,i){
    var active=i===next;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',active?'true':'false');
    var pill=tab.querySelector('.faq-tab-pill');
    if(active&&!pill){
      pill=document.createElement('span');
      pill.className='faq-tab-pill';
      tab.insertBefore(pill,tab.firstChild);
    }else if(!active&&pill){
      pill.remove();
    }
  });
  if(!faqAccordion)return;
  faqAccordion.classList.add('switching');
  window.setTimeout(function(){
    renderFaqAccordion();
    requestAnimationFrame(function(){
      faqAccordion.classList.remove('switching');
    });
  },90);
}
if(faqCard){
  faqTabs.forEach(function(tab,index){
    tab.addEventListener('click',function(){setFaqTab(index);});
  });
  faqAccordion.addEventListener('click',function(event){
    var item=event.target.closest('.faq-item');
    var button=event.target.closest('.faq-question');
    if(!item||!button)return;
    var index=Number(item.getAttribute('data-faq-index'));
    faqOpenIndex=faqOpenIndex===index?-1:index;
    Array.from(faqAccordion.querySelectorAll('.faq-item')).forEach(function(row,rowIndex){
      var open=rowIndex===faqOpenIndex;
      row.classList.toggle('open',open);
      var q=row.querySelector('.faq-question');
      if(q)q.setAttribute('aria-expanded',open?'true':'false');
    });
  });
  if(faqFooter){
    faqFooter.addEventListener('click',function(){
      var message='Hola, deseo comenzar mi solicitud en Hashcod Codespace.';
      var whatsappUrl='https://wa.me/18294721257?text='+encodeURIComponent(message);
      window.dispatchEvent(new CustomEvent('hashcod:faq-start-request',{
        detail:{channel:'whatsapp',phone:'+18294721257'}
      }));
      window.open(whatsappUrl,'_blank','noopener,noreferrer');
    });
  }
  renderFaqAccordion();
}

var savedChatRoot=document.getElementById('d5SavedChatDemo');
var savedChatMessagesEl=document.getElementById('d5SavedChatMessages');
var savedChatEmpty=document.getElementById('d5SavedChatEmpty');
var savedChatInput=document.getElementById('d5SavedChatInput');
var savedChatSend=document.getElementById('d5SavedChatSend');
var savedChatNew=document.getElementById('d5SavedChatNew');
var savedChatRefresh=document.getElementById('d5SavedChatRefresh');
var savedChatStatus=document.getElementById('d5SavedChatStatus');
var SAVED_CHAT_CLIENT_KEY='hashcod:saved-chat:client:v1';
var SAVED_CHAT_PENDING_KEY='hashcod:saved-chat:pending:v1';
var SAVED_CHAT_CACHE_KEY='hashcod:saved-chat:cache:v2';
var savedChatRemoteMessages=savedChatCachedMessages();
var savedChatLoading=false;
var savedChatPollTimer=0;

function savedChatBasePath(){
  var match=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return match?'/'+match[1]:'';
}
var SAVED_CHAT_API=savedChatBasePath()+'/api/hashcod-comments';

function savedChatUuid(){
  if(window.crypto&&typeof window.crypto.randomUUID==='function'){
    return window.crypto.randomUUID().replace(/-/g,'_');
  }
  var bytes=new Uint8Array(16);
  if(window.crypto&&typeof window.crypto.getRandomValues==='function'){
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes,function(v){return v.toString(16).padStart(2,'0');}).join('');
  }
  return 'c_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,14);
}
function savedChatClientId(){
  var id='';
  try{id=window.localStorage.getItem(SAVED_CHAT_CLIENT_KEY)||'';}catch(_){}
  if(!/^[a-zA-Z0-9_-]{8,96}$/.test(id)){
    id='hc_'+savedChatUuid().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
    try{window.localStorage.setItem(SAVED_CHAT_CLIENT_KEY,id);}catch(_){}
  }
  return id;
}
function savedChatPending(){
  try{
    var parsed=JSON.parse(window.localStorage.getItem(SAVED_CHAT_PENDING_KEY)||'[]');
    return Array.isArray(parsed)?parsed:[];
  }catch(_){return [];}
}
function savedChatSavePending(rows){
  try{window.localStorage.setItem(SAVED_CHAT_PENDING_KEY,JSON.stringify(rows.slice(-30)));}catch(_){}
}
function savedChatCachedMessages(){
  try{
    var parsed=JSON.parse(window.localStorage.getItem(SAVED_CHAT_CACHE_KEY)||'[]');
    return Array.isArray(parsed)?parsed.slice(-120):[];
  }catch(_){return [];}
}
function savedChatSaveCache(rows){
  try{window.localStorage.setItem(SAVED_CHAT_CACHE_KEY,JSON.stringify((Array.isArray(rows)?rows:[]).slice(-120)));}catch(_){}
}
function savedChatAuthToken(){
  var token='';
  try{token=window.sessionStorage.getItem('l8_auth_token')||window.localStorage.getItem('l8_auth_token')||'';}catch(_){}
  return token;
}
function savedChatHeaders(json){
  var headers={'X-Requested-With':'XMLHttpRequest','X-Hashcod-Chat-Client':savedChatClientId()};
  if(json)headers['Content-Type']='application/json';
  var token=savedChatAuthToken();
  if(token)headers.Authorization='Bearer '+token;
  return headers;
}
function savedChatSetStatus(textValue,type){
  if(!savedChatStatus)return;
  savedChatStatus.textContent=textValue||'';
  if(type)savedChatStatus.setAttribute('data-type',type);
  else savedChatStatus.removeAttribute('data-type');
}
function savedChatTime(value){
  var date=new Date(value||Date.now());
  if(Number.isNaN(date.getTime()))return '';
  try{return date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
  catch(_){return '';}
}
function savedChatCombinedMessages(){
  var rows=savedChatRemoteMessages.slice();
  savedChatPending().forEach(function(row){rows.push(row);});
  var seen={};
  rows=rows.filter(function(row){
    var key=String(row.client_nonce||row.id||'');
    if(!key||seen[key])return false;
    seen[key]=true;
    return true;
  });
  rows.sort(function(a,b){
    return String(a.created_at||'').localeCompare(String(b.created_at||''));
  });
  return rows.slice(-120);
}
function renderSavedChat(){
  if(!savedChatMessagesEl||!savedChatEmpty)return;
  var rows=savedChatCombinedMessages();
  savedChatMessagesEl.innerHTML='';
  if(!rows.length){
    savedChatEmpty.hidden=false;
    savedChatMessagesEl.hidden=true;
    return;
  }
  savedChatEmpty.hidden=true;
  savedChatMessagesEl.hidden=false;
  rows.forEach(function(row){
    var bubble=document.createElement('div');
    bubble.className='saved-chat-message'+(row.mine?' mine':'')+(row.pending?' pending':'');
    var content=document.createElement('span');
    content.textContent=String(row.content||'');
    bubble.appendChild(content);
    var time=document.createElement('span');
    time.className='saved-chat-message-time';
    time.textContent=(row.pending?'Pending · ':'')+savedChatTime(row.created_at);
    bubble.appendChild(time);
    savedChatMessagesEl.appendChild(bubble);
  });
  requestAnimationFrame(function(){
    savedChatMessagesEl.scrollTop=savedChatMessagesEl.scrollHeight;
  });
}
async function loadSavedChat(silent){
  if(!savedChatRoot||savedChatLoading)return;
  savedChatLoading=true;
  if(!silent)savedChatSetStatus('Loading…');
  try{
    var url=SAVED_CHAT_API+'?limit=100&client_id='+encodeURIComponent(savedChatClientId());
    var response=await fetch(url,{
      method:'GET',
      headers:savedChatHeaders(false),
      credentials:'same-origin',
      cache:'no-store'
    });
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.ok)throw new Error(data.error||'Could not load comments');
    var incoming=Array.isArray(data.messages)?data.messages:[];
    // A degraded empty response must not erase the last durable browser copy.
    if(incoming.length||!data.degraded||!savedChatRemoteMessages.length){
      savedChatRemoteMessages=incoming;
      savedChatSaveCache(savedChatRemoteMessages);
    }
    renderSavedChat();
    if(!silent){
      savedChatSetStatus(data.degraded?'Loaded from durable fallback':'Saved in Codespace',data.degraded?'':'ok');
    }
  }catch(error){
    // Keep showing cached/queued messages without presenting a false offline
    // warning when a security layer or transient request interrupts polling.
    renderSavedChat();
    if(!silent)savedChatSetStatus('');
  }finally{
    savedChatLoading=false;
  }
}
async function postSavedChatPending(row){
  var response=await fetch(SAVED_CHAT_API,{
    method:'POST',
    headers:savedChatHeaders(true),
    credentials:'same-origin',
    cache:'no-store',
    body:JSON.stringify({
      client_id:savedChatClientId(),
      client_nonce:row.client_nonce,
      content:row.content
    })
  });
  var data=await response.json().catch(function(){return {};});
  if(!response.ok||!data.ok)throw new Error(data.error||'Could not save comment');
  return data;
}
async function retrySavedChatPending(){
  var queue=savedChatPending();
  if(!queue.length)return true;
  var remaining=[];
  for(var i=0;i<queue.length;i++){
    try{
      var synced=await postSavedChatPending(queue[i]);
      if(synced&&synced.message){
        savedChatRemoteMessages=savedChatRemoteMessages.filter(function(row){return row.id!==synced.message.id;});
        savedChatRemoteMessages.push(synced.message);
        savedChatSaveCache(savedChatRemoteMessages);
      }
    }catch(_){
      remaining.push(queue[i]);
    }
  }
  savedChatSavePending(remaining);
  renderSavedChat();
  return remaining.length===0;
}
async function sendSavedChatMessage(){
  if(!savedChatInput||!savedChatSend)return;
  var content=String(savedChatInput.value||'').trim();
  if(!content)return;
  if(content.length>1200){
    savedChatSetStatus('Maximum 1200 characters','error');
    return;
  }
  var nonce='n_'+savedChatUuid().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
  var optimistic={
    id:'pending_'+nonce,
    client_nonce:nonce,
    content:content,
    created_at:new Date().toISOString(),
    mine:true,
    pending:true
  };
  var queue=savedChatPending();
  queue.push(optimistic);
  savedChatSavePending(queue);
  savedChatInput.value='';
  savedChatSend.disabled=true;
  renderSavedChat();
  savedChatSetStatus('Saving…');
  try{
    var result=await postSavedChatPending(optimistic);
    if(result&&result.message){
      savedChatRemoteMessages=savedChatRemoteMessages.filter(function(row){return row.id!==result.message.id;});
      savedChatRemoteMessages.push(result.message);
      savedChatSaveCache(savedChatRemoteMessages);
    }
    savedChatSavePending(savedChatPending().filter(function(row){return row.client_nonce!==nonce;}));
    renderSavedChat();
    savedChatSetStatus(result.deferred?'Saved · sync queued':'Saved','ok');
    await loadSavedChat(true);
  }catch(error){
    savedChatSetStatus('Saved locally · syncing');
    renderSavedChat();
  }finally{
    savedChatSend.disabled=false;
    savedChatInput.focus();
  }
}
async function refreshSavedChat(){
  if(savedChatRefresh)savedChatRefresh.classList.add('spinning');
  savedChatSetStatus('Refreshing…');
  await retrySavedChatPending();
  await loadSavedChat(false);
  window.setTimeout(function(){
    if(savedChatRefresh)savedChatRefresh.classList.remove('spinning');
  },700);
}
if(savedChatRoot){
  renderSavedChat();
  loadSavedChat(false);
  retrySavedChatPending().then(function(){loadSavedChat(true);});
  savedChatPollTimer=window.setInterval(function(){
    if(document.visibilityState==='visible')loadSavedChat(true);
  },6000);
  window.addEventListener('online',function(){
    retrySavedChatPending().then(function(){loadSavedChat(true);});
  });
}
if(savedChatSend)savedChatSend.addEventListener('click',sendSavedChatMessage);
if(savedChatRefresh)savedChatRefresh.addEventListener('click',refreshSavedChat);
if(savedChatNew)savedChatNew.addEventListener('click',function(){
  if(!savedChatInput)return;
  savedChatInput.value='';
  savedChatInput.focus();
  savedChatSetStatus('');
});
if(savedChatInput){
  savedChatInput.addEventListener('keydown',function(event){
    if(event.key==='Enter'&&!event.shiftKey){
      event.preventDefault();
      sendSavedChatMessage();
    }
  });
}

var textEditorCard=document.getElementById('d5TextEditorCard');
var textEditorInput=document.getElementById('d5TextEditorInput');
var textEditorStatus=document.getElementById('d5TextEditorStatus');
var textEditorCount=document.getElementById('d5TextEditorCount');
var textEditorImport=document.getElementById('d5TextEditorImport');
var textEditorFile=document.getElementById('d5TextEditorFile');
var textEditorNormalize=document.getElementById('d5TextEditorNormalize');
var textEditorClean=document.getElementById('d5TextEditorClean');
var textEditorExport=document.getElementById('d5TextEditorExport');
var textEditorClear=document.getElementById('d5TextEditorClear');
var textEditorEncoding=document.getElementById('d5TextEditorEncoding');
var textEditorFormatbar=document.getElementById('d5TextEditorFormatbar');
var textEditorSlashMenu=document.getElementById('d5TextEditorSlashMenu');
var textEditorSlashItems=textEditorSlashMenu?Array.from(textEditorSlashMenu.querySelectorAll('[data-editor-slash]')):[];
var textEditorUndoStack=[];
var textEditorRedoStack=[];
var textEditorHistoryApplying=false;
var textEditorSlashActiveIndex=0;
var TEXT_EDITOR_CLIENT_KEY='hashcod:text-editor:client:v1';
var TEXT_EDITOR_CACHE_KEY='hashcod:text-editor:draft:v1';
var textEditorSaveTimer=0;
var textEditorDirty=false;
var textEditorSaving=false;
var textEditorLoaded=false;

function textEditorBasePath(){
  var match=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return match?'/'+match[1]:'';
}
var TEXT_EDITOR_API=textEditorBasePath()+'/api/hashcod-text-editor';

function textEditorUuid(){
  if(window.crypto&&typeof window.crypto.randomUUID==='function'){
    return window.crypto.randomUUID().replace(/-/g,'_');
  }
  var bytes=new Uint8Array(18);
  if(window.crypto&&typeof window.crypto.getRandomValues==='function'){
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes,function(v){return v.toString(16).padStart(2,'0');}).join('');
  }
  return 'te_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,16);
}
function textEditorClientId(){
  var id='';
  try{id=window.localStorage.getItem(TEXT_EDITOR_CLIENT_KEY)||'';}catch(_){}
  if(!/^[a-zA-Z0-9_-]{16,96}$/.test(id)){
    id='hte_'+textEditorUuid().replace(/[^a-zA-Z0-9_-]/g,'').slice(0,88);
    try{window.localStorage.setItem(TEXT_EDITOR_CLIENT_KEY,id);}catch(_){}
  }
  return id;
}
function textEditorLocalRead(){
  try{
    var parsed=JSON.parse(window.localStorage.getItem(TEXT_EDITOR_CACHE_KEY)||'null');
    return parsed&&typeof parsed==='object'?parsed:null;
  }catch(_){return null;}
}
function textEditorLocalWrite(content,updatedAt){
  try{
    window.localStorage.setItem(TEXT_EDITOR_CACHE_KEY,JSON.stringify({
      content:String(content||''),
      updated_at:updatedAt||new Date().toISOString(),
      editor:'tagspaces-editorText-adapted',
      version:1
    }));
  }catch(_){}
}
function textEditorSetStatus(state,label){
  if(!textEditorStatus)return;
  textEditorStatus.setAttribute('data-state',state||'');
  var span=textEditorStatus.querySelector('span');
  if(span)span.textContent=label||'';
}
function textEditorAutosize(){
  if(!textEditorInput)return;
  textEditorInput.style.height='auto';
  textEditorInput.style.height=Math.max(52,textEditorInput.scrollHeight)+'px';
}
function textEditorUpdateCount(){
  if(!textEditorCount||!textEditorInput)return;
  var value=String(textEditorInput.value||'');
  var chars=Array.from(value).length;
  var words=value.trim()?value.trim().split(/\s+/u).filter(Boolean).length:0;
  var lines=value===''?0:value.split('\n').length;
  textEditorCount.textContent=lines+' '+(lines===1?'line':'lines')+' · '+words+' '+(words===1?'word':'words')+' · '+chars+' '+(chars===1?'character':'characters');
}
function textEditorSetEncoding(label){
  if(textEditorEncoding)textEditorEncoding.textContent=String(label||'UTF-8').toUpperCase();
}
function textEditorNormalizeLineEndings(value){
  return String(value==null?'':value).replace(/\r\n?/g,'\n');
}
function textEditorCleanValue(value){
  return textEditorNormalizeLineEndings(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,'')
    .replace(/^\uFEFF/,'');
}
function textEditorNormalizeValue(value){
  var cleaned=textEditorCleanValue(value);
  try{return cleaned.normalize('NFKC');}catch(_){return cleaned;}
}
// Banger Editor-inspired command layer.
// Source inspiration: bangle-io/banger-editor (MIT), especially the bold,
// italic, underline, strike, heading, blockquote, code, code-block, list,
// link, horizontal-rule, history and suggestions modules. Hashcod keeps its
// existing textarea/autosave architecture and translates those concepts to
// deterministic Markdown transformations.
function textEditorSnapshot(){
  if(!textEditorInput)return null;
  return {
    value:String(textEditorInput.value||''),
    start:typeof textEditorInput.selectionStart==='number'?textEditorInput.selectionStart:0,
    end:typeof textEditorInput.selectionEnd==='number'?textEditorInput.selectionEnd:0
  };
}
function textEditorSnapshotsEqual(a,b){
  return !!a&&!!b&&a.value===b.value&&a.start===b.start&&a.end===b.end;
}
function textEditorPushUndo(){
  if(!textEditorInput||textEditorHistoryApplying)return;
  var snapshot=textEditorSnapshot();
  var last=textEditorUndoStack.length?textEditorUndoStack[textEditorUndoStack.length-1]:null;
  if(!textEditorSnapshotsEqual(snapshot,last)){
    textEditorUndoStack.push(snapshot);
    if(textEditorUndoStack.length>120)textEditorUndoStack.shift();
  }
  textEditorRedoStack.length=0;
}
function textEditorRestoreSnapshot(snapshot,label){
  if(!textEditorInput||!snapshot)return;
  textEditorHistoryApplying=true;
  textEditorInput.value=String(snapshot.value||'');
  var max=textEditorInput.value.length;
  var start=Math.max(0,Math.min(max,Number(snapshot.start)||0));
  var end=Math.max(start,Math.min(max,Number(snapshot.end)||start));
  textEditorInput.setSelectionRange(start,end);
  textEditorHistoryApplying=false;
  textEditorSetEncoding('UTF-8');
  textEditorMarkEdited(label||'History');
  textEditorInput.focus();
}
function textEditorUndo(){
  if(!textEditorInput||!textEditorUndoStack.length)return;
  var current=textEditorSnapshot();
  var target=textEditorUndoStack.pop();
  if(current)textEditorRedoStack.push(current);
  textEditorRestoreSnapshot(target,'Undo');
}
function textEditorRedo(){
  if(!textEditorInput||!textEditorRedoStack.length)return;
  var current=textEditorSnapshot();
  var target=textEditorRedoStack.pop();
  if(current){
    textEditorUndoStack.push(current);
    if(textEditorUndoStack.length>120)textEditorUndoStack.shift();
  }
  textEditorRestoreSnapshot(target,'Redo');
}
function textEditorSelection(){
  if(!textEditorInput)return {start:0,end:0,value:'',selected:''};
  var value=String(textEditorInput.value||'');
  var start=typeof textEditorInput.selectionStart==='number'?textEditorInput.selectionStart:0;
  var end=typeof textEditorInput.selectionEnd==='number'?textEditorInput.selectionEnd:start;
  return {start:start,end:end,value:value,selected:value.slice(start,end)};
}
function textEditorLineRange(){
  var selection=textEditorSelection();
  var lineStart=selection.value.lastIndexOf('\n',Math.max(0,selection.start-1))+1;
  var lineEnd=selection.value.indexOf('\n',selection.end);
  if(lineEnd<0)lineEnd=selection.value.length;
  return {start:lineStart,end:lineEnd,value:selection.value,text:selection.value.slice(lineStart,lineEnd)};
}
function textEditorReplaceRange(start,end,replacement,selectStart,selectEnd,label){
  if(!textEditorInput)return;
  textEditorInput.setRangeText(String(replacement),start,end,'end');
  var max=textEditorInput.value.length;
  var from=Math.max(0,Math.min(max,typeof selectStart==='number'?selectStart:start+String(replacement).length));
  var to=Math.max(from,Math.min(max,typeof selectEnd==='number'?selectEnd:from));
  textEditorInput.setSelectionRange(from,to);
  textEditorSetEncoding('UTF-8');
  textEditorMarkEdited(label||'Formatted');
  textEditorInput.focus();
}
function textEditorWrapSelection(before,after,placeholder,label){
  var selection=textEditorSelection();
  var inner=selection.selected||placeholder||'text';
  var replacement=before+inner+after;
  var innerStart=selection.start+before.length;
  textEditorReplaceRange(selection.start,selection.end,replacement,innerStart,innerStart+inner.length,label);
}
function textEditorReplaceSelectedLines(transform,label){
  if(!textEditorInput||typeof transform!=='function')return;
  var range=textEditorLineRange();
  var output=String(transform(range.text));
  if(output===range.text){
    textEditorSetStatus('saved','No changes');
    return;
  }
  textEditorReplaceRange(range.start,range.end,output,range.start,range.start+output.length,label);
}
function textEditorSetHeading(level){
  var prefix=new Array(level+1).join('#')+' ';
  textEditorReplaceSelectedLines(function(block){
    return block.split('\n').map(function(line){return prefix+line.replace(/^#{1,6}\s+/,'');}).join('\n');
  },'Heading '+level);
}
function textEditorToggleQuote(){
  textEditorReplaceSelectedLines(function(block){
    var lines=block.split('\n');
    var allQuoted=lines.every(function(line){return /^>\s?/.test(line);});
    return lines.map(function(line){return allQuoted?line.replace(/^>\s?/,''):'> '+line;}).join('\n');
  },'Blockquote');
}
function textEditorToggleBullet(){
  textEditorReplaceSelectedLines(function(block){
    var lines=block.split('\n');
    var allBullets=lines.every(function(line){return /^\s*[-*+]\s+/.test(line);});
    return lines.map(function(line){
      if(allBullets)return line.replace(/^(\s*)[-*+]\s+/,'$1');
      return '- '+line.replace(/^\s*(?:[-*+]|\d+\.)\s+/,'');
    }).join('\n');
  },'Bullet list');
}
function textEditorToggleOrdered(){
  textEditorReplaceSelectedLines(function(block){
    var lines=block.split('\n');
    var allOrdered=lines.every(function(line){return /^\s*\d+\.\s+/.test(line);});
    return lines.map(function(line,index){
      if(allOrdered)return line.replace(/^(\s*)\d+\.\s+/,'$1');
      return (index+1)+'. '+line.replace(/^\s*(?:[-*+]|\d+\.)\s+/,'');
    }).join('\n');
  },'Numbered list');
}
function textEditorParagraph(){
  textEditorReplaceSelectedLines(function(block){
    return block.split('\n').map(function(line){
      return line.replace(/^#{1,6}\s+/,'').replace(/^>\s?/,'').replace(/^\s*[-*+]\s+/,'').replace(/^\s*\d+\.\s+/,'');
    }).join('\n');
  },'Paragraph');
}
function textEditorCodeBlock(){
  var range=textEditorLineRange();
  var block=range.text;
  var fence=String.fromCharCode(96,96,96);
  var trimmed=block.trim();
  if(trimmed.indexOf(fence)===0&&trimmed.lastIndexOf(fence)===trimmed.length-fence.length){
    var firstBreak=trimmed.indexOf('\n');
    var inner=firstBreak>=0?trimmed.slice(firstBreak+1,trimmed.length-fence.length).replace(/\n$/,''):'';
    textEditorReplaceRange(range.start,range.end,inner,range.start,range.start+inner.length,'Code block removed');
    return;
  }
  var replacement=fence+'\n'+block+'\n'+fence;
  textEditorReplaceRange(range.start,range.end,replacement,range.start+fence.length+1,range.start+fence.length+1+block.length,'Code block');
}
function textEditorInsertRule(){
  var selection=textEditorSelection();
  var before=selection.start>0&&selection.value.charAt(selection.start-1)!=='\n'?'\n':'';
  var after=selection.end<selection.value.length&&selection.value.charAt(selection.end)!=='\n'?'\n':'';
  var replacement=before+'---'+after;
  var caret=selection.start+replacement.length;
  textEditorReplaceRange(selection.start,selection.end,replacement,caret,caret,'Horizontal rule');
}
function textEditorInsertLink(url){
  var selection=textEditorSelection();
  var label=selection.selected||'link';
  var safeUrl=String(url||'').trim();
  if(!safeUrl)return;
  var replacement='['+label+']('+safeUrl+')';
  var labelStart=selection.start+1;
  textEditorReplaceRange(selection.start,selection.end,replacement,labelStart,labelStart+label.length,'Link');
}
function textEditorSlashContext(){
  if(!textEditorInput)return null;
  var selection=textEditorSelection();
  if(selection.start!==selection.end)return null;
  var lineStart=selection.value.lastIndexOf('\n',Math.max(0,selection.start-1))+1;
  var before=selection.value.slice(lineStart,selection.start);
  var match=before.match(/^(\s*)\/([a-z0-9-]*)$/i);
  if(!match)return null;
  return {start:lineStart+match[1].length,end:selection.start,query:String(match[2]||'').toLowerCase()};
}
function textEditorVisibleSlashItems(){return textEditorSlashItems.filter(function(item){return !item.hidden;});}
function textEditorSetSlashActive(index){
  var visible=textEditorVisibleSlashItems();
  if(!visible.length){textEditorSlashActiveIndex=0;return;}
  textEditorSlashActiveIndex=(index%visible.length+visible.length)%visible.length;
  visible.forEach(function(item,itemIndex){item.dataset.active=itemIndex===textEditorSlashActiveIndex?'true':'false';});
  var active=visible[textEditorSlashActiveIndex];
  if(active&&typeof active.scrollIntoView==='function')active.scrollIntoView({block:'nearest'});
}
function textEditorHideSlashMenu(){
  if(!textEditorSlashMenu)return;
  textEditorSlashMenu.hidden=true;
  textEditorSlashItems.forEach(function(item){item.dataset.active='false';});
  textEditorSlashActiveIndex=0;
}
function textEditorRefreshSlashMenu(){
  if(!textEditorSlashMenu)return;
  var context=textEditorSlashContext();
  if(!context){textEditorHideSlashMenu();return;}
  var query=context.query;
  textEditorSlashItems.forEach(function(item){
    var hay=(String(item.getAttribute('data-editor-keywords')||'')+' '+String(item.textContent||'')).toLowerCase();
    item.hidden=!!query&&hay.indexOf(query)<0;
  });
  var visible=textEditorVisibleSlashItems();
  if(!visible.length){textEditorHideSlashMenu();return;}
  textEditorSlashMenu.hidden=false;
  textEditorSetSlashActive(0);
}
function textEditorOpenSlashMenu(){
  if(!textEditorInput)return;
  var context=textEditorSlashContext();
  if(!context){
    textEditorPushUndo();
    var selection=textEditorSelection();
    textEditorInput.setRangeText('/',selection.start,selection.end,'end');
    textEditorMarkEdited('Command menu');
  }
  textEditorRefreshSlashMenu();
  textEditorInput.focus();
}
function textEditorApplySlashCommand(command){
  if(!textEditorInput)return;
  var context=textEditorSlashContext();
  if(!context)return;
  textEditorPushUndo();
  textEditorInput.setRangeText('',context.start,context.end,'end');
  textEditorHideSlashMenu();
  textEditorMarkEdited('Command');
  textEditorRunCommand(command,{skipHistory:true,fromSlash:true});
}
function textEditorRunCommand(command,options){
  if(!textEditorInput)return;
  var opts=options||{};
  var name=String(command||'').toLowerCase();
  if(name==='undo'){textEditorUndo();return;}
  if(name==='redo'){textEditorRedo();return;}
  if(name==='slash'){textEditorOpenSlashMenu();return;}
  var linkUrl='';
  if(name==='link'){
    linkUrl=window.prompt('Link URL','https://')||'';
    if(!linkUrl)return;
  }
  if(!opts.skipHistory)textEditorPushUndo();
  if(name==='bold')textEditorWrapSelection('**','**','bold text','Bold');
  else if(name==='italic')textEditorWrapSelection('*','*','italic text','Italic');
  else if(name==='underline')textEditorWrapSelection('<u>','</u>','underlined text','Underline');
  else if(name==='strike')textEditorWrapSelection('~~','~~','strikethrough','Strikethrough');
  else if(name==='code'){var tick=String.fromCharCode(96);textEditorWrapSelection(tick,tick,'code','Inline code');}
  else if(name==='h1')textEditorSetHeading(1);
  else if(name==='h2')textEditorSetHeading(2);
  else if(name==='h3')textEditorSetHeading(3);
  else if(name==='quote')textEditorToggleQuote();
  else if(name==='bullet')textEditorToggleBullet();
  else if(name==='ordered')textEditorToggleOrdered();
  else if(name==='paragraph')textEditorParagraph();
  else if(name==='codeblock')textEditorCodeBlock();
  else if(name==='rule')textEditorInsertRule();
  else if(name==='link')textEditorInsertLink(linkUrl);
}
function textEditorMarkEdited(label){
  if(!textEditorInput)return;
  textEditorDirty=true;
  textEditorAutosize();
  textEditorUpdateCount();
  textEditorLocalWrite(textEditorInput.value,new Date().toISOString());
  textEditorSetStatus('saving',label||'Editing');
  scheduleTextEditorSave(700);
  window.dispatchEvent(new CustomEvent('hashcod:text-editor-change',{
    detail:{length:(textEditorInput.value||'').length}
  }));
}
function textEditorTransformSelection(transform,label){
  if(!textEditorInput||typeof transform!=='function')return;
  var start=typeof textEditorInput.selectionStart==='number'?textEditorInput.selectionStart:0;
  var end=typeof textEditorInput.selectionEnd==='number'?textEditorInput.selectionEnd:start;
  var current=String(textEditorInput.value||'');
  var selected=end>start;
  var input=selected?current.slice(start,end):current;
  var output=String(transform(input));
  if(output===input){
    textEditorSetStatus('saved','No changes');
    return;
  }
  textEditorPushUndo();
  if(selected){
    textEditorInput.setRangeText(output,start,end,'select');
  }else{
    textEditorInput.value=output;
    textEditorInput.setSelectionRange(output.length,output.length);
  }
  textEditorSetEncoding('UTF-8');
  textEditorMarkEdited(label);
  textEditorInput.focus();
}
async function textEditorDecodeFile(file){
  if(!file)throw new Error('No file selected');
  if(Number(file.size||0)>65536)throw new Error('File exceeds 64 KB');
  var buffer=await file.arrayBuffer();
  var bytes=new Uint8Array(buffer);
  var text='';
  var encoding='UTF-8';
  if(bytes.length>=3&&bytes[0]===0xEF&&bytes[1]===0xBB&&bytes[2]===0xBF){
    text=new TextDecoder('utf-8').decode(bytes.subarray(3));
  }else{
    try{
      text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    }catch(_){
      try{
        text=new TextDecoder('shift_jis',{fatal:false}).decode(bytes);
        encoding='SHIFT-JIS';
      }catch(__){
        text=new TextDecoder('utf-8',{fatal:false}).decode(bytes);
        encoding='UTF-8?';
      }
    }
  }
  return {text:textEditorCleanValue(text),encoding:encoding};
}
function textEditorExportTxt(){
  if(!textEditorInput)return;
  var blob=new Blob(['\uFEFF'+String(textEditorInput.value||'')],{type:'text/plain;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='hashcod-workspace-draft.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(function(){URL.revokeObjectURL(url);},0);
  textEditorSetStatus('saved','TXT exported');
}
function textEditorApplyContent(content){
  if(!textEditorInput)return;
  textEditorInput.value=String(content||'');
  textEditorAutosize();
  textEditorUpdateCount();
}
function textEditorTimestamp(value){
  var n=Date.parse(String(value||''));
  return Number.isFinite(n)?n:0;
}
async function textEditorLoad(){
  if(!textEditorInput||textEditorLoaded)return;
  textEditorLoaded=true;

  var local=textEditorLocalRead();
  if(local&&typeof local.content==='string'){
    textEditorApplyContent(local.content);
    textEditorSetStatus('loading','Syncing');
  }else{
    textEditorAutosize();
    textEditorUpdateCount();
    textEditorSetStatus('loading','Loading');
  }

  try{
    var url=TEXT_EDITOR_API+'?client_id='+encodeURIComponent(textEditorClientId());
    var response=await fetch(url,{
      method:'GET',
      credentials:'same-origin',
      cache:'no-store',
      headers:{'X-Requested-With':'XMLHttpRequest'}
    });
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.ok)throw new Error(data.error||'Could not load text');

    if(!textEditorDirty){
      var localTime=local?textEditorTimestamp(local.updated_at):0;
      var remoteTime=textEditorTimestamp(data.updated_at);
      if(typeof data.content==='string'&&(!local||remoteTime>=localTime)){
        textEditorApplyContent(data.content);
        textEditorLocalWrite(data.content,data.updated_at||new Date().toISOString());
      }else if(local&&localTime>remoteTime){
        scheduleTextEditorSave(80);
      }
    }
    textEditorSetStatus('saved',data.cloud_available===false?'Saved locally':'Saved');
  }catch(_){
    textEditorSetStatus('offline',local?'Local copy':'Offline');
  }
}
async function textEditorSave(){
  if(!textEditorInput||textEditorSaving)return;
  window.clearTimeout(textEditorSaveTimer);
  textEditorSaveTimer=0;

  var content=textEditorInput.value||'';
  var localTime=new Date().toISOString();
  textEditorLocalWrite(content,localTime);
  textEditorSaving=true;
  textEditorSetStatus('saving','Saving');

  try{
    var response=await fetch(TEXT_EDITOR_API,{
      method:'POST',
      credentials:'same-origin',
      cache:'no-store',
      headers:{
        'Content-Type':'application/json',
        'X-Requested-With':'XMLHttpRequest'
      },
      body:JSON.stringify({
        client_id:textEditorClientId(),
        content:content
      })
    });
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.ok)throw new Error(data.error||'Could not save text');
    textEditorLocalWrite(content,data.updated_at||localTime);
    textEditorDirty=false;
    textEditorSetStatus('saved',data.saved==='local'?'Saved locally':'Saved');
    window.dispatchEvent(new CustomEvent('hashcod:text-editor-saved',{
      detail:{updated_at:data.updated_at||localTime,storage:data.saved||'unknown'}
    }));
  }catch(_){
    textEditorSetStatus('offline','Saved locally');
  }finally{
    textEditorSaving=false;
  }
}
function scheduleTextEditorSave(delay){
  window.clearTimeout(textEditorSaveTimer);
  textEditorSaveTimer=window.setTimeout(textEditorSave,typeof delay==='number'?delay:700);
}
if(textEditorImport&&textEditorFile){
  textEditorImport.addEventListener('click',function(){
    textEditorFile.value='';
    textEditorFile.click();
  });
  textEditorFile.addEventListener('change',async function(){
    var file=textEditorFile.files&&textEditorFile.files[0];
    if(!file)return;
    textEditorSetStatus('loading','Reading');
    try{
      var decoded=await textEditorDecodeFile(file);
      textEditorPushUndo();
      textEditorApplyContent(decoded.text);
      textEditorSetEncoding(decoded.encoding);
      textEditorDirty=true;
      textEditorLocalWrite(textEditorInput.value,new Date().toISOString());
      textEditorSetStatus('saving','Imported · '+decoded.encoding);
      scheduleTextEditorSave(120);
    }catch(error){
      textEditorSetStatus('offline',error&&error.message?error.message:'Could not read file');
    }
  });
}
if(textEditorNormalize)textEditorNormalize.addEventListener('click',function(){
  textEditorTransformSelection(textEditorNormalizeValue,'Normalized');
});
if(textEditorClean)textEditorClean.addEventListener('click',function(){
  textEditorTransformSelection(textEditorCleanValue,'Cleaned');
});
if(textEditorExport)textEditorExport.addEventListener('click',textEditorExportTxt);
if(textEditorClear)textEditorClear.addEventListener('click',function(){
  if(!textEditorInput||!String(textEditorInput.value||''))return;
  if(!window.confirm('Clear the current workspace draft?'))return;
  textEditorPushUndo();
  textEditorInput.value='';
  textEditorSetEncoding('UTF-8');
  textEditorMarkEdited('Cleared');
  textEditorInput.focus();
});

if(textEditorFormatbar){
  textEditorFormatbar.addEventListener('mousedown',function(event){
    var button=event.target&&event.target.closest?event.target.closest('[data-editor-command]'):null;
    if(button&&textEditorFormatbar.contains(button))event.preventDefault();
  });
  textEditorFormatbar.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('[data-editor-command]'):null;
    if(!button||!textEditorFormatbar.contains(button))return;
    textEditorRunCommand(button.getAttribute('data-editor-command'));
  });
}
if(textEditorSlashMenu){
  textEditorSlashMenu.addEventListener('mousedown',function(event){event.preventDefault();});
  textEditorSlashMenu.addEventListener('click',function(event){
    var button=event.target&&event.target.closest?event.target.closest('[data-editor-slash]'):null;
    if(!button||button.hidden)return;
    textEditorApplySlashCommand(button.getAttribute('data-editor-slash'));
  });
}
if(textEditorInput){
  textEditorInput.addEventListener('beforeinput',function(event){
    if(textEditorHistoryApplying)return;
    var inputType=String(event.inputType||'');
    if(inputType.indexOf('history')===0)return;
    textEditorPushUndo();
  });
  textEditorInput.addEventListener('input',function(){
    textEditorSetEncoding('UTF-8');
    textEditorMarkEdited('Editing');
    textEditorRefreshSlashMenu();
  });
  textEditorInput.addEventListener('click',textEditorRefreshSlashMenu);
  textEditorInput.addEventListener('keyup',function(event){
    if(['ArrowDown','ArrowUp','Enter','Escape'].indexOf(event.key)<0)textEditorRefreshSlashMenu();
  });
  textEditorInput.addEventListener('keydown',function(event){
    var modifier=event.ctrlKey||event.metaKey;
    var key=String(event.key||'').toLowerCase();
    if(textEditorSlashMenu&&!textEditorSlashMenu.hidden){
      var visible=textEditorVisibleSlashItems();
      if(event.key==='ArrowDown'){event.preventDefault();textEditorSetSlashActive(textEditorSlashActiveIndex+1);return;}
      if(event.key==='ArrowUp'){event.preventDefault();textEditorSetSlashActive(textEditorSlashActiveIndex-1);return;}
      if(event.key==='Enter'&&visible.length){
        event.preventDefault();
        var active=visible[textEditorSlashActiveIndex]||visible[0];
        textEditorApplySlashCommand(active.getAttribute('data-editor-slash'));
        return;
      }
      if(event.key==='Escape'){event.preventDefault();textEditorHideSlashMenu();return;}
    }
    if(modifier&&key==='s'){event.preventDefault();textEditorSave();return;}
    if(modifier&&!event.shiftKey&&key==='z'){event.preventDefault();textEditorUndo();return;}
    if(modifier&&(key==='y'||(event.shiftKey&&key==='z'))){event.preventDefault();textEditorRedo();return;}
    if(modifier&&!event.shiftKey&&key==='b'){event.preventDefault();textEditorRunCommand('bold');return;}
    if(modifier&&!event.shiftKey&&key==='i'){event.preventDefault();textEditorRunCommand('italic');return;}
    if(modifier&&!event.shiftKey&&key==='u'){event.preventDefault();textEditorRunCommand('underline');return;}
    if(modifier&&event.shiftKey&&key==='x'){event.preventDefault();textEditorRunCommand('strike');return;}
    if(modifier&&!event.shiftKey&&key==='k'){event.preventDefault();textEditorRunCommand('link');return;}
    if(modifier&&event.altKey&&['1','2','3'].indexOf(key)>=0){event.preventDefault();textEditorRunCommand('h'+key);return;}
    if(modifier&&event.shiftKey&&key==='7'){event.preventDefault();textEditorRunCommand('ordered');return;}
    if(modifier&&event.shiftKey&&key==='8'){event.preventDefault();textEditorRunCommand('bullet');return;}
    if(event.key==='Tab'&&!modifier&&!event.altKey){
      event.preventDefault();
      textEditorPushUndo();
      var start=textEditorInput.selectionStart;
      var end=textEditorInput.selectionEnd;
      textEditorInput.setRangeText('    ',start,end,'end');
      textEditorMarkEdited('Editing');
    }
  });
  document.addEventListener('pointerdown',function(event){
    if(!textEditorSlashMenu||textEditorSlashMenu.hidden)return;
    if(event.target===textEditorInput||textEditorSlashMenu.contains(event.target))return;
    textEditorHideSlashMenu();
  });
  window.addEventListener('beforeunload',function(){
    textEditorLocalWrite(textEditorInput.value,new Date().toISOString());
  });
  requestAnimationFrame(function(){
    textEditorAutosize();
    textEditorUpdateCount();
    textEditorLoad();
  });
}

var numberTickerRoot=document.getElementById('d5NumberTicker');
var tickerDecrease=document.getElementById('d5TickerDecrease');
var tickerRandomize=document.getElementById('d5TickerRandomize');
var tickerIncrease=document.getElementById('d5TickerIncrease');
var tiltPrice=document.getElementById('d5TiltPrice');
var NUMBER_TICKER_STEP=.32;
var NUMBER_TICKER_STORAGE_KEY='hashcod:number-ticker:value:v2';
var NUMBER_TICKER_DEFAULT=60;
function loadStoredNumberTickerValue(){
  try{
    var stored=window.localStorage.getItem(NUMBER_TICKER_STORAGE_KEY);
    if(stored===null||stored==='')return NUMBER_TICKER_DEFAULT;
    var parsed=Number(stored);
    return Number.isFinite(parsed)&&parsed>=0?Math.round(parsed*100)/100:NUMBER_TICKER_DEFAULT;
  }catch(_){
    return NUMBER_TICKER_DEFAULT;
  }
}
function persistNumberTickerValue(value){
  try{
    var normalized=Math.max(0,Math.round(Number(value)*100)/100);
    window.localStorage.setItem(NUMBER_TICKER_STORAGE_KEY,normalized.toFixed(2));
  }catch(_){}
}
var numberTickerValue=loadStoredNumberTickerValue();
var numberTickerEntered=false;
var numberTickerArmed=false;
var numberTickerEntranceTimer=0;

function numberTickerFormat(value){
  var normalized=Math.round(Number(value)*100)/100;
  try{
    return normalized.toLocaleString(undefined,{
      minimumFractionDigits:2,
      maximumFractionDigits:2
    });
  }catch(_){
    return normalized.toFixed(2);
  }
}
function syncSlotPrice(value){
  if(!tiltPrice)return;
  var formatted='$'+numberTickerFormat(value);
  tiltPrice.textContent=formatted;
  tiltPrice.setAttribute('aria-label','Current slot price '+formatted);
}
function numberTickerGlyphs(value){
  var text=numberTickerFormat(value);
  var chars=text.split('');
  return chars.map(function(char,index){
    return {char:char,id:'g-'+(chars.length-1-index)};
  });
}
function createNumberTickerDigit(id){
  var digit=document.createElement('span');
  digit.className='number-ticker-digit';
  digit.setAttribute('data-ticker-id',id);
  digit.setAttribute('data-ticker-type','digit');
  var column=document.createElement('span');
  column.className='number-ticker-column';
  for(var n=0;n<10;n++){
    var glyph=document.createElement('span');
    glyph.className='number-ticker-glyph';
    glyph.textContent=String(n);
    column.appendChild(glyph);
  }
  digit.appendChild(column);
  return digit;
}
function createNumberTickerSeparator(id,char){
  var separator=document.createElement('span');
  separator.className='number-ticker-separator';
  separator.setAttribute('data-ticker-id',id);
  separator.setAttribute('data-ticker-type','separator');
  separator.textContent=char;
  return separator;
}
function triggerTickerBlur(column,delay){
  if(!column||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  column.classList.remove('blur-roll');
  void column.offsetWidth;
  if(delay>0){
    window.setTimeout(function(){column.classList.add('blur-roll');},Math.round(delay*1000));
  }else{
    column.classList.add('blur-roll');
  }
}
function renderNumberTicker(value,entrance){
  if(!numberTickerRoot)return;
  var glyphs=numberTickerGlyphs(value);
  var existing={};
  Array.from(numberTickerRoot.querySelectorAll('[data-ticker-id]')).forEach(function(node){
    existing[node.getAttribute('data-ticker-id')]=node;
  });

  var visual=numberTickerRoot.querySelector('.number-ticker-visual');
  if(!visual){
    visual=document.createElement('span');
    visual.className='number-ticker-visual';
    numberTickerRoot.appendChild(visual);
  }

  var prefix=visual.querySelector('.number-ticker-prefix');
  if(!prefix){
    prefix=document.createElement('span');
    prefix.className='number-ticker-prefix';
    prefix.textContent='$';
    visual.appendChild(prefix);
  }

  var ordered=[prefix];
  var digitIndex=0;
  glyphs.forEach(function(glyph){
    var isDigit=/\d/.test(glyph.char);
    var node=existing[glyph.id];
    var correct=node&&node.getAttribute('data-ticker-type')===(isDigit?'digit':'separator');
    if(!correct){
      node=isDigit?createNumberTickerDigit(glyph.id):createNumberTickerSeparator(glyph.id,glyph.char);
    }
    if(isDigit){
      var column=node.querySelector('.number-ticker-column');
      var target=Number(glyph.char);
      var delay=entrance?digitIndex*.04:0;
      column.style.transitionDelay=delay+'s';
      requestAnimationFrame(function(){
        column.style.transform='translateY(-'+(target*1.1)+'em)';
        triggerTickerBlur(column,delay);
      });
      digitIndex++;
    }else{
      node.textContent=glyph.char;
    }
    ordered.push(node);
  });

  ordered.forEach(function(node){visual.appendChild(node);});
  Array.from(visual.children).forEach(function(node){
    if(ordered.indexOf(node)===-1)node.remove();
  });
  numberTickerRoot.setAttribute('aria-label','$'+numberTickerFormat(value));
}
function armNumberTicker(){
  if(numberTickerArmed)return;
  numberTickerArmed=true;
  renderNumberTicker(numberTickerValue,true);
  window.clearTimeout(numberTickerEntranceTimer);
  numberTickerEntranceTimer=window.setTimeout(function(){
    numberTickerEntered=true;
  },Math.round((.9+numberTickerGlyphs(numberTickerValue).length*.04)*1000));
}
function setNumberTickerValue(nextValue){
  numberTickerValue=Math.max(0,Math.round(Number(nextValue)*100)/100);
  persistNumberTickerValue(numberTickerValue);
  syncSlotPrice(numberTickerValue);
  renderNumberTicker(numberTickerValue,!numberTickerEntered);
}
syncSlotPrice(numberTickerValue);

if(numberTickerRoot){
  var initialGlyphs=numberTickerGlyphs(numberTickerValue);
  var initialVisual=document.createElement('span');
  initialVisual.className='number-ticker-visual';
  var initialPrefix=document.createElement('span');
  initialPrefix.className='number-ticker-prefix';
  initialPrefix.textContent='$';
  initialVisual.appendChild(initialPrefix);
  numberTickerRoot.appendChild(initialVisual);
  initialGlyphs.forEach(function(glyph){
    initialVisual.appendChild(/\d/.test(glyph.char)?createNumberTickerDigit(glyph.id):createNumberTickerSeparator(glyph.id,glyph.char));
  });
  numberTickerRoot.setAttribute('aria-label','$'+numberTickerFormat(numberTickerValue));

  if('IntersectionObserver' in window){
    var tickerObserver=new IntersectionObserver(function(entries){
      if(entries.some(function(entry){return entry.isIntersecting&&entry.intersectionRatio>=.6;})){
        tickerObserver.disconnect();
        armNumberTicker();
      }
    },{threshold:[.6]});
    tickerObserver.observe(numberTickerRoot);
  }else{
    armNumberTicker();
  }
}
if(tickerDecrease){
  tickerDecrease.addEventListener('click',function(){
    setNumberTickerValue(Math.max(0,numberTickerValue-NUMBER_TICKER_STEP));
  });
}
if(tickerRandomize){
  tickerRandomize.addEventListener('click',function(){
    setNumberTickerValue(Math.round(10000+Math.random()*990000));
  });
}
if(tickerIncrease){
  tickerIncrease.addEventListener('click',function(){
    setNumberTickerValue(numberTickerValue+NUMBER_TICKER_STEP);
  });
}

var tiltWhatsApp=document.getElementById('d5TiltWhatsApp');
if(tiltWhatsApp){
  tiltWhatsApp.addEventListener('click',function(event){
    event.stopPropagation();
    var currentPrice='$'+numberTickerFormat(numberTickerValue);
    var message='Hola, deseo adquirir un cupo en Hashcod Codespace. El precio actual que aparece en la plataforma es '+currentPrice+'.';
    var whatsappUrl='https://wa.me/18294721257?text='+encodeURIComponent(message);
    window.dispatchEvent(new CustomEvent('hashcod:slot-purchase-whatsapp',{
      detail:{channel:'whatsapp',phone:'+18294721257',price:numberTickerValue}
    }));
    window.open(whatsappUrl,'_blank','noopener,noreferrer');
  });
}

var tiltCard=document.getElementById('d5TiltCard');
var tiltGlare=document.getElementById('d5TiltGlare');
var tiltItems=tiltCard?Array.from(tiltCard.querySelectorAll('[data-tilt-depth]')):[];
var TILT_MAX=12;
var TILT_SCALE=1.02;
var TILT_PRESS_SCALE=.99;
var TILT_REST=.5;
var tiltHovered=false;
var tiltPressed=false;
var tiltCurrentX=TILT_REST;
var tiltCurrentY=TILT_REST;
var tiltTargetX=TILT_REST;
var tiltTargetY=TILT_REST;
var tiltCurrentScale=1;
var tiltTargetScale=1;
var tiltVx=0;
var tiltVy=0;
var tiltVs=0;
var tiltRaf=0;
var tiltUseResetSpring=false;

function tiltReducedMotion(){
  return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function applyTiltItems(lifted){
  tiltItems.forEach(function(item){
    var depth=Number(item.getAttribute('data-tilt-depth')||0);
    item.style.transform=lifted&&!tiltReducedMotion()?'translateZ('+depth+'px)':'translateZ(0px)';
  });
}
function renderTiltFrame(){
  if(!tiltCard)return;
  if(tiltReducedMotion()){
    tiltCard.style.transform='rotateX(0deg) rotateY(0deg) scale(1)';
    if(tiltGlare)tiltGlare.style.opacity='0';
    applyTiltItems(false);
    cancelAnimationFrame(tiltRaf);
    tiltRaf=0;
    return;
  }

  var spring=tiltUseResetSpring
    ?{stiffness:140,damping:18,mass:1}
    :{stiffness:260,damping:22,mass:.6};
  var dt=1/60;

  function step(current,target,velocity){
    var force=-spring.stiffness*(current-target)-spring.damping*velocity;
    var acceleration=force/spring.mass;
    velocity+=acceleration*dt;
    current+=velocity*dt;
    return [current,velocity];
  }

  var sx=step(tiltCurrentX,tiltTargetX,tiltVx);
  var sy=step(tiltCurrentY,tiltTargetY,tiltVy);
  var ss=step(tiltCurrentScale,tiltTargetScale,tiltVs);
  tiltCurrentX=sx[0]; tiltVx=sx[1];
  tiltCurrentY=sy[0]; tiltVy=sy[1];
  tiltCurrentScale=ss[0]; tiltVs=ss[1];

  var rotateX=TILT_MAX-(tiltCurrentY*TILT_MAX*2);
  var rotateY=-TILT_MAX+(tiltCurrentX*TILT_MAX*2);
  tiltCard.style.transform='rotateX('+rotateX+'deg) rotateY('+rotateY+'deg) scale('+tiltCurrentScale+')';

  if(tiltGlare){
    tiltGlare.style.background='radial-gradient(circle at '+(tiltCurrentX*100)+'% '+(tiltCurrentY*100)+'%, rgba(255,255,255,.35), transparent 65%)';
  }

  var settled=
    Math.abs(tiltCurrentX-tiltTargetX)<.0005 &&
    Math.abs(tiltCurrentY-tiltTargetY)<.0005 &&
    Math.abs(tiltCurrentScale-tiltTargetScale)<.0005 &&
    Math.abs(tiltVx)<.001 &&
    Math.abs(tiltVy)<.001 &&
    Math.abs(tiltVs)<.001;

  if(settled){
    tiltCurrentX=tiltTargetX;
    tiltCurrentY=tiltTargetY;
    tiltCurrentScale=tiltTargetScale;
    tiltVx=tiltVy=tiltVs=0;
    tiltCard.style.transform='rotateX('+(TILT_MAX-(tiltCurrentY*TILT_MAX*2))+'deg) rotateY('+(-TILT_MAX+(tiltCurrentX*TILT_MAX*2))+'deg) scale('+tiltCurrentScale+')';
    tiltRaf=0;
    return;
  }
  tiltRaf=requestAnimationFrame(renderTiltFrame);
}
function startTiltAnimation(){
  if(tiltRaf||tiltReducedMotion())return;
  tiltRaf=requestAnimationFrame(renderTiltFrame);
}
function resetTiltCard(){
  tiltHovered=false;
  tiltPressed=false;
  tiltUseResetSpring=true;
  tiltTargetX=TILT_REST;
  tiltTargetY=TILT_REST;
  tiltTargetScale=1;
  if(tiltCard)tiltCard.classList.remove('is-hovered');
  if(tiltGlare)tiltGlare.style.opacity='0';
  applyTiltItems(false);
  startTiltAnimation();
}
if(tiltCard){
  tiltCard.addEventListener('pointerenter',function(event){
    if(event.pointerType!=='mouse'||tiltReducedMotion())return;
    tiltHovered=true;
    tiltPressed=false;
    tiltUseResetSpring=false;
    tiltTargetScale=TILT_SCALE;
    tiltCard.classList.add('is-hovered');
    if(tiltGlare)tiltGlare.style.opacity='1';
    applyTiltItems(true);
    startTiltAnimation();
  });
  tiltCard.addEventListener('pointermove',function(event){
    if(event.pointerType!=='mouse'||tiltReducedMotion())return;
    var rect=tiltCard.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    tiltUseResetSpring=false;
    tiltTargetX=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
    tiltTargetY=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
    startTiltAnimation();
  });
  tiltCard.addEventListener('pointerleave',resetTiltCard);
  tiltCard.addEventListener('pointerdown',function(){
    if(tiltReducedMotion())return;
    tiltPressed=true;
    tiltUseResetSpring=false;
    tiltTargetScale=TILT_PRESS_SCALE;
    startTiltAnimation();
  });
  tiltCard.addEventListener('pointerup',function(){
    if(tiltReducedMotion())return;
    tiltPressed=false;
    tiltTargetScale=tiltHovered?TILT_SCALE:1;
    startTiltAnimation();
  });
  tiltCard.addEventListener('pointercancel',function(){
    tiltPressed=false;
    tiltTargetScale=tiltHovered?TILT_SCALE:1;
    startTiltAnimation();
  });
}

var scratchCard=document.getElementById('d5ScratchCard');
var scratchContent=document.getElementById('d5ScratchContent');
var scratchFoil=document.getElementById('d5ScratchFoil');
var scratchCanvas=document.getElementById('d5ScratchCanvas');
var scratchParticlesCanvas=document.getElementById('d5ScratchParticles');
var scratchCopy=document.getElementById('d5ScratchCopy');
var scratchCouponCodeEl=document.getElementById('d5ScratchCouponCode');
var SCRATCH_COUPON_ENDPOINT='/api/hashcod-coupon';
var scratchCouponCode='';
var scratchCouponValid=false;
var scratchCopyIcon=document.getElementById('d5ScratchCopyIcon');
var scratchCopySr=document.getElementById('d5ScratchCopySr');
var scratchReset=document.getElementById('d5ScratchReset');
var scratchAnnouncement=document.getElementById('d5ScratchAnnouncement');

var SCRATCH_REVEAL_THRESHOLD=.5;
var SCRATCH_BRUSH_SIZE=28;
var SCRATCH_SAMPLE_STRIDE=32;
var SCRATCH_CHECK_EVERY_MOVES=10;
var SCRATCH_MAX_PARTICLES=120;
var SCRATCH_PARTICLE_GRAVITY=.18;
var scratchIsScratching=false;
var scratchLastPoint=null;
var scratchMoveCount=0;
var scratchRevealed=false;
var scratchParticles=[];
var scratchParticleRaf=0;
var scratchCopyTimer=0;
var scratchLastWidth=0;
var scratchLastHeight=0;

function scratchPrefersReducedMotion(){
  return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
function paintScratchOverlay(){
  if(!scratchCard||!scratchCanvas||!scratchParticlesCanvas||scratchRevealed)return;
  var rect=scratchCard.getBoundingClientRect();
  var width=rect.width;
  var height=rect.height;
  if(!width||!height)return;
  scratchLastWidth=width;
  scratchLastHeight=height;

  var dpr=window.devicePixelRatio||1;
  scratchCanvas.width=Math.max(1,Math.round(width*dpr));
  scratchCanvas.height=Math.max(1,Math.round(height*dpr));
  var ctx=scratchCanvas.getContext('2d');
  if(!ctx)return;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#171717';
  ctx.fillRect(0,0,width,height);

  ctx.strokeStyle='rgba(255,255,255,.04)';
  ctx.lineWidth=1;
  for(var x=-height;x<width;x+=8){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x+height,height);
    ctx.stroke();
  }

  ctx.fillStyle='#737373';
  ctx.font='500 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('SCRATCH TO REVEAL',width/2,height/2);

  scratchParticlesCanvas.width=Math.max(1,Math.round(width*dpr));
  scratchParticlesCanvas.height=Math.max(1,Math.round(height*dpr));
  var particleCtx=scratchParticlesCanvas.getContext('2d');
  if(particleCtx)particleCtx.setTransform(dpr,0,0,dpr,0,0);
}
function resizeScratchCanvases(){
  if(!scratchCard||scratchRevealed)return;
  var rect=scratchCard.getBoundingClientRect();
  if(rect.width===scratchLastWidth&&rect.height===scratchLastHeight)return;
  paintScratchOverlay();
}
function scratchGetPoint(event){
  var rect=scratchCanvas.getBoundingClientRect();
  return {x:event.clientX-rect.left,y:event.clientY-rect.top};
}
function scratchLine(from,to){
  if(!scratchCanvas)return;
  var ctx=scratchCanvas.getContext('2d');
  if(!ctx)return;
  ctx.globalCompositeOperation='destination-out';
  ctx.lineWidth=SCRATCH_BRUSH_SIZE;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(from.x,from.y);
  ctx.lineTo(to.x,to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(to.x,to.y,SCRATCH_BRUSH_SIZE/2,0,Math.PI*2);
  ctx.fill();
  ctx.globalCompositeOperation='source-over';
}
function runScratchParticleLoop(){
  if(!scratchParticlesCanvas)return;
  var ctx=scratchParticlesCanvas.getContext('2d');
  if(!ctx)return;
  cancelAnimationFrame(scratchParticleRaf);

  function tick(){
    var rect=scratchParticlesCanvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);
    var alive=[];
    scratchParticles.forEach(function(particle){
      particle.vy+=SCRATCH_PARTICLE_GRAVITY;
      particle.x+=particle.vx;
      particle.y+=particle.vy;
      particle.life-=1;
      if(particle.life<=0)return;
      ctx.globalAlpha=particle.life/particle.maxLife;
      ctx.fillStyle='#a3a3a3';
      ctx.fillRect(particle.x,particle.y,particle.size,particle.size);
      alive.push(particle);
    });
    ctx.globalAlpha=1;
    scratchParticles=alive;
    if(alive.length>0){
      scratchParticleRaf=requestAnimationFrame(tick);
    }else{
      ctx.clearRect(0,0,rect.width,rect.height);
    }
  }
  scratchParticleRaf=requestAnimationFrame(tick);
}
function spawnScratchParticles(x,y){
  if(scratchPrefersReducedMotion()||scratchParticles.length>=SCRATCH_MAX_PARTICLES)return;
  for(var i=0;i<2;i++){
    var maxLife=24+Math.random()*20;
    scratchParticles.push({
      x:x+(Math.random()-.5)*SCRATCH_BRUSH_SIZE*.6,
      y:y+(Math.random()-.5)*SCRATCH_BRUSH_SIZE*.6,
      vx:(Math.random()-.5)*1.6,
      vy:-Math.random()*1.4,
      size:1.5+Math.random()*2,
      life:maxLife,
      maxLife:maxLife
    });
  }
  runScratchParticleLoop();
}
function revealScratchCard(){
  if(scratchRevealed)return;
  scratchRevealed=true;
  scratchIsScratching=false;
  scratchLastPoint=null;
  if(scratchContent)scratchContent.removeAttribute('inert');
  if(scratchFoil){
    scratchFoil.classList.add('revealed');
    window.setTimeout(function(){
      if(scratchRevealed)scratchFoil.hidden=true;
    },scratchPrefersReducedMotion()?0:400);
  }
  if(scratchAnnouncement){
    scratchAnnouncement.textContent=scratchCouponValid
      ?('Coupon revealed: '+scratchCouponCode+' for 20% off')
      :'Coupon revealed. Validation code unavailable.';
  }
  if(scratchReset)scratchReset.hidden=false;
}
function checkScratchProgress(){
  if(!scratchCanvas||scratchRevealed)return;
  var ctx=scratchCanvas.getContext('2d');
  if(!ctx||scratchCanvas.width===0||scratchCanvas.height===0)return;
  var data;
  try{
    data=ctx.getImageData(0,0,scratchCanvas.width,scratchCanvas.height).data;
  }catch(_){
    return;
  }
  var cleared=0;
  var sampled=0;
  for(var i=3;i<data.length;i+=4*SCRATCH_SAMPLE_STRIDE){
    if(data[i]<128)cleared++;
    sampled++;
  }
  if(sampled>0&&cleared/sampled>=SCRATCH_REVEAL_THRESHOLD){
    revealScratchCard();
  }
}
function resetScratchCopyState(){
  window.clearTimeout(scratchCopyTimer);
  if(scratchCopyIcon){
    scratchCopyIcon.innerHTML='<svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
  }
  if(scratchCopySr)scratchCopySr.textContent='Copy coupon code';
}
function setScratchCopiedState(){
  if(scratchCopyIcon){
    scratchCopyIcon.innerHTML='<svg viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"></path></svg>';
  }
  if(scratchCopySr)scratchCopySr.textContent='Copied to clipboard';
  window.clearTimeout(scratchCopyTimer);
  scratchCopyTimer=window.setTimeout(resetScratchCopyState,2000);
}
async function loadScratchCoupon(){
  if(!scratchCouponCodeEl)return;
  scratchCouponCodeEl.textContent='HC20-LOADING';
  if(scratchCopy)scratchCopy.disabled=true;
  try{
    var response=await fetch(SCRATCH_COUPON_ENDPOINT+'?action=issue',{
      credentials:'same-origin',
      cache:'no-store',
      headers:{Accept:'application/json'}
    });
    var data=await response.json();
    var coupon=data&&data.coupon?data.coupon:null;
    var code=coupon&&typeof coupon.code==='string'?coupon.code.trim():'';
    if(!response.ok||!data.ok||!coupon||coupon.valid!==true||!/^HC20-/.test(code)){
      throw new Error('coupon_issue_failed');
    }

    var verifyResponse=await fetch(SCRATCH_COUPON_ENDPOINT,{
      method:'POST',
      credentials:'same-origin',
      cache:'no-store',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({action:'validate',code:code})
    });
    var verifyData=await verifyResponse.json();
    if(!verifyResponse.ok||!verifyData.ok||!verifyData.coupon||verifyData.coupon.valid!==true){
      throw new Error('coupon_validation_failed');
    }

    scratchCouponCode=code;
    scratchCouponValid=true;
    scratchCouponCodeEl.textContent=code;
    if(scratchCopy)scratchCopy.disabled=false;
  }catch(_){
    scratchCouponCode='';
    scratchCouponValid=false;
    scratchCouponCodeEl.textContent='CODE UNAVAILABLE';
    if(scratchCopy)scratchCopy.disabled=true;
  }
}

function copyScratchCoupon(){
  var value=scratchCouponValid?scratchCouponCode:'';
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(value).then(setScratchCopiedState).catch(function(){
      fallbackCopyScratchCoupon(value);
    });
  }else{
    fallbackCopyScratchCoupon(value);
  }
}
function fallbackCopyScratchCoupon(value){
  var area=document.createElement('textarea');
  area.value=value;
  area.setAttribute('readonly','');
  area.style.position='fixed';
  area.style.opacity='0';
  document.body.appendChild(area);
  area.select();
  try{
    document.execCommand('copy');
    setScratchCopiedState();
  }catch(_){}
  area.remove();
}
function resetScratchCard(){
  scratchRevealed=false;
  scratchIsScratching=false;
  scratchLastPoint=null;
  scratchMoveCount=0;
  scratchParticles=[];
  cancelAnimationFrame(scratchParticleRaf);
  resetScratchCopyState();
  if(scratchAnnouncement)scratchAnnouncement.textContent='';
  if(scratchContent)scratchContent.setAttribute('inert','');
  if(scratchReset)scratchReset.hidden=true;
  if(scratchFoil){
    scratchFoil.hidden=false;
    scratchFoil.classList.remove('revealed');
  }
  scratchLastWidth=0;
  scratchLastHeight=0;
  requestAnimationFrame(paintScratchOverlay);
}

loadScratchCoupon();

if(scratchCard&&scratchCanvas&&scratchParticlesCanvas){
  requestAnimationFrame(paintScratchOverlay);

  if('ResizeObserver' in window){
    var scratchResizeObserver=new ResizeObserver(resizeScratchCanvases);
    scratchResizeObserver.observe(scratchCard);
  }else{
    window.addEventListener('resize',resizeScratchCanvases);
  }

  scratchCanvas.addEventListener('pointerdown',function(event){
    if(scratchRevealed)return;
    try{scratchCanvas.setPointerCapture(event.pointerId);}catch(_){}
    scratchIsScratching=true;
    var point=scratchGetPoint(event);
    scratchLine(point,point);
    spawnScratchParticles(point.x,point.y);
    scratchLastPoint=point;
  });
  scratchCanvas.addEventListener('pointermove',function(event){
    if(!scratchIsScratching||scratchRevealed)return;
    var point=scratchGetPoint(event);
    scratchLine(scratchLastPoint||point,point);
    scratchLastPoint=point;
    scratchMoveCount++;
    if(scratchMoveCount%2===0)spawnScratchParticles(point.x,point.y);
    if(scratchMoveCount%SCRATCH_CHECK_EVERY_MOVES===0)checkScratchProgress();
  });
  function endScratch(){
    scratchIsScratching=false;
    scratchLastPoint=null;
    checkScratchProgress();
  }
  scratchCanvas.addEventListener('pointerup',endScratch);
  scratchCanvas.addEventListener('pointercancel',endScratch);
  scratchCanvas.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      revealScratchCard();
    }
  });
}
if(scratchCopy)scratchCopy.addEventListener('click',copyScratchCoupon);
if(scratchReset)scratchReset.addEventListener('click',resetScratchCard);

var navListDemo=document.getElementById('d5NavListDemo');
var documentsModal=document.getElementById('d5DocumentsModal');
var documentSheet=document.getElementById('d5DocumentSheet');
var documentNavItems=documentsModal?Array.from(documentsModal.querySelectorAll('[data-doc-id]')):[];

var OFFICIAL_DOCUMENTS={
  onapi:{
    seal:'ONAPI',
    title:'Certificado de Registro de Marca Mixta',
    issuer:'Oficina Nacional de la Propiedad Industrial (ONAPI)',
    status:'REGISTRO VIGENTE',
    fields:[
      ['Signo','HASHCOD'],
      ['Núm. de registro','336973'],
      ['Núm. de solicitud','2026-35462'],
      ['Fecha de concesión','18/08/2026'],
      ['Fecha de vencimiento','18/08/2036'],
      ['Clase internacional','42'],
      ['Colores reivindicados','Negro, blanco']
    ],
    description:'El certificado comprende desarrollo de software, SaaS, diseño, mantenimiento y actualización de software, seguridad informática, criptografía aplicada a software, protección de datos digitales, autenticación y verificación de códigos digitales, almacenamiento seguro de información digital, gestión de códigos, licencias, accesos y credenciales e inteligencia artificial.',
    hash:'696254deb3f1783f788d475c8b13b615ceb32440ce2b921ca946a030292464db',
    source:'onapiedoc_639239904000000000 (1).pdf'
  },
  mercantil:{
    seal:'RM',
    title:'Certificado de Registro Mercantil · Persona Física',
    issuer:'Cámara de Comercio y Producción de La Vega',
    status:'REGISTRO VIGENTE',
    fields:[
      ['Registro Mercantil','3323LV-PF'],
      ['Establecimiento','DIKTATCART'],
      ['Persona física RNC','402-0936929-3'],
      ['Fecha de emisión','16/06/2026'],
      ['Fecha de vencimiento','16/06/2028'],
      ['Actividad del establecimiento','Servicio'],
      ['Capital general','RD$10,000.00']
    ],
    description:'El certificado registra a DIKTATCART y describe su actividad como diseño y desarrollo de software, soluciones digitales, inteligencia artificial, automatización y herramientas criptográficas para usuarios y desarrolladores.',
    hash:'ec1077ab5fd6d81685f0976ab3451ef7f4fa5be230e8ffe94761365708ab3e31',
    source:'CERTIFICADOREGISTROMERCANTIL(1).pdf'
  },
  rnc:{
    seal:'DGII',
    title:'Certificación de Registro Nacional de Contribuyentes',
    issuer:'Dirección General de Impuestos Internos (DGII)',
    status:'ACTIVO',
    fields:[
      ['RNC','402-0936929-3'],
      ['Condición','Contribuyente'],
      ['Estado','Activo'],
      ['Actividad económica','Diseño y desarrollo de software'],
      ['Régimen de pago','Ordinario'],
      ['Fecha de certificación','12/07/2026']
    ],
    description:'La certificación de la DGII acredita la inscripción del contribuyente con estado activo y actividad económica declarada de diseño y desarrollo de software.',
    hash:'72cd3363c15d503adcee3bf97158a0ff437b7228a532e9222256cbca515c3fbd',
    source:'Inscripcion RNC(1).pdf'
  }
};

function escapeDoc(value){
  return String(value==null?'':value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
function renderOfficialDocument(id){
  if(!documentSheet)return;
  var doc=OFFICIAL_DOCUMENTS[id]||OFFICIAL_DOCUMENTS.onapi;
  documentNavItems.forEach(function(item){
    item.classList.toggle('active',item.getAttribute('data-doc-id')===id);
  });
  var rows=doc.fields.map(function(field){
    return '<div class="document-field"><dt>'+escapeDoc(field[0])+'</dt><dd>'+escapeDoc(field[1])+'</dd></div>';
  }).join('');
  documentSheet.innerHTML=
    '<section class="official-document">'
      +'<header class="official-document-head">'
        +'<div class="official-document-seal">'+escapeDoc(doc.seal)+'</div>'
        +'<h3>'+escapeDoc(doc.title)+'</h3>'
        +'<p>'+escapeDoc(doc.issuer)+'</p>'
        +'<span class="document-status">'+escapeDoc(doc.status)+'</span>'
      +'</header>'
      +'<dl class="document-fields">'+rows+'</dl>'
      +'<p class="document-description">'+escapeDoc(doc.description)+'</p>'
      +'<div class="document-hash"><strong>SHA-256 · evidencia</strong><br>'+escapeDoc(doc.hash)+'</div>'
      +'<p class="document-note">Fuente aportada: '+escapeDoc(doc.source)+'. Vista informativa construida a partir del documento original y su manifiesto de evidencia.</p>'
    +'</section>';
}
function openDocumentsModal(){
  if(!documentsModal)return;
  renderOfficialDocument('onapi');
  documentsModal.hidden=false;
  documentsModal.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  var close=documentsModal.querySelector('.documents-close');
  if(close)window.setTimeout(function(){close.focus();},0);
}
function closeDocumentsModal(){
  if(!documentsModal)return;
  documentsModal.hidden=true;
  documentsModal.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
}
if(documentsModal){
  documentsModal.addEventListener('click',function(event){
    var close=event.target.closest('[data-doc-action="close"]');
    if(close){closeDocumentsModal();return;}
    var nav=event.target.closest('[data-doc-id]');
    if(nav)renderOfficialDocument(nav.getAttribute('data-doc-id'));
  });
}
document.addEventListener('keydown',function(event){
  if(event.key==='Escape'&&documentsModal&&!documentsModal.hidden)closeDocumentsModal();
});

if(navListDemo){
  navListDemo.addEventListener('click',function(event){
    var row=event.target.closest('[data-nav-list-item]');
    if(!row)return;
    var label=row.getAttribute('data-nav-list-item')||'';
    if(label==='Documents'){
      openDocumentsModal();
      return;
    }
    window.dispatchEvent(new CustomEvent('hashcod:nav-list-action',{
      detail:{label:label}
    }));
  });
}

if(!entryIntro&&btn&&sig&&renew&&ch){
  btn.addEventListener('click',async function(){
    var value=sig.value.trim();
    if(!value){
      st('Pega primero la firma Base64 del reto actual.','error');
      sig.focus();
      return;
    }

    btn.disabled=true;
    st(phase===1?'Verificando primera firma…':'Verificando confirmación final…','info');

    try{
      var response=await fetch(ep,{
        method:'POST',
        credentials:'same-origin',
        headers:{
          'Content-Type':'application/json',
          Accept:'application/json'
        },
        body:JSON.stringify({
          signature:value,
          phase:phase
        })
      });
      var data=await readJson(response);

      if(!response.ok||!data.ok){
        if(['challenge_expired','phase_mismatch','replay_detected'].includes(data.code)){
          await resetProtocol(data.error||'El protocolo debe reiniciarse.');
          return;
        }
        throw new Error(data.error||'Firma inválida');
      }

      if(Number(data.next_phase||0)===2&&data.challenge){
        applyChallenge(data);
        if(stepOne)stepOne.classList.add('complete');
        st('Paso 1 válido. Firma ahora el segundo reto; la firma anterior ya no sirve.','ok');
        return;
      }

      if(data.authorized){
        if(stepOne)stepOne.classList.add('complete');
        if(stepTwo){
          stepTwo.classList.add('complete');
          stepTwo.classList.remove('active');
        }
        st('Doble firma válida. Acceso concedido.','ok');
        setTimeout(function(){location.replace(data.redirect||'/');},220);
        return;
      }

      throw new Error('Respuesta de validación incompleta.');
    }catch(error){
      st(error&&error.message?error.message:'Firma inválida','error');
      btn.disabled=false;
    }
  });

  load();
}
})();