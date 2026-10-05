(function(){
'use strict';

var VERSION='20261005-file-vault-fast5';
var ORIGINAL_ENDPOINT='/api/hashcod-file-vault';
var FAST_ENDPOINT='/hashcod-file-vault-fast-upload.php';
var RETRY_DELAYS=[0,500,1400,3000];

if(window.__hashcodFileVaultFast5Loaded)return;
window.__hashcodFileVaultFast5Loaded=true;

var proto=XMLHttpRequest.prototype;
var previousOpen=proto.open;
var previousSend=proto.send;

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function isUploadRequest(method,url){
  return String(method||'').toUpperCase()==='POST'&&
    String(url||'').indexOf(ORIGINAL_ENDPOINT)!==-1&&
    String(url||'').indexOf('action=upload')!==-1;
}
function bridgeProgress(owner,loaded,total){
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
async function json(response){try{return await response.json();}catch(_){return {};}}
function phase(name,detail){
  try{
    window.dispatchEvent(new CustomEvent('hashcod:file-vault-transfer-phase',{detail:{phase:name,detail:detail||'',version:VERSION}}));
  }catch(_){}
}
async function prepare(file,id,secret,code){
  var response=await fetch(FAST_ENDPOINT+'?action=prepare',{
    method:'POST',
    credentials:'same-origin',
    cache:'no-store',
    headers:{'Accept':'application/json','Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
    body:JSON.stringify({
      id:id,
      name:file&&file.name||'file',
      type:file&&file.type||'application/octet-stream',
      size:Number(file&&file.size||0),
      totp_secret:secret,
      totp_code:code
    })
  });
  var payload=await json(response);
  if(!response.ok||!payload.ok||!payload.uploadUrl||!payload.ticket){
    var error=new Error(payload.error||'Could not prepare direct cloud upload.');
    error.status=response.status||503;
    throw error;
  }
  return payload;
}
function putOnce(url,file,onProgress){
  return new Promise(function(resolve,reject){
    var xhr=new XMLHttpRequest();
    xhr.open('PUT',url,true);
    xhr.timeout=240000;
    try{xhr.setRequestHeader('x-upsert','true');}catch(_){}
    xhr.upload.onprogress=function(event){
      if(event.lengthComputable&&typeof onProgress==='function')onProgress(event.loaded,event.total);
    };
    xhr.onerror=function(){reject(new Error('Direct Storage connection was interrupted.'));};
    xhr.ontimeout=function(){reject(new Error('Direct Storage upload timed out.'));};
    xhr.onload=function(){
      if(xhr.status>=200&&xhr.status<300){
        if(typeof onProgress==='function')onProgress(file.size||1,file.size||1);
        resolve(true);
      }else{
        reject(new Error('Direct Storage upload failed with HTTP '+xhr.status+'.'));
      }
    };
    var form=new FormData();
    form.append('cacheControl','3600');
    form.append('',file,file.name||'file');
    xhr.send(form);
  });
}
async function putWithRetry(url,file,onProgress){
  var lastError=null;
  for(var attempt=0;attempt<RETRY_DELAYS.length;attempt++){
    if(attempt>0){
      phase('retry','attempt '+(attempt+1));
      await sleep(RETRY_DELAYS[attempt]);
    }
    try{
      await putOnce(url,file,onProgress);
      return true;
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error('Direct cloud upload failed.');
}
function ensureBadge(){
  var drop=document.getElementById('d5FileVaultDropzone');
  if(!drop)return;
  if(drop.querySelector('.hfv-fast5-badge'))return;
  try{drop.style.position='relative';}catch(_){}
  var badge=document.createElement('span');
  badge.className='hfv-fast5-badge';
  badge.textContent='Direct cloud';
  badge.title='File bytes upload directly to Supabase Storage; Railway only prepares and finalizes metadata.';
  badge.style.cssText='position:absolute;right:12px;top:12px;z-index:5;padding:5px 8px;border:1px solid #3f3f46;border-radius:999px;background:#171717;color:#d4d4d8;font:600 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.02em;pointer-events:none';
  drop.appendChild(badge);
}
function installBadgeObserver(){
  ensureBadge();
  var observer=new MutationObserver(ensureBadge);
  observer.observe(document.body,{childList:true,subtree:true});
}

proto.open=function(method,url){
  this.__hashcodHfvFast5Upload=isUploadRequest(method,url);
  return previousOpen.apply(this,arguments);
};

proto.send=function(body){
  if(!this.__hashcodHfvFast5Upload||!(body instanceof FormData)){
    return previousSend.call(this,body);
  }

  var owner=this;
  var file=body.get('file');
  var id=String(body.get('id')||'');
  if(!(file instanceof Blob)||!id){
    return previousSend.call(owner,body);
  }

  (async function(){
    try{
      var api=window.HashcodFileVaultTotp;
      if(!api||typeof api.requestSetup!=='function'){
        throw new Error('TOTP protection is not ready. Reload the page and try again.');
      }

      phase('totp','waiting for TOTP setup');
      var setup=await api.requestSetup(file.name||'file');
      if(!setup){
        try{if(typeof owner.onerror==='function')owner.onerror.call(owner,new Event('error'));}catch(_){}
        return;
      }

      var total=Math.max(1,Number(file.size||1));
      bridgeProgress(owner,Math.max(1,Math.floor(total*0.01)),total);
      phase('prepare','requesting signed upload URL');
      var prepared=await prepare(file,id,setup.secret,setup.code);

      phase('upload','browser → Supabase Storage');
      await putWithRetry(prepared.uploadUrl,file,function(loaded,bytesTotal){
        bridgeProgress(owner,loaded,bytesTotal||total);
      });

      phase('finalize','indexing l8_files');
      previousOpen.call(owner,'POST',FAST_ENDPOINT+'?action=complete',true);
      owner.withCredentials=true;
      try{owner.setRequestHeader('Accept','application/json');}catch(_){}
      try{owner.setRequestHeader('Content-Type','application/json');}catch(_){}
      try{owner.setRequestHeader('X-Requested-With','XMLHttpRequest');}catch(_){}
      previousSend.call(owner,JSON.stringify({ticket:prepared.ticket}));
    }catch(error){
      phase('error',error&&error.message||'direct upload failed');
      finishOwner(owner,Number(error&&error.status||502),{
        ok:false,
        error:error&&error.message||'Direct cloud upload unavailable.'
      });
    }
  })();

  return undefined;
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installBadgeObserver,{once:true});
else installBadgeObserver();

window.HashcodFileVaultFastUpload=Object.freeze({
  version:VERSION,
  transport:'supabase-signed-direct',
  strategy:'aws-s3-presigned-style-direct-object-transfer',
  endpoint:FAST_ENDPOINT,
  retries:RETRY_DELAYS.length,
  phpProxyBytes:false,
  legacyPhpFallback:false,
  totpBeforeTransfer:true,
  database:'l8_files'
});
})();
