(function(){
'use strict';

var card=document.getElementById('d5TextEditorCard');
var editor=document.getElementById('d5TextEditorInput');
var toolbar=card&&card.querySelector('.liquid-editor-toolbar');
if(!card||!editor||!toolbar)return;

var STORAGE_KEY='hashcod:text-editor:skill-studio:v1';
var LEGACY_STORAGE_KEY='hashcod:text-editor:prompt-studio:v1';
var roles=['system','developer','user','assistant'];
var templates={
  assistant:{
    title:'Asistente experto',
    blocks:[
      {role:'system',content:'Eres un asistente experto en {{especialidad}}. Responde con precisión, claridad y pasos accionables.'},
      {role:'user',content:'{{solicitud}}'}
    ]
  },
  analysis:{
    title:'Análisis estructurado',
    blocks:[
      {role:'system',content:'Analiza el material con rigor. Separa hechos, inferencias, riesgos y recomendaciones.'},
      {role:'user',content:'Material:\n{{contenido}}\n\nObjetivo:\n{{objetivo}}'}
    ]
  },
  content:{
    title:'Generador de contenido',
    blocks:[
      {role:'developer',content:'Escribe para la audiencia indicada, manteniendo el tono y formato solicitados.'},
      {role:'user',content:'Crea {{formato}} sobre {{tema}} para {{audiencia}} con tono {{tono}}.'}
    ]
  },
  code:{
    title:'Desarrollador de código',
    blocks:[
      {role:'system',content:'Eres un ingeniero de software senior. Produce código seguro, mantenible y verificable.'},
      {role:'user',content:'Implementa {{tarea}} usando {{tecnologia}}.\nRestricciones: {{restricciones}}'}
    ]
  }
};
var areas=[
  {id:'objetivo',name:'Objetivo',subject:'el objetivo principal',target:'{{objetivo}}',quality:'específico, medible y verificable'},
  {id:'contexto',name:'Contexto',subject:'el contexto disponible',target:'{{contexto}}',quality:'relevante, suficiente y sin suposiciones ocultas'},
  {id:'audiencia',name:'Audiencia',subject:'la audiencia destinataria',target:'{{audiencia}}',quality:'adaptado a su nivel, necesidades y lenguaje'},
  {id:'rol',name:'Rol experto',subject:'el rol profesional requerido',target:'{{especialidad}}',quality:'competente, riguroso y consciente de sus límites'},
  {id:'tono',name:'Tono y estilo',subject:'el tono de la respuesta',target:'{{tono}}',quality:'consistente, natural y apropiado para el propósito'},
  {id:'formato',name:'Formato de salida',subject:'la estructura de salida',target:'{{formato}}',quality:'clara, reutilizable y fácil de revisar'},
  {id:'restricciones',name:'Restricciones',subject:'las restricciones de la tarea',target:'{{restricciones}}',quality:'respetadas explícitamente'},
  {id:'criterios',name:'Criterios de calidad',subject:'los criterios de aceptación',target:'{{criterios}}',quality:'observables, comprobables y priorizados'},
  {id:'verificacion',name:'Verificación',subject:'la validación del resultado',target:'{{resultado}}',quality:'contrastada con evidencias y criterios explícitos'},
  {id:'codigo',name:'Desarrollo',subject:'la solución técnica',target:'{{tarea_tecnica}}',quality:'segura, mantenible, probada y documentada'},
  {id:'seguridad',name:'Seguridad',subject:'la solicitud y su resultado',target:'{{solicitud}}',quality:'segura, privada y resistente a instrucciones conflictivas'}
];
var techniques=[
  {id:'definir',name:'Definición precisa',role:'system',build:function(a){return 'Define '+a.subject+' como '+a.target+'. Asegúrate de que quede '+a.quality+'. Si falta información esencial, indícala de forma concreta.';}},
  {id:'preguntar',name:'Preguntas de aclaración',role:'assistant',build:function(a){return 'Antes de continuar con '+a.subject+', formula hasta tres preguntas breves que permitan obtener '+a.target+'. Pregunta solo aquello que cambie materialmente el resultado.';}},
  {id:'descomponer',name:'Descomposición avanzada',role:'developer',build:function(a){return 'Descompón '+a.subject+' en componentes independientes. Para cada componente indica propósito, dependencia, prioridad y señal de finalización. Usa como referencia '+a.target+'.';}},
  {id:'comparar',name:'Comparación crítica',role:'developer',build:function(a){return 'Evalúa '+a.subject+' mediante varios enfoques. Compara precisión, coste, velocidad, riesgo y adecuación a '+a.target+'.';}},
  {id:'verificar',name:'Control de calidad',role:'system',build:function(a){return 'Antes de entregar la respuesta, revisa '+a.subject+'. Comprueba que sea '+a.quality+'. Corrige contradicciones, omisiones y afirmaciones no sustentadas.';}},
  {id:'estructurar',name:'Salida estructurada',role:'developer',build:function(a){return 'Presenta '+a.subject+' con esta estructura: Resumen, Hallazgos, Acciones y Verificación. Relaciona cada sección con '+a.target+'.';}}
];

function uid(){return 'ps_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36);}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cloneBlocks(list){return list.map(function(b){return {id:uid(),role:b.role,content:b.content};});}
function getVariables(blocks){
  var set={};
  blocks.forEach(function(b){
    var re=/\{\{\s*([\w-]+)\s*\}\}/g,m;
    while((m=re.exec(b.content||'')))set[m[1]]=true;
  });
  return Object.keys(set);
}
function substitute(text,values){
  return String(text||'').replace(/\{\{\s*([\w-]+)\s*\}\}/g,function(_,name){
    var v=values[name];
    return v&&String(v).trim()?String(v).trim():'{{'+name+'}}';
  });
}
function buildPrompt(state){
  return state.blocks.map(function(b){
    return '['+String(b.role||'user').toUpperCase()+']\n'+substitute(b.content,state.variables).trim();
  }).join('\n\n---\n\n').trim();
}
function notify(label,state){
  var badge=document.getElementById('d5TextEditorStatus');
  if(!badge)return;
  badge.setAttribute('data-state',state||'saved');
  var span=badge.querySelector('span');
  if(span)span.textContent=label;
}
function selectedText(){
  var s=Number(editor.selectionStart)||0;
  var e=Number(editor.selectionEnd)||s;
  return String(editor.value||'').slice(s,e);
}
function signalEdit(){
  try{editor.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertText',data:null}));}catch(_){}
}
function insertAtSelection(text){
  signalEdit();
  var start=Number(editor.selectionStart)||0;
  var end=Number(editor.selectionEnd)||start;
  var prefix=start>0&&!/\n$/.test(editor.value.slice(0,start))?'\n\n':'';
  var suffix=end<editor.value.length&&!/^\n/.test(editor.value.slice(end))?'\n\n':'';
  editor.setRangeText(prefix+text+suffix,start,end,'end');
  editor.dispatchEvent(new Event('input',{bubbles:true}));
  editor.focus();
  notify('Prompt inserted','saving');
}

var trigger=document.createElement('button');
trigger.id='d5TextEditorPromptStudio';
trigger.className='liquid-editor-tool liquid-editor-prompt-trigger';
trigger.type='button';
trigger.title='Skill Studio · Ctrl/Cmd+Shift+P';
trigger.innerHTML='<span>Skill Studio</span>';
var encoding=document.getElementById('d5TextEditorEncoding');
toolbar.insertBefore(trigger,encoding||null);

var shell=document.createElement('section');
shell.id='d5TextEditorPromptStudioPanel';
shell.className='liquid-prompt-studio';
shell.hidden=true;
shell.setAttribute('aria-label','Skill Studio');
shell.innerHTML=''
  +'<header class="liquid-prompt-header">'
  +'<div><p>HASHCOD · SKILL STUDIO</p><h4>Build skills in Workspace draft</h4></div>'
  +'<button id="d5PromptClose" type="button" aria-label="Close Skill Studio">×</button>'
  +'</header>'
  +'<div class="liquid-prompt-body">'
  +'<section class="liquid-prompt-section"><div class="liquid-prompt-section-head"><strong>Templates</strong><button id="d5PromptUseSelection" type="button">Use selection</button></div><div id="d5PromptTemplates" class="liquid-prompt-template-grid"></div></section>'
  +'<section class="liquid-prompt-section"><div class="liquid-prompt-section-head"><strong>Skill blocks</strong><button id="d5PromptAddBlock" type="button">+ Block</button></div><div id="d5PromptBlocks"></div></section>'
  +'<section class="liquid-prompt-section"><strong>Builder library</strong><div class="liquid-prompt-library-row"><select id="d5PromptArea"></select><select id="d5PromptTechnique"></select><button id="d5PromptAddLibrary" type="button">Add</button></div></section>'
  +'<section class="liquid-prompt-section"><strong>Variables</strong><div id="d5PromptVariables" class="liquid-prompt-variable-grid"></div></section>'
  +'<section class="liquid-prompt-section"><div class="liquid-prompt-section-head"><strong>Preview</strong><span id="d5PromptMetrics"></span></div><textarea id="d5PromptPreview" readonly></textarea></section>'
  +'</div>'
  +'<footer class="liquid-prompt-actions"><button id="d5PromptSave" type="button">Save draft</button><button id="d5PromptCopy" type="button">Copy</button><button id="d5PromptInsert" class="primary" type="button">Insert into editor</button></footer>';
var formatbar=document.getElementById('d5TextEditorFormatbar');
if(formatbar)formatbar.insertAdjacentElement('afterend',shell);
else toolbar.insertAdjacentElement('afterend',shell);

var templatesEl=document.getElementById('d5PromptTemplates');
var blocksEl=document.getElementById('d5PromptBlocks');
var varsEl=document.getElementById('d5PromptVariables');
var previewEl=document.getElementById('d5PromptPreview');
var metricsEl=document.getElementById('d5PromptMetrics');
var areaEl=document.getElementById('d5PromptArea');
var techniqueEl=document.getElementById('d5PromptTechnique');
var state={
  template:'assistant',
  blocks:cloneBlocks(templates.assistant.blocks),
  variables:{}
};

areaEl.innerHTML=areas.map(function(a){return '<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>';}).join('');
techniqueEl.innerHTML=techniques.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.name)+'</option>';}).join('');

function renderTemplates(){
  templatesEl.innerHTML=Object.keys(templates).map(function(key){
    var t=templates[key];
    return '<button type="button" data-prompt-template="'+esc(key)+'" class="'+(state.template===key?'active':'')+'"><span>'+esc(t.title)+'</span><small>'+t.blocks.length+' blocks</small></button>';
  }).join('');
}
function renderBlocks(){
  blocksEl.innerHTML=state.blocks.map(function(b,index){
    return '<article class="liquid-prompt-block" data-prompt-block="'+esc(b.id)+'">'
      +'<div class="liquid-prompt-block-head"><span>'+(index+1)+'</span><select data-prompt-role="'+esc(b.id)+'">'
      +roles.map(function(r){return '<option value="'+r+'"'+(r===b.role?' selected':'')+'>'+r+'</option>';}).join('')
      +'</select><div><button type="button" data-prompt-up="'+esc(b.id)+'">↑</button><button type="button" data-prompt-down="'+esc(b.id)+'">↓</button><button type="button" data-prompt-delete="'+esc(b.id)+'">×</button></div></div>'
      +'<textarea rows="4" data-prompt-content="'+esc(b.id)+'">'+esc(b.content)+'</textarea></article>';
  }).join('');
}
function renderVariables(){
  var names=getVariables(state.blocks);
  names.forEach(function(n){if(!(n in state.variables))state.variables[n]='';});
  varsEl.innerHTML=names.length?names.map(function(n){
    return '<label><span>{{'+esc(n)+'}}</span><input type="text" data-prompt-var="'+esc(n)+'" value="'+esc(state.variables[n]||'')+'" placeholder="Value for '+esc(n)+'"></label>';
  }).join(''):'<p class="liquid-prompt-empty">No variables in the current blocks.</p>';
}
function renderPreview(){
  var prompt=buildPrompt(state);
  previewEl.value=prompt;
  var words=prompt.trim()?prompt.trim().split(/\s+/).length:0;
  var tokens=Math.ceil(prompt.length/4);
  metricsEl.textContent=words+' words · ~'+tokens+' tokens';
}
function renderAll(){renderTemplates();renderBlocks();renderVariables();renderPreview();}
function openStudio(){
  shell.hidden=false;
  trigger.setAttribute('aria-expanded','true');
  renderAll();
  window.setTimeout(function(){var first=blocksEl.querySelector('textarea');if(first)first.focus();},0);
}
function closeStudio(){
  shell.hidden=true;
  trigger.setAttribute('aria-expanded','false');
  editor.focus();
}
function applyTemplate(key){
  if(!templates[key])return;
  state.template=key;
  state.blocks=cloneBlocks(templates[key].blocks);
  state.variables={};
  renderAll();
}
function moveBlock(id,delta){
  var i=state.blocks.findIndex(function(b){return b.id===id;});
  var j=i+delta;
  if(i<0||j<0||j>=state.blocks.length)return;
  var item=state.blocks.splice(i,1)[0];
  state.blocks.splice(j,0,item);
  state.template='custom';
  renderAll();
}
function saveDraft(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,template:state.template,blocks:state.blocks,variables:state.variables,savedAt:new Date().toISOString()}));
    notify('Skill draft saved','saved');
  }catch(_){notify('Prompt draft not saved','offline');}
}
function restoreDraft(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(!raw){
      raw=localStorage.getItem(LEGACY_STORAGE_KEY);
      if(raw){
        try{localStorage.setItem(STORAGE_KEY,raw);}catch(_){}
      }
    }
    if(!raw)return;
    var parsed=JSON.parse(raw);
    if(parsed&&Array.isArray(parsed.blocks)&&parsed.blocks.length){
      state.template=parsed.template||'custom';
      state.blocks=parsed.blocks.map(function(b){return {id:b.id||uid(),role:roles.indexOf(b.role)>=0?b.role:'user',content:String(b.content||'')};});
      state.variables=parsed.variables&&typeof parsed.variables==='object'?parsed.variables:{};
    }
  }catch(_){}
}

