(function(){
'use strict';

var ep='/api/mldsa-access';
var ch=document.getElementById('d5Challenge');
var sig=document.getElementById('d5Signature');
var btn=document.getElementById('d5Verify');
var verifyText=document.getElementById('d5VerifyText');
var renew=document.getElementById('d5NewChallenge');
var status=document.getElementById('d5Status');
var fp=document.getElementById('d5Fingerprint');
var description=document.getElementById('d5Description');
var stepOne=document.getElementById('d5StepOne');
var stepTwo=document.getElementById('d5StepTwo');
var deck=document.getElementById('d5ToolDeck');
var pill=ch&&ch.parentElement;
var exp=0;
var timer=null;
var phase=1;

function st(message,type){
  if(!status)return;
  status.textContent=message||'';
  status.dataset.type=type||'';
}
async function readJson(response){
  var type=(response.headers.get('content-type')||'').toLowerCase();
  var text=await response.text();
  if(!type.includes('application/json')){
    if(response.status===404)throw new Error('El endpoint ML-DSA-87 todavía no está disponible en este deployment.');
    throw new Error('Respuesta inválida del servidor ('+response.status+').');
  }
  try{return JSON.parse(text)}catch(_){throw new Error('El servidor devolvió JSON inválido.')}
}
function setPhase(nextPhase){
  phase=nextPhase===2?2:1;
  if(stepOne)stepOne.classList.toggle('complete',phase===2);
  if(stepTwo){
    stepTwo.classList.toggle('active',phase===2);
    stepTwo.classList.remove('complete');
  }
  if(description){
    description.textContent=phase===1
      ?'Paso 1 de 2 · Prueba inicial de posesión ML-DSA-87.'
      :'Paso 2 de 2 · Confirmación encadenada y anti-replay.';
  }
  if(verifyText)verifyText.textContent=phase===1?'VALIDAR PASO 1':'CONFIRMAR ACCESO';
  sig.placeholder=phase===1
    ?'Pega aquí la firma del reto actual'
    :'Firma el segundo reto y pega aquí la nueva firma';
}
function applyChallenge(data){
  setPhase(Number(data.phase||1));
  ch.textContent=data.challenge||'';
  exp=Number(data.expires_at||0);
  sig.value='';
  btn.disabled=false;
  if(pill)pill.classList.remove('active');
  clearInterval(timer);
  timer=setInterval(countdown,1000);
  countdown();
}
function countdown(){
  if(!exp)return;
  var seconds=Math.max(0,Math.ceil(exp-Date.now()/1000));
  renew.textContent=seconds>0?'NUEVO RETO · '+seconds+'S':'NUEVO RETO';
  if(seconds<=0){
    clearInterval(timer);
    resetProtocol('El reto caducó. Se generará un flujo nuevo.');
  }
}
async function load(){
  btn.disabled=true;
  setPhase(1);
  if(pill)pill.classList.add('active');
  ch.textContent='Generando reto…';
  st('Preparando protocolo de doble firma…','info');
  try{
    var response=await fetch(ep,{
      credentials:'same-origin',
      cache:'no-store',
      headers:{Accept:'application/json'}
    });
    var data=await readJson(response);
    if(!response.ok||!data.ok)throw new Error(data.error||'No se pudo generar el reto');
    if(data.authorized){location.replace('/');return;}
    if(fp)fp.textContent=(data.public_key_fingerprint||'').slice(0,16)+'…';
    applyChallenge(data);
    st('Firma el reto del Paso 1 con tu clave privada ML-DSA-87.','');
  }catch(error){
    ch.textContent='No disponible';
    if(pill)pill.classList.remove('active');
    st(error&&error.message?error.message:'Error generando reto','error');
  }
}
async function resetProtocol(message){
  sig.value='';
  exp=0;
  if(message)st(message,'info');
  await load();
}

renew.addEventListener('click',function(){
  resetProtocol('Generando un protocolo nuevo desde el Paso 1…');
});
sig.addEventListener('focus',function(){
  if(pill)pill.classList.remove('active');
});

function setDeckExpanded(expanded){
  if(!deck)return;
  deck.classList.toggle('expanded',!!expanded);
  deck.setAttribute('aria-expanded',expanded?'true':'false');
}
if(deck){
  deck.addEventListener('click',function(){
    setDeckExpanded(!deck.classList.contains('expanded'));
  });
  deck.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      setDeckExpanded(!deck.classList.contains('expanded'));
    }
  });
}

