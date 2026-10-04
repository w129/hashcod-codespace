(function(){
'use strict';

if(window.__hashcodSmithCredentialChartLoaded)return;
window.__hashcodSmithCredentialChartLoaded=true;

var VERSION='20261004-smith1';
var FIELD_NAMES=['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
var FIELD_LABELS={TYPE:'T',PAYLOAD:'P',SALT:'S',NONCE:'N',ISSUED:'I',USE:'U',CHECK:'C'};
var NS='http://www.w3.org/2000/svg';
var CENTER=500;
var RADIUS=430;
var panel=null;
var stage=null;
var observer=null;
var projectionSerial=0;
var encoder=new TextEncoder();

function svgNode(name,attrs){
  var el=document.createElementNS(NS,name);
  Object.keys(attrs||{}).forEach(function(key){el.setAttribute(key,String(attrs[key]));});
  return el;
}

function addCircle(parent,cx,cy,r,cls){
  parent.appendChild(svgNode('circle',{cx:cx,cy:cy,r:r,'class':cls}));
}

function buildSmithGrid(svg){
  var defs=svgNode('defs');
  var clip=svgNode('clipPath',{id:'d5SmithUnitClip'});
  clip.appendChild(svgNode('circle',{cx:CENTER,cy:CENTER,r:RADIUS}));
  defs.appendChild(clip);
  svg.appendChild(defs);

  var clipped=svgNode('g',{'clip-path':'url(#d5SmithUnitClip)'});
  var resistance=[0.05,0.1,0.2,0.3,0.5,0.7,1,1.5,2,3,5,10];
  var reactance=[0.1,0.2,0.3,0.5,0.7,1,1.5,2,3,5,10];

  resistance.forEach(function(r){
    var centerGamma=r/(r+1);
    var radiusGamma=1/(r+1);
    addCircle(
      clipped,
      CENTER+(RADIUS*centerGamma),
      CENTER,
      RADIUS*radiusGamma,
      (r===0.2||r===0.5||r===1||r===2||r===5)?'smith-grid-major':'smith-grid-minor'
    );
  });

  reactance.forEach(function(absX){
    [absX,-absX].forEach(function(x){
      var cy=CENTER-(RADIUS*(1/x));
      addCircle(
        clipped,
        CENTER+RADIUS,
        cy,
        RADIUS/Math.abs(x),
        (absX===0.2||absX===0.5||absX===1||absX===2||absX===5)?'smith-grid-major':'smith-grid-minor'
      );
    });
  });

  clipped.appendChild(svgNode('line',{
    x1:CENTER-RADIUS,y1:CENTER,x2:CENTER+RADIUS,y2:CENTER,'class':'smith-real-axis'
  }));
  svg.appendChild(clipped);
  addCircle(svg,CENTER,CENTER,RADIUS,'smith-unit-circle');

  var labels=svgNode('g',{'class':'smith-axis-labels'});
  [0.2,0.5,1,2,5].forEach(function(r){
    var gamma=(r-1)/(r+1);
    var text=svgNode('text',{
      x:CENTER+(RADIUS*gamma),
      y:CENTER-12,
      'text-anchor':'middle'
    });
    text.textContent=String(r);
    labels.appendChild(text);
  });
  svg.appendChild(labels);

  var trajectory=svgNode('g',{id:'d5SmithTrajectory','class':'smith-trajectory'});
  trajectory.appendChild(svgNode('polyline',{id:'d5SmithPath',points:'','class':'smith-path'}));
  svg.appendChild(trajectory);
}

function createPanel(){
  var root=document.createElement('aside');
  root.id='d5SmithCredentialChart';
  root.className='smith-credential-chart';
  root.hidden=true;
  root.setAttribute('aria-label','Smith chart credential variable projection');
  root.setAttribute('data-vector','svg');
  root.setAttribute('data-precision','float64');
  root.innerHTML='\
    <header class="smith-chart-head">\
      <div><span>VARIABLE TRANSFORM</span><strong>Smith credential map</strong></div>\
      <em>SVG · FLOAT64</em>\
    </header>\
    <div class="smith-chart-formula">cred → SHA-256 → z=r+jx → Γ=(z−1)/(z+1)</div>\
    <div class="smith-chart-vector"><svg id="d5SmithChartSvg" viewBox="0 0 1000 1000" role="img" aria-label="Vector Smith chart" shape-rendering="geometricPrecision"></svg></div>\
    <footer class="smith-chart-foot"><span id="d5SmithPointCount">0/7 projected</span><code id="d5SmithLastPoint">Γ —</code></footer>';
  document.body.appendChild(root);
  var svg=root.querySelector('#d5SmithChartSvg');
  buildSmithGrid(svg);
  return root;
}

function unit53(view,offset){
  var hi=view.getUint32(offset,false)&0x001fffff;
  var lo=view.getUint32(offset+4,false);
  return ((hi*4294967296)+lo)/9007199254740992;
}

async function projectField(name,value){
  var input='HASHCOD|SMITH|V1|'+name+'\u0000'+String(value);
  var digest=await crypto.subtle.digest('SHA-256',encoder.encode(input));
  var view=new DataView(digest);
  var u=unit53(view,0);
  var v=unit53(view,8);

  // Positive normalized resistance over six decades: 10^-3 ... 10^3.
  var r=Math.pow(10,-3+(6*u));
  // Bounded normalized reactance with high density around x=0.
  var x=Math.sinh((2*v-1)*3);
  var denominator=((r+1)*(r+1))+(x*x);
  var gr=((r*r)+(x*x)-1)/denominator;
  var gi=(2*x)/denominator;
  var magnitude=Math.hypot(gr,gi);
  var phase=Math.atan2(gi,gr)*(180/Math.PI);

  return {name:name,r:r,x:x,gr:gr,gi:gi,magnitude:magnitude,phase:phase};
}

function currentCredentialValues(){
  return FIELD_NAMES.map(function(name){
    var input=document.getElementById('d5MeshField'+name);
    return {name:name,value:input?String(input.value||'').trim():''};
  }).filter(function(item){return item.value!=='';});
}

function clearTrajectory(){
  if(!panel)return;
  var trajectory=panel.querySelector('#d5SmithTrajectory');
  var path=panel.querySelector('#d5SmithPath');
  if(path)path.setAttribute('points','');
  if(trajectory){
    Array.from(trajectory.querySelectorAll('[data-smith-point]')).forEach(function(node){node.remove();});
  }
}

function renderPoints(points){
  if(!panel)return;
  clearTrajectory();
  var trajectory=panel.querySelector('#d5SmithTrajectory');
  var path=panel.querySelector('#d5SmithPath');
  var coords=[];

  points.forEach(function(point,index){
    var px=CENTER+(RADIUS*point.gr);
    var py=CENTER-(RADIUS*point.gi);
    coords.push(px.toFixed(6)+','+py.toFixed(6));

    var g=svgNode('g',{
      'data-smith-point':point.name,
      'class':'smith-point',
      transform:'translate('+px.toFixed(9)+' '+py.toFixed(9)+')'
    });
    var circle=svgNode('circle',{cx:0,cy:0,r:17});
    var label=svgNode('text',{x:0,y:5,'text-anchor':'middle'});
    label.textContent=FIELD_LABELS[point.name]||String(index+1);
    var title=svgNode('title');
    title.textContent=point.name+'  r='+point.r.toPrecision(12)+'  x='+point.x.toPrecision(12)+'  |Γ|='+point.magnitude.toPrecision(12)+'  ∠='+point.phase.toFixed(9)+'°';
    g.appendChild(title);
    g.appendChild(circle);
    g.appendChild(label);
    trajectory.appendChild(g);
  });

  if(path)path.setAttribute('points',coords.join(' '));
  var count=panel.querySelector('#d5SmithPointCount');
  if(count)count.textContent=points.length+'/7 projected';
  var last=points[points.length-1];
  var metric=panel.querySelector('#d5SmithLastPoint');
  if(metric){
    metric.textContent=last
      ? 'Γ '+last.gr.toFixed(9)+(last.gi<0?' − j':' + j')+Math.abs(last.gi).toFixed(9)
      : 'Γ —';
  }
  panel.setAttribute('data-points',String(points.length));
}

async function refreshProjection(){
  if(!window.crypto||!crypto.subtle){
    if(panel){
      var metric=panel.querySelector('#d5SmithLastPoint');
      if(metric)metric.textContent='SHA-256 unavailable';
    }
    return;
  }
  var serial=++projectionSerial;
  var values=currentCredentialValues();
  if(!values.length){renderPoints([]);return;}
  try{
    var points=await Promise.all(values.map(function(item){return projectField(item.name,item.value);}));
    if(serial!==projectionSerial)return;
    renderPoints(points);
  }catch(_){
    if(serial!==projectionSerial)return;
    renderPoints([]);
  }
}

function positionPanel(){
  if(!panel)return;
  var gate=document.getElementById('d5CodeAccessGate');
  var nextStage=gate&&gate.querySelector('.mesh-editor-stage');
  if(!nextStage){
    panel.hidden=true;
    document.documentElement.classList.remove('hashcod-smith-chart-active');
    return;
  }
  stage=nextStage;
  var rect=stage.getBoundingClientRect();
  if(rect.width<80||rect.height<80){panel.hidden=true;return;}
  var width=Math.round(Math.max(205,Math.min(282,rect.width*0.35)));
  if(rect.width<560)width=Math.round(Math.max(170,Math.min(210,rect.width*0.44)));
  panel.style.left=Math.round(rect.right-width)+'px';
  panel.style.top=Math.round(rect.top)+'px';
  panel.style.width=width+'px';
  panel.style.height=Math.round(rect.height)+'px';
  panel.hidden=false;
  document.documentElement.style.setProperty('--hashcod-smith-panel-width',width+'px');
  document.documentElement.classList.add('hashcod-smith-chart-active');
}

function mount(){
  if(!document.body)return;
  if(!panel)panel=createPanel();
  positionPanel();
  refreshProjection();
}

function onCredentialInput(event){
  var target=event&&event.target;
  if(!target||!target.id||target.id.indexOf('d5MeshField')!==0)return;
  refreshProjection();
}

document.addEventListener('input',onCredentialInput,true);
window.addEventListener('resize',positionPanel,{passive:true});
window.addEventListener('scroll',positionPanel,{passive:true,capture:true});
window.addEventListener('hashcod:code-access-granted',function(){
  if(panel)panel.hidden=true;
  document.documentElement.classList.remove('hashcod-smith-chart-active');
});

observer=new MutationObserver(function(){
  if(document.getElementById('d5CodeAccessGate')){
    mount();
  }else if(panel){
    panel.hidden=true;
    document.documentElement.classList.remove('hashcod-smith-chart-active');
  }
});

function boot(){
  mount();
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.HashcodSmithCredentialChart=Object.freeze({
    mounted:true,
    version:VERSION,
    transform:'SHA-256→normalized impedance→reflection coefficient',
    precision:'IEEE-754 float64 / SVG vector',
    refresh:refreshProjection
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
