(function(){
'use strict';

if(window.__hashcodDeviceUsageTrackerLoaded)return;
window.__hashcodDeviceUsageTrackerLoaded=true;

function basePath(){
  var match=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return match?'/'+match[1]:'';
}
var API=basePath()+'/api/device-usage';
var entered=false;
var queue=Promise.resolve();

function eventId(prefix){
  try{
    if(crypto&&typeof crypto.randomUUID==='function')return prefix+':'+crypto.randomUUID();
    if(crypto&&typeof crypto.getRandomValues==='function'){
      var bytes=new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return prefix+':'+Array.from(bytes).map(function(v){return v.toString(16).padStart(2,'0');}).join('');
    }
  }catch(_){}
  return prefix+':'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2);
}

function post(action){
  var id=eventId(action);
  queue=queue.catch(function(){}).then(function(){
    return fetch(API,{
      method:'POST',
      credentials:'same-origin',
      keepalive:true,
      headers:{
        'Content-Type':'application/json',
        'X-Requested-With':'XMLHttpRequest',
        Accept:'application/json'
      },
      body:JSON.stringify({action:action,event_id:id})
    }).then(function(response){
      if(!response.ok)return null;
      return response.json().catch(function(){return null;});
    }).then(function(data){
      if(data&&data.ok){
        try{window.dispatchEvent(new CustomEvent('hashcod:device-usage-updated',{detail:data}));}catch(_){}
      }
      return data;
    });
  });
  return queue;
}

function countEnter(){
  if(entered)return;
  entered=true;
  post('enter');
}

function eligibleToolboxButton(target){
  if(!target||!target.closest)return null;
  var slot=target.closest('.toolbox-panel .tb-slot');
  if(!slot)return null;
  if(slot.disabled||slot.getAttribute('aria-disabled')==='true')return null;
  return slot;
}

document.addEventListener('click',function(event){
  if(event.isTrusted===false)return;
  var slot=eligibleToolboxButton(event.target);
  if(!slot)return;
  post('touch');
},true);

window.addEventListener('hashcod:platform-entered',countEnter,{once:true});
window.addEventListener('hashcod:platform-entry-complete',countEnter,{once:true});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){
    window.setTimeout(countEnter,0);
  },{once:true});
}else{
  window.setTimeout(countEnter,0);
}

window.HashcodDeviceUsageTracker=Object.freeze({
  refresh:function(){
    return fetch(API,{credentials:'same-origin',headers:{Accept:'application/json'}}).then(function(r){return r.json();});
  },
  recordTouch:function(){return post('touch');}
});
})();