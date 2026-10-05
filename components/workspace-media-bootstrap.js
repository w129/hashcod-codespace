(function(){
'use strict';
var VERSION='20261004-workspace-media1';
var scripts=[
  {src:'/components/product-image-cloud-sync.js?v=20261004-product-image-cloud1',attr:'hashcodProductImageCloud'},
  {src:'/components/workspace-image-vault-sync.js?v=20261004-image-vault-workspace1',attr:'hashcodImageVaultWorkspace'}
];
function load(item){
  var selector='script[data-'+item.attr.replace(/[A-Z]/g,function(c){return '-'+c.toLowerCase();})+']';
  if(document.querySelector(selector))return;
  var script=document.createElement('script');
  script.src=item.src;
  script.defer=true;
  script.dataset[item.attr]='true';
  document.head.appendChild(script);
}
function start(){scripts.forEach(load);}
window.HashcodWorkspaceMedia=Object.freeze({version:VERSION,start:start});
window.addEventListener('hashcod:code-access-granted',start);
if(document.body&&document.body.dataset.hashcodCodeAccessAuthorized==='1')start();
})();
