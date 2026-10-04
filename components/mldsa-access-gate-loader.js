(function(){
'use strict';

var VERSION='20261004-smith2';
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
  addScript('smith-chart','smith-credential-chart.js?v='+VERSION);
}

// Important: never resolve the gate core through /components/mldsa-access-gate.js.
// That URL is this loader in production. The PHP bridge reads the real runtime
// directly from disk, preventing rewrite recursion and guaranteeing that the
// access editor initializes before the optional Smith visualization.
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