var faqCard=document.getElementById('d5FaqCard');
var faqAccordion=document.getElementById('d5FaqAccordion');
var faqFooter=document.getElementById('d5FaqFooter');
var faqTabs=faqCard?Array.from(faqCard.querySelectorAll('[data-faq-tab]')):[];
var faqActiveTab=0;
var faqOpenIndex=0;
var FAQ_TABS=[
  {
    label:'General',
    faqs:[
      {
        question:'¿Qué obtengo al entrar a Hashcod Codespace?',
        answer:'Al entrar a Hashcod Codespace obtienes acceso a un entorno digital diseñado para trabajar, organizar y desarrollar tu proyecto desde un mismo espacio. Podrás utilizar las herramientas disponibles de la plataforma, gestionar información relacionada con tu creación, guardar tu progreso y acceder a las funciones habilitadas para tu cuenta. La plataforma está pensada para acompañar el proceso desde la preparación de tu proyecto hasta los servicios de análisis, validación y certificación disponibles dentro del ecosistema Hashcod.'
      },
      {
        question:'¿Qué puedo hacer dentro de Hashcod Codespace?',
        answer:'Dentro de Hashcod Codespace puedes utilizar diferentes herramientas para crear, organizar, desarrollar y gestionar tu proyecto digital desde un solo entorno. La plataforma integra espacios de trabajo, herramientas técnicas, gestión de archivos, almacenamiento de información y funciones destinadas al análisis y validación de proyectos. Dependiendo de las funciones habilitadas en tu cuenta, también podrás registrar información de tu plataforma, conservar tu progreso y acceder a los diferentes recursos que forman parte del ecosistema Hashcod Codespace.'
      },
      {
        question:'¿Cómo funciona el proceso de validación de mi proyecto?',
        answer:'Cuando envías la información de tu proyecto a través de Hashcod Codespace, se genera un registro asociado a tu solicitud. Posteriormente, el proyecto puede pasar por un proceso de revisión y análisis según el servicio seleccionado. Durante esta evaluación se pueden comprobar aspectos técnicos, estructurales y funcionales del proyecto. Una vez completada la revisión y cumplidos los requisitos correspondientes, se podrá continuar con el proceso de validación o certificación disponible dentro del ecosistema Hashcod.'
      }
    ]
  },
  {
    label:'Building',
    faqs:[
      {
        question:'¿Por qué mi Toolbook está vacía cuando entro por primera vez?',
        answer:'Cuando accedes por primera vez a Hashcod Codespace, tu Toolbook estará vacía por defecto. Esto es completamente normal, ya que las herramientas y módulos de tu proyecto no se generan automáticamente. Para comenzar a llenarla, primero debes realizar una petición de desarrollo a Hashcod Codespace, explicando qué necesitas para tu plataforma, sistema o proyecto. Nuestro proceso parte de esa solicitud. A partir de ella se analizan tus necesidades, se determina qué herramientas, funciones o módulos deben desarrollarse y se organiza el trabajo correspondiente. A medida que Hashcod Codespace desarrolla e incorpora las soluciones solicitadas para tu proyecto, estas podrán aparecer dentro de tu Toolbook según las funciones habilitadas para tu cuenta. Esto permite que cada Toolbook sea diferente y se adapte al proyecto de cada usuario, en lugar de mostrar herramientas genéricas que posiblemente no necesite.'
      },
      {
        question:'¿Cómo solicito que Hashcod Codespace desarrolle una herramienta o función para mi proyecto?',
        answer:'Para solicitar una nueva herramienta, función o módulo, debes enviar una petición de desarrollo a Hashcod Codespace explicando qué deseas incorporar a tu proyecto y cuál es el objetivo de esa función. La petición será revisada para determinar los requerimientos técnicos, el alcance del desarrollo y los recursos necesarios para llevarla a cabo. Si se necesita información adicional, Hashcod Codespace podrá solicitar detalles sobre el funcionamiento esperado, diseño, integraciones, tecnologías o características específicas del proyecto. Una vez definida la solicitud, se podrá establecer el proceso de desarrollo correspondiente. Cuando la herramienta o función esté preparada y habilitada para tu cuenta, podrá integrarse dentro de tu entorno y aparecer en tu Toolbook. Cada petición se trabaja de acuerdo con las necesidades particulares del proyecto, por lo que las herramientas disponibles pueden variar entre diferentes usuarios de Hashcod Codespace.'
      },
      {
        question:'¿Qué tipo de herramientas o funciones puedo solicitar que se desarrollen?',
        answer:'En Hashcod Codespace puedes solicitar el desarrollo de herramientas, funciones o módulos adaptados a las necesidades de tu proyecto. Esto puede incluir interfaces, sistemas de gestión, automatizaciones, formularios, almacenamiento de información, paneles de control, herramientas técnicas, integraciones entre servicios y otras funciones relacionadas con el funcionamiento de tu plataforma. Cada solicitud se evalúa de forma individual para determinar si puede desarrollarse dentro del ecosistema de Hashcod Codespace, qué recursos requiere y cómo debe integrarse con el resto de tu proyecto. No todas las Toolbooks serán iguales. Las herramientas que aparezcan en tu espacio dependerán de las funciones que hayas solicitado y de los desarrollos que hayan sido habilitados específicamente para tu cuenta.'
      }
    ]
  },
  {
    label:'Goals',
    faqs:[
      {
        question:'¿Para qué sirven los Goals dentro de Hashcod Codespace?',
        answer:'Los Goals representan los objetivos que deseas alcanzar con tu proyecto dentro de Hashcod Codespace. Al definir tus objetivos, nos ayudas a comprender qué quieres construir, mejorar o solucionar en tu plataforma. Estos objetivos sirven como referencia para determinar qué herramientas, módulos y funciones pueden ser necesarias durante el desarrollo. Por ejemplo, un Goal puede ser automatizar un proceso, crear un nuevo sistema, mejorar una función existente, integrar una tecnología, organizar información o desarrollar una herramienta específica para tu proyecto. Los Goals permiten que el desarrollo tenga una dirección clara y que las soluciones incorporadas a tu Toolbook estén relacionadas directamente con las necesidades reales de tu proyecto.'
      },
      {
        question:'¿Cómo creo un Goal para mi proyecto?',
        answer:'Para crear un Goal, debes definir de forma clara qué deseas conseguir con tu proyecto. No es necesario explicar todos los detalles técnicos desde el principio; lo más importante es indicar cuál es el resultado que quieres alcanzar. Por ejemplo, puedes establecer como Goal crear una nueva función, automatizar un proceso, mejorar una parte de tu plataforma, conectar un servicio externo, organizar determinada información o desarrollar una herramienta específica. Mientras más claro sea el objetivo, más fácil será analizar qué recursos, módulos o herramientas pueden ser necesarios para desarrollarlo. Una vez definido el Goal, este puede servir como referencia para organizar las solicitudes de desarrollo y orientar las funciones que posteriormente podrán incorporarse a tu Toolbook.'
      },
      {
        question:'¿Puedo tener varios Goals al mismo tiempo?',
        answer:'Sí. Dentro de Hashcod Codespace puedes trabajar con varios Goals al mismo tiempo siempre que cada uno represente un objetivo claro dentro de tu proyecto. Por ejemplo, puedes tener un Goal enfocado en desarrollar una nueva herramienta, otro destinado a mejorar la interfaz de tu plataforma y otro relacionado con automatizar un proceso o integrar un servicio externo. Mantener los Goals separados ayuda a organizar mejor el desarrollo, identificar qué funciones pertenecen a cada objetivo y dar seguimiento al progreso de cada parte del proyecto. A medida que avances, cada Goal puede requerir distintas herramientas, módulos o soluciones, las cuales podrán incorporarse a tu Toolbook según el desarrollo realizado para tu cuenta.'
      }
    ]
  }
];

