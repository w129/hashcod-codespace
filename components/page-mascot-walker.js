(function(){
'use strict';
/* Page mascot walker.
 * The panda leaves its corner and walks after the mouse at walking pace (frontend). When the page talks to
 * the server (a same-origin /api request or a *.php controller) it goes to the control that started the work
 * and reports it (backend). Like agenttrail, it only illustrates activity it actually observes and leaves a
 * dotted trail behind it; it never invents work. The trail styling is adapted from agenttrail (MIT,
 * (c) 2026 Kelly Sun): dashed round-capped polyline, 55% opacity. */
if(window.__hashcodMascotWalkerLoaded)return;
window.__hashcodMascotWalkerLoaded=true;

var STORE_KEY='hashcod-mascot-walker';
var MAX_SPEED=330,ACCEL=7,STRIDE=40,ARRIVE=5,MARGIN=10;
var TRAIL_POINTS=40,TRAIL_STEP=14,TRAIL_LIFE=2400;
var SLEEP_AFTER=14000,CHIP_HOLD=1100,BACKEND_AFTER=250,BACKEND_CAP=6500,GESTURE_MS=1200;
var COLORS={frontend:'#141413',backend:'#f09a2f'};

var fine=!!(window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches);
var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function stored(){try{return window.localStorage.getItem(STORE_KEY);}catch(_){return null;}}
function store(value){try{window.localStorage.setItem(STORE_KEY,value);}catch(_){}}
var enabled=stored()!=='off';

var root=null,button=null,size=128;
var chip=null,chipDot=null,chipText=null,trailSvg=null,trailLine=null,shadow=null;
var pos={x:0,y:0},vel=0,phase=0,home={x:0,y:0};
var pointer=null,pointerAt=0,walking=false,raf=0,last=0,engaged=false;
var points=[],lastPoint=null;
var mode='frontend',chipTimer=0,sleepy=false;
var pending={},pendingCount=0,nextToken=1,errorFlash=false;
var gesture={el:null,at:0},sleepTimer=0;
var work=null; /* {x,y} of the control that started the pending backend work */

function now(){return Date.now();}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}

function build(){
  root=document.getElementById('hashcodPageMascotDock');
  if(!root)return false;
  button=document.getElementById('hashcodPageMascot');
  size=root.offsetWidth||128;
  shadow=document.createElement('span');
  shadow.className='hashcod-walker-shadow';
  shadow.setAttribute('aria-hidden','true');
  root.appendChild(shadow);
  chip=document.createElement('div');
  chip.className='hashcod-walker-chip';
  chip.setAttribute('aria-hidden','true');
  chipDot=document.createElement('i');
  chipText=document.createElement('span');
  chip.appendChild(chipDot);chip.appendChild(chipText);
  document.body.appendChild(chip);
  var ns='http://www.w3.org/2000/svg';
  trailSvg=document.createElementNS(ns,'svg');
  trailSvg.setAttribute('class','hashcod-walker-trail');
  trailSvg.setAttribute('aria-hidden','true');
  trailLine=document.createElementNS(ns,'polyline');
  trailLine.setAttribute('stroke',COLORS.frontend);
  chip.style.setProperty('--walker-color',COLORS.frontend);
  trailSvg.appendChild(trailLine);
  document.body.appendChild(trailSvg);
  return true;
}

function viewport(){return {w:window.innerWidth||document.documentElement.clientWidth,h:window.innerHeight||document.documentElement.clientHeight};}

function readHome(){
  var box=root.getBoundingClientRect();
  home.x=box.left+box.width/2;
  home.y=box.top+box.height/2;
  size=box.width||size;
}

/* the panda stands beside the pointer, never under it, and flips sides near the edges */
function followTarget(){
  var v=viewport(),half=size/2,gap=Math.round(size*.62);
  var x=pointer.x+gap,y=pointer.y+gap*.8;
  if(x>v.w-half-MARGIN)x=pointer.x-gap;
  if(y>v.h-half-MARGIN)y=pointer.y-gap*.8;
  return {x:clamp(x,half+MARGIN,v.w-half-MARGIN),y:clamp(y,half+MARGIN,v.h-half-MARGIN)};
}

/* next to the control that started the backend work, on the side with room */
function workTarget(rect){
  var v=viewport(),half=size/2;
  var right=rect.right+half*.8,left=rect.left-half*.8;
  var x=right<v.w-half-MARGIN?right:left;
  return {x:clamp(x,half+MARGIN,v.w-half-MARGIN),y:clamp(rect.top+rect.height/2,half+MARGIN,v.h-half-MARGIN)};
}

function currentTarget(){
  if(work&&pendingCount>0)return work;
  if(pointer&&now()-pointerAt<45000)return followTarget();
  return home;
}

function setMode(next){
  if(mode===next)return;
  mode=next;
  root.setAttribute('data-walker-mode',mode);
  chip.style.setProperty('--walker-color',COLORS[mode]);
  trailLine.setAttribute('stroke',COLORS[mode]);
}

function say(text,tone,hold){
  chipText.textContent=text;
  chip.setAttribute('data-tone',tone||mode);
  chip.style.setProperty('--walker-color',tone==='ok'?'#16a34a':tone==='error'?'#dc2626':COLORS[mode]);
  chip.classList.add('is-visible');
  window.clearTimeout(chipTimer);
  if(hold)chipTimer=window.setTimeout(function(){chip.classList.remove('is-visible');},hold);
}

function placeChip(){
  if(!chip.classList.contains('is-visible'))return;
  var v=viewport(),w=chip.offsetWidth||90;
  var x=clamp(pos.x-w/2,6,v.w-w-6),y=pos.y-size*.5-26;
  if(y<6)y=pos.y+size*.5+4;
  chip.style.transform='translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)';
}

function react(name,ms){
  var api=window.HashcodPageMascot;
  if(api&&typeof api.react==='function')api.react(name,ms);
}

function draw(){
  var feet=pos.y+size*.36;
  root.style.setProperty('--wx',Math.round(pos.x-size/2)+'px');
  root.style.setProperty('--wy',Math.round(pos.y-size/2)+'px');
  var speedRatio=clamp(vel/MAX_SPEED,0,1);
  var wave=Math.sin(phase*Math.PI);
  var tilt=wave*7*speedRatio;
  var hop=Math.abs(wave)*7*speedRatio;
  button.style.transform='translate3d(0,'+(-hop).toFixed(1)+'px,0) rotate('+tilt.toFixed(1)+'deg)';
  shadow.style.transform='translateX(-50%) scale('+(1-hop/26).toFixed(2)+','+(1-hop/40).toFixed(2)+')';
  shadow.style.opacity=String(.28-hop/60);
  /* dotted footprints, newest last */
  var t=now();
  if(!lastPoint||Math.hypot(pos.x-lastPoint.x,feet-lastPoint.y)>=TRAIL_STEP){
    lastPoint={x:pos.x,y:feet,t:t};points.push(lastPoint);
    if(points.length>TRAIL_POINTS)points.shift();
  }
  while(points.length&&t-points[0].t>TRAIL_LIFE)points.shift();
  if(points.length>1){
    trailLine.setAttribute('points',points.map(function(p){return Math.round(p.x)+','+Math.round(p.y);}).join(' '));
    trailLine.style.opacity=String(clamp(.55*(1-(t-points[0].t)/TRAIL_LIFE)+.15,0,.55));
  }else trailLine.removeAttribute('points');
  placeChip();
}

function frame(ts){
  raf=0;
  if(document.hidden){last=0;return;}
  var dt=last?Math.min(.05,(ts-last)/1000):.016;
  last=ts;
  var target=currentTarget();
  var dx=target.x-pos.x,dy=target.y-pos.y,dist=Math.hypot(dx,dy);
  var desired=dist<ARRIVE?0:Math.min(MAX_SPEED,dist*5.5);
  vel+=(desired-vel)*Math.min(1,dt*ACCEL);
  if(dist>=ARRIVE&&vel>.5){
    var step=Math.min(dist,vel*dt);
    pos.x+=dx/dist*step;pos.y+=dy/dist*step;
    phase+=step/STRIDE;
    if(!walking){walking=true;root.classList.add('is-walking');}
  }else{
    vel=0;
    if(walking){walking=false;root.classList.remove('is-walking');phase=Math.round(phase);}
  }
  draw();
  var idle=!walking&&pendingCount===0;
  if(!idle||points.length>1||Math.abs(vel)>.5)kick();
  else if(chip.classList.contains('is-visible'))kick();
}

function kick(){if(!raf&&engaged)raf=window.requestAnimationFrame(frame);}

function engage(){
  if(engaged)return;
  readHome();
  pos.x=home.x;pos.y=home.y;
  engaged=true;
  root.classList.add('is-walker');
  setMode('frontend');
  draw();
}

function wake(){
  if(sleepy){sleepy=false;react('surprised',420);}
}

function onMove(event){
  if(!enabled)return;
  pointer={x:event.clientX,y:event.clientY};
  pointerAt=now();
  wake();
  window.clearTimeout(sleepTimer);
  sleepTimer=window.setTimeout(function(){
    if(enabled&&pendingCount===0&&!walking&&!errorFlash){sleepy=true;react('sleepy',0);}
  },SLEEP_AFTER);
  if(!engaged)engage();
  if(pendingCount===0&&mode!=='frontend')setMode('frontend');
  if(pendingCount===0&&!walking)say('frontend','frontend',CHIP_HOLD);
  kick();
}

function onLeave(){pointer=null;kick();}

/* ---- backend observation: wraps fetch without changing its result ---- */
function describe(input,init){
  try{
    var raw=typeof input==='string'?input:(input&&input.url)||String(input);
    var url=new URL(raw,window.location.href);
    if(url.origin!==window.location.origin)return null;
    var path=url.pathname;
    if(!/^\/(?:l8|l8-codespace)?\/?api\//i.test(path)&&!/\.php$/i.test(path)&&!/^\/hashcod-/i.test(path))return null;
    var method=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
    return {path:path.replace(/^\/(?:l8|l8-codespace)(?=\/)/i,''),method:method};
  }catch(_){return null;}
}

function originOfGesture(){
  var el=gesture.el;
  if(!el||now()-gesture.at>GESTURE_MS||!el.isConnected)return null;
  var rect=el.getBoundingClientRect(),v=viewport();
  if(rect.width<2||rect.height<2||rect.bottom<0||rect.top>v.h||rect.right<0||rect.left>v.w)return null;
  return rect;
}

function beginWork(info){
  var token=nextToken++;
  pending[token]={info:info,at:now(),rect:originOfGesture(),shown:false};
  pendingCount++;
  var item=pending[token];
  window.setTimeout(function(){
    if(!pending[token]||!enabled)return;
    /* only work that outlasts a blink is worth walking to */
    if(!engaged)engage();
    item.shown=true;
    setMode('backend');
    sleepy=false;
    say('backend \u00b7 '+info.method+' '+info.path,'backend',0);
    if(item.rect&&!reduced&&fine)work=workTarget(item.rect);
    kick();
  },BACKEND_AFTER);
  window.setTimeout(function(){if(pending[token])endWork(token,true,true);},BACKEND_CAP);
  return token;
}

function endWork(token,ok,silent){
  var item=pending[token];
  if(!item)return;
  delete pending[token];
  pendingCount=Math.max(0,pendingCount-1);
  if(pendingCount>0)return;
  work=null;
  if(!item.shown||!enabled||!engaged)return;
  if(silent)ok=true;
  setMode('frontend');
  if(ok){say('backend \u00b7 listo','ok',CHIP_HOLD);react('sparkle',900);}
  else{
    errorFlash=true;
    say('backend \u00b7 error','error',CHIP_HOLD*1.6);
    react('surprised',1200);
    window.setTimeout(function(){errorFlash=false;},1300);
  }
  kick();
}

if(typeof window.fetch==='function'){
  var nativeFetch=window.fetch;
  window.fetch=function(input,init){
    var info=enabled?describe(input,init):null;
    var promise=nativeFetch.apply(this,arguments);
    if(!info)return promise;
    var token=beginWork(info);
    promise.then(function(response){endWork(token,!!(response&&response.ok));},function(){endWork(token,false);});
    return promise;
  };
}

function rememberGesture(event){
  var el=event.target&&event.target.closest?event.target.closest('button,a,[role="button"],input,select,textarea,summary,label'):null;
  if(el&&!(root&&root.contains(el)))gesture={el:el,at:now()};
}

function toggle(next){
  enabled=next;store(next?'on':'off');
  if(!root)return;
  if(!next){
    root.classList.remove('is-walker','is-walking');
    root.style.removeProperty('--wx');root.style.removeProperty('--wy');
    button.style.transform='';chip.classList.remove('is-visible');
    trailLine.removeAttribute('points');points=[];lastPoint=null;engaged=false;walking=false;vel=0;
    if(raf){window.cancelAnimationFrame(raf);raf=0;}
  }else if(pointer)onMove({clientX:pointer.x,clientY:pointer.y});
}

function init(){
  if(!build())return false;
  if(fine&&!reduced){
    window.addEventListener('pointermove',onMove,{passive:true});
    document.documentElement.addEventListener('mouseleave',onLeave);
    window.addEventListener('resize',function(){if(engaged)kick();},{passive:true});
    document.addEventListener('visibilitychange',function(){last=0;if(!document.hidden)kick();});
  }
  window.addEventListener('pointerdown',rememberGesture,{capture:true,passive:true});
  window.addEventListener('keydown',function(event){
    if(event.altKey&&event.shiftKey&&(event.key==='M'||event.key==='m')){event.preventDefault();toggle(!enabled);return;}
    if(event.key==='Enter'||event.key===' ')rememberGesture({target:document.activeElement});
  },true);
  return true;
}

function start(){
  if(init())return;
  /* the mascot dock is added by page-mascot-panda.js; wait for it */
  var tries=0,timer=window.setInterval(function(){
    tries++;
    if(init()||tries>40)window.clearInterval(timer);
  },150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.HashcodMascotWalker=Object.freeze({
  enable:function(){toggle(true);},
  disable:function(){toggle(false);},
  status:function(){return {enabled:enabled,engaged:engaged,walking:walking,mode:mode,pending:pendingCount,walkingSupported:fine&&!reduced};}
});
})();
