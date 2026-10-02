(function(){
'use strict';

if(window.__hashcodGhostCursorLoaded)return;
window.__hashcodGhostCursorLoaded=true;

function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}

function parseNumber(value,fallback){
  var n=Number(value);
  return Number.isFinite(n)?n:fallback;
}

function parseHexColor(hex){
  var value=String(hex||'#000000').trim().replace('#','');
  if(value.length===3)value=value.split('').map(function(ch){return ch+ch;}).join('');
  if(!/^[0-9a-f]{6}$/i.test(value))value='000000';
  return {
    r:parseInt(value.slice(0,2),16),
    g:parseInt(value.slice(2,4),16),
    b:parseInt(value.slice(4,6),16)
  };
}

function boot(){
  var body=document.body;
  if(!body||body.getAttribute('data-hashcod-entry-intro')!=='1')return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  var host=document.getElementById('d5GhostCursorBackground');
  var canvas=document.getElementById('d5GhostCursorCanvas');
  if(!host||!canvas)return;

  var ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  if(!ctx)return;

  var trailLength=Math.max(1,Math.floor(parseNumber(host.getAttribute('data-trail-length'),50)));
  var inertia=clamp(parseNumber(host.getAttribute('data-inertia'),0.5),0,0.99);
  var grainIntensity=clamp(parseNumber(host.getAttribute('data-grain-intensity'),0.05),0,0.5);
  var bloomStrength=Math.max(0,parseNumber(host.getAttribute('data-bloom-strength'),0.1));
  var bloomRadius=Math.max(0,parseNumber(host.getAttribute('data-bloom-radius'),1));
  var bloomThreshold=clamp(parseNumber(host.getAttribute('data-bloom-threshold'),0.025),0,1);
  var brightness=Math.max(0,parseNumber(host.getAttribute('data-brightness'),1));
  var edgeIntensity=clamp(parseNumber(host.getAttribute('data-edge-intensity'),0),0,1);
  var fadeDelay=Math.max(0,parseNumber(host.getAttribute('data-fade-delay-ms'),1000));
  var fadeDuration=Math.max(100,parseNumber(host.getAttribute('data-fade-duration-ms'),1500));
  var baseColor=parseHexColor(host.getAttribute('data-color')||'#000000');

  var dpr=1;
  var width=1;
  var height=1;
  var current={x:window.innerWidth/2,y:window.innerHeight/2};
  var target={x:current.x,y:current.y};
  var velocity={x:0,y:0};
  var trail=[];
  var pointerActive=false;
  var lastMove=performance.now();
  var raf=0;
  var running=false;
  var seed=1337;

  function rand(){
    seed=(seed*1664525+1013904223)>>>0;
    return seed/4294967296;
  }

  function resize(){
    width=Math.max(1,window.innerWidth||document.documentElement.clientWidth||1);
    height=Math.max(1,window.innerHeight||document.documentElement.clientHeight||1);
    dpr=Math.min(window.devicePixelRatio||1,0.75);
    canvas.width=Math.max(1,Math.floor(width*dpr));
    canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+'px';
    canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function pushTrail(x,y){
    trail.unshift({x:x,y:y,born:performance.now()});
    if(trail.length>trailLength)trail.length=trailLength;
  }

  function ensureTrail(){
    if(!trail.length){
      for(var i=0;i<trailLength;i++)trail.push({x:current.x,y:current.y,born:lastMove});
    }
  }

  function edgeMask(x,y){
    if(edgeIntensity<=0)return 1;
    var edge=Math.min(x,width-x,y,height-y);
    var normalized=clamp(edge/Math.max(1,Math.min(width,height)*0.25),0,1);
    return (1-edgeIntensity)+edgeIntensity*normalized;
  }

  function drawGhost(now,opacity){
    ctx.clearRect(0,0,width,height);
    if(opacity<=0.001)return;

    ctx.save();
    ctx.globalCompositeOperation='source-over';

    var baseRadius=clamp(Math.min(width,height)*0.085,48,105);
    var bloomBlur=(10+24*bloomRadius)*bloomStrength;
    var thresholdGain=1+Math.max(0,0.1-bloomThreshold)*2.5;

    for(var i=trail.length-1;i>=0;i--){
      var p=trail[i];
      var t=1-i/Math.max(1,trailLength-1);
      var strength=Math.pow(t,2.05)*opacity*brightness*edgeMask(p.x,p.y);
      if(strength<=0.002)continue;

      var wobble=Math.sin(now*0.0017+i*0.47)*0.13;
      var radius=baseRadius*(0.54+0.58*t)*(1+wobble);

      var gradient=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
      var coreAlpha=clamp(strength*0.135*thresholdGain,0,0.30);
      var midAlpha=clamp(strength*0.060*thresholdGain,0,0.18);
      var edgeAlpha=clamp(strength*0.010,0,0.05);

      gradient.addColorStop(0,'rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+','+coreAlpha+')');
      gradient.addColorStop(0.34,'rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+','+midAlpha+')');
      gradient.addColorStop(0.72,'rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+','+edgeAlpha+')');
      gradient.addColorStop(1,'rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+',0)');

      if(bloomBlur>0.01){
        ctx.shadowColor='rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+','+clamp(strength*bloomStrength,0,0.16)+')';
        ctx.shadowBlur=bloomBlur;
      }else{
        ctx.shadowBlur=0;
      }

      ctx.fillStyle=gradient;
      ctx.beginPath();
      ctx.arc(p.x,p.y,radius,0,Math.PI*2);
      ctx.fill();
    }

    ctx.shadowBlur=0;

    if(grainIntensity>0){
      var particles=Math.max(4,Math.floor(28*grainIntensity*opacity));
      for(var g=0;g<particles;g++){
        var gp=trail[Math.min(trail.length-1,Math.floor(rand()*Math.min(trail.length,12)))]||current;
        var angle=rand()*Math.PI*2;
        var dist=(0.2+rand()*0.8)*baseRadius;
        var size=0.4+rand()*1.3;
        var alpha=grainIntensity*opacity*(0.03+rand()*0.08);
        ctx.fillStyle='rgba('+baseColor.r+','+baseColor.g+','+baseColor.b+','+alpha+')';
        ctx.fillRect(gp.x+Math.cos(angle)*dist,gp.y+Math.sin(angle)*dist,size,size);
      }
    }

    ctx.restore();
  }

  function frame(now){
    raf=0;
    ensureTrail();

    if(pointerActive&&now-lastMove>80){
      pointerActive=false;
    }

    var dx=target.x-current.x;
    var dy=target.y-current.y;

    if(pointerActive){
      velocity.x=dx;
      velocity.y=dy;
      current.x+=dx*0.34;
      current.y+=dy*0.34;
    }else{
      velocity.x*=inertia;
      velocity.y*=inertia;
      current.x+=velocity.x*0.085;
      current.y+=velocity.y*0.085;
    }

    pushTrail(current.x,current.y);

    var idle=now-lastMove;
    var opacity=1;
    if(!pointerActive&&idle>fadeDelay){
      opacity=1-clamp((idle-fadeDelay)/fadeDuration,0,1);
    }

    drawGhost(now,opacity);

    var moving=Math.abs(dx)+Math.abs(dy)>0.15||Math.abs(velocity.x)+Math.abs(velocity.y)>0.08;
    if(pointerActive||moving||opacity>0.001){
      raf=requestAnimationFrame(frame);
    }else{
      running=false;
    }
  }

  function ensureLoop(){
    if(running)return;
    running=true;
    raf=requestAnimationFrame(frame);
  }

  function onPointerMove(event){
    if(event.pointerType==='touch')return;
    target.x=clamp(event.clientX,0,width);
    target.y=clamp(event.clientY,0,height);
    pointerActive=true;
    lastMove=performance.now();
    ensureLoop();
  }

  function onPointerLeave(){
    pointerActive=false;
    lastMove=performance.now();
    ensureLoop();
  }

  function onPointerEnter(event){
    if(event.pointerType==='touch')return;
    target.x=clamp(event.clientX,0,width);
    target.y=clamp(event.clientY,0,height);
    pointerActive=true;
    lastMove=performance.now();
    ensureLoop();
  }

  function onBlur(){
    pointerActive=false;
    lastMove=performance.now();
    ensureLoop();
  }

  resize();
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('pointermove',onPointerMove,{passive:true});
  window.addEventListener('pointerenter',onPointerEnter,{passive:true});
  document.documentElement.addEventListener('pointerleave',onPointerLeave,{passive:true});
  window.addEventListener('blur',onBlur,{passive:true});

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
      fadeDurationMs:fadeDuration
    },
    clear:function(){
      trail.length=0;
      ctx.clearRect(0,0,width,height);
    }
  };
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();