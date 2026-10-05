(function(){
'use strict';

var VERSION='20261004-universal-cloud1';
var ENDPOINT='/hashcod-workspace-state.php';
var META_KEY='__hashcod_cloud_meta_v1';
var APPLIED_REVISION_KEY='hashcod:workspace:applied-revision';
var MAX_VALUE_BYTES=524288;
var MAX_ENTRIES=256;
var state={
  ready:false,
  syncing:false,
  dirty:false,
  revision:0,
  meta:{},
  lastValues:{},
  pushTimer:0,
  pollTimer:0,
  pullTimer:0,
  lastError:''
};

function sensitiveKey(key){
  var k=String(key||'').toLowerCase();
  if(!k||k===META_KEY||k.indexOf('__hashcod_cloud_')===0)return true;
  if(/(?:^|[_:\-.])(auth|token|secret|password|passwd|private|credential|dilithium|webauthn|csrf|nonce|challenge|turnstile|session|jwt|oauth|supabase|api[_-]?key|access[_-]?code)(?:$|[_:\-.])/i.test(k))return true;
  // Runtime/network caches are reproducible and should not overwrite user work on another device.
  if(/(?:^|[_:\-.])(cache|telemetry|orbit|satellite|ephemeris|rate[_-]?limit|debug|temporary|temp|tmp)(?:$|[_:\-.])/i.test(k))return true;
  return false;
}
function loadMeta(){
  try{
    var raw=localStorage.getItem(META_KEY)||'';
    var parsed=raw?JSON.parse(raw):{};
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))state.meta=parsed;
  }catch(_){state.meta={};}
}
function saveMeta(){
  try{localStorage.setItem(META_KEY,JSON.stringify(state.meta));}catch(_){}
}
function currentSafeValues(){
  var out={};
  try{
    for(var i=0;i<localStorage.length&&Object.keys(out).length<MAX_ENTRIES;i++){
      var key=localStorage.key(i);
      if(!key||sensitiveKey(key))continue;
      var value=localStorage.getItem(key);
      if(typeof value!=='string')continue;
      if(new Blob([value]).size>MAX_VALUE_BYTES)continue;
      out[key]=value;
    }
  }catch(_){}
  return out;
}
function baselineFromStorage(){
  state.lastValues=currentSafeValues();
}
function dispatchStorage(key,oldValue,newValue){
  try{
    window.dispatchEvent(new StorageEvent('storage',{key:key,oldValue:oldValue,newValue:newValue,url:location.href,storageArea:localStorage}));
  }catch(_){
    try{window.dispatchEvent(new CustomEvent('hashcod:cloud-storage-change',{detail:{key:key,oldValue:oldValue,newValue:newValue}}));}catch(__){}
  }
}
function markLocalChanges(){
  var now=Date.now();
  var current=currentSafeValues();
  var changed=false;
  Object.keys(current).forEach(function(key){
    if(!Object.prototype.hasOwnProperty.call(state.lastValues,key)){
      if(!state.meta[key])state.meta[key]={updatedAt:now,deleted:false};
      else state.meta[key].deleted=false;
      changed=true;
    }else if(state.lastValues[key]!==current[key]){
      state.meta[key]={updatedAt:now,deleted:false};
      changed=true;
    }
  });
  Object.keys(state.lastValues).forEach(function(key){
    if(!Object.prototype.hasOwnProperty.call(current,key)){
      state.meta[key]={updatedAt:now,deleted:true};
      changed=true;
    }
  });
  state.lastValues=current;
  if(changed){
    saveMeta();
    state.dirty=true;
    schedulePush(700);
  }
  return changed;
}
function buildEntries(){
  var current=currentSafeValues();
  var entries={};
  var keys=Object.keys(state.meta).slice(0,MAX_ENTRIES);
  keys.forEach(function(key){
    if(sensitiveKey(key))return;
    var info=state.meta[key]||{};
    var ts=Math.max(1,Number(info.updatedAt)||1);
    if(Object.prototype.hasOwnProperty.call(current,key)){
      entries[key]={value:current[key],updatedAt:ts,deleted:false};
    }else if(info.deleted){
      entries[key]={value:'',updatedAt:ts,deleted:true};
    }
  });
  Object.keys(current).forEach(function(key){
    if(Object.keys(entries).length>=MAX_ENTRIES||entries[key])return;
    var ts=Date.now();
    state.meta[key]={updatedAt:ts,deleted:false};
    entries[key]={value:current[key],updatedAt:ts,deleted:false};
  });
  saveMeta();
  return entries;
}
async function request(method,body){
  var options={method:method,credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}};
  if(method==='POST'){
    options.headers['Content-Type']='application/json';
    options.headers['X-Requested-With']='XMLHttpRequest';
    options.body=JSON.stringify(body||{});
  }
  var response=await fetch(ENDPOINT,options);
  var data={};
  try{data=await response.json();}catch(_){}
  if(!response.ok||!data.ok){
    var error=new Error(data.error||('workspace_http_'+response.status));
    error.status=response.status;
    throw error;
  }
  return data;
}
function applyRemote(entries,revision,allowReload){
  if(!entries||typeof entries!=='object')return false;
  var changed=false;
  Object.keys(entries).forEach(function(key){
    if(sensitiveKey(key))return;
    var remote=entries[key];
    if(!remote||typeof remote!=='object')return;
    var remoteTs=Math.max(0,Number(remote.updatedAt)||0);
    var localInfo=state.meta[key]||{};
    var localTs=Math.max(0,Number(localInfo.updatedAt)||0);
    if(remoteTs<localTs)return;
    var oldValue=null;
    try{oldValue=localStorage.getItem(key);}catch(_){}
    if(remote.deleted){
      if(oldValue!==null){
        try{localStorage.removeItem(key);}catch(_){}
        dispatchStorage(key,oldValue,null);
        changed=true;
      }
      state.meta[key]={updatedAt:remoteTs,deleted:true};
    }else{
      var next=String(remote.value==null?'':remote.value);
      if(new Blob([next]).size>MAX_VALUE_BYTES)return;
      if(oldValue!==next){
        try{localStorage.setItem(key,next);}catch(_){return;}
        dispatchStorage(key,oldValue,next);
        changed=true;
      }
      state.meta[key]={updatedAt:remoteTs,deleted:false};
    }
  });
  state.revision=Math.max(state.revision,Number(revision)||0);
  saveMeta();
  baselineFromStorage();
  try{window.dispatchEvent(new CustomEvent('hashcod:cloud-state-restored',{detail:{revision:state.revision,changed:changed}}));}catch(_){}

  if(changed&&allowReload){
    try{
      var applied=Number(sessionStorage.getItem(APPLIED_REVISION_KEY)||'0');
      if(state.revision>applied){
        sessionStorage.setItem(APPLIED_REVISION_KEY,String(state.revision));
        window.setTimeout(function(){location.reload();},120);
      }
    }catch(_){}
  }
  return changed;
}
async function pull(options){
  if(state.syncing)return null;
  state.syncing=true;
  try{
    var data=await request('GET');
    applyRemote(data.entries||{},data.revision||0,Boolean(options&&options.allowReload));
    state.lastError='';
    return data;
  }catch(error){
    state.lastError=String(error&&error.message||error||'pull_failed');
    return null;
  }finally{state.syncing=false;}
}
async function push(){
  if(state.syncing)return null;
  markLocalChanges();
  var entries=buildEntries();
  state.syncing=true;
  try{
    var data=await request('POST',{revision:state.revision+1,entries:entries});
    state.revision=Math.max(state.revision,Number(data.revision)||0);
    state.dirty=false;
    if(data.entries)applyRemote(data.entries,state.revision,false);
    state.lastError='';
    return data;
  }catch(error){
    state.lastError=String(error&&error.message||error||'push_failed');
    state.dirty=true;
    return null;
  }finally{state.syncing=false;}
}
function schedulePush(delay){
  clearTimeout(state.pushTimer);
  state.pushTimer=setTimeout(function(){push();},Math.max(100,delay||700));
}
async function syncNow(){
  markLocalChanges();
  if(state.dirty)await push();
  return pull({allowReload:false});
}
async function bootstrap(){
  if(state.ready)return;
  loadMeta();
  baselineFromStorage();
  var remote=await pull({allowReload:true});
  if(remote===null)return;

  // Anything local that was never seen in the cloud becomes a new cloud entry.
  var now=Date.now();
  var current=currentSafeValues();
  Object.keys(current).forEach(function(key){
    if(!state.meta[key]){
      state.meta[key]={updatedAt:now,deleted:false};
      state.dirty=true;
    }
  });
  saveMeta();
  baselineFromStorage();
  if(state.dirty)await push();

  state.ready=true;
  document.documentElement.dataset.hashcodUniversalCloud='ready';
  state.pollTimer=setInterval(markLocalChanges,2000);
  state.pullTimer=setInterval(function(){if(document.visibilityState!=='hidden')pull({allowReload:false});},15000);
}
function start(){
  bootstrap();
}

window.HashcodUniversalPersistence=Object.freeze({
  version:VERSION,
  syncNow:syncNow,
  pull:function(){return pull({allowReload:false});},
  push:push,
  getState:function(){return {ready:state.ready,syncing:state.syncing,dirty:state.dirty,revision:state.revision,lastError:state.lastError};}
});

window.addEventListener('hashcod:code-access-granted',start);
window.addEventListener('online',function(){syncNow();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')schedulePush(100);else pull({allowReload:false});});
window.addEventListener('pagehide',function(){markLocalChanges();});

if(document.body&&document.body.dataset.hashcodCodeAccessAuthorized==='1')start();
})();
