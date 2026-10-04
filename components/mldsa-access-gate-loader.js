(function(){
'use strict';

var VERSION='20261004-smith3';
var current=(document.currentScript&&document.currentScript.src)||window.location.href;
var base=new URL('.',current);

function addStyle(){
  if(document.querySelector('link[data-hashcod-smith-chart="style"]'))return;
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href=new URL('smith-credential-chart.css?v='+VERSION,base).href;
  link.setAttribute('data-hashcod-smith-chart','style');
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

function loadSmithAfterGate(){
  addStyle();
  addScript(
    'smith-chart',
    'smith-credential-chart.js?v='+VERSION,
    function(){
      addScript('smith-chart-layout','smith-credential-chart-layout.js?v='+VERSION);
    }
  );
}

// The gate runtime is loaded first from a direct PHP bridge. Smith chart code
// is strictly secondary and cannot block Monaco initialization.
addScript(
  'gate-core',
  '../mldsa-access-gate-core.php?v='+VERSION,
  loadSmithAfterGate,
  function(){
    var status=document.getElementById('d5CodeAccessStatus');
    if(status)status.textContent='Access runtime unavailable. Reload the page.';
    console.error('Hashcod access gate core failed to load');
  }
);
})();
