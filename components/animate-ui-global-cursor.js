(function(){
'use strict';

if(window.__hashcodAnimateCursorLoaded)return;
window.__hashcodAnimateCursorLoaded=true;

var FINE_POINTER=window.matchMedia&&window.matchMedia('(pointer:fine)').matches;
var HOVER_POINTER=window.matchMedia&&window.matchMedia('(hover:hover)').matches;
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

  var follow=document.createElement('div');
  follow.id='d5AnimateCursorFollow';
  follow.className='hashcod-animate-cursor-follow';
  follow.textContent='Designer';

  layer.appendChild(cursor);
  layer.appendChild(follow);
  document.body.appendChild(layer);

  var targetX=window.innerWidth/2;
  var targetY=window.innerHeight/2;
  var cursorX=targetX;
  var cursorY=targetY;
  var followX=targetX;
  var followY=targetY+SIDE_OFFSET;
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
    var rect=follow.getBoundingClientRect();
    var desiredX=targetX-rect.width+ALIGN_OFFSET;
    var desiredY=targetY+SIDE_OFFSET;
    var maxX=Math.max(8,window.innerWidth-rect.width-8);
    var maxY=Math.max(8,window.innerHeight-rect.height-8);
    desiredX=Math.min(Math.max(8,desiredX),maxX);
    desiredY=Math.min(Math.max(8,desiredY),maxY);
    return {x:desiredX,y:desiredY};
  }

  function frame(now){
    var dt=Math.min(32,Math.max(1,now-last))/1000;
    last=now;

    var cursorAlpha=reduceMotion?1:1-Math.exp(-Math.sqrt(SPRING_STIFFNESS)*dt*1.85);
    var followAlpha=reduceMotion?1:1-Math.exp(-(SPRING_DAMPING/2.5)*dt);

    cursorX+=(targetX-cursorX)*cursorAlpha;
    cursorY+=(targetY-cursorY)*cursorAlpha;

    var fp=positionFollow();
    followX+=(fp.x-followX)*followAlpha;
    followY+=(fp.y-followY)*followAlpha;

    var cursorScale=pressed?0.76:1;
    cursor.style.transform='translate3d('+cursorX+'px,'+cursorY+'px,0) scale('+cursorScale+')';
    follow.style.transform='translate3d('+followX+'px,'+followY+'px,0)';

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