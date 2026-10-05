(function(){
'use strict';

// Retired gate version: 20261004-numeric-series5. Kept only as a migration marker.
var VERSION='20261005-open-entry3';
var UNIVERSAL_PERSISTENCE='/components/universal-cloud-persistence.js?v=20261004-universal-cloud2';
var WORKSPACE_MEDIA='/components/workspace-media-bootstrap.js?v=20261004-workspace-media1';
var FILE_VAULT_FAST='/components/file-vault-fast-upload-v3.js?v=20261005-file-vault-fast3';
var FILE_VAULT_TOTP='/components/file-vault-totp.bundle.js?v=20261005-file-vault-totp2';
var FILE_VAULT_TOTP_CSS='/components/file-vault-totp.css?v=20261005-file-vault-totp3';

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

function appendFileVaultTotp(){
  if(document.querySelector('script[data-hashcod-file-vault-totp]'))return;
  var script=document.createElement('script');
  script.src=FILE_VAULT_TOTP;
  script.defer=true;
  script.dataset.hashcodFileVaultTotp='true';
  document.head.appendChild(script);
}

function loadFileVaultTotp(){
  if(!document.querySelector('link[data-hashcod-file-vault-totp-style]')){
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=FILE_VAULT_TOTP_CSS;
    link.dataset.hashcodFileVaultTotpStyle='true';
    document.head.appendChild(link);
  }

  if(window.__hashcodFileVaultFast3Loaded){
    appendFileVaultTotp();
    return;
  }

  var existing=document.querySelector('script[data-hashcod-file-vault-fast]');
  if(existing){
    existing.addEventListener('load',appendFileVaultTotp,{once:true});
    existing.addEventListener('error',appendFileVaultTotp,{once:true});
    return;
  }

  var fast=document.createElement('script');
  fast.src=FILE_VAULT_FAST;
  fast.async=false;
  fast.dataset.hashcodFileVaultFast='true';
  fast.addEventListener('load',appendFileVaultTotp,{once:true});
  fast.addEventListener('error',appendFileVaultTotp,{once:true});
  document.head.appendChild(fast);
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
  loadFileVaultTotp();
  try{
    window.dispatchEvent(new CustomEvent('hashcod:code-access-granted',{detail:{required:false,mode:'open-entry'}}));
  }catch(_){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openPlatform,{once:true});
else openPlatform();
})();
