const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const wait = () => new Promise(r => setTimeout(r,20));
async function until(check) { for(let i=0;i<200;i++) { if(check()) return; await wait(); } throw Error('Period UI timeout'); }
async function scenario(origin, offline = false) {
  const dom = new JSDOM('<body><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer><div class="code-access-root"></div></body>',{url:origin,runScripts:'dangerously',pretendToBeVisual:true});
  const w=dom.window; w.scrollTo=()=>{}; w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}}); w.ResizeObserver=class{observe(){} disconnect(){} unobserve(){}};
  let now=0, tick, server={ok:true,state:'choose',serverNow:1000}, calls=[];
  Object.defineProperty(w.performance,'now',{value:()=>now});
  const nativeInterval=w.setInterval.bind(w);
  w.setInterval=(f,ms,...args)=>{if(ms===1000)tick=f;return nativeInterval(f,ms,...args)};
  if(offline)Object.assign(w.document.body.dataset,{hashcodPeriodDays:'20',hashcodPeriodExpiresAt:'1002',hashcodPeriodNow:'1000'});
  w.fetch=async(url,options={})=>{
    if(url!='/api/platform-period') return new Response('{"ok":true,"files":[]}');
    if(offline)throw Error('Offline');
    const body=options.body&&JSON.parse(options.body); calls.push(body);
    if(body){
      if(server.state==='expired'&&body.code!=='fixture-renewal-key')return new Response('{"ok":false,"error":"Clave de renovación incorrecta."}',{status:403});
      if(body.days===10&&server.state==='choose')return new Response('{"ok":false,"error":"No se pudo guardar el plazo."}',{status:503});
      server={ok:true,state:'active',days:body.days,expiresAt:1002,serverNow:1000};
    }
    return new Response(JSON.stringify(server));
  };
  w.eval(fs.readFileSync(path.resolve(__dirname,'../../components/center-empty-state.bundle.js'),'utf8'));
  try {
    await until(()=>w.document.querySelector('#d5RecommendationCard'));
    const card=w.document.querySelector('#d5RecommendationCard');
    if(!offline){
      await until(()=>!card.querySelector('[data-recommendation-accept]').disabled);
      card.querySelector('[data-recommendation-accept]').click();
      await until(()=>card.querySelector('[role="alert"]'));
      assert.equal(card.dataset.accepted,'false','Failed save cannot start period');
      card.querySelector('.hrc-button--secondary').click(); await wait();
      card.querySelector('[data-option="20"]').click(); await wait();
      card.querySelector('[data-recommendation-accept]').click();
    }
    await until(()=>card.dataset.selected==='20'&&card.dataset.accepted==='true'&&tick);
    now=3000; if(!offline)server={...server,state:'expired'};tick();
    await until(()=>w.document.querySelector('#hpa-code'));
    assert.equal(w.document.activeElement.id,'hpa-code');
    assert.equal(w.document.querySelector('main').inert,true);
    assert.equal(w.document.querySelector('#hpa-code').type,'password');
    if(!offline){
      const field=w.document.querySelector('#hpa-code');
      const enter=async code=>{Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(field,code);field.dispatchEvent(new w.Event('input',{bubbles:true}));await wait();w.document.querySelector('#hpaGatePortal form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
      await enter('wrong'); await until(()=>w.document.querySelector('#hpaGatePortal [role="alert"]'));
      assert(w.document.querySelector('#hpaGatePortal'),'Wrong key dismissed gate');
      const select=w.document.querySelector('#hpa-days');select.value='30';select.dispatchEvent(new w.Event('change',{bubbles:true}));await wait();
      now=0; await enter('fixture-renewal-key');
      await until(()=>!w.document.querySelector('#hpaGatePortal'));
      assert.equal(card.dataset.selected,'30');assert.equal(w.document.querySelector('main').inert,undefined);
      assert.equal(calls.at(-1).days,30);
    }
    console.log(`Platform period ${origin}: ${offline?'offline deadline restore':'save failure, expiry, wrong key, renewal and focus'} OK`);
  } finally {dom.window.close();}
}
(async()=>{await scenario('https://hashcodcodespace.dev');await scenario('http://127.0.0.1:8000');await scenario('http://127.0.0.1:8000',true)})().catch(e=>{console.error(e);process.exitCode=1});
