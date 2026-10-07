'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
  const server = http.createServer((req,res) => {
    if (req.url === '/native.js') { res.setHeader('Content-Type','text/javascript'); return res.end(fs.readFileSync(path.join(root,'components/csp-native-handlers.js'))); }
    if (req.url === '/bindings.js') { res.setHeader('Content-Type','text/javascript'); return res.end(fs.readFileSync(path.join(root,'components/csp-event-bindings.js'))); }
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'nonce-test'; script-src-attr 'none'; style-src 'nonce-test'; connect-src 'self'; img-src 'self';");
    res.end(`<style nonce="test">#button{color:rgb(1,2,3)}</style><button id="button" data-hc-click="test">Run</button><script nonce="test" src="/bindings.js"></script><script nonce="test">window.calls=[]; window.openPrivacyPolicyModal=()=>{window.privacyOpened=true;}; HashcodCspEvents.register({test:function(event,args){ calls.push({id:this.id,arg:args[0]}); return false; }});</script><script nonce="test" src="/native.js"></script>`);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage();
    await page.route('**/*',route=>new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.locator('#button').click();
    assert.equal(await page.evaluate(()=>calls[0].id),'button');
    assert.equal(await page.locator('#button').evaluate(e=>getComputedStyle(e).color),'rgb(1, 2, 3)');
    await page.evaluate(()=>{const el=document.createElement('button');el.id='privacy';el.textContent='Privacy';el.setAttribute('data-hc-click','h8216b00131d6d46d9977');document.body.append(el);});
    await page.locator('#privacy').click(); assert.equal(await page.evaluate(()=>window.privacyOpened),true,'native migrated callback resolves its original function');
    const attack="');window.injected=true;//";
    await page.evaluate(arg=>{ const el=document.createElement('button');el.id='dynamic';el.textContent='Dynamic';el.setAttribute('data-hc-click','test');el.setAttribute('data-hc-args',encodeURIComponent(JSON.stringify([arg])));el.setAttribute('onclick','window.injected=true');document.body.append(el); },attack);
    await page.locator('#dynamic').click();
    assert.equal(await page.evaluate(()=>calls[1].arg),attack);
    assert.equal(await page.evaluate(()=>window.injected),undefined,'inline injected handler is blocked');
    await page.evaluate(()=>{ document.getElementById('dynamic').setAttribute('data-hc-click','missing'); });
    await page.waitForTimeout(30); await page.locator('#dynamic').click();
    assert.equal(await page.evaluate(()=>calls.length),2,'unregistered handler cannot execute');
    await page.evaluate(()=>{const e=document.createElement('input');e.id='both';for(const type of ['input','change']) {e.setAttribute('data-hc-'+type,'test');e.setAttribute('data-hc-args-'+type,encodeURIComponent(JSON.stringify([type])));}document.body.append(e);});
    await page.waitForTimeout(30); await page.evaluate(()=>{const e=document.getElementById('both');e.dispatchEvent(new Event('input'));e.dispatchEvent(new Event('change'));});
    assert.deepEqual(await page.evaluate(()=>calls.slice(2).map(c=>c.arg)),['input','change']);
    console.log('PASS: real CSP blocks inline injection; static/dynamic listeners preserve values and this');
  } finally { await browser?.close(); await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;});