function faqChevronSvg(){
  return '<svg class="faq-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
}
function renderFaqAccordion(){
  if(!faqAccordion)return;
  var current=FAQ_TABS[faqActiveTab]||FAQ_TABS[0];
  faqAccordion.innerHTML=current.faqs.map(function(faq,index){
    var open=index===faqOpenIndex;
    return '<div class="faq-item'+(open?' open':'')+'" data-faq-index="'+index+'">'
      +'<button class="faq-question" type="button" aria-expanded="'+(open?'true':'false')+'">'
      +'<span class="faq-question-text">'+faq.question+'</span>'+faqChevronSvg()+'</button>'
      +'<div class="faq-answer-wrap"><div class="faq-answer-inner"><p class="faq-answer">'+faq.answer+'</p></div></div>'
      +'</div>';
  }).join('');
}
function setFaqTab(index){
  var next=Math.max(0,Math.min(FAQ_TABS.length-1,Number(index)||0));
  faqActiveTab=next;
  faqOpenIndex=0;
  faqTabs.forEach(function(tab,i){
    var active=i===next;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-selected',active?'true':'false');
    var pill=tab.querySelector('.faq-tab-pill');
    if(active&&!pill){
      pill=document.createElement('span');
      pill.className='faq-tab-pill';
      tab.insertBefore(pill,tab.firstChild);
    }else if(!active&&pill){
      pill.remove();
    }
  });
  if(!faqAccordion)return;
  faqAccordion.classList.add('switching');
  window.setTimeout(function(){
    renderFaqAccordion();
    requestAnimationFrame(function(){
      faqAccordion.classList.remove('switching');
    });
  },90);
}
if(faqCard){
  faqTabs.forEach(function(tab,index){
    tab.addEventListener('click',function(){setFaqTab(index);});
  });
  faqAccordion.addEventListener('click',function(event){
    var item=event.target.closest('.faq-item');
    var button=event.target.closest('.faq-question');
    if(!item||!button)return;
    var index=Number(item.getAttribute('data-faq-index'));
    faqOpenIndex=faqOpenIndex===index?-1:index;
    Array.from(faqAccordion.querySelectorAll('.faq-item')).forEach(function(row,rowIndex){
      var open=rowIndex===faqOpenIndex;
      row.classList.toggle('open',open);
      var q=row.querySelector('.faq-question');
      if(q)q.setAttribute('aria-expanded',open?'true':'false');
    });
  });
  if(faqFooter){
    faqFooter.addEventListener('click',function(){
      var message='Hola, deseo comenzar mi solicitud en Hashcod Codespace.';
      var whatsappUrl='https://wa.me/18294721257?text='+encodeURIComponent(message);
      window.dispatchEvent(new CustomEvent('hashcod:faq-start-request',{
        detail:{channel:'whatsapp',phone:'+18294721257'}
      }));
      window.open(whatsappUrl,'_blank','noopener,noreferrer');
    });
  }
  renderFaqAccordion();
}

