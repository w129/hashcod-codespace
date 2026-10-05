(function(){
'use strict';

var VERSION='20261005-file-vault-commit-recovery1';
var FAST_ENDPOINT='/hashcod-file-vault-fast-upload.php';
var STORAGE_KEY='hashcod:hfv:pending-cloud-commits:v1';
var MAX_AGE_MS=28*60*1000;
var RETRY_DELAYS=[0,650,1600,3200,6500];
var nativeFetch=window.fetch.bind(window);
var recovering=false;

if(window.__hashcodFileVaultCommitRecoveryLoaded)return;
window.__hashcodFileVaultCommitRecoveryLoaded=true;

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function safeJson(text){try{return JSON.parse(text||'{}');}catch(_){return {};}}
function readPending(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    var rows=raw?safeJson(raw):[];
    return Array.isArray(rows)?rows:[];
  }catch(_){return [];}
}
function writePending(rows){
  try{
    if(!rows.length)localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(-12)));
  }catch(_){}
}
function remember(ticket){
  ticket=String(ticket||'').trim();
  if(!ticket)return;
  var now=Date.now();
  var rows=readPending().filter(function(row){
    return row&&row.ticket&&now-Number(row.createdAt||0)<MAX_AGE_MS&&row.ticket!==ticket;
  });
  rows.push({ticket:ticket,createdAt:now,attempts:0});
  writePending(rows);
}
function forget(ticket){
  ticket=String(ticket||'');
  writePending(readPending().filter(function(row){return row&&row.ticket!==ticket;}));
}
function bump(ticket){
  var rows=readPending();
  for(var i=0;i<rows.length;i++){
    if(rows[i]&&rows[i].ticket===ticket){
      rows[i].attempts=Number(rows[i].attempts||0)+1;
      rows[i].lastAttemptAt=Date.now();
    }
  }
  writePending(rows);
}
function isCompleteRequest(input,init){
  var url='';
  try{url=typeof input==='string'?input:String(input&&input.url||'');}catch(_){}
  var method=String(init&&init.method||'GET').toUpperCase();
  return method==='POST'&&url.indexOf(FAST_ENDPOINT)!==-1&&url.indexOf('action=complete')!==-1;
}
function requestBody(init){
  var raw=init&&init.body;
  if(typeof raw!=='string')return {};
  return safeJson(raw);
}
async function responsePayload(response){
  try{return await response.clone().json();}catch(_){return {};}
}
function transientStatus(status){
  return status===0||status===408||status===425||status===429||status>=500;
}
function refreshVault(file){
  try{
    window.dispatchEvent(new CustomEvent('hashcod:file-vault-cloud-committed',{detail:{file:file||null,version:VERSION}}));
  }catch(_){}
  [100,650,1800,4200].forEach(function(delay){
    setTimeout(function(){
      var button=document.querySelector('#d5FileVault .hfv-list-head button');
      if(button)button.click();
      try{
        if(window.HashcodFileVaultTotp&&typeof window.HashcodFileVaultTotp.refresh==='function'){
          window.HashcodFileVaultTotp.refresh();
        }
      }catch(_){}
    },delay);
  });
}
async function postComplete(ticket){
  return nativeFetch(FAST_ENDPOINT+'?action=complete',{
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
}
async function completeWithRetry(input,init,ticket){
  var lastResponse=null;
  var lastError=null;
  for(var attempt=0;attempt<RETRY_DELAYS.length;attempt++){
    if(RETRY_DELAYS[attempt])await sleep(RETRY_DELAYS[attempt]);
    bump(ticket);
    try{
      var response=await nativeFetch(input,init);
      var payload=await responsePayload(response);
      lastResponse=response;
      if(response.ok&&payload&&payload.ok){
        forget(ticket);
        refreshVault(payload.file||null);
        return response;
      }
      if(!transientStatus(response.status)){
        if(response.status===400||response.status===401||response.status===404)forget(ticket);
        return response;
      }
    }catch(error){
      lastError=error;
    }
  }
  if(lastResponse)return lastResponse;
  if(typeof Response!=='undefined'){
    return new Response(JSON.stringify({ok:false,error:lastError&&lastError.message||'Cloud index commit is temporarily unavailable. The upload will be retried automatically.'}),{
      status:503,
      headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
    });
  }
  throw lastError||new Error('Cloud index commit is temporarily unavailable.');
}

window.fetch=function(input,init){
  if(!isCompleteRequest(input,init))return nativeFetch(input,init);
  var body=requestBody(init);
  var ticket=String(body.ticket||'').trim();
  if(!ticket)return nativeFetch(input,init);
  remember(ticket);
  return completeWithRetry(input,init,ticket);
};

async function recoverPending(){
  if(recovering)return;
  recovering=true;
  try{
    var now=Date.now();
    var rows=readPending().filter(function(row){
      return row&&row.ticket&&now-Number(row.createdAt||0)<MAX_AGE_MS;
    });
    writePending(rows);
    for(var i=0;i<rows.length;i++){
      var row=rows[i];
      try{
        bump(row.ticket);
        var response=await postComplete(row.ticket);
        var payload=await responsePayload(response);
        if(response.ok&&payload&&payload.ok){
          forget(row.ticket);
          refreshVault(payload.file||null);
        }else if(!transientStatus(response.status)){
          forget(row.ticket);
        }
      }catch(_){}
      if(i<rows.length-1)await sleep(500);
    }
  }finally{
    recovering=false;
  }
}

window.addEventListener('online',recoverPending);
window.addEventListener('focus',recoverPending);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')recoverPending();});
setTimeout(recoverPending,350);
setInterval(recoverPending,15000);

window.HashcodFileVaultCommitRecovery=Object.freeze({
  version:VERSION,
  pending:function(){return readPending().length;},
  retry:recoverPending
});
})();
