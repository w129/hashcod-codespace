(function(){
'use strict';

var VERSION='20261005-file-vault-fast4-route2';
var FAST_ENDPOINT='/hashcod-file-vault-fast-upload.php';
var TUS_THRESHOLD=6*1024*1024;
var TUS_CHUNK_SIZE=6*1024*1024;
var RETRY_DELAYS=[0,450,1200,2400,4200];
var uiBusy=false;

if(window.__hashcodFileVaultFast4Loaded)return;
window.__hashcodFileVaultFast4Loaded=true;

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
async function prepareUpload(file,id,secret,code){
  var response=await fetch(FAST_ENDPOINT+'?action=prepare',{
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
      totp_secret:secret,
      totp_code:code
    })
  });
  var payload=await parseJson(response);
  if(!response.ok||!payload.ok){
    var error=new Error(payload.error||'Could not prepare direct upload.');
    error.status=response.status;
    throw error;
  }
  return payload;
}
function directPut(url,file,onProgress){
  return new Promise(function(resolve,reject){
    var xhr=new XMLHttpRequest();
    xhr.open('PUT',url,true);
    try{xhr.setRequestHeader('x-upsert','true');}catch(_){}
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
      reject(new Error('Storage upload failed with HTTP '+xhr.status+'.'));
    };
    var form=new FormData();
    form.append('cacheControl','3600');
    form.append('',file,file.name||'file');
    xhr.send(form);
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
function utf8Base64(value){
  var bytes=new TextEncoder().encode(String(value||''));
  var chunk='';
  for(var i=0;i<bytes.length;i++)chunk+=String.fromCharCode(bytes[i]);
  return btoa(chunk);
}
function parseSignedUpload(prepared){
  var parsed=new URL(prepared.uploadUrl,window.location.href);
  var marker='/storage/v1/object/upload/sign/';
  var index=parsed.pathname.indexOf(marker);
  if(index<0)throw new Error('Signed Storage URL is not compatible with resumable upload.');
  var tail=parsed.pathname
    .slice(index+marker.length)
    .split('/')
    .filter(Boolean)
    .map(function(part){try{return decodeURIComponent(part);}catch(_){return part;}});
  if(tail.length<2)throw new Error('Signed Storage URL is missing bucket/object metadata.');
  var bucket=tail.shift();
  var token=parsed.searchParams.get('token')||'';
  if(!token)throw new Error('Signed Storage token is missing.');
  var tusUrl=String(prepared.tusEndpoint||'').trim();
  if(!tusUrl)tusUrl=parsed.origin+'/storage/v1/upload/resumable';
  return {bucket:bucket,object:tail.join('/'),token:token,tusUrl:tusUrl};
}
function resumeKey(id,file){
  return 'hashcod:hfv:tus:v4:'+String(id||'')+':'+String(file&&file.size||0)+':'+String(file&&file.lastModified||0);
}
function loadResume(key){try{return localStorage.getItem(key)||'';}catch(_){return '';}}
function saveResume(key,url){try{localStorage.setItem(key,url);}catch(_){}}
function clearResume(key){try{localStorage.removeItem(key);}catch(_){}}
function tusHeaders(token){return {'Tus-Resumable':'1.0.0','x-signature':token};}
async function tusRequest(url,options,attempts){
  var lastError=null;
  var totalAttempts=Math.max(1,attempts||4);
  for(var attempt=0;attempt<totalAttempts;attempt++){
    if(attempt>0)await sleep(RETRY_DELAYS[Math.min(attempt,RETRY_DELAYS.length-1)]||2500);
    try{
      var response=await fetch(url,options);
      if(response.status>=500||response.status===408||response.status===425||response.status===429){
        lastError=new Error('Resumable Storage returned HTTP '+response.status+'.');
        continue;
      }
      return response;
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error('Resumable Storage request failed.');
}
async function tusHead(uploadUrl,token){
  var response=await tusRequest(uploadUrl,{method:'HEAD',cache:'no-store',headers:tusHeaders(token)},3);
  if(response.status===404||response.status===410)return null;
  if(!response.ok)throw new Error('Could not resume upload (HTTP '+response.status+').');
  var offset=Number(response.headers.get('Upload-Offset')||0);
  return Number.isFinite(offset)&&offset>=0?offset:0;
}
async function tusCreate(info,file){
  var metadata={
    bucketName:info.bucket,
    objectName:info.object,
    contentType:file.type||'application/octet-stream',
    cacheControl:'3600'
  };
  var headerValue=Object.keys(metadata).map(function(key){
    return key+' '+utf8Base64(metadata[key]);
  }).join(',');
  var headers=tusHeaders(info.token);
  headers['Upload-Length']=String(file.size||0);
  headers['Upload-Metadata']=headerValue;
  headers['x-upsert']='true';
  var response=await tusRequest(info.tusUrl,{method:'POST',cache:'no-store',headers:headers},4);
  if(response.status!==201&&!response.ok){
    throw new Error('Could not initialize resumable upload (HTTP '+response.status+').');
  }
  var location=response.headers.get('Location')||'';
  if(!location)throw new Error('Resumable Storage did not return an upload location.');
  return new URL(location,info.tusUrl).href;
}
async function tusPatch(uploadUrl,token,offset,chunk){
  var headers=tusHeaders(token);
  headers['Upload-Offset']=String(offset);
  headers['Content-Type']='application/offset+octet-stream';
  var response=await tusRequest(uploadUrl,{
    method:'PATCH',
    cache:'no-store',
    headers:headers,
    body:chunk
  },4);
  if(response.status!==204&&!response.ok){
    if(response.status===409){
      var conflict=new Error('Resumable upload offset changed.');
      conflict.code='offset-conflict';
      throw conflict;
    }
    throw new Error('Resumable chunk failed with HTTP '+response.status+'.');
  }
  var next=Number(response.headers.get('Upload-Offset'));
  if(!Number.isFinite(next)||next<offset)next=offset+chunk.size;
  return next;
}
async function uploadTus(prepared,file,id,onProgress){
  var info=parseSignedUpload(prepared);
  var key=resumeKey(id,file);
  var uploadUrl=loadResume(key);
  var offset=0;

  if(uploadUrl){
    try{
      var resumed=await tusHead(uploadUrl,info.token);
      if(resumed===null||resumed>file.size){
        clearResume(key);
        uploadUrl='';
      }else{
        offset=resumed;
      }
    }catch(_){
      clearResume(key);
      uploadUrl='';
    }
  }

  if(!uploadUrl){
    uploadUrl=await tusCreate(info,file);
    saveResume(key,uploadUrl);
    offset=0;
  }

  if(typeof onProgress==='function')onProgress(offset,file.size||1);

  while(offset<file.size){
    var end=Math.min(file.size,offset+TUS_CHUNK_SIZE);
    var chunk=file.slice(offset,end);
    try{
      offset=await tusPatch(uploadUrl,info.token,offset,chunk);
    }catch(error){
      if(error&&error.code==='offset-conflict'){
        var serverOffset=await tusHead(uploadUrl,info.token);
        if(serverOffset===null)throw error;
        offset=serverOffset;
      }else{
        throw error;
      }
    }
    if(typeof onProgress==='function'){
      onProgress(Math.min(offset,file.size),file.size||1);
    }
  }

  clearResume(key);
  if(typeof onProgress==='function')onProgress(file.size||1,file.size||1);
  return true;
}
async function completeUpload(ticket){
  var response=await fetch(FAST_ENDPOINT+'?action=complete',{
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
    error.status=response.status;
    throw error;
  }
  return payload;
}
async function performDirectUpload(file,id,secret,code,onProgress,onPhase){
  if(typeof onPhase==='function')onPhase('Preparing secure direct upload');
  var prepared=await prepareUpload(file,id,secret,code);
  var progress=function(loaded,total){
    if(typeof onProgress==='function')onProgress(loaded,total);
  };

  if(Number(file.size||0)>TUS_THRESHOLD){
    if(typeof onPhase==='function')onPhase('Uploading resumable chunks directly');
    try{
      await uploadTus(prepared,file,id,progress);
    }catch(error){
      if(typeof onPhase==='function')onPhase('Resumable path unavailable · switching to direct cloud');
      clearResume(resumeKey(id,file));
      await uploadWithRetry(prepared.uploadUrl,file,progress);
    }
  }else{
    if(typeof onPhase==='function')onPhase('Uploading directly to cloud');
    await uploadWithRetry(prepared.uploadUrl,file,progress);
  }

  if(typeof onPhase==='function')onPhase('Finalizing cloud index');
  return await completeUpload(prepared.ticket);
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
        reject(new Error('TOTP interface did not initialize.'));
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
function refreshVault(){
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

  var completed=await performDirectUpload(
    file,
    id,
    setup.secret,
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

  setUi(file.name,100,'Stored in cloud','done');
  refreshVault();
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
  if(!event||event.__hashcodHfvFast4Handled)return;
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

  try{Object.defineProperty(event,'__hashcodHfvFast4Handled',{value:true});}catch(_){}
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

// Backup path for older File Vault builds: once TOTP fields are present,
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
    !body.has('totp_secret')||
    !body.has('totp_code')
  ){
    return nativeSend.call(this,body);
  }

  var owner=this;
  var file=body.get('file');
  var id=String(body.get('id')||'');
  var secret=String(body.get('totp_secret')||'');
  var code=String(body.get('totp_code')||'');
  if(!(file instanceof Blob)||!id)return nativeSend.call(owner,body);

  (async function(){
    try{
      var total=Number(file.size||1);
      callProgress(owner,Math.max(1,Math.floor(total*0.02)),total);
      var completed=await performDirectUpload(
        file,
        id,
        secret,
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
  transport:'direct-signed-storage+tus-resumable',
  strategy:'aws-style-direct-object-transfer',
  endpoint:FAST_ENDPOINT,
  resumableThreshold:TUS_THRESHOLD,
  chunkSize:TUS_CHUNK_SIZE,
  localBlocking:false,
  legacyPhpFallback:false,
  capturePhase:'window+document'
});
})();
