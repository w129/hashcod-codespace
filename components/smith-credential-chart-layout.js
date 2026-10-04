(function(){
'use strict';

if(window.__hashcodSmithCredentialLayoutLoaded)return;
window.__hashcodSmithCredentialLayoutLoaded=true;

function attachSmithPanel(){
  var stage=document.querySelector('#d5CodeAccessGate .mesh-editor-stage');
  var panel=document.getElementById('d5SmithCredentialChart');
  if(!stage||!panel)return false;

  if(panel.parentElement!==stage){
    stage.appendChild(panel);
  }

  panel.hidden=false;
  panel.setAttribute('data-layout','editor-stage');
  document.documentElement.classList.add('hashcod-smith-chart-active');

  requestAnimationFrame(function(){
    var width=Math.round(panel.getBoundingClientRect().width||0);
    if(width>0){
      document.documentElement.style.setProperty('--hashcod-smith-panel-width',width+'px');
    }
  });
  return true;
}

var scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(function(){
    scheduled=false;
    attachSmithPanel();
  });
}

var observer=new MutationObserver(schedule);

function boot(){
  attachSmithPanel();
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('hashcod:code-access-granted',function(){
    var panel=document.getElementById('d5SmithCredentialChart');
    if(panel)panel.hidden=true;
  });

  window.HashcodSmithCredentialLayout=Object.freeze({
    mounted:true,
    version:'20261004-smith3',
    attach:attachSmithPanel
  });
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();
