(function(){
'use strict';

// Retired gate version: 20261004-numeric-series5. Kept only as a migration marker.
var VERSION='20261004-open-entry1';
var UNIVERSAL_PERSISTENCE='/components/universal-cloud-persistence.js?v=20261004-universal-cloud2';
var WORKSPACE_MEDIA='/components/workspace-media-bootstrap.js?v=20261004-workspace-media1';

function hideLegacyGate(){
  var root=document.getElementById('d5CodeAccessMount');
  if(root){
    root.dataset.authorized='1';
    root.style.display='none';
  }
  var numericGate=document.getElementById('d5NumericSeriesGate');
  if(numericGate&&numericGate.parentNode)numericGate.parentNode.removeChild(numericGate);
  document.querySelectorAll('link[data-hashcod-numeric-series-style]').forEach(function(node){
    if(node&&node.parentNode)node.parentNode.removeChild(node);
  });
}

function loadUniversalPersistence(){
  if(document.querySelector('script[data-hashcod-universal-persistence]'))return;
  var script=document.createElement('script');
  script.src=UNIVERSAL_PERSISTENCE;
  script.defer=true;
  script.dataset.hashcodUniversalPersistence='true';
  document.head.appendChild(script);
}

function loadWorkspaceMedia(){
  if(document.querySelector('script[data-hashcod-workspace-media]'))return;
  var script=document.createElement('script');
  script.src=WORKSPACE_MEDIA;
  script.defer=true;
  script.dataset.hashcodWorkspaceMedia='true';
  document.head.appendChild(script);
}

function openPlatform(){
  hideLegacyGate();
  if(document.body){
    document.body.dataset.hashcodCodeAccessAuthorized='1';
    document.body.dataset.hashcodEntryLock='disabled';
    document.body.style.overflow='';
  }
  document.documentElement.dataset.hashcodEntryLock='disabled';
  window.HashcodCodeAccess=Object.freeze({
    mounted:true,
    authorized:true,
    required:false,
    mode:'open-entry',
    version:VERSION
  });
  loadUniversalPersistence();
  loadWorkspaceMedia();
  try{
    window.dispatchEvent(new CustomEvent('hashcod:code-access-granted',{detail:{required:false,mode:'open-entry'}}));
  }catch(_){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openPlatform,{once:true});
else openPlatform();
})();
