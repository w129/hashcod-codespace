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
  if(panel){
    var style=window.getComputedStyle(panel);
    var rect=panel.getBoundingClientRect();
    if(
      style.display!=='none'&&
      style.visibility!=='hidden'&&
      Number(style.opacity)!==0&&
      rect.width>=300&&
      rect.height>=300&&
      rect.right>0&&
      rect.left<window.innerWidth&&
      rect.bottom>0&&
      rect.top<window.innerHeight
    ) return panel;
  }

  var slots=Array.from(document.querySelectorAll('.tb-slot')).filter(function(slot){
    var style=window.getComputedStyle(slot);
    var rect=slot.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>40&&rect.height>40;
  });
  if(slots.length>=12)return slots[0];

  var labels=Array.from(document.querySelectorAll('button,[role="button"]')).filter(function(node){
    var style=window.getComputedStyle(node);
    var rect=node.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
  }).map(function(node){return (node.textContent||'').trim();});

  if(['S1TB','S2TB','S3TB','S4TB'].every(function(label){return labels.indexOf(label)!==-1;})){
    return document.body;
  }

  return null;
}

function platformEntered(){
  var root=document.documentElement;
  if(!root)return false;
  return (
    root.dataset.hashcodPlatformEntered==='true' ||
    root.classList.contains('hashcod-platform-entered') ||
    (document.body&&document.body.classList.contains('hashcod-platform-entered'))
  );
}

function createWorkspace(){
  var blank=document.createElement('main');
  blank.id='hashcodToolbookBlankPage';
  blank.setAttribute('aria-label','Toolbook workspace');
  blank.setAttribute('data-hashcod-toolbook-blank','true');

  var panel=document.createElement('section');
  panel.id='hashcodToolbookBranchedMenuPanel';
  panel.setAttribute('aria-label','Branched menu panel');

  var mount=document.createElement('div');
  mount.id='hashcodToolbookBranchedMenuMount';
  mount.setAttribute('data-hashcod-react-branched-menu-mount','true');

  panel.appendChild(mount);
  blank.appendChild(panel);
  return blank;
}

function keepWorkspace(){
  if(!activated||!document.body)return;

  var blank=document.getElementById('hashcodToolbookBlankPage');
  if(!blank){
    blank=createWorkspace();
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

  var blank=createWorkspace();
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
      keepWorkspace();
    });
    bodyObserver.observe(document.body,{childList:true});
  }

  window.HashcodToolbookBlankPage={
    active:true,
    version:'20261003-react1'
  };

  try{
    window.dispatchEvent(new CustomEvent('hashcod:toolbook-page-blanked'));
  }catch(_){}
}

function watch(){
  if(platformEntered()||visibleToolbookSurface()){
    activate();
    return;
  }

  window.addEventListener('hashcod:platform-entered',activate,{once:true});

  if(document.body&&typeof MutationObserver==='function'){
    surfaceObserver=new MutationObserver(function(){
      if(platformEntered()||visibleToolbookSurface())activate();
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
    if(platformEntered()||visibleToolbookSurface()){
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