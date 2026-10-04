(function(){
'use strict';

var VERSION='20261004-smith1';
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

function addScript(name,src){
  if(document.querySelector('script[data-hashcod-loader="'+name+'"]'))return;
  var script=document.createElement('script');
  script.src=new URL(src,base).href;
  script.defer=true;
  script.async=false;
  script.setAttribute('data-hashcod-loader',name);
  document.head.appendChild(script);
}

addStyle();
addScript('gate-core','mldsa-access-gate-core.js?v='+VERSION);
addScript('smith-chart','smith-credential-chart.js?v='+VERSION);
})();
