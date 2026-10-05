(function(){
'use strict';

var VERSION='20261005-file-vault-fast1';
var FAST_ENDPOINT='/hashcod-file-vault-fast-upload.php';

if(window.__hashcodFileVaultFastUploadLoaded)return;
window.__hashcodFileVaultFastUploadLoaded=true;

var proto=XMLHttpRequest.prototype;
var nativeOpen=proto.open;
var nativeSend=proto.send;

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}

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
    error.fallback=Boolean(payload.fallback);
    throw error;
  }
  return payload;
}

function directPut(url,file,owner){
  return new Promise(function(resolve,reject){
    var xhr=new XMLHttpRequest();
    xhr.open('PUT',url,true);
    try{xhr.setRequestHeader('x-upsert','true');}catch(_){}
    xhr.upload.onprogress=function(event){
      if(event.lengthComputable)callProgress(owner,event.loaded,event.total);
    };
    xhr.onerror=function(){reject(new Error('Direct storage connection was interrupted.'));};
    xhr.ontimeout=function(){reject(new Error('Direct storage upload timed out.'));};
    xhr.timeout=120000;
    xhr.onload=function(){
      if(xhr.status>=200&&xhr.status<300){
        callProgress(owner,file.size||1,file.size||1);
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

async function uploadWithRetry(url,file,owner){
  var delays=[0,400,1000,2200];
  var lastError=null;
  for(var attempt=0;attempt<3;attempt++){
    if(attempt>0)await sleep(delays[attempt]||1000);
    try{
      await directPut(url,file,owner);
      return true;
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error('Direct upload failed.');
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

proto.open=function(method,url){
  var args=Array.prototype.slice.call(arguments,2);
  this.__hashcodHfvFastUpload=
    String(method||'').toUpperCase()==='POST'&&
    String(url||'').indexOf('/api/hashcod-file-vault')!==-1&&
    String(url||'').indexOf('action=upload')!==-1;
  return nativeOpen.apply(this,[method,url].concat(args));
};

proto.send=function(body){
  if(!this.__hashcodHfvFastUpload||!(body instanceof FormData)||!body.has('totp_secret')||!body.has('totp_code')){
    return nativeSend.call(this,body);
  }

  var owner=this;
  var file=body.get('file');
  var id=String(body.get('id')||'');
  var secret=String(body.get('totp_secret')||'');
  var code=String(body.get('totp_code')||'');

  if(!(file instanceof Blob)||!id){
    return nativeSend.call(owner,body);
  }

  (async function(){
    try{
      callProgress(owner,0,Number(file.size||1));
      var prepared=await prepareUpload(file,id,secret,code);
      await uploadWithRetry(prepared.uploadUrl,file,owner);
      var completed=await completeUpload(prepared.ticket);
      finishOwner(owner,201,completed);
    }catch(error){
      if(error&&error.fallback){
        try{return nativeSend.call(owner,body);}catch(_){}
      }
      finishOwner(owner,Number(error&&error.status||502),{
        ok:false,
        error:error&&error.message||'Cloud upload unavailable.'
      });
    }
  })();

  return undefined;
};

window.HashcodFileVaultFastUpload=Object.freeze({
  version:VERSION,
  transport:'direct-signed-storage',
  strategy:'aws-style-direct-object-transfer',
  endpoint:FAST_ENDPOINT
});
})();
