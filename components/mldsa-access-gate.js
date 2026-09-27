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
    label:'Billing',
    faqs:[
      {
        question:'What payment methods do you accept?',
        answer:'All major credit and debit cards, plus ACH transfers on annual plans.'
      },
      {
        question:'Can I cancel my subscription anytime?',
        answer:'Yes, cancel from Settings → Billing. You keep access until the end of the current billing period.'
      },
      {
        question:'Do you offer refunds?',
        answer:'We offer a full refund within 14 days of purchase, no questions asked.'
      }
    ]
  },
  {
    label:'Goals',
    faqs:[
      {
        question:'How do savings goals work?',
        answer:'Set a target amount and date — we track progress automatically across your linked accounts.'
      },
      {
        question:'Can I share a goal with a partner?',
        answer:"Yes, invite a partner to any goal and you'll both see live progress and contributions."
      },
      {
        question:'What happens when I reach a goal?',
        answer:'We notify you and suggest next steps, like rolling the balance into a new goal or investing it.'
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
      window.dispatchEvent(new CustomEvent('hashcod:faq-contact-support'));
    });
  }
  renderFaqAccordion();
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