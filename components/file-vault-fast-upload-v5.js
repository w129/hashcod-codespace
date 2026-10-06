(function(){
'use strict';

var VERSION='20261006-files-loading1';
var FAST_ENDPOINT=(document.body&&document.body.dataset.hashcodSharedWorkspace==='1')?'/api/hashcod-shared-upload':'/hashcod-file-vault-fast-upload.php';
var RETRY_DELAYS=[0,500,1400,3000];
var uiBusy=false;

if(window.__hashcodFileVaultFast5Loaded)return;
window.__hashcodFileVaultFast5Loaded=true;

var proto=XMLHttpRequest.prototype;
var nativeOpen=proto.open;
var nativeSend=proto.send;

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
function makeId(){
  var raw='';
  try{raw=crypto.randomUUID().replace(/-/g,'');}
  catch(_){raw=Date.now().toString(36)+Math.random().toString(36).slice(2);}
  return 'fv_'+raw.slice(0,40);
}
function callProgress(owner,loaded,total){
  try{
    var handler=owner&&owner.upload&&owner.upload.onprogress;
    if(typeof handler==='function'){
      handler.call(owner.upload,{lengthComputable:true,loaded:loaded,total:total});
    }
  }catch(_){}
}
function setReadonly(target,key,value){
  try{Object.defineProperty(target,key,{configurable:true,get:function(){return value;}});}catch(_){}
}
function finishOwner(owner,status,payload){
  var text=JSON.stringify(payload||{});
  setReadonly(owner,'status',status);
  setReadonly(owner,'readyState',4);
  setReadonly(owner,'responseText',text);
  setReadonly(owner,'response',text);
  queueMicrotask(function(){
    try{if(typeof owner.onload==='function')owner.onload.call(owner,new Event('load'));}catch(_){}
    try{owner.dispatchEvent(new Event('load'));}catch(_){}
    try{owner.dispatchEvent(new Event('loadend'));}catch(_){}
  });
}
async function parseJson(response){
  try{return await response.json();}catch(_){return {};}
}
async function boundedFetch(url,options){
  var controller=typeof AbortController==='function'?new AbortController():null;
  var timer=controller?setTimeout(function(){controller.abort();},20000):null;
  try{return await fetch(url,Object.assign({},options,controller?{signal:controller.signal}:{}));}
  catch(error){if(controller&&controller.signal.aborted)error.status=408;throw error;}
  finally{if(timer!==null)clearTimeout(timer);}
}
async function prepareUpload(file,id,code){
  var response=await boundedFetch(FAST_ENDPOINT+'?action=prepare',{
    method:'POST',
    credentials:'same-origin',
    cache:'no-store',
    headers:{
      'Accept':'application/json',
      'Content-Type':'application/json',
      'X-Requested-With':'XMLHttpRequest'
    },
    body:JSON.stringify({
      id:id,
      name:file&&file.name||'file',
      type:file&&file.type||'application/octet-stream',
      size:Number(file&&file.size||0),
      access_code:code
    })
  });
  var payload=await parseJson(response);
  if(!response.ok||!payload.ok){
    var error=new Error(payload.error||'Could not prepare direct upload.');
    error.status=response.ok?502:response.status;
    throw error;
  }
  return payload;
}
function directPut(url,file,onProgress){
  return new Promise(function(resolve,reject){
    var xhr=new XMLHttpRequest();
    xhr.open('PUT',url,true);
    try{xhr.setRequestHeader('x-upsert','true');}catch(_){}
    try{xhr.setRequestHeader('Content-Type',String(file&&file.type||'application/octet-stream'));}catch(_){}
    xhr.upload.onprogress=function(event){
      if(event.lengthComputable&&typeof onProgress==='function'){
        onProgress(event.loaded,event.total);
      }
    };
    xhr.onerror=function(){reject(new Error('Direct Storage connection was interrupted.'));};
    xhr.ontimeout=function(){reject(new Error('Direct Storage upload timed out.'));};
    xhr.timeout=180000;
    xhr.onload=function(){
      if(xhr.status>=200&&xhr.status<300){
        if(typeof onProgress==='function')onProgress(file.size||1,file.size||1);
        resolve(true);
        return;
      }
      var error=new Error('Cloud transfer could not be completed.');
      error.status=xhr.status;
      reject(error);
    };
    // Supabase signed upload URLs accept the file bytes directly. Sending a
    // multipart envelope makes the object appear corrupt on some browsers.
    xhr.send(file);
  });
}
async function uploadWithRetry(url,file,onProgress){
  var lastError=null;
  for(var attempt=0;attempt<3;attempt++){
    if(attempt>0)await sleep(RETRY_DELAYS[attempt]||1000);
    try{
      await directPut(url,file,onProgress);
      return true;
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error('Direct upload failed.');
}
async function completeUpload(ticket){
  var response=await boundedFetch(FAST_ENDPOINT+'?action=complete',{
    method:'POST',
    credentials:'same-origin',
    cache:'no-store',
    headers:{
      'Accept':'application/json',
      'Content-Type':'application/json',
      'X-Requested-With':'XMLHttpRequest'
    },
    body:JSON.stringify({ticket:ticket})
  });
  var payload=await parseJson(response);
  if(!response.ok||!payload.ok){
    var error=new Error(payload.error||'Could not finalize cloud upload.');
    error.status=response.ok?502:response.status;
    throw error;
  }
  return payload;
}
async function performDirectUpload(file,id,code,onProgress,onPhase){
  if(typeof onPhase==='function')onPhase('Preparing secure direct upload');
  var prepared=await prepareUpload(file,id,code);
  var progress=function(loaded,total){
    if(typeof onProgress==='function')onProgress(loaded,total);
  };

  if(typeof onPhase==='function')onPhase('Uploading browser → Supabase Storage');
  await uploadWithRetry(prepared.uploadUrl,file,progress);

  if(typeof onPhase==='function')onPhase('Finalizing cloud index');
  return await completeUpload(prepared.ticket);
}
function notifyTransfer(id,pending){
  if(typeof window.dispatchEvent==='function'&&typeof CustomEvent==='function'){
    window.dispatchEvent(new CustomEvent('hashcod:file-vault-transfer',{detail:{id:id,pending:pending}}));
  }
}
async function uploadProtectedFile(file,id,code,onProgress,onPhase){
  notifyTransfer(id,true);
  try{return await performDirectUpload(file,id,code,onProgress,onPhase);}
  catch(error){
    var status=Number(error&&error.status||0);
    if(status!==0&&status!==408&&status!==502&&status!==503&&status!==504)throw error;
    var api=window.HashcodFileVaultTotp;
    if(!api||typeof api.saveLocal!=='function')throw error;
    if(typeof onPhase==='function')onPhase('Saving protected file on this device');
    var local=await api.saveLocal(file,id,code);
    if(typeof onProgress==='function')onProgress(file.size||1,file.size||1);
    return {ok:true,file:local,storage:'device',cloud:false};
  }finally{notifyTransfer(id,false);}
}
function waitForTotpApi(){
  return new Promise(function(resolve,reject){
    var started=Date.now();
    (function check(){
      if(window.HashcodFileVaultTotp&&typeof window.HashcodFileVaultTotp.requestSetup==='function'){
        resolve(window.HashcodFileVaultTotp);
        return;
      }
      if(Date.now()-started>10000){
        reject(new Error('File-code interface did not initialize.'));
        return;
      }
      setTimeout(check,35);
    })();
  });
}
function ensureUiStyle(){
  if(document.getElementById('d5HfvFastStyle'))return;
  var style=document.createElement('style');
  style.id='d5HfvFastStyle';
  style.textContent='.hfv-dropzone{position:relative}.hfv-fast-layer{position:absolute;inset:0;z-index:30;display:grid;place-items:center;padding:22px;border-radius:inherit;background:#0a0a0a;color:#fff;text-align:center}.hfv-fast-box{width:min(440px,88%);display:grid;gap:10px}.hfv-fast-box strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 14px/1.3 Inter,system-ui,sans-serif}.hfv-fast-box small{color:#a3a3a3;font:600 10px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace}.hfv-fast-track{display:block;height:4px;overflow:hidden;border-radius:999px;background:#333}.hfv-fast-bar{display:block;height:100%;transform-origin:left center;background:#fff;transition:transform .12s linear}.hfv-fast-layer[data-state="error"] .hfv-fast-bar{background:#fca5a5}.hfv-fast-layer[data-state="done"] .hfv-fast-bar{background:#d4d4d4}';
  style.textContent+='.hfv-fast-layer[data-state="error"]{pointer-events:none}.hfv-fast-box small{overflow-wrap:anywhere}';
  document.head.appendChild(style);
}
function uiLayer(){
  ensureUiStyle();
  var drop=document.getElementById('d5FileVaultDropzone');
  if(!drop)return null;
  var layer=drop.querySelector('.hfv-fast-layer');
  if(!layer){
    layer=document.createElement('div');
    layer.className='hfv-fast-layer';
    layer.setAttribute('role','status');
    layer.setAttribute('aria-live','polite');
    layer.innerHTML='<div class="hfv-fast-box"><strong></strong><small></small><span class="hfv-fast-track"><span class="hfv-fast-bar"></span></span></div>';
    drop.appendChild(layer);
  }
  return layer;
}
function setUi(fileName,percent,phase,state){
  var layer=uiLayer();
  if(!layer)return;
  layer.dataset.state=state||'uploading';
  var strong=layer.querySelector('strong');
  var small=layer.querySelector('small');
  var bar=layer.querySelector('.hfv-fast-bar');
  if(strong)strong.textContent=fileName||'File';
  if(small)small.textContent=(phase||'Uploading')+(state==='error'?' · Click or drop the file to try again.':' · '+Math.round(clamp(percent,0,100))+'%');
  if(bar)bar.style.transform='scaleX('+clamp(percent,0,100)/100+')';
}
function clearUi(delay){
  setTimeout(function(){
    var layer=document.querySelector('#d5FileVaultDropzone .hfv-fast-layer');
    if(layer)layer.remove();
  },delay||0);
}
function refreshVault(file){
  window.dispatchEvent(new CustomEvent('hashcod:file-vault-saved',{detail:{file:file}}));
  setTimeout(function(){
    var button=document.querySelector('#d5FileVault .hfv-list-head button');
    if(button)button.click();
  },120);
}
async function uploadFromUi(file){
  var api=await waitForTotpApi();
  var setup=await api.requestSetup(file.name||'file');
  if(!setup)return false;

  var id=makeId();
  var lastPercent=2;
  setUi(file.name,2,'Preparing secure direct upload','uploading');

  var completed=await uploadProtectedFile(
    file,
    id,
    setup.code,
    function(loaded,total){
      var raw=total>0?(loaded/total)*100:0;
      lastPercent=5+(raw*0.9);
      setUi(file.name,lastPercent,'Direct cloud transfer','uploading');
    },
    function(phase){
      setUi(file.name,lastPercent,phase,'uploading');
    }
  );

  var local=completed.file&&completed.file.cloud===false;
  setUi(file.name,100,local?'Saved on this device · cloud unavailable':'Stored in cloud','done');
  refreshVault(completed.file);
  return completed;
}
async function processUiFiles(files){
  if(uiBusy)return;
  var queue=Array.from(files||[]).filter(function(file){
    return file&&typeof file.name==='string';
  });
  if(!queue.length)return;

  uiBusy=true;
  var lastFailure=null;
  try{
    for(var i=0;i<queue.length;i++){
      try{
        await uploadFromUi(queue[i]);
        await sleep(160);
      }catch(error){
        lastFailure={name:queue[i].name,message:error&&error.message||'Direct upload failed.'};
        setUi(lastFailure.name,100,lastFailure.message,'error');
        await sleep(2200);
      }
    }
  }finally{
    uiBusy=false;
    if(lastFailure)setUi(lastFailure.name,100,lastFailure.message,'error');
    else clearUi(350);
    var input=document.getElementById('d5FileVaultInput');
    if(input)input.value='';
  }
}
function captureFilesEvent(event){
  if(!event||event.__hashcodHfvFast5Handled)return;
  var files=null;

  if(event.type==='change'){
    var input=event.target;
    if(!input||input.id!=='d5FileVaultInput'||!input.files||!input.files.length)return;
    files=input.files;
  }else if(event.type==='drop'){
    var target=event.target;
    var drop=target&&target.closest?target.closest('#d5FileVaultDropzone'):null;
    if(!drop||!event.dataTransfer||!event.dataTransfer.files||!event.dataTransfer.files.length)return;
    files=event.dataTransfer.files;
  }else{
    return;
  }

  try{Object.defineProperty(event,'__hashcodHfvFast5Handled',{value:true});}catch(_){}
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  void processUiFiles(files);
}
function installUiCapture(){
  window.addEventListener('change',captureFilesEvent,true);
  window.addEventListener('drop',captureFilesEvent,true);
  document.addEventListener('change',captureFilesEvent,true);
  document.addEventListener('drop',captureFilesEvent,true);
}

// Backup path for older File Vault builds: once a chosen code is present,
// reroute the upload away from PHP and directly to Supabase Storage.
proto.open=function(method,url){
  var args=Array.prototype.slice.call(arguments,2);
  this.__hashcodHfvFastUpload=
    String(method||'').toUpperCase()==='POST'&&
    String(url||'').indexOf('/api/hashcod-file-vault')!==-1&&
    String(url||'').indexOf('action=upload')!==-1;
  return nativeOpen.apply(this,[method,url].concat(args));
};
proto.send=function(body){
  if(
    !this.__hashcodHfvFastUpload||
    !(body instanceof FormData)||
    !body.has('access_code')
  ){
    return nativeSend.call(this,body);
  }

  var owner=this;
  var file=body.get('file');
  var id=String(body.get('id')||'');
  var code=String(body.get('access_code')||'');
  if(!(file instanceof Blob)||!id)return nativeSend.call(owner,body);

  (async function(){
    try{
      var total=Number(file.size||1);
      callProgress(owner,Math.max(1,Math.floor(total*0.02)),total);
      var completed=await uploadProtectedFile(
        file,
        id,
        code,
        function(loaded,bytesTotal){callProgress(owner,loaded,bytesTotal);}
      );
      finishOwner(owner,201,completed);
    }catch(error){
      finishOwner(owner,Number(error&&error.status||502),{
        ok:false,
        error:error&&error.message||'Direct cloud upload unavailable.'
      });
    }
  })();

  return undefined;
};

installUiCapture();

window.HashcodFileVaultFastUpload=Object.freeze({
  version:VERSION,
  transport:'supabase-signed-direct',
  strategy:'aws-style-direct-object-transfer',
  endpoint:FAST_ENDPOINT,
  phpProxyBytes:false,
  localBlocking:false,
  legacyPhpFallback:false,
  capturePhase:'window+document',
  upload:uploadProtectedFile
});
})();
