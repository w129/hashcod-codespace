(function(){
'use strict';

var VERSION='20261004-numeric-series4';
var API='/api/code-access';
var UNIVERSAL_PERSISTENCE='/components/universal-cloud-persistence.js?v=20261004-universal-cloud1';
var state={busy:false,series:''};

function addStyle(){
  if(document.querySelector('link[data-hashcod-numeric-series-style]'))return;
  var link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/components/numeric-series-access.css?v='+VERSION;
  link.setAttribute('data-hashcod-numeric-series-style','1');
  document.head.appendChild(link);
}
function hideLegacyGate(){
  var root=document.getElementById('d5CodeAccessMount');
  if(root)root.style.display='none';
}
function loadUniversalPersistence(){
  if(document.querySelector('script[data-hashcod-universal-persistence]'))return;
  var script=document.createElement('script');
  script.src=UNIVERSAL_PERSISTENCE;
  script.defer=true;
  script.dataset.hashcodUniversalPersistence='true';
  document.head.appendChild(script);
}
function markAuthorized(){
  state.series='';
  if(document.body){
    document.body.dataset.hashcodCodeAccessAuthorized='1';
    document.body.style.overflow='';
  }
  var root=document.getElementById('d5CodeAccessMount');
  if(root){root.dataset.authorized='1';root.style.display='none';}
  var gate=document.getElementById('d5NumericSeriesGate');
  if(gate)gate.remove();
  window.HashcodCodeAccess=Object.freeze({mounted:true,authorized:true,mode:'sealed-access',version:VERSION});
  loadUniversalPersistence();
  try{window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));}catch(_){}
}
function setStatus(message,kind){
  var node=document.getElementById('d5NumericSeriesStatus');
  if(!node)return;
  var copy=node.querySelector('span');
  if(copy)copy.textContent=message||'';
  else node.textContent=message||'';
  node.dataset.kind=kind||'idle';
}
function setLoaded(series){
  state.series=String(series||'');
  var input=document.getElementById('d5NumericSeriesInput');
  if(input){
    input.value='';
    input.placeholder=state.series.trim()?'Access data loaded ••••••••••••':'Paste access data here…';
    input.dataset.loaded=state.series.trim()?'true':'false';
  }
  setStatus(state.series.trim()?'Access data loaded. Ready to validate.':'Waiting for access data.',state.series.trim()?'ready':'idle');
}
function buildGate(){
  if(document.getElementById('d5NumericSeriesGate'))return;
  hideLegacyGate();
  addStyle();

  var overlay=document.createElement('div');
  overlay.id='d5NumericSeriesGate';
  overlay.className='numeric-series-overlay';
  overlay.innerHTML=''
    +'<section class="numeric-series-window" role="dialog" aria-modal="true" aria-labelledby="d5NumericSeriesTitle">'
    +  '<header class="numeric-series-header">'
    +    '<div class="numeric-series-heading">'
    +      '<img src="/components/access-tab-icon.svg" alt="" aria-hidden="true">'
    +      '<div><p>HASHCOD CODESPACE · SECURE ENTRY</p><h1 id="d5NumericSeriesTitle">Secure access data</h1></div>'
    +    '</div>'
    +    '<span class="numeric-series-pill">PRIVATE ENTRY</span>'
    +  '</header>'
    +  '<p class="numeric-series-description">Paste the authorized access data or load the original local file. Its contents are never rendered in this window.</p>'
    +  '<div class="numeric-series-toolbar">'
    +    '<span>SEALED INPUT</span>'
    +    '<div><label class="numeric-series-file-label" for="d5NumericSeriesFile">Load local file</label><input id="d5NumericSeriesFile" type="file" accept=".txt,text/plain" hidden><button id="d5NumericSeriesClear" type="button">Clear</button></div>'
    +  '</div>'
    +  '<textarea id="d5NumericSeriesInput" class="numeric-series-editor numeric-series-editor-sealed" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Sealed access data input" placeholder="Paste access data here…"></textarea>'
    +  '<div class="numeric-series-meta">'
    +    '<span><b>INPUT</b><code>sealed locally</code></span>'
    +    '<span><b>TRANSPORT</b><code>same-origin only</code></span>'
    +    '<span><b>VALIDATION</b><code>server-side</code></span>'
    +  '</div>'
    +  '<footer class="numeric-series-footer">'
    +    '<p id="d5NumericSeriesStatus" data-kind="idle"><i></i><span>Waiting for access data.</span></p>'
    +    '<button id="d5NumericSeriesValidate" type="button">Validate access</button>'
    +  '</footer>'
    +'</section>';
  document.body.appendChild(overlay);

  var input=document.getElementById('d5NumericSeriesInput');
  var file=document.getElementById('d5NumericSeriesFile');
  var clear=document.getElementById('d5NumericSeriesClear');
  var validate=document.getElementById('d5NumericSeriesValidate');

  input.addEventListener('keydown',function(event){
    var paste=(event.ctrlKey||event.metaKey)&&String(event.key||'').toLowerCase()==='v';
    if(!paste)event.preventDefault();
  });
  input.addEventListener('paste',function(event){
    event.preventDefault();
    var clipboard=event.clipboardData||window.clipboardData;
    setLoaded(clipboard?clipboard.getData('text'): '');
  });
  input.addEventListener('drop',function(event){event.preventDefault();});
  clear.addEventListener('click',function(){
    setLoaded('');
    if(file)file.value='';
    input.focus();
  });
  file.addEventListener('change',function(){
    var selected=file.files&&file.files[0];
    if(!selected)return;
    var reader=new FileReader();
    reader.onload=function(){setLoaded(String(reader.result||''));file.value='';};
    reader.onerror=function(){setLoaded('');setStatus('Access data could not be loaded.','error');file.value='';};
    reader.readAsText(selected);
  });
  validate.addEventListener('click',async function(){
    if(state.busy)return;
    var payload=state.series;
    if(!payload.trim()){setStatus('Load access data before continuing.','error');input.focus();return;}
    state.busy=true;
    validate.disabled=true;
    validate.textContent='Validating…';
    setStatus('Validating access…','idle');
    try{
      var response=await fetch(API,{
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json','Accept':'application/json','X-Hashcod-Numeric-Series':'1'},
        body:JSON.stringify({series:payload})
      });
      state.series='';
      payload='';
      input.value='';
      input.placeholder='Paste access data here…';
      input.dataset.loaded='false';
      var data={};
      try{data=await response.json();}catch(_){}
      if(!response.ok||!data.ok||!data.authorized)throw new Error('Access denied.');
      setStatus('Access granted. Opening Hashcod Codespace…','success');
      window.setTimeout(markAuthorized,180);
    }catch(_){
      state.series='';
      payload='';
      input.value='';
      input.placeholder='Paste access data here…';
      input.dataset.loaded='false';
      setStatus('Access denied.','error');
    }finally{
      state.busy=false;
      validate.disabled=false;
      validate.textContent='Validate access';
    }
  });
  window.setTimeout(function(){input.focus();},80);
}
async function init(){
  hideLegacyGate();
  try{
    var response=await fetch(API,{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
    var data={};
    try{data=await response.json();}catch(_){}
    if(data&&data.authorized){markAuthorized();return;}
  }catch(_){}
  buildGate();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