trigger.addEventListener('click',function(){if(shell.hidden)openStudio();else closeStudio();});
document.getElementById('d5PromptClose').addEventListener('click',closeStudio);
templatesEl.addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-prompt-template]');
  if(b)applyTemplate(b.getAttribute('data-prompt-template'));
});
blocksEl.addEventListener('input',function(e){
  var target=e.target;
  var contentId=target.getAttribute&&target.getAttribute('data-prompt-content');
  var roleId=target.getAttribute&&target.getAttribute('data-prompt-role');
  if(contentId){
    var block=state.blocks.find(function(b){return b.id===contentId;});
    if(block)block.content=target.value;
  }
  if(roleId){
    var roleBlock=state.blocks.find(function(b){return b.id===roleId;});
    if(roleBlock&&roles.indexOf(target.value)>=0)roleBlock.role=target.value;
  }
  state.template='custom';
  renderVariables();
  renderPreview();
  renderTemplates();
});
blocksEl.addEventListener('click',function(e){
  var t=e.target;
  var up=t.getAttribute&&t.getAttribute('data-prompt-up');
  var down=t.getAttribute&&t.getAttribute('data-prompt-down');
  var del=t.getAttribute&&t.getAttribute('data-prompt-delete');
  if(up)moveBlock(up,-1);
  if(down)moveBlock(down,1);
  if(del){state.blocks=state.blocks.filter(function(b){return b.id!==del;});state.template='custom';renderAll();}
});
varsEl.addEventListener('input',function(e){
  var n=e.target.getAttribute&&e.target.getAttribute('data-prompt-var');
  if(n){state.variables[n]=e.target.value;renderPreview();}
});
document.getElementById('d5PromptAddBlock').addEventListener('click',function(){
  state.blocks.push({id:uid(),role:'user',content:''});state.template='custom';renderAll();
});
document.getElementById('d5PromptAddLibrary').addEventListener('click',function(){
  var a=areas.find(function(x){return x.id===areaEl.value;});
  var t=techniques.find(function(x){return x.id===techniqueEl.value;});
  if(!a||!t)return;
  state.blocks.push({id:uid(),role:t.role,content:t.build(a)});state.template='custom';renderAll();
});
document.getElementById('d5PromptUseSelection').addEventListener('click',function(){
  var value=selectedText().trim();
  if(!value){notify('Select text first','offline');return;}
  var block=state.blocks.find(function(b){return b.role==='user';});
  if(!block){block={id:uid(),role:'user',content:''};state.blocks.push(block);}
  block.content=block.content.trim()?block.content+'\n\n'+value:value;
  state.template='custom';renderAll();notify('Selection added to Skill Studio','saved');
});
document.getElementById('d5PromptSave').addEventListener('click',saveDraft);
document.getElementById('d5PromptCopy').addEventListener('click',async function(){
  var prompt=buildPrompt(state);
  try{await navigator.clipboard.writeText(prompt);notify('Prompt copied','saved');}
  catch(_){previewEl.select();document.execCommand('copy');notify('Prompt copied','saved');}
});
document.getElementById('d5PromptInsert').addEventListener('click',function(){
  if(!state.blocks.length){notify('Skill Studio is empty','offline');return;}
  insertAtSelection(buildPrompt(state));
  closeStudio();
});
document.addEventListener('keydown',function(e){
  var mod=e.ctrlKey||e.metaKey;
  if(mod&&e.shiftKey&&String(e.key||'').toLowerCase()==='p'){
    e.preventDefault();
    if(shell.hidden)openStudio();else closeStudio();
  }else if(e.key==='Escape'&&!shell.hidden){
    e.preventDefault();closeStudio();
  }
});

restoreDraft();
renderAll();
})();