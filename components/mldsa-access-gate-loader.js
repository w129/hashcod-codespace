(function(){
'use strict';

var VERSION='20261004-numeric-series1';
var API='/api/code-access';
var EXPECTED_ROWS=9865;
var COLUMNS=8;
var state={busy:false,rows:0};

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
function markAuthorized(){
  if(document.body){
    document.body.dataset.hashcodCodeAccessAuthorized='1';
    document.body.style.overflow='';
  }
  var root=document.getElementById('d5CodeAccessMount');
  if(root){root.dataset.authorized='1';root.style.display='none';}
  var gate=document.getElementById('d5NumericSeriesGate');
  if(gate)gate.remove();
  try{window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));}catch(_){}
  window.HashcodCodeAccess=Object.freeze({
    mounted:true,
    authorized:true,
    protocol:'HASHCOD-NUMERIC-SERIES/1',
    mode:'numeric-series',
    version:VERSION
  });
}
function setStatus(message,kind){
  var node=document.getElementById('d5NumericSeriesStatus');
  if(!node)return;
  node.textContent=message||'';
  node.dataset.kind=kind||'idle';
}
function normalizePreview(value){
  var rows=String(value||'').split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean);
  state.rows=rows.length;
  var counter=document.getElementById('d5NumericSeriesRows');
  if(counter)counter.textContent=rows.length.toLocaleString()+' / '+EXPECTED_ROWS.toLocaleString()+' rows';
  return rows;
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
    +      '<div><p>HASHCOD CODESPACE · SECURE ENTRY</p><h1 id="d5NumericSeriesTitle">Numeric access series</h1></div>'
    +    '</div>'
    +    '<span class="numeric-series-pill">HASHCOD-NUMERIC-SERIES/1</span>'
    +  '</header>'
    +  '<p class="numeric-series-description">Paste the complete authorized numeric series or load the original .txt file. Spacing may vary, but every number and row order must match.</p>'
    +  '<div class="numeric-series-toolbar">'
    +    '<span>NUMERIC SERIES</span>'
    +    '<div><label class="numeric-series-file-label" for="d5NumericSeriesFile">Load .txt</label><input id="d5NumericSeriesFile" type="file" accept=".txt,text/plain" hidden><button id="d5NumericSeriesClear" type="button">Clear</button></div>'
    +  '</div>'
    +  '<textarea id="d5NumericSeriesInput" class="numeric-series-editor" spellcheck="false" autocomplete="off" placeholder="0 1 0 866 268 0 0 0&#10;0 1 1 865 272 0 0 0&#10;..."></textarea>'
    +  '<div class="numeric-series-meta">'
    +    '<span><b>ROWS</b><code id="d5NumericSeriesRows">0 / '+EXPECTED_ROWS.toLocaleString()+' rows</code></span>'
    +    '<span><b>COLUMNS</b><code>'+COLUMNS+' integers / row</code></span>'
    +    '<span><b>VALIDATION</b><code>SHA-256 exact series</code></span>'
    +  '</div>'
    +  '<footer class="numeric-series-footer">'
    +    '<p id="d5NumericSeriesStatus" data-kind="idle"><i></i><span>Waiting for authorized numeric series.</span></p>'
    +    '<button id="d5NumericSeriesValidate" type="button">Validate series</button>'
    +  '</footer>'
    +'</section>';
  document.body.appendChild(overlay);

  var input=document.getElementById('d5NumericSeriesInput');
  var file=document.getElementById('d5NumericSeriesFile');
  var clear=document.getElementById('d5NumericSeriesClear');
  var validate=document.getElementById('d5NumericSeriesValidate');

  input.addEventListener('input',function(){normalizePreview(input.value);});
  clear.addEventListener('click',function(){input.value='';normalizePreview('');setStatus('Waiting for authorized numeric series.','idle');input.focus();});
  file.addEventListener('change',function(){
    var selected=file.files&&file.files[0];
    if(!selected)return;
    var reader=new FileReader();
    reader.onload=function(){input.value=String(reader.result||'');normalizePreview(input.value);setStatus('File loaded. Validate the series to continue.','ready');};
    reader.onerror=function(){setStatus('Could not read the selected file.','error');};
    reader.readAsText(selected);
  });
  validate.addEventListener('click',async function(){
    if(state.busy)return;
    var series=input.value;
    if(!series.trim()){setStatus('Paste or load the complete numeric series first.','error');input.focus();return;}
    state.busy=true;
    validate.disabled=true;
    validate.textContent='Validating…';
    setStatus('Checking '+state.rows.toLocaleString()+' rows against the authorized series…','idle');
    try{
      var response=await fetch(API,{
        method:'POST',
        credentials:'same-origin',
        headers:{'Content-Type':'application/json','Accept':'application/json','X-Hashcod-Numeric-Series':'1'},
        body:JSON.stringify({series:series})
      });
      var data={};
      try{data=await response.json();}catch(_){}
      if(!response.ok||!data.ok||!data.authorized){
        throw new Error(data.error||'The numeric series was rejected.');
      }
      setStatus('Authorized series verified. Opening Hashcod Codespace…','success');
      window.setTimeout(markAuthorized,220);
    }catch(error){
      setStatus(error&&error.message?error.message:'The numeric series was rejected.','error');
    }finally{
      state.busy=false;
      validate.disabled=false;
      validate.textContent='Validate series';
    }
  });
  window.setTimeout(function(){input.focus();},80);
}
async function init(){
  hideLegacyGate();
  try{
    var response=await fetch(API,{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
    var data=await response.json();
    if(data&&data.authorized){markAuthorized();return;}
  }catch(_){}
  buildGate();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