var numberTickerRoot=document.getElementById('d5NumberTicker');
var tickerDecrease=document.getElementById('d5TickerDecrease');
var tickerRandomize=document.getElementById('d5TickerRandomize');
var tickerIncrease=document.getElementById('d5TickerIncrease');
var NUMBER_TICKER_STEP=1250;
var NUMBER_TICKER_STORAGE_KEY='hashcod:number-ticker:value:v1';
function loadStoredNumberTickerValue(){
  try{
    var stored=window.localStorage.getItem(NUMBER_TICKER_STORAGE_KEY);
    if(stored===null||stored==='')return 48250;
    var parsed=Number(stored);
    return Number.isFinite(parsed)&&parsed>=0?Math.round(parsed):48250;
  }catch(_){
    return 48250;
  }
}
function persistNumberTickerValue(value){
  try{
    window.localStorage.setItem(NUMBER_TICKER_STORAGE_KEY,String(Math.max(0,Math.round(value))));
  }catch(_){}
}
var numberTickerValue=loadStoredNumberTickerValue();
var numberTickerEntered=false;
var numberTickerArmed=false;
var numberTickerEntranceTimer=0;

function numberTickerFormat(value){
  try{return Math.round(value).toLocaleString();}
  catch(_){return String(Math.round(value));}
}
function numberTickerGlyphs(value){
  var text=numberTickerFormat(value);
  var chars=text.split('');
  return chars.map(function(char,index){
    return {char:char,id:'g-'+(chars.length-1-index)};
  });
}
function createNumberTickerDigit(id){
  var digit=document.createElement('span');
  digit.className='number-ticker-digit';
  digit.setAttribute('data-ticker-id',id);
  digit.setAttribute('data-ticker-type','digit');
  var column=document.createElement('span');
  column.className='number-ticker-column';
  for(var n=0;n<10;n++){
    var glyph=document.createElement('span');
    glyph.className='number-ticker-glyph';
    glyph.textContent=String(n);
    column.appendChild(glyph);
  }
  digit.appendChild(column);
  return digit;
}
function createNumberTickerSeparator(id,char){
  var separator=document.createElement('span');
  separator.className='number-ticker-separator';
  separator.setAttribute('data-ticker-id',id);
  separator.setAttribute('data-ticker-type','separator');
  separator.textContent=char;
  return separator;
}
function triggerTickerBlur(column,delay){
  if(!column||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  column.classList.remove('blur-roll');
  void column.offsetWidth;
  if(delay>0){
    window.setTimeout(function(){column.classList.add('blur-roll');},Math.round(delay*1000));
  }else{
    column.classList.add('blur-roll');
  }
}
function renderNumberTicker(value,entrance){
  if(!numberTickerRoot)return;
  var glyphs=numberTickerGlyphs(value);
  var existing={};
  Array.from(numberTickerRoot.querySelectorAll('[data-ticker-id]')).forEach(function(node){
    existing[node.getAttribute('data-ticker-id')]=node;
  });

  var visual=numberTickerRoot.querySelector('.number-ticker-visual');
  if(!visual){
    visual=document.createElement('span');
    visual.className='number-ticker-visual';
    numberTickerRoot.appendChild(visual);
  }

  var prefix=visual.querySelector('.number-ticker-prefix');
  if(!prefix){
    prefix=document.createElement('span');
    prefix.className='number-ticker-prefix';
    prefix.textContent='$';
    visual.appendChild(prefix);
  }

  var ordered=[prefix];
  var digitIndex=0;
  glyphs.forEach(function(glyph){
    var isDigit=/\d/.test(glyph.char);
    var node=existing[glyph.id];
    var correct=node&&node.getAttribute('data-ticker-type')===(isDigit?'digit':'separator');
    if(!correct){
      node=isDigit?createNumberTickerDigit(glyph.id):createNumberTickerSeparator(glyph.id,glyph.char);
    }
    if(isDigit){
      var column=node.querySelector('.number-ticker-column');
      var target=Number(glyph.char);
      var delay=entrance?digitIndex*.04:0;
      column.style.transitionDelay=delay+'s';
      requestAnimationFrame(function(){
        column.style.transform='translateY(-'+(target*1.1)+'em)';
        triggerTickerBlur(column,delay);
      });
      digitIndex++;
    }else{
      node.textContent=glyph.char;
    }
    ordered.push(node);
  });

  ordered.forEach(function(node){visual.appendChild(node);});
  Array.from(visual.children).forEach(function(node){
    if(ordered.indexOf(node)===-1)node.remove();
  });
  numberTickerRoot.setAttribute('aria-label','$'+numberTickerFormat(value));
}
function armNumberTicker(){
  if(numberTickerArmed)return;
  numberTickerArmed=true;
  renderNumberTicker(numberTickerValue,true);
  window.clearTimeout(numberTickerEntranceTimer);
  numberTickerEntranceTimer=window.setTimeout(function(){
    numberTickerEntered=true;
  },Math.round((.9+numberTickerGlyphs(numberTickerValue).length*.04)*1000));
}
function setNumberTickerValue(nextValue){
  numberTickerValue=Math.max(0,Math.round(nextValue));
  persistNumberTickerValue(numberTickerValue);
  renderNumberTicker(numberTickerValue,!numberTickerEntered);
}
if(numberTickerRoot){
  var initialGlyphs=numberTickerGlyphs(numberTickerValue);
  var initialVisual=document.createElement('span');
  initialVisual.className='number-ticker-visual';
  var initialPrefix=document.createElement('span');
  initialPrefix.className='number-ticker-prefix';
  initialPrefix.textContent='$';
  initialVisual.appendChild(initialPrefix);
  numberTickerRoot.appendChild(initialVisual);
  initialGlyphs.forEach(function(glyph){
    initialVisual.appendChild(/\d/.test(glyph.char)?createNumberTickerDigit(glyph.id):createNumberTickerSeparator(glyph.id,glyph.char));
  });
  numberTickerRoot.setAttribute('aria-label','$'+numberTickerFormat(numberTickerValue));

  if('IntersectionObserver' in window){
    var tickerObserver=new IntersectionObserver(function(entries){
      if(entries.some(function(entry){return entry.isIntersecting&&entry.intersectionRatio>=.6;})){
        tickerObserver.disconnect();
        armNumberTicker();
      }
    },{threshold:[.6]});
    tickerObserver.observe(numberTickerRoot);
  }else{
    armNumberTicker();
  }
}
if(tickerDecrease){
  tickerDecrease.addEventListener('click',function(){
    setNumberTickerValue(Math.max(0,numberTickerValue-NUMBER_TICKER_STEP));
  });
}
if(tickerRandomize){
  tickerRandomize.addEventListener('click',function(){
    setNumberTickerValue(Math.round(10000+Math.random()*990000));
  });
}
if(tickerIncrease){
  tickerIncrease.addEventListener('click',function(){
    setNumberTickerValue(numberTickerValue+NUMBER_TICKER_STEP);
  });
}

var navListDemo=document.getElementById('d5NavListDemo');
var documentsModal=document.getElementById('d5DocumentsModal');
var documentSheet=document.getElementById('d5DocumentSheet');
var documentNavItems=documentsModal?Array.from(documentsModal.querySelectorAll('[data-doc-id]')):[];

var OFFICIAL_DOCUMENTS={
  onapi:{
    seal:'ONAPI',
    title:'Certificado de Registro de Marca Mixta',
    issuer:'Oficina Nacional de la Propiedad Industrial (ONAPI)',
    status:'REGISTRO VIGENTE',
    fields:[
      ['Signo','HASHCOD'],
      ['Núm. de registro','336973'],
      ['Núm. de solicitud','2026-35462'],
      ['Fecha de concesión','18/08/2026'],
      ['Fecha de vencimiento','18/08/2036'],
      ['Clase internacional','42'],
      ['Colores reivindicados','Negro, blanco']
    ],
    description:'El certificado comprende desarrollo de software, SaaS, diseño, mantenimiento y actualización de software, seguridad informática, criptografía aplicada a software, protección de datos digitales, autenticación y verificación de códigos digitales, almacenamiento seguro de información digital, gestión de códigos, licencias, accesos y credenciales e inteligencia artificial.',
    hash:'696254deb3f1783f788d475c8b13b615ceb32440ce2b921ca946a030292464db',
    source:'onapiedoc_639239904000000000 (1).pdf'
  },
  mercantil:{
    seal:'RM',
    title:'Certificado de Registro Mercantil · Persona Física',
    issuer:'Cámara de Comercio y Producción de La Vega',
    status:'REGISTRO VIGENTE',
    fields:[
      ['Registro Mercantil','3323LV-PF'],
      ['Establecimiento','DIKTATCART'],
      ['Persona física RNC','402-0936929-3'],
      ['Fecha de emisión','16/06/2026'],
      ['Fecha de vencimiento','16/06/2028'],
      ['Actividad del establecimiento','Servicio'],
      ['Capital general','RD$10,000.00']
    ],
    description:'El certificado registra a DIKTATCART y describe su actividad como diseño y desarrollo de software, soluciones digitales, inteligencia artificial, automatización y herramientas criptográficas para usuarios y desarrolladores.',
    hash:'ec1077ab5fd6d81685f0976ab3451ef7f4fa5be230e8ffe94761365708ab3e31',
    source:'CERTIFICADOREGISTROMERCANTIL(1).pdf'
  },
  rnc:{
    seal:'DGII',
    title:'Certificación de Registro Nacional de Contribuyentes',
    issuer:'Dirección General de Impuestos Internos (DGII)',
    status:'ACTIVO',
    fields:[
      ['RNC','402-0936929-3'],
      ['Condición','Contribuyente'],
      ['Estado','Activo'],
      ['Actividad económica','Diseño y desarrollo de software'],
      ['Régimen de pago','Ordinario'],
      ['Fecha de certificación','12/07/2026']
    ],
    description:'La certificación de la DGII acredita la inscripción del contribuyente con estado activo y actividad económica declarada de diseño y desarrollo de software.',
    hash:'72cd3363c15d503adcee3bf97158a0ff437b7228a532e9222256cbca515c3fbd',
    source:'Inscripcion RNC(1).pdf'
  }
};

function escapeDoc(value){
  return String(value==null?'':value)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}
function renderOfficialDocument(id){
  if(!documentSheet)return;
  var doc=OFFICIAL_DOCUMENTS[id]||OFFICIAL_DOCUMENTS.onapi;
  documentNavItems.forEach(function(item){
    item.classList.toggle('active',item.getAttribute('data-doc-id')===id);
  });
  var rows=doc.fields.map(function(field){
    return '<div class="document-field"><dt>'+escapeDoc(field[0])+'</dt><dd>'+escapeDoc(field[1])+'</dd></div>';
  }).join('');
  documentSheet.innerHTML=
    '<section class="official-document">'
      +'<header class="official-document-head">'
        +'<div class="official-document-seal">'+escapeDoc(doc.seal)+'</div>'
        +'<h3>'+escapeDoc(doc.title)+'</h3>'
        +'<p>'+escapeDoc(doc.issuer)+'</p>'
        +'<span class="document-status">'+escapeDoc(doc.status)+'</span>'
      +'</header>'
      +'<dl class="document-fields">'+rows+'</dl>'
      +'<p class="document-description">'+escapeDoc(doc.description)+'</p>'
      +'<div class="document-hash"><strong>SHA-256 · evidencia</strong><br>'+escapeDoc(doc.hash)+'</div>'
      +'<p class="document-note">Fuente aportada: '+escapeDoc(doc.source)+'. Vista informativa construida a partir del documento original y su manifiesto de evidencia.</p>'
    +'</section>';
}
function openDocumentsModal(){
  if(!documentsModal)return;
  renderOfficialDocument('onapi');
  documentsModal.hidden=false;
  documentsModal.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow='hidden';
  var close=documentsModal.querySelector('.documents-close');
  if(close)window.setTimeout(function(){close.focus();},0);
}
function closeDocumentsModal(){
  if(!documentsModal)return;
  documentsModal.hidden=true;
  documentsModal.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
}
if(documentsModal){
  documentsModal.addEventListener('click',function(event){
    var close=event.target.closest('[data-doc-action="close"]');
    if(close){closeDocumentsModal();return;}
    var nav=event.target.closest('[data-doc-id]');
    if(nav)renderOfficialDocument(nav.getAttribute('data-doc-id'));
  });
}
document.addEventListener('keydown',function(event){
  if(event.key==='Escape'&&documentsModal&&!documentsModal.hidden)closeDocumentsModal();
});

if(navListDemo){
  navListDemo.addEventListener('click',function(event){
    var row=event.target.closest('[data-nav-list-item]');
    if(!row)return;
    var label=row.getAttribute('data-nav-list-item')||'';
    if(label==='Documents'){
      openDocumentsModal();
      return;
    }
    window.dispatchEvent(new CustomEvent('hashcod:nav-list-action',{
      detail:{label:label}
    }));
  });
}

btn.addEventListener('click',async function(){
  var value=sig.value.trim();
  if(!value){
    st('Pega primero la firma Base64 del reto actual.','error');
    sig.focus();
    return;
  }

  btn.disabled=true;
  st(phase===1?'Verificando primera firma…':'Verificando confirmación final…','info');

  try{
    var response=await fetch(ep,{
      method:'POST',
      credentials:'same-origin',
      headers:{
        'Content-Type':'application/json',
        Accept:'application/json'
      },
      body:JSON.stringify({
        signature:value,
        phase:phase
      })
    });
    var data=await readJson(response);

    if(!response.ok||!data.ok){
      if(['challenge_expired','phase_mismatch','replay_detected'].includes(data.code)){
        await resetProtocol(data.error||'El protocolo debe reiniciarse.');
        return;
      }
      throw new Error(data.error||'Firma inválida');
    }

    if(Number(data.next_phase||0)===2&&data.challenge){
      applyChallenge(data);
      if(stepOne)stepOne.classList.add('complete');
      st('Paso 1 válido. Firma ahora el segundo reto; la firma anterior ya no sirve.','ok');
      return;
    }

    if(data.authorized){
      if(stepOne)stepOne.classList.add('complete');
      if(stepTwo){
        stepTwo.classList.add('complete');
        stepTwo.classList.remove('active');
      }
      st('Doble firma válida. Acceso concedido.','ok');
      setTimeout(function(){location.replace(data.redirect||'/');},220);
      return;
    }

    throw new Error('Respuesta de validación incompleta.');
  }catch(error){
    st(error&&error.message?error.message:'Firma inválida','error');
    btn.disabled=false;
  }
});

load();
})();