(function(){
'use strict';
var root=document.getElementById('hashcodPlatformSkeleton');
if(!root)return;

var SHOW_DELAY=550;
var MAX_WAIT=12000;
var shown=false;
var finished=false;
var showTimer=null;
var maxTimer=null;

function setRootState(state){
  root.dataset.state=state;
}
function show(){
  if(finished||shown)return;
  shown=true;
  root.hidden=false;
  setRootState('visible');
  document.documentElement.dataset.hashcodPlatformSkeleton='visible';
}
function removeRoot(){
  if(root&&root.parentNode){
    try{root.parentNode.removeChild(root);}catch(_){root.hidden=true;}
  }
}
function finish(){
  if(finished)return;
  finished=true;
  if(showTimer){clearTimeout(showTimer);showTimer=null;}
  if(maxTimer){clearTimeout(maxTimer);maxTimer=null;}
  delete document.documentElement.dataset.hashcodPlatformSkeleton;
  if(!shown){
    removeRoot();
    return;
  }
  setRootState('leaving');
  window.setTimeout(removeRoot,240);
}
function readySoon(){
  window.setTimeout(finish,80);
}

showTimer=window.setTimeout(show,SHOW_DELAY);
maxTimer=window.setTimeout(finish,MAX_WAIT);

window.addEventListener('hashcod:platform-entered',finish,{once:true});
window.addEventListener('hashcod:platform-entry-complete',finish,{once:true});
window.addEventListener('load',finish,{once:true});
window.addEventListener('pageshow',function(event){
  if(event&&event.persisted)finish();
},{once:true});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',readySoon,{once:true});
}else{
  readySoon();
}

window.HashcodPlatformLoadingSkeleton=Object.freeze({
  show:show,
  hide:finish,
  isVisible:function(){return shown&&!finished;}
});
})();