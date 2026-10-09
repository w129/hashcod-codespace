const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
async function run() {
  let period, posts = [];
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/platform-period') {
      if (req.method === 'POST') {
        let raw = ''; for await (const part of req) raw += part;
        const body = JSON.parse(raw); posts.push(body); if (body.entry === 'pro') {
          assert.deepEqual(Object.keys(body).sort(), ['code','entry']);
          if (body.code !== '654321') { res.statusCode=403; res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({ok:false,error:'Código incorrecto, caducado o ya utilizado.'})); return; }
        } else assert.deepEqual(body, { entry: 'free' });
        period = { ok: true, reference:'11111111-1111-4111-8111-111111111111',subscription:body.entry==='pro'?{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+2592000}:{tier:'free'}, state: 'active', days: 10, expiresAt: Math.floor(Date.now()/1000) + 864000, serverNow: Math.floor(Date.now()/1000) };
      }
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(period)); return;
    }
    if (pathname.startsWith('/api/')) { res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true,"files":[]}'); return; }
    if (pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; frame-src 'none'; connect-src 'self'");
      res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/components/center-empty-state.bundle.css"></head><body><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer><script src="/components/center-empty-state.bundle.js"></script></body></html>'); return;
    }
    const file = path.resolve(root, '.' + pathname);
    if (!pathname.startsWith('/components/') || !file.startsWith(root + path.sep) || !fs.existsSync(file) || !['.js', '.css'].includes(path.extname(file))) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : 'text/javascript'); fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const width of [1280, 390, 320]) {
      period = { ok: true, state: 'choose', reference:'11111111-1111-4111-8111-111111111111',subscription:{tier:'free'}, serverNow: Math.floor(Date.now()/1000) }; posts = [];
      const context = await browser.newContext({ viewport: { width, height: 820 }, reducedMotion: 'reduce' });
      await context.route(/^https:\/\/wa\.me\//, route => route.fulfill({ status: 200, contentType: 'text/plain', body: 'WhatsApp link fixture; no message sent.' }));
      const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:' + server.address().port);
      const checkout = page.locator('#hashcodEntryCheckout'); await checkout.waitFor();
      assert(await page.locator('main').evaluate(n => n.inert));
      assert.equal(await page.locator('#hpa-days,#hpa-code').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Volver');
      const pay = checkout.locator('.hco-pay');
      assert.equal(await pay.getAttribute('aria-disabled'), 'true'); assert.equal(await pay.getAttribute('href'), null);
      await page.locator('#hco-cedula').fill('00112345678');
      assert.equal(await page.locator('#hco-cedula').inputValue(), '001-1234567-8');
      const message = async () => new URL(await pay.getAttribute('href')).searchParams.get('text');
      assert.match(await message(), /Plan: Mensual\nPeríodo: 1 mes/); assert.match(await message(), /Total: US\$20.00/);
      assert.equal(new URL(await pay.getAttribute('href')).pathname, '/18294721257');
      await checkout.getByRole('button', { name: 'Anual · −20%' }).click();
      await checkout.getByRole('group', { name: 'Comprobante fiscal' }).getByRole('button', { name: 'Sí', exact: true }).click();
      assert.match(await message(), /Plan: Anual\nPeríodo: 1 año/); assert.match(await message(), /Total: US\$192.00/); assert.match(await message(), /Comprobante fiscal: Sí/);
      const requestsBeforeOtp = posts.length;
      await page.locator('#hco-otp').fill('a12345'); assert.equal(await page.locator('#hco-otp').inputValue(), '12345');
      await page.locator('#hco-otp').fill('123456');
      await checkout.getByRole('button', { name: 'Verificar pago', exact: true }).click();
      await checkout.getByRole('status').filter({ hasText: 'Código incorrecto' }).waitFor();
      assert.equal(posts.length, requestsBeforeOtp+1); assert.deepEqual(posts.at(-1),{entry:'pro',code:'123456'}); assert.equal(period.subscription.tier,'free');
      assert.equal(await checkout.count(), 1);
      await checkout.getByRole('button', { name: 'Otro país', exact: true }).click();
      assert.doesNotMatch(await message(), /Cédula:/); assert.match(await message(), /País de facturación: Otro país/);
      assert.equal(await pay.getAttribute('rel'), 'noopener noreferrer');
      const [popup] = await Promise.all([context.waitForEvent('page'), pay.click()]);
      await popup.waitForURL('https://wa.me/**');
      assert.match(popup.url(), /^https:\/\/wa\.me\/18294721257\?text=/); await popup.close();
      assert.equal(posts.length, 1, 'Opening WhatsApp must not submit payment');
      assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0, 'Checkout must not store cedula or OTP');
      assert(await checkout.evaluate(n => n.scrollWidth <= n.clientWidth), 'Checkout must fit phone width');
      const summary = await checkout.locator('.hco-summary').boundingBox(), form = await checkout.locator('.hco-form').boundingBox();
      if (width >= 1000) assert(form.x >= summary.x + summary.width - 1, 'Desktop must have two columns');
      else assert(form.y >= summary.y + summary.height - 1, 'Phone columns must stack');
      await checkout.locator('.hco-business').scrollIntoViewIfNeeded();
      assert(await checkout.locator('.hco-business').isVisible(), 'Full form including business footer must be reachable');
      if (process.env.HASHCOD_CHECKOUT_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.HASHCOD_CHECKOUT_SCREENSHOT_DIR, { recursive: true });
        await checkout.screenshot({ path: path.join(process.env.HASHCOD_CHECKOUT_SCREENSHOT_DIR, `checkout-${width}.png`) });
      }
      await checkout.getByRole('button', { name: 'Entrar Gratis', exact: true }).click();
      await checkout.waitFor({ state: 'detached' });
      assert.equal(posts.length, 2); assert(!(await page.locator('main').evaluate(n => n.inert)));
      await page.reload(); await page.locator('#d5RecommendationCard[data-accepted="true"]').waitFor();
      await checkout.waitFor({ state: 'detached' });
      await page.getByRole('button', { name: 'Ver planes de Hashcod Pro' }).click(); await checkout.waitFor();
      assert.equal(await page.locator('#hco-cedula').inputValue(), ''); assert.equal(await page.locator('#hco-otp').inputValue(), '');
      await page.keyboard.press('Escape'); await checkout.waitFor({ state: 'detached' }); assert.equal(posts.length, 2);
      await page.getByRole('button',{name:'Activar beneficios Pro'}).click(); await checkout.waitFor();
      assert.equal(await page.locator('#d5FileVaultUploadInput').count(),0);
      await page.locator('#hco-otp').fill('654321'); await checkout.getByRole('button',{name:'Verificar pago',exact:true}).click();
      await checkout.waitFor({state:'detached'}); await page.locator('#d5ExpandingAction3').waitFor();
      assert.equal(period.subscription.tier,'pro'); assert.equal(posts.length,3);
      await page.reload(); await page.locator('#d5ExpandingAction3').waitFor();
      assert.equal(await checkout.count(),0);
      assert.deepEqual(errors, []); await context.close();
      console.log(`Checkout ${width}px: complete layout, billing/country/fiscal, safe WhatsApp, pending OTP, free entry/reload/Escape and input privacy OK`);
    }
  } finally { await browser?.close(); await new Promise(r => server.close(r)); }
}
run().catch(e => { console.error(e); process.exitCode = 1; });
