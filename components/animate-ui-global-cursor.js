(function(){
'use strict';

if(window.__hashcodAnimateCursorLoaded)return;
window.__hashcodAnimateCursorLoaded=true;

var maxTouchPoints=Number(navigator.maxTouchPoints||0);
var FINE_POINTER=(window.matchMedia&&window.matchMedia('(pointer:fine)').matches)||maxTouchPoints===0;
var HOVER_POINTER=(window.matchMedia&&window.matchMedia('(hover:hover)').matches)||maxTouchPoints===0;
if(!FINE_POINTER||!HOVER_POINTER)return;

var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var SIDE_OFFSET=15;
var ALIGN_OFFSET=5;
var SPRING_STIFFNESS=500;
var SPRING_DAMPING=50;

function boot(){
  if(!document.body||document.getElementById('d5AnimateCursorLayer'))return;

  document.documentElement.classList.add('hashcod-animate-cursor-active');

  var layer=document.createElement('div');
  layer.id='d5AnimateCursorLayer';
  layer.setAttribute('aria-hidden','true');

  var cursor=document.createElement('div');
  cursor.id='d5AnimateCursor';
  cursor.className='hashcod-animate-cursor';
  cursor.innerHTML='<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"/></svg>';

  var follow=document.createElement('div');
  follow.id='d5AnimateCursorFollow';
  follow.className='hashcod-animate-cursor-follow';
  follow.textContent='Designer';

  layer.appendChild(cursor);
  layer.appendChild(follow);
  document.body.appendChild(layer);

  var targetX=window.innerWidth/2;
  var targetY=window.innerHeight/2;
  var followX=targetX;
  var followY=targetY+SIDE_OFFSET+12;
  var visible=false;
  var pressed=false;
  var raf=0;
  var last=performance.now();

  function interactiveTarget(target){
    return !!(target&&target.closest&&target.closest('a,button,input,textarea,select,summary,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])'));
  }

  function setVisible(next){
    visible=next;
    cursor.classList.toggle('is-visible',next);
    follow.classList.toggle('is-visible',next);
  }

  function positionFollow(){
    var cursorRect=cursor.getBoundingClientRect();
    var cursorWidth=cursorRect.width||24;
    var cursorHeight=cursorRect.height||24;
    var desiredX=targetX+ALIGN_OFFSET+(cursorWidth/2);
    var desiredY=targetY+SIDE_OFFSET+(cursorHeight/2);
    var rect=follow.getBoundingClientRect();
    var halfW=rect.width/2;
    var halfH=rect.height/2;
    desiredX=Math.min(Math.max(halfW+8,desiredX),window.innerWidth-halfW-8);
    desiredY=Math.min(Math.max(halfH+8,desiredY),window.innerHeight-halfH-8);
    return {x:desiredX,y:desiredY};
  }

  function frame(now){
    var dt=Math.min(32,Math.max(1,now-last))/1000;
    last=now;

    var followAlpha=reduceMotion?1:1-Math.exp(-(SPRING_DAMPING/2.5)*dt);

    var fp=positionFollow();
    followX+=(fp.x-followX)*followAlpha;
    followY+=(fp.y-followY)*followAlpha;

    var cursorScale=pressed?0.82:1;
    cursor.style.transform='translate3d('+targetX+'px,'+targetY+'px,0) translate(-50%,-50%) scale('+cursorScale+')';
    follow.style.transform='translate3d('+followX+'px,'+followY+'px,0) translate(-50%,-50%)';

    raf=requestAnimationFrame(frame);
  }

  function onPointerMove(event){
    if(event.pointerType&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
    targetX=event.clientX;
    targetY=event.clientY;
    cursor.classList.toggle('is-interactive',interactiveTarget(event.target));
    if(!visible)setVisible(true);
  }

  function onPointerDown(event){
    if(event.pointerType&&event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
    pressed=true;
    cursor.classList.add('is-pressed');
  }

  function onPointerUp(){
    pressed=false;
    cursor.classList.remove('is-pressed');
  }

  function onPointerLeave(event){
    if(!event.relatedTarget)setVisible(false);
  }

  window.addEventListener('pointermove',onPointerMove,{passive:true});
  window.addEventListener('pointerdown',onPointerDown,{passive:true});
  window.addEventListener('pointerup',onPointerUp,{passive:true});
  window.addEventListener('blur',function(){setVisible(false);});
  document.addEventListener('mouseout',onPointerLeave,{passive:true});

  raf=requestAnimationFrame(frame);

  window.HashcodAnimateCursor=Object.freeze({
    mounted:true,
    global:true,
    side:'bottom',
    sideOffset:SIDE_OFFSET,
    align:'end',
    alignOffset:ALIGN_OFFSET,
    label:'Designer',
    version:'20261004-animate-cursor1'
  });

  window.addEventListener('pagehide',function(){
    if(raf)cancelAnimationFrame(raf);
  },{once:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();