(function(){
'use strict';

// Retired gate version: 20261004-numeric-series5. Kept only as a migration marker.
var VERSION='20261005-open-entry7';
var UNIVERSAL_PERSISTENCE='/components/universal-cloud-persistence.js?v=20261004-universal-cloud2';
var WORKSPACE_MEDIA='/components/workspace-media-bootstrap.js?v=20261004-workspace-media1';
var FILE_VAULT_RECOVERY='/components/file-vault-commit-recovery.js?v=20261005-file-vault-commit-recovery1';
var FILE_VAULT_TOTP='/components/file-vault-totp.bundle.js?v=20261006-file-vault-setup-verify2';
var FILE_VAULT_TOTP_CSS='/components/file-vault-totp.css?v=20261005-file-vault-download-totp5';
var FILE_VAULT_FAST='/components/file-vault-fast-upload-v5.js?v=20261005-file-vault-fast5-route2';

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

function appendFileVaultFast(){
  if(window.__hashcodFileVaultFast5Loaded)return;
  if(document.querySelector('script[data-hashcod-file-vault-fast]'))return;
  var fast=document.createElement('script');
  fast.src=FILE_VAULT_FAST;
  fast.async=false;
  fast.dataset.hashcodFileVaultFast='true';
  document.head.appendChild(fast);
}

function appendFileVaultTotp(){
  if(window.__hashcodFileVaultTotpLoaded){
    appendFileVaultFast();
    return;
  }
  var existing=document.querySelector('script[data-hashcod-file-vault-totp]');
  if(existing){
    existing.addEventListener('load',appendFileVaultFast,{once:true});
    existing.addEventListener('error',appendFileVaultFast,{once:true});
    return;
  }
  var script=document.createElement('script');
  script.src=FILE_VAULT_TOTP;
  script.async=false;
  script.dataset.hashcodFileVaultTotp='true';
  script.addEventListener('load',appendFileVaultFast,{once:true});
  script.addEventListener('error',appendFileVaultFast,{once:true});
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

  if(window.__hashcodFileVaultCommitRecoveryLoaded){
    appendFileVaultTotp();
    return;
  }

  var existingRecovery=document.querySelector('script[data-hashcod-file-vault-recovery]');
  if(existingRecovery){
    existingRecovery.addEventListener('load',appendFileVaultTotp,{once:true});
    existingRecovery.addEventListener('error',appendFileVaultTotp,{once:true});
    return;
  }

  var recovery=document.createElement('script');
  recovery.src=FILE_VAULT_RECOVERY;
  recovery.async=false;
  recovery.dataset.hashcodFileVaultRecovery='true';
  recovery.addEventListener('load',appendFileVaultTotp,{once:true});
  recovery.addEventListener('error',appendFileVaultTotp,{once:true});
  document.head.appendChild(recovery);
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
