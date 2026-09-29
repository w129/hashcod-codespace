(function(){
'use strict';

if(window.__hashcodPqcActionBusLoaded)return;
window.__hashcodPqcActionBusLoaded=true;

var nativeFetch=typeof window.fetch==='function'?window.fetch.bind(window):null;
if(!nativeFetch)return;

function basePath(){
  var match=String(location.pathname||'').match(/^\/(l8|l8-codespace)(?=\/|$)/i);
  return match?'/'+match[1]:'';
}

var API=basePath()+'/api/pqc-actions';
var state={
  ready:null,
  nextSeq:1,
  enforcement:false,
  pqcActive:false,
  keyFingerprint:'',
  chainHead:'',
  queue:Promise.resolve(),
  entered:false,
  lastReceipt:null
};

function randomId(prefix){
  try{
    if(window.crypto&&typeof crypto.randomUUID==='function')return prefix+':'+crypto.randomUUID();
    if(window.crypto&&typeof crypto.getRandomValues==='function'){
      var bytes=new Uint8Array(18);
      crypto.getRandomValues(bytes);
      return prefix+':'+Array.from(bytes).map(function(v){return v.toString(16).padStart(2,'0');}).join('');
    }
  }catch(_){}
  return prefix+':'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2);
}

function clean(value,max){
  var text=String(value==null?'':value).replace(/[\u0000-\u001f\u007f]/g,'').trim();
  return text.slice(0,max||160);
}

function toolIdFor(node){
  if(!node||!node.getAttribute)return '';
  return clean(
    node.getAttribute('data-tool-id')||
    node.getAttribute('data-tool')||
    node.getAttribute('data-slot')||
    '',120
  );
}

function targetFor(node){
  if(!node||node===document||node===window)return 'document';
  if(!node.getAttribute)return clean(String(node.nodeName||'unknown').toLowerCase(),180);
  var id=clean(node.id||'',100);
  if(id)return '#'+id;
  var tool=toolIdFor(node);
  if(tool)return 'tool:'+tool;
  var aria=clean(node.getAttribute('aria-label')||'',100);
  var name=clean(node.getAttribute('name')||'',80);
  var tag=clean(String(node.tagName||'node').toLowerCase(),40);
  var role=clean(node.getAttribute('role')||'',40);
  return [tag,role?('role='+role):'',name?('name='+name):'',aria?('aria='+aria):''].filter(Boolean).join('|').slice(0,180);
}

function bootstrap(){
  if(state.ready)return state.ready;
  state.ready=nativeFetch(API+'?action=bootstrap',{
    method:'GET',
    credentials:'same-origin',
    cache:'no-store',
    headers:{Accept:'application/json'}
  }).then(function(response){
    if(!response.ok)throw new Error('pqc_bootstrap_'+response.status);
    return response.json();
  }).then(function(data){
    if(!data||!data.ok)throw new Error('pqc_bootstrap_invalid');
    state.nextSeq=Math.max(1,Number(data.session&&data.session.next_seq)||1);
    state.enforcement=!!data.enforcement;
    state.pqcActive=!!data.pqc_active;
    state.keyFingerprint=clean(data.key_fingerprint||'',80);
    state.chainHead=clean(data.session&&data.session.chain_head||'',128);
    try{window.dispatchEvent(new CustomEvent('hashcod:pqc-ready',{detail:{
      active:state.pqcActive,
      enforcement:state.enforcement,
      algorithm:data.algorithm||'ML-DSA-87',
      standard:data.standard||'NIST FIPS 204',
      keyFingerprint:state.keyFingerprint
    }}));}catch(_){}
    return data;
  }).catch(function(error){
    try{window.dispatchEvent(new CustomEvent('hashcod:pqc-degraded',{detail:{reason:String(error&&error.message||error)}}));}catch(_){}
    throw error;
  });
  return state.ready;
}

function sendRaw(kind,target,options,retry){
  options=options||{};
  return bootstrap().then(function(){
    var seq=state.nextSeq;
    var payload={
      seq:seq,
      event_id:randomId(kind.replace(/[^a-z0-9]+/gi,'-').slice(0,24)||'event'),
      kind:clean(kind,64),
      target:clean(target,180),
      tool_id:clean(options.toolId||'',120),
      request_path:clean(options.requestPath||'',240),
      method:clean(options.method||'',12).toUpperCase(),
      client_ts:Date.now()
    };
    return nativeFetch(API,{
      method:'POST',
      credentials:'same-origin',
      cache:'no-store',
      keepalive:!!options.keepalive,
      headers:{
        'Content-Type':'application/json',
        'X-Requested-With':'XMLHttpRequest',
        Accept:'application/json'
      },
      body:JSON.stringify(payload)
    }).then(function(response){
      return response.json().catch(function(){return {ok:false,error:'invalid_json'};}).then(function(data){
        if(response.status===409&&data&&data.error==='sequence_conflict'&&Number(data.next_seq)>0&&retry!==false){
          state.nextSeq=Number(data.next_seq);
          return sendRaw(kind,target,options,false);
        }
        if(!response.ok||!data||!data.ok){
          var error=new Error(String(data&&data.error||('pqc_action_'+response.status)));
          error.status=response.status;
          throw error;
        }
        state.nextSeq=Math.max(seq+1,Number(data.next_seq)||seq+1);
        state.chainHead=clean(data.event_hash||state.chainHead,128);
        state.lastReceipt=data;
        try{window.dispatchEvent(new CustomEvent('hashcod:pqc-receipt',{detail:data}));}catch(_){}
        return data;
      });
    });
  });
}

function signEvent(kind,target,options){
  state.queue=state.queue.catch(function(){}).then(function(){
    return sendRaw(kind,target,options||{},true);
  });
  return state.queue;
}

function interactiveTarget(origin){
  if(!origin||!origin.closest)return null;
  return origin.closest('button,[role="button"],input[type="button"],input[type="submit"],input[type="reset"],.tb-slot,[data-tool-id],[data-tool]');
}

function onTrustedActivation(event){
  if(event.isTrusted===false)return;
  var node=interactiveTarget(event.target);
  if(!node)return;
  signEvent('ui.activate',targetFor(node),{
    toolId:toolIdFor(node),
    keepalive:true
  }).catch(function(){});
}

document.addEventListener('click',onTrustedActivation,true);
document.addEventListener('submit',function(event){
  if(event.isTrusted===false)return;
  var form=event.target;
  signEvent('ui.submit',targetFor(form),{keepalive:true}).catch(function(){});
},true);

var enabledSnapshot=new WeakMap();
var reportedEnabled=new WeakSet();

function isEnabledTool(node){
  if(!node||node.nodeType!==1||!node.matches)return false;
  if(!node.matches('.tb-slot,[data-tool-id],[data-tool]'))return false;
  if(node.disabled===true)return false;
  if(node.getAttribute('aria-disabled')==='true')return false;
  return true;
}

function rememberTool(node){
  if(!node||node.nodeType!==1)return;
  if(node.matches&&node.matches('.tb-slot,[data-tool-id],[data-tool]')){
    enabledSnapshot.set(node,isEnabledTool(node));
  }
  if(node.querySelectorAll){
    node.querySelectorAll('.tb-slot,[data-tool-id],[data-tool]').forEach(function(child){
      enabledSnapshot.set(child,isEnabledTool(child));
    });
  }
}

function reportToolEnable(node,source){
  if(!isEnabledTool(node))return;
  if(reportedEnabled.has(node)&&source==='mount')return;
  reportedEnabled.add(node);
  signEvent('tool.enable',targetFor(node),{
    toolId:toolIdFor(node),
    keepalive:true
  }).catch(function(){});
}

function observeTools(){
  var root=document.documentElement;
  if(!root||typeof MutationObserver!=='function')return;
  rememberTool(root);
  var observer=new MutationObserver(function(records){
    records.forEach(function(record){
      if(record.type==='attributes'){
        var node=record.target;
        var previous=enabledSnapshot.get(node);
        var current=isEnabledTool(node);
        enabledSnapshot.set(node,current);
        if(previous===false&&current===true)reportToolEnable(node,'attribute');
        if(current&&['data-tool-id','data-tool'].indexOf(record.attributeName)>=0)reportToolEnable(node,'identity');
        return;
      }
      Array.from(record.addedNodes||[]).forEach(function(node){
        if(!node||node.nodeType!==1)return;
        if(node.matches&&node.matches('.tb-slot,[data-tool-id],[data-tool]')){
          enabledSnapshot.set(node,isEnabledTool(node));
          if(isEnabledTool(node)&&toolIdFor(node))reportToolEnable(node,'mount');
        }
        if(node.querySelectorAll){
          node.querySelectorAll('.tb-slot,[data-tool-id],[data-tool]').forEach(function(child){
            enabledSnapshot.set(child,isEnabledTool(child));
            if(isEnabledTool(child)&&toolIdFor(child))reportToolEnable(child,'mount');
          });
        }
      });
    });
  });
  observer.observe(root,{
    subtree:true,
    childList:true,
    attributes:true,
    attributeFilter:['disabled','aria-disabled','class','data-tool-id','data-tool']
  });
}

function sameOriginRequest(request){
  try{return new URL(request.url,location.href).origin===location.origin;}catch(_){return false;}
}

function stateChanging(method){
  return ['POST','PUT','PATCH','DELETE'].indexOf(String(method||'GET').toUpperCase())>=0;
}

window.fetch=function(input,init){
  var request;
  try{request=new Request(input,init);}catch(_){return nativeFetch(input,init);}
  if(!sameOriginRequest(request)||!stateChanging(request.method)){
    return nativeFetch(input,init);
  }
  var url;
  try{url=new URL(request.url,location.href);}catch(_){return nativeFetch(input,init);}
  if(url.pathname===API||url.pathname.endsWith('/api/pqc-actions')){
    return nativeFetch(request);
  }

  var requestPath=url.pathname;
  return signEvent('api.mutation',requestPath,{
    requestPath:requestPath,
    method:request.method
  }).then(function(receipt){
    var headers=new Headers(request.headers);
    if(receipt&&receipt.permit_token)headers.set('X-Hashcod-PQC-Permit',receipt.permit_token);
    if(receipt&&receipt.receipt_hash)headers.set('X-Hashcod-PQC-Receipt-Hash',receipt.receipt_hash);
    return nativeFetch(new Request(request,{headers:headers}));
  }).catch(function(error){
    if(state.enforcement)return Promise.reject(error);
    try{window.dispatchEvent(new CustomEvent('hashcod:pqc-degraded',{detail:{
      reason:String(error&&error.message||error),
      requestPath:requestPath
    }}));}catch(_){}
    return nativeFetch(request);
  });
};

function markPlatformStart(){
  signEvent('platform.start',location.pathname,{keepalive:true}).catch(function(){});
}

function markPlatformEntered(){
  if(state.entered)return;
  state.entered=true;
  signEvent('platform.enter',location.pathname,{keepalive:true}).catch(function(){});
}

window.addEventListener('hashcod:platform-entered',markPlatformEntered,{once:true});
window.addEventListener('hashcod:platform-entry-complete',markPlatformEntered,{once:true});

bootstrap().then(function(){
  markPlatformStart();
  if(document.documentElement&&document.documentElement.dataset.hashcodPlatformEntered==='true')markPlatformEntered();
}).catch(function(){});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',observeTools,{once:true});
}else{
  observeTools();
}

window.HashcodPQCActionBus=Object.freeze({
  bootstrap:bootstrap,
  signEvent:signEvent,
  secureFetch:window.fetch.bind(window),
  status:function(){
    return {
      pqcActive:state.pqcActive,
      enforcement:state.enforcement,
      keyFingerprint:state.keyFingerprint,
      nextSeq:state.nextSeq,
      chainHead:state.chainHead,
      lastReceipt:state.lastReceipt
    };
  },
  publicKey:function(){
    return nativeFetch(API+'?action=public-key',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}})
      .then(function(r){return r.json();});
  }
});
})();