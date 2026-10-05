(function(){
'use strict';

var VERSION='20261004-product-image-cloud1';
var ENDPOINT='/hashcod-workspace-blob.php?key=product-image';
var DB_NAME='hashcod-entry-product-media-v1';
var DB_STORE='assets';
var DB_KEY='product-image';
var HASH_KEY='__hashcod_cloud_product_image_hash_v1';
var RESTORE_SESSION_KEY='hashcod:product-image:restored-hash';
var running=false;
var timer=0;

function openDb(){
  return new Promise(function(resolve,reject){
    if(!('indexedDB' in window))return reject(new Error('indexeddb_unavailable'));
    var request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=function(){
      var db=request.result;
      if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE);
    };
    request.onsuccess=function(){resolve(request.result);};
    request.onerror=function(){reject(request.error||new Error('indexeddb_open_failed'));};
  });
}
async function getLocal(){
  var db=await openDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readonly');
    var req=tx.objectStore(DB_STORE).get(DB_KEY);
    req.onsuccess=function(){resolve(req.result||null);};
    req.onerror=function(){reject(req.error||new Error('indexeddb_read_failed'));};
    tx.oncomplete=function(){try{db.close();}catch(_){}};
  });
}
async function putLocal(blob){
  var db=await openDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put({
      blob:blob,
      name:'product-image',
      type:String(blob.type||'image/png'),
      updatedAt:Date.now()
    },DB_KEY);
    tx.oncomplete=function(){try{db.close();}catch(_){} resolve(true);};
    tx.onerror=function(){try{db.close();}catch(_){} reject(tx.error||new Error('indexeddb_write_failed'));};
  });
}
async function deleteLocal(){
  var db=await openDb();
  return new Promise(function(resolve){
    var tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).delete(DB_KEY);
    tx.oncomplete=function(){try{db.close();}catch(_){} resolve(true);};
    tx.onerror=function(){try{db.close();}catch(_){} resolve(false);};
  });
}
async function hashBlob(blob){
  if(!blob)return '';
  var buffer=await blob.arrayBuffer();
  var digest=await crypto.subtle.digest('SHA-256',buffer);
  return Array.from(new Uint8Array(digest)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
}
function marker(){try{return localStorage.getItem(HASH_KEY)||'';}catch(_){return '';}}
function setMarker(value){try{localStorage.setItem(HASH_KEY,String(value||''));}catch(_){} }
async function remoteGet(){
  var response=await fetch(ENDPOINT,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'image/*'}});
  if(response.status===404)return {exists:false};
  if(!response.ok)throw new Error('product_image_http_'+response.status);
  var blob=await response.blob();
  var hash=String(response.headers.get('X-Content-SHA256')||'');
  if(!/^[a-f0-9]{64}$/i.test(hash))hash=await hashBlob(blob);
  return {exists:true,blob:blob,hash:hash.toLowerCase()};
}
async function remoteUpload(record){
  if(!record||!(record.blob instanceof Blob))return null;
  var form=new FormData();
  var name=String(record.name||'product-image');
  form.append('file',record.blob,name);
  form.append('key','product-image');
  form.append('action','upload');
  var response=await fetch(ENDPOINT+'&action=upload',{
    method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest'},body:form
  });
  var data={};try{data=await response.json();}catch(_){}
  if(!response.ok||!data.ok)throw new Error(data.error||('product_image_upload_'+response.status));
  return String(data.sha256||'').toLowerCase();
}
async function remoteDelete(){
  var response=await fetch(ENDPOINT+'&action=delete',{
    method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest','Content-Type':'application/json'},body:'{}'
  });
  if(!response.ok&&response.status!==404)throw new Error('product_image_delete_'+response.status);
}
function notify(kind,hash){
  try{window.dispatchEvent(new CustomEvent('hashcod:product-image-cloud-sync',{detail:{kind:kind,hash:hash||''}}));}catch(_){}
}
function reloadOnceForRemote(hash){
  try{
    if(sessionStorage.getItem(RESTORE_SESSION_KEY)===hash)return;
    sessionStorage.setItem(RESTORE_SESSION_KEY,hash);
    setTimeout(function(){location.reload();},140);
  }catch(_){}
}
async function sync(){
  if(running||!navigator.onLine)return;
  running=true;
  try{
    var local=await getLocal();
    var localBlob=local&&local.blob instanceof Blob?local.blob:null;
    var localHash=localBlob?await hashBlob(localBlob):'';
    var known=marker();
    var remote=await remoteGet();

    if(remote.exists){
      if(!localBlob){
        if(known&&known!=='__deleted__'){
          await remoteDelete();
          setMarker('__deleted__');
          notify('deleted','');
        }else{
          await putLocal(remote.blob);
          setMarker(remote.hash);
          notify('restored',remote.hash);
          reloadOnceForRemote(remote.hash);
        }
      }else if(localHash===remote.hash){
        setMarker(remote.hash);
      }else if(known&&known!=='__deleted__'&&localHash!==known){
        var uploaded=await remoteUpload(local);
        setMarker(uploaded||localHash);
        notify('uploaded',uploaded||localHash);
      }else{
        await putLocal(remote.blob);
        setMarker(remote.hash);
        notify('restored',remote.hash);
        reloadOnceForRemote(remote.hash);
      }
    }else{
      if(localBlob){
        if(known&&known!=='__deleted__'&&localHash===known){
          await deleteLocal();
          setMarker('__deleted__');
          notify('deleted','');
        }else{
          var uploadedHash=await remoteUpload(local);
          setMarker(uploadedHash||localHash);
          notify('uploaded',uploadedHash||localHash);
        }
      }else{
        setMarker('__deleted__');
      }
    }
  }catch(_){
    // Offline/cloud errors never delete local media. The next pass retries.
  }finally{running=false;}
}
function start(){
  clearInterval(timer);
  sync();
  timer=setInterval(sync,8000);
}

window.HashcodProductImageCloud=Object.freeze({version:VERSION,syncNow:sync});
window.addEventListener('online',sync);
window.addEventListener('hashcod:code-access-granted',start);
if(document.body&&document.body.dataset.hashcodCodeAccessAuthorized==='1')start();
})();
