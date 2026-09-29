(function(){
'use strict';
if(window.__hashcodPageMascotLoaded)return;
window.__hashcodPageMascotLoaded=true;

var DIRECTIONS=['up-left','up','up-right','left','center','right','down-left','down','down-right'];
var REACTIONS=['blink','heart','sparkle','surprised','wink','bashful','sleepy','dizzy','delighted'];
var CLOCKWISE=['right','down-right','down','down-left','left','up-left','up','up-right'];
var SECTOR=(Math.PI*2)/CLOCKWISE.length;
var HYSTERESIS=.12;
var DEAD_ZONE=70;
var PAYOFFS=['heart','sparkle','delighted'];
var BOOP_PAYOFF=120,BOOP_END=560,SQUASH_MS=420,DIZZY_AFTER=4,DIZZY_WINDOW=1600,DIZZY_END=1100;
var timers=[],boops={count:0,at:0},sector=-1,pointer=null,reaction=null,direction='center';

function basePath(){
  var m=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return m?'/'+m[1]:'';
}
var directionsUrl=basePath()+'/mascots/panda-directions.webp';
var reactionsUrl=basePath()+'/mascots/panda-reactions.webp';

function cell(index){
  return ((index%3)*50)+'% '+(Math.floor(index/3)*50)+'%';
}
function wrap(angle){return Math.atan2(Math.sin(angle),Math.cos(angle));}
function clearTimers(){timers.forEach(window.clearTimeout);timers=[];}
function later(ms,fn){timers.push(window.setTimeout(fn,ms));}

var root=document.createElement('div');
root.id='hashcodPageMascotDock';
root.className='hashcod-page-mascot-dock';
root.setAttribute('data-page-mascot','panda');

var button=document.createElement('button');
button.id='hashcodPageMascot';
button.type='button';
button.className='hashcod-page-mascot';
button.setAttribute('aria-label','Interactuar con el panda de Hashcod');
button.setAttribute('title','Panda de Hashcod');

var squash=document.createElement('span');
squash.className='hashcod-page-mascot-squash';
var dirLayer=document.createElement('span');
dirLayer.className='hashcod-page-mascot-layer hashcod-page-mascot-directions';
var reactLayer=document.createElement('span');
reactLayer.className='hashcod-page-mascot-layer hashcod-page-mascot-reactions';
dirLayer.style.backgroundImage='url("'+directionsUrl+'")';
reactLayer.style.backgroundImage='url("'+reactionsUrl+'")';
squash.appendChild(dirLayer);squash.appendChild(reactLayer);button.appendChild(squash);root.appendChild(button);

function render(){
  var di=Math.max(0,DIRECTIONS.indexOf(direction));
  var ri=Math.max(0,REACTIONS.indexOf(reaction||'blink'));
  dirLayer.style.backgroundPosition=cell(di);
  reactLayer.style.backgroundPosition=cell(ri);
  dirLayer.style.opacity=reaction?'0':'1';
  reactLayer.style.opacity=reaction?'1':'0';
  root.dataset.direction=direction;
  root.dataset.reaction=reaction||'';
}
function aim(){
  if(!pointer||!button.isConnected)return;
  var box=button.getBoundingClientRect();
  var dx=pointer.x-(box.left+box.width/2),dy=pointer.y-(box.top+box.height/2);
  if(Math.hypot(dx,dy)<DEAD_ZONE){sector=-1;direction='center';render();return;}
  var angle=Math.atan2(dy,dx);
  if(sector!==-1&&Math.abs(wrap(angle-sector*SECTOR))<SECTOR/2+HYSTERESIS)return;
  sector=(Math.round(angle/SECTOR)+CLOCKWISE.length)%CLOCKWISE.length;
  direction=CLOCKWISE[sector];render();
}
function setReaction(next){reaction=next;render();}
function boop(){
  clearTimers();
  var now=Date.now();
  boops.count=now-boops.at<DIZZY_WINDOW?boops.count+1:1;
  boops.at=now;
  if(boops.count>=DIZZY_AFTER){
    boops.count=0;setReaction('dizzy');later(DIZZY_END,function(){setReaction(null);});
  }else{
    setReaction('blink');
    var payoff=PAYOFFS[(boops.count-1)%PAYOFFS.length];
    later(BOOP_PAYOFF,function(){setReaction(payoff);});
    later(BOOP_END,function(){setReaction(null);});
  }
  try{window.dispatchEvent(new CustomEvent('hashcod:page-mascot-boop',{detail:{reaction:reaction||'blink'}}));}catch(_){}
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(squash.animate){
    squash.animate([
      {transform:'scale(1,1)',easing:'ease-in'},
      {transform:'scale(1.10,.86)',offset:.18,easing:'ease-out'},
      {transform:'scale(.95,1.08)',offset:.45,easing:'ease-in-out'},
      {transform:'scale(1.03,.97)',offset:.72,easing:'ease-in-out'},
      {transform:'scale(1,1)'}
    ],{duration:SQUASH_MS,easing:'linear'});
  }
}
button.addEventListener('click',boop);

function reveal(){
  root.classList.add('is-page-visible');
}

var fine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if(fine){
  window.addEventListener('pointermove',function(event){pointer={x:event.clientX,y:event.clientY};aim();},{passive:true});
  window.addEventListener('scroll',aim,{passive:true});
}

function mount(){
  if(!document.body||document.getElementById(root.id))return;
  document.body.appendChild(root);
  render();reveal();
  var loaded=0;
  function ready(){loaded++;if(loaded>=2)root.classList.add('is-ready');}
  [directionsUrl,reactionsUrl].forEach(function(src){
    var img=new Image();img.onload=ready;img.onerror=ready;img.src=src;
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();

window.HashcodPageMascot=Object.freeze({
  boop:boop,
  status:function(){return {direction:direction,reaction:reaction,visible:root.classList.contains('is-page-visible')};}
});
})();