(function(){
'use strict';

var VERSION='20261004-image-vault-workspace1';
var ENDPOINT='/hashcod-workspace-image-vault.php';
var DB_NAME='hashcod_image_vault_v1';
var DB_VERSION=1;
var STORE_NAME='images';
var running=false;
var timer=0;

function openDb(){
  return new Promise(function(resolve,reject){
    if(!window.indexedDB)return reject(new Error('indexeddb_unavailable'));
    var request=window.indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=function(){
      var db=request.result;
      if(!db.objectStoreNames.contains(STORE_NAME)){
        var store=db.createObjectStore(STORE_NAME,{keyPath:'id'});
        store.createIndex('createdAt','createdAt',{unique:false});
      }
    };
    request.onsuccess=function(){resolve(request.result);};
    request.onerror=function(){reject(request.error||new Error('indexeddb_open_failed'));};
  });
}
async function getAll(){
  var db=await openDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(STORE_NAME,'readonly');
    var req=tx.objectStore(STORE_NAME).getAll();
    req.onsuccess=function(){resolve(Array.isArray(req.result)?req.result:[]);};
    req.onerror=function(){reject(req.error||new Error('indexeddb_read_failed'));};
    tx.oncomplete=function(){try{db.close();}catch(_){}};
  });
}
async function put(record){
  var db=await openDb();
  return new Promise(function(resolve,reject){
    var tx=db.transaction(STORE_NAME,'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete=function(){try{db.close();}catch(_){} resolve(true);};
    tx.onerror=function(){try{db.close();}catch(_){} reject(tx.error||new Error('indexeddb_write_failed'));};
  });
}
async function listRemote(){
  var response=await fetch(ENDPOINT+'?action=list',{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  var data={};try{data=await response.json();}catch(_){}
  if(!response.ok||!data.ok)throw new Error(data.error||('image_vault_list_'+response.status));
  return Array.isArray(data.images)?data.images:[];
}
async function getRemote(row){
  var response=await fetch(ENDPOINT+'?action=get&id='+encodeURIComponent(row.id),{method:'GET',credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw new Error('image_vault_get_'+response.status);
  var blob=await response.blob();
  return {
    id:String(row.id),
    name:String(row.name||'image.png'),
    type:'image/png',
    size:Number(row.size||blob.size||0),
    createdAt:Number(row.createdAt||Date.now()),
    codeHash:String(row.codeHash||''),
    blob:blob
  };
}
async function uploadLocal(row){
  if(!row||!(row.blob instanceof Blob)||!row.id||!/^[a-f0-9]{64}$/i.test(String(row.codeHash||'')))return false;
  var form=new FormData();
  form.append('id',String(row.id));
  form.append('code_hash',String(row.codeHash).toLowerCase());
  form.append('created_at',String(Number(row.createdAt||Date.now())));
  form.append('file',row.blob,String(row.name||'image.png'));
  var response=await fetch(ENDPOINT+'?action=upload',{
    method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'XMLHttpRequest'},body:form
  });
  if(!response.ok)return false;
  var data={};try{data=await response.json();}catch(_){}
  return data.ok===true;
}
function notify(detail){
  try{window.dispatchEvent(new CustomEvent('hashcod:image-vault-workspace-sync',{detail:detail||{}}));}catch(_){}
  try{window.dispatchEvent(new CustomEvent('hashcod:local-save'));}catch(_){}
}
async function sync(){
  if(running||!navigator.onLine)return;
  running=true;
  try{
    var local=await getAll();
    var remote=await listRemote();
    var localById=new Map(local.map(function(row){return [String(row.id),row];}));
    var remoteById=new Map(remote.map(function(row){return [String(row.id),row];}));
    var uploaded=0,downloaded=0;

    for(var i=0;i<local.length;i++){
      var localRow=local[i];
      if(!remoteById.has(String(localRow.id))){
        if(await uploadLocal(localRow))uploaded++;
      }
    }
    for(var j=0;j<remote.length;j++){
      var remoteRow=remote[j];
      if(!localById.has(String(remoteRow.id))){
        var record=await getRemote(remoteRow);
        await put(record);
        downloaded++;
      }
    }
    if(uploaded||downloaded)notify({uploaded:uploaded,downloaded:downloaded});
  }catch(_){
    // Local IndexedDB remains the offline copy; future passes retry cloud sync.
  }finally{running=false;}
}
function start(){
  clearInterval(timer);
  sync();
  timer=setInterval(sync,15000);
}

window.HashcodImageVaultWorkspace=Object.freeze({version:VERSION,syncNow:sync});
window.addEventListener('online',sync);
window.addEventListener('hashcod:code-access-granted',start);
window.addEventListener('hashcod:local-save',function(){setTimeout(sync,500);});
if(document.body&&document.body.dataset.hashcodCodeAccessAuthorized==='1')start();
})();
