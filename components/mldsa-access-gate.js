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