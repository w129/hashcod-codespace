(function(){
'use strict';

var VERSION='20261004-smith-auth1';
var API='/api/code-access';

function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}

function setStatus(message,kind){
  var node=document.getElementById('d5CodeAccessStatus');
  if(!node)return;
  node.setAttribute('data-kind',kind||'idle');
  var span=node.querySelector('span');
  if(span)span.textContent=message;
  else node.textContent=message;
}

async function copyText(text){
  if(!text)return false;
  try{await navigator.clipboard.writeText(text);return true;}catch(_){return false;}
}

function installControls(state){
  var tools=document.querySelector('#d5CodeAccessGate .code-tabs-tools');
  if(!tools||tools.querySelector('[data-smith-bridge-controls]'))return;

  var wrap=document.createElement('span');
  wrap.setAttribute('data-smith-bridge-controls','1');
  wrap.className='signed-smith-toolbar';

  var copy=document.createElement('button');
  copy.type='button';
  copy.textContent='Copy challenge';
  copy.addEventListener('click',async function(){
    var ok=await copyText(state.challenge||'');
    copy.textContent=ok?'Copied':'Copy challenge';
    if(ok)setTimeout(function(){copy.textContent='Copy challenge';},1200);
  });

  var refresh=document.createElement('button');
  refresh.type='button';
  refresh.textContent='New challenge';
  refresh.addEventListener('click',function(){loadChallenge(state);});

  wrap.append(copy,refresh);
  tools.appendChild(wrap);
}

function installEditor(state){
  var stage=document.querySelector('#d5CodeAccessGate .mesh-editor-stage');
  if(!stage)return null;

  var old=stage.querySelector('#d5SignedSmithManifest');
  if(old)return old;

  var textarea=document.createElement('textarea');
  textarea.id='d5SignedSmithManifest';
  textarea.className='signed-smith-manifest-editor';
  textarea.spellcheck=false;
  textarea.autocomplete='off';
  textarea.setAttribute('aria-label','Signed Smith access manifest editor');
  textarea.value="<?php\n\n// Loading current signed-access challenge…\n\nreturn [\n  'protocol' => 'OCG-SMITH-AUTH/1',\n  'payload_b64' => 'GENERATE_WITH_HASHCOD_SMITH_CONSOLE',\n  'signature_b64' => 'GENERATE_WITH_HASHCOD_SMITH_CONSOLE',\n];\n";
  stage.appendChild(textarea);

  var oldIcon=document.getElementById('d5MeshNodeIcon');
  if(oldIcon)oldIcon.hidden=true;

  state.editor=textarea;
  return textarea;
}

async function loadChallenge(state){
  if(state.loading)return;
  state.loading=true;
  setStatus('Preparing signed Smith challenge…','idle');
  try{
    var response=await fetch(API,{method:'GET',credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.ok)throw new Error(data.error||'Unable to create signed Smith challenge.');

    state.challenge=String(data.challenge||'');
    state.authorityConfigured=data.authority_configured!==false;
    if(state.editor&&data.template)state.editor.value=String(data.template);

    setStatus(
      state.authorityConfigured
        ?'Copy the challenge to Hashcod Smith Credential Console, generate the signed code, then paste the complete PHP block here.'
        :'Server ML-DSA-87 public key is not configured. Configure the matching public key before validating.',
      state.authorityConfigured?'ready':'error'
    );

    var button=document.getElementById('d5OpenMeshCredential');
    if(button){
      button.disabled=!state.authorityConfigured;
      button.textContent='Validate signed code';
    }
  }catch(error){
    setStatus(error&&error.message?error.message:'Unable to prepare signed Smith access.','error');
  }finally{
    state.loading=false;
  }
}

async function validate(state,event){
  if(event){event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();}
  if(state.loading||!state.editor)return;
  state.loading=true;
  var button=document.getElementById('d5OpenMeshCredential');
  if(button){button.disabled=true;button.textContent='Verifying…';}
  setStatus('Backend is recalculating Smith variables, footprint and ML-DSA-87 signature…','idle');

  try{
    var response=await fetch(API,{
      method:'POST',
      credentials:'same-origin',
      headers:{Accept:'application/json','Content-Type':'application/json','X-Hashcod-Smith':'1'},
      body:JSON.stringify({manifest:state.editor.value})
    });
    var data=await response.json().catch(function(){return {};});
    if(!response.ok||!data.ok||!data.authorized)throw new Error(data.error||'Signed Smith access code rejected.');

    setStatus('Authentic footprint verified. Opening Hashcod Codespace…','success');
    document.body.dataset.hashcodCodeAccessAuthorized='1';
    window.HashcodSignedSmith=Object.freeze({authorized:true,protocol:'OCG-SMITH-AUTH/1',footprint:data.footprint||'',version:VERSION});
    window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));
    var gate=document.getElementById('d5CodeAccessGate');
    if(gate)setTimeout(function(){gate.style.display='none';},220);
  }catch(error){
    setStatus(error&&error.message?error.message:'Signed Smith access code rejected.','error');
    if(button){button.disabled=false;button.textContent='Validate signed code';}
  }finally{
    state.loading=false;
  }
}

async function mount(){
  var state={challenge:'',authorityConfigured:false,loading:false,editor:null};
  for(var i=0;i<80;i++){
    if(document.getElementById('d5CodeAccessGate')&&document.querySelector('#d5CodeAccessGate .mesh-editor-stage'))break;
    await sleep(100);
  }
  if(!document.getElementById('d5CodeAccessGate'))return;

  installEditor(state);
  installControls(state);

  var button=document.getElementById('d5OpenMeshCredential');
  if(button){
    button.textContent='Validate signed code';
    button.addEventListener('click',function(event){validate(state,event);},true);
  }

  // Let the original React GET settle first, then issue the authoritative
  // challenge that the desktop signer will use.
  await sleep(450);
  await loadChallenge(state);

  window.HashcodSignedSmithBridge=Object.freeze({mounted:true,version:VERSION});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
})();
