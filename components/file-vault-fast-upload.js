(function(){
'use strict';

var VERSION='20261005-file-vault-fast2';
var FAST_ENDPOINT='/hashcod-file-vault-fast-upload.php';
var TUS_THRESHOLD=6*1024*1024;
var TUS_CHUNK_SIZE=6*1024*1024;
var RETRY_DELAYS=[0,500,1500,3000,5000];

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
  var lastError=null;
  for(var attempt=0;attempt<3;attempt++){
    if(attempt>0)await sleep(RETRY_DELAYS[attempt]||1000);
    try{
      await directPut(url,file,owner);
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

function parseSignedUpload(url){
  var parsed=new URL(url,window.location.href);
  var marker='/storage/v1/object/upload/sign/';
  var index=parsed.pathname.indexOf(marker);
  if(index<0)throw new Error('Signed Storage URL is not compatible with resumable upload.');
  var tail=parsed.pathname.slice(index+marker.length).split('/').filter(Boolean).map(function(part){
    try{return decodeURIComponent(part);}catch(_){return part;}
  });
  if(tail.length<2)throw new Error('Signed Storage URL is missing bucket/object metadata.');
  var bucket=tail.shift();
  var token=parsed.searchParams.get('token')||'';
  if(!token)throw new Error('Signed Storage token is missing.');
  return {
    bucket:bucket,
    object:tail.join('/'),
    token:token,
    tusUrl:parsed.origin+'/storage/v1/upload/resumable'
  };
}

function resumeKey(id,file){
  return 'hashcod:hfv:tus:v1:'+String(id||'')+':'+String(file&&file.size||0)+':'+String(file&&file.lastModified||0);
}

function loadResume(key){
  try{return window.localStorage.getItem(key)||'';}catch(_){return '';}
}

function saveResume(key,url){
  try{window.localStorage.setItem(key,url);}catch(_){}
}

function clearResume(key){
  try{window.localStorage.removeItem(key);}catch(_){}
}

function tusHeaders(token){
  return {
    'Tus-Resumable':'1.0.0',
    'x-signature':token
  };
}

async function tusRequest(url,options,attempts){
  var lastError=null;
  var totalAttempts=Math.max(1,attempts||4);
  for(var attempt=0;attempt<totalAttempts;attempt++){
    if(attempt>0)await sleep(RETRY_DELAYS[Math.min(attempt,RETRY_DELAYS.length-1)]||3000);
    try{
      var response=await fetch(url,options);
      if(response.status>=500||response.status===408||response.status===429){
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
  var response=await tusRequest(uploadUrl,{
    method:'HEAD',
    cache:'no-store',
    headers:tusHeaders(token)
  },3);
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
  var response=await tusRequest(info.tusUrl,{
    method:'POST',
    cache:'no-store',
    headers:headers
  },4);
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

async function uploadTus(prepared,file,id,owner){
  var info=parseSignedUpload(prepared.uploadUrl);
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

  callProgress(owner,offset,file.size||1);

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
    callProgress(owner,Math.min(offset,file.size),file.size||1);
  }

  clearResume(key);
  callProgress(owner,file.size||1,file.size||1);
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
      var total=Number(file.size||1);
      callProgress(owner,Math.max(1,Math.floor(total*0.01)),total);
      var prepared=await prepareUpload(file,id,secret,code);
      if(Number(file.size||0)>TUS_THRESHOLD){
        try{
          await uploadTus(prepared,file,id,owner);
        }catch(tusError){
          clearResume(resumeKey(id,file));
          await uploadWithRetry(prepared.uploadUrl,file,owner);
        }
      }else{
        await uploadWithRetry(prepared.uploadUrl,file,owner);
      }
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
  transport:'direct-signed-storage+tus-resumable',
  strategy:'aws-style-direct-object-transfer',
  endpoint:FAST_ENDPOINT,
  resumableThreshold:TUS_THRESHOLD,
  chunkSize:TUS_CHUNK_SIZE
});
})();
