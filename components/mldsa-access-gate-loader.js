(function(){
'use strict';

var VERSION='20261004-smith-auth1';
var current=(document.currentScript&&document.currentScript.src)||window.location.href;
var base=new URL('.',current);

function addStyle(name,src){
  if(document.querySelector('link[data-hashcod-loader-style="'+name+'"]'))return;
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=new URL(src,base).href;
  link.setAttribute('data-hashcod-loader-style',name);
  document.head.appendChild(link);
}

function addScript(name,src,onload,onerror){
  var existing=document.querySelector('script[data-hashcod-loader="'+name+'"]');
  if(existing){
    if(typeof onload==='function'&&existing.dataset.loaded==='true')onload();
    return existing;
  }
  var script=document.createElement('script');
  script.src=new URL(src,base).href;
  script.async=false;
  script.setAttribute('data-hashcod-loader',name);
  script.onload=function(){
    script.dataset.loaded='true';
    if(typeof onload==='function')onload();
  };
  script.onerror=function(){
    script.dataset.failed='true';
    if(typeof onerror==='function')onerror();
  };
  document.head.appendChild(script);
  return script;
}

function loadSignedSmithBridge(){
  addStyle('signed-smith-editor','signed-smith-editor-bridge.css?v='+VERSION);
  addScript('signed-smith-editor','signed-smith-editor-bridge.js?v='+VERSION);
}

// The production gate runtime always initializes first. The signed-Smith bridge
// is secondary: if it fails, the React/Monaco gate still loads normally.
addScript(
  'gate-core',
  '../mldsa-access-gate-core.php?v='+VERSION,
  loadSignedSmithBridge,
  function(){
    var status=document.getElementById('d5CodeAccessStatus');
    if(status)status.textContent='Access runtime unavailable. Reload the page.';
    console.error('Hashcod access gate core failed to load');
  }
);
})();
