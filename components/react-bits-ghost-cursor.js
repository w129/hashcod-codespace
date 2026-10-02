(function(){
'use strict';

if(window.__hashcodGhostCursorLoaded)return;
window.__hashcodGhostCursorLoaded=true;

function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function numberAttr(node,name,fallback){
  var value=Number(node.getAttribute(name));
  return Number.isFinite(value)?value:fallback;
}

function boot(){
  var body=document.body;
  if(!body||body.getAttribute('data-hashcod-entry-intro')!=='1')return;

  var host=document.getElementById('d5GhostCursorBackground');
  if(!host)return;

  var trailLength=Math.max(1,Math.min(50,Math.floor(numberAttr(host,'data-trail-length',50))));
  var inertia=clamp(numberAttr(host,'data-inertia',0.5),0,0.99);
  var brightness=Math.max(0,numberAttr(host,'data-brightness',1));
  var grainIntensity=clamp(numberAttr(host,'data-grain-intensity',0.05),0,0.5);
  var bloomStrength=Math.max(0,numberAttr(host,'data-bloom-strength',0.1));
  var bloomRadius=Math.max(0,numberAttr(host,'data-bloom-radius',1));
  var bloomThreshold=clamp(numberAttr(host,'data-bloom-threshold',0.025),0,1);
  var edgeIntensity=clamp(numberAttr(host,'data-edge-intensity',0),0,1);
  var fadeDelay=Math.max(0,numberAttr(host,'data-fade-delay-ms',1000));
  var fadeDuration=Math.max(100,numberAttr(host,'data-fade-duration-ms',1500));
  var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var particles=[];
  var target={x:0,y:0};
  var hasPointer=false;
  var pointerMoving=false;
  var lastMove=0;
  var raf=0;
  var running=false;

  host.textContent='';

  for(var i=0;i<trailLength;i++){
    var node=document.createElement('span');
    node.className='entry-ghost-particle';
    node.setAttribute('aria-hidden','true');

    var t=i/Math.max(1,trailLength-1);
    var size=(118-(t*58))*(0.92+brightness*0.08);
    var blur=5+(t*8)+(bloomRadius*bloomStrength*5);
    node.style.setProperty('--ghost-size',size.toFixed(1)+'px');
    node.style.setProperty('--ghost-blur',blur.toFixed(1)+'px');
    host.appendChild(node);

    particles.push({
      node:node,
      x:0,
      y:0,
      initialized:false
    });
  }

  function edgeMask(x,y){
    if(edgeIntensity<=0)return 1;
    var w=Math.max(1,window.innerWidth);
    var h=Math.max(1,window.innerHeight);
    var edge=Math.min(x,w-x,y,h-y);
    var normalized=clamp(edge/Math.max(1,Math.min(w,h)*0.22),0,1);
    return (1-edgeIntensity)+(normalized*edgeIntensity);
  }

  function resetAt(x,y){
    for(var i=0;i<particles.length;i++){
      particles[i].x=x;
      particles[i].y=y;
      particles[i].initialized=true;
    }
  }

  function render(now){
    raf=0;
    if(!hasPointer){
      running=false;
      return;
    }

    if(pointerMoving&&now-lastMove>70)pointerMoving=false;

    var idle=now-lastMove;
    var fade=1;
    if(!pointerMoving&&idle>fadeDelay){
      fade=1-clamp((idle-fadeDelay)/fadeDuration,0,1);
    }

    var head=particles[0];
    var headFollow=reduced?0.72:0.42;
    head.x+=(target.x-head.x)*headFollow;
    head.y+=(target.y-head.y)*headFollow;

    for(var i=1;i<particles.length;i++){
      var prev=particles[i-1];
      var part=particles[i];
      var tailRatio=i/Math.max(1,particles.length-1);
      var follow=(0.34-(tailRatio*0.20))*(1-inertia*0.32);
      if(reduced)follow=Math.max(follow,0.42);
      part.x+=(prev.x-part.x)*follow;
      part.y+=(prev.y-part.y)*follow;
    }

    var visibleCount=reduced?Math.min(14,particles.length):particles.length;
    for(var j=0;j<particles.length;j++){
      var p=particles[j];
      var ratio=j/Math.max(1,particles.length-1);
      var density=Math.pow(1-ratio,1.22);
      var thresholdBoost=1+Math.max(0,0.08-bloomThreshold)*2;
      var alpha=density*fade*brightness*edgeMask(p.x,p.y)*thresholdBoost;
      if(j>=visibleCount)alpha=0;

      var organic=Math.sin(now*0.0022+j*0.71)*0.035;
      var scale=(0.82+(density*0.34)+organic);
      var angle=Math.sin(now*0.0012+j*0.43)*7;
      var grainJitter=grainIntensity>0?Math.sin(now*0.009+j*1.7)*grainIntensity*2.2:0;

      p.node.style.opacity=clamp(alpha*0.92,0,0.88).toFixed(3);
      p.node.style.transform=
        'translate3d('+(p.x+grainJitter).toFixed(2)+'px,'+
        (p.y-grainJitter).toFixed(2)+'px,0) scale('+scale.toFixed(3)+') rotate('+angle.toFixed(2)+'deg)';
    }

    if(fade>0.001||pointerMoving){
      raf=requestAnimationFrame(render);
    }else{
      for(var k=0;k<particles.length;k++)particles[k].node.style.opacity='0';
      running=false;
    }
  }

  function ensureLoop(){
    if(running)return;
    running=true;
    raf=requestAnimationFrame(render);
  }

  function move(event){
    if(event.pointerType==='touch')return;
    var x=clamp(event.clientX,0,window.innerWidth);
    var y=clamp(event.clientY,0,window.innerHeight);

    if(!hasPointer){
      hasPointer=true;
      target.x=x;
      target.y=y;
      resetAt(x,y);
    }else{
      target.x=x;
      target.y=y;
    }

    pointerMoving=true;
    lastMove=performance.now();
    ensureLoop();
  }

  function leave(){
    if(!hasPointer)return;
    pointerMoving=false;
    lastMove=performance.now();
    ensureLoop();
  }

  window.addEventListener('pointermove',move,{passive:true});
  document.documentElement.addEventListener('pointerleave',leave,{passive:true});
  window.addEventListener('blur',leave,{passive:true});

  window.HashcodGhostCursor={
    config:{
      color:'#000000',
      brightness:brightness,
      edgeIntensity:edgeIntensity,
      trailLength:trailLength,
      inertia:inertia,
      grainIntensity:grainIntensity,
      bloomStrength:bloomStrength,
      bloomRadius:bloomRadius,
      bloomThreshold:bloomThreshold,
      fadeDelayMs:fadeDelay,
      fadeDurationMs:fadeDuration,
      renderer:'dom-particles'
    },
    clear:function(){
      hasPointer=false;
      pointerMoving=false;
      if(raf)cancelAnimationFrame(raf);
      raf=0;
      running=false;
      for(var i=0;i<particles.length;i++){
        particles[i].node.style.opacity='0';
        particles[i].node.style.transform='translate3d(-9999px,-9999px,0) scale(.8)';
      }
    }
  };
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();