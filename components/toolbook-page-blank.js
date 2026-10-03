(function(){
'use strict';

if(window.__hashcodToolbookPageResetLoaded)return;
window.__hashcodToolbookPageResetLoaded=true;

var activated=false;
var bodyObserver=null;
var surfaceObserver=null;
var timer=0;

function visibleToolbookSurface(){
  var panel=document.querySelector('.toolbox-panel');
  if(!panel)return null;

  var style=window.getComputedStyle(panel);
  if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0)return null;

  var rect=panel.getBoundingClientRect();
  if(rect.width<300||rect.height<300)return null;
  if(rect.right<=0||rect.left>=window.innerWidth||rect.bottom<=0||rect.top>=window.innerHeight)return null;

  return panel;
}

function keepBlank(){
  if(!activated||!document.body)return;

  var blank=document.getElementById('hashcodToolbookBlankPage');
  if(!blank){
    blank=document.createElement('main');
    blank.id='hashcodToolbookBlankPage';
    blank.setAttribute('aria-label','Toolbook blank page');
    blank.setAttribute('data-hashcod-toolbook-blank','true');
    document.body.appendChild(blank);
  }

  Array.from(document.body.children).forEach(function(node){
    if(node===blank)return;
    try{node.remove();}catch(_){}
  });
}

function activate(){
  if(activated||!document.body)return;
  activated=true;

  document.documentElement.dataset.hashcodToolbookPageBlank='true';
  document.documentElement.classList.add('hashcod-toolbook-page-blank');

  try{
    if(document.getAnimations){
      document.getAnimations().forEach(function(animation){
        try{animation.cancel();}catch(_){}
      });
    }
  }catch(_){}

  var blank=document.createElement('main');
  blank.id='hashcodToolbookBlankPage';
  blank.setAttribute('aria-label','Toolbook blank page');
  blank.setAttribute('data-hashcod-toolbook-blank','true');

  document.body.replaceChildren(blank);
  document.body.className='hashcod-toolbook-page-blank-body';
  document.body.removeAttribute('style');

  if(surfaceObserver){
    surfaceObserver.disconnect();
    surfaceObserver=null;
  }
  if(timer){
    window.clearInterval(timer);
    timer=0;
  }

  if(typeof MutationObserver==='function'){
    bodyObserver=new MutationObserver(function(){
      keepBlank();
    });
    bodyObserver.observe(document.body,{childList:true});
  }

  window.HashcodToolbookBlankPage={
    active:true,
    version:'20261003-blank1'
  };

  try{
    window.dispatchEvent(new CustomEvent('hashcod:toolbook-page-blanked'));
  }catch(_){}
}

function watch(){
  if(visibleToolbookSurface()){
    activate();
    return;
  }

  if(document.body&&typeof MutationObserver==='function'){
    surfaceObserver=new MutationObserver(function(){
      if(visibleToolbookSurface())activate();
    });
    surfaceObserver.observe(document.body,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','style','hidden','aria-hidden']
    });
  }

  var attempts=0;
  timer=window.setInterval(function(){
    attempts++;
    if(visibleToolbookSurface()){
      activate();
      return;
    }
    if(attempts>240){
      window.clearInterval(timer);
      timer=0;
      if(surfaceObserver){
        surfaceObserver.disconnect();
        surfaceObserver=null;
      }
    }
  },125);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',watch,{once:true});
}else{
  watch();
}
})();