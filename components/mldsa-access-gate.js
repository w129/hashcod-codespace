(function(){
'use strict';
var ep='/api/mldsa-access';
var ch=document.getElementById('d5Challenge');
var sig=document.getElementById('d5Signature');
var btn=document.getElementById('d5Verify');
var renew=document.getElementById('d5NewChallenge');
var status=document.getElementById('d5Status');
var fp=document.getElementById('d5Fingerprint');
var pill=ch&&ch.parentElement;
var exp=0,timer=null;

function st(m,t){if(!status)return;status.textContent=m||'';status.dataset.type=t||''}

async function readJson(response){
  var type=(response.headers.get('content-type')||'').toLowerCase();
  var text=await response.text();
  if(!type.includes('application/json')){
    if(response.status===404) throw new Error('El endpoint ML-DSA-87 todavía no está disponible en este deployment.');
    throw new Error('Respuesta inválida del servidor ('+response.status+').');
  }
  try{return JSON.parse(text)}catch(_){throw new Error('El servidor devolvió JSON inválido.')}
}

function countdown(){
  if(!exp)return;
  var n=Math.max(0,Math.ceil(exp-Date.now()/1000));
  renew.textContent=n>0?'NUEVO RETO · '+n+'S':'NUEVO RETO';
  if(n<=0){clearInterval(timer);load();}
}

async function load(){
  btn.disabled=true;
  if(pill)pill.classList.add('active');
  ch.textContent='Generando reto…';
  st('Preparando reto criptográfico…','info');
  try{
    var r=await fetch(ep,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
    var d=await readJson(r);
    if(!r.ok||!d.ok)throw new Error(d.error||'No se pudo generar el reto');
    if(d.authorized){location.replace('/');return;}
    ch.textContent=d.challenge||'';
    fp.textContent=(d.public_key_fingerprint||'').slice(0,16)+'…';
    exp=Number(d.expires_at||0);
    btn.disabled=false;
    if(pill)pill.classList.remove('active');
    st('Firma este reto exacto con tu clave privada ML-DSA-87.','');
    clearInterval(timer);
    timer=setInterval(countdown,1000);
    countdown();
  }catch(e){
    ch.textContent='No disponible';
    if(pill)pill.classList.remove('active');
    st(e&&e.message?e.message:'Error generando reto','error');
  }
}

renew.addEventListener('click',function(){sig.value='';load();});
sig.addEventListener('focus',function(){if(pill)pill.classList.remove('active');});

btn.addEventListener('click',async function(){
  var value=sig.value.trim();
  if(!value){st('Pega primero la firma Base64.','error');sig.focus();return;}
  btn.disabled=true;
  st('Verificando ML-DSA-87…','info');
  try{
    var r=await fetch(ep,{
      method:'POST',
      credentials:'same-origin',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({signature:value})
    });
    var d=await readJson(r);
    if(!r.ok||!d.ok){
      if(d.code==='challenge_expired'){sig.value='';await load();}
      throw new Error(d.error||'Firma inválida');
    }
    st('Firma válida. Acceso concedido.','ok');
    setTimeout(function(){location.replace(d.redirect||'/');},180);
  }catch(e){
    st(e&&e.message?e.message:'Firma inválida','error');
    btn.disabled=false;
  }
});

load();
})();