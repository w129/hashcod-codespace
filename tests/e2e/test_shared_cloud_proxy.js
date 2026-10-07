const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

// Exercise the real PHP facade. The upstream is isolated: this test never
// reads or changes a production file and needs no provider credentials.
async function main() {
  const jsonFile = Buffer.from('{ "preserve": true, "unicode": "ñ" }\r\n');
  const textFile = Buffer.from('[this is plain text, not JSON]\n');
  let upstreamCalls = 0;
  let period = { ok: true, token: '12345678-1234-1234-1234-123456789abc.' + 'a'.repeat(64), state: 'choose', days: null, expiresAt: null, serverNow: Math.floor(Date.now()/1000) };
  const upstream = http.createServer(async (req, res) => {
    upstreamCalls++;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    const action = new URL(req.url, 'http://localhost').searchParams.get('action');
    if (action.startsWith('period.')) {
      if (action === 'period.accept') {
        assert.equal(body.token, period.token, 'browser-supplied identity must be ignored');
        if (period.state === 'expired' && body.code !== 'test-renewal-key') {
          res.writeHead(403, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"Clave de renovación incorrecta."}'); return;
        }
        period = {...period, state:'active', days:body.days, expiresAt:Math.floor(Date.now()/1000)+body.days*86400};
      }
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(period));return;
    }
    if (action === 'files.download') {
      if (body.code !== 'chosen-code') {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end('{"ok":false,"error":"Incorrect code."}');
      } else {
        res.writeHead(200, { 'Content-Type': body.id === 'json' ? 'application/json' : 'text/plain' });
        res.end(body.id === 'json' ? jsonFile : textFile);
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true,"files":[]}');
    }
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const root = path.resolve(__dirname, '../..');
  const php = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', root, path.join(root, 'router.php')], {
    cwd: root, env: { ...process.env, HASHCOD_SHARED_CLOUD_URL: `http://127.0.0.1:${upstream.address().port}` }, stdio: 'ignore',
  });
  let spawnError;
  php.on('error', error => { spawnError = error; });
  const base = `http://127.0.0.1:${port}`;
  const url = base + '/api/hashcod-shared-files?action=download';
  let cookie = '';
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Origin: base };
  const post = (body, requestHeaders = headers) => fetch(url, { method: 'POST', headers: { ...requestHeaders, Cookie: cookie }, body: JSON.stringify(body) });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (spawnError) throw spawnError;
      try { ready = (await fetch(base + '/api/hashcod-shared-files?action=list')).status === 403; } catch (_) {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'PHP facade must start');
    const untouched=upstreamCalls;
    for(const route of ['/api/hashcod-shared-files?action=list','/api/hashcod-shared-state','/hashcod-sync.php','/hashcod-file-vault-fast-upload.php','/l8-codespace/api/hashcod-shared-files?action=list']) {
      const denied=await fetch(base+route);assert.equal(denied.status,403);assert.equal((await denied.json()).code,'platform_period_required');
    }
    assert.equal(upstreamCalls,untouched,'Requests without confirmation reached storage');
    const periodUrl = base + '/api/platform-period';
    const initial = await fetch(periodUrl);
    assert.equal(initial.status,200);
    assert(!(await initial.text()).includes(period.token), 'identity token leaked to browser JavaScript');
    cookie = initial.headers.get('set-cookie');
    assert.match(cookie, /HttpOnly/i);assert.match(cookie, /SameSite=Strict/i);cookie=cookie.split(';')[0];
    const periodPost = (body,extra={}) => fetch(periodUrl,{method:'POST',headers:{...headers,Cookie:cookie,...extra},body:JSON.stringify(body)});
    assert.equal((await periodPost({days:11})).status,400);
    assert.equal((await periodPost({days:20},{Origin:'https://other.example'})).status,403);
    assert.equal((await periodPost({days:20,code:'x'.repeat(257)})).status,400);
    const pending = await fetch(base+'/api/hashcod-shared-files?action=list',{headers:{Cookie:cookie}});
    assert.equal(pending.status,403);assert.equal((await pending.json()).code,'platform_period_required');
    const accepted = await periodPost({days:20,token:'forged-body-identity'});
    assert.equal(accepted.status,200);assert.equal((await accepted.json()).days,20);
    cookie=accepted.headers.get('set-cookie').split(';')[0];
    for (const [id, bytes] of [['json', jsonFile], ['text', textFile]]) {
      const response = await post({ id, code: 'chosen-code' });
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, 'download bytes must survive the proxy unchanged');
      assert.equal(Number(response.headers.get('content-length')), bytes.length);
    }
    const wrongCode = await post({ id: 'json', code: 'wrong' });
    assert.equal(wrongCode.status, 401);
    assert.equal((await wrongCode.json()).ok, false);
    const callsBeforeRejection = upstreamCalls;
    assert.equal((await post({}, { ...headers, Origin: 'https://other.example' })).status, 403);
    assert.equal((await post({}, { ...headers, 'Sec-Fetch-Site': 'cross-site' })).status, 403);
    assert.equal((await post({}, { 'Content-Type': 'application/json' })).status, 403);
    assert.equal(upstreamCalls, callsBeforeRejection, 'cross-origin requests must never reach storage');
    period={...period,state:'expired',expiresAt:Math.floor(Date.now()/1000)-1};
    const expired=await fetch(periodUrl,{headers:{Cookie:cookie}});assert.equal((await expired.json()).state,'expired');
    cookie=expired.headers.get('set-cookie').split(';')[0];
    const beforeBlocked=upstreamCalls;
    for(const route of ['/api/hashcod-shared-files?action=list','/api/hashcod-shared-state','/api/hashcod-file-vault?action=list','/hashcod-file-vault-fast-upload.php']) {
      const denied=await fetch(base+route,{headers:{Cookie:cookie}});assert.equal(denied.status,403);assert.equal((await denied.json()).code,'platform_period_expired');
    }
    assert.equal(upstreamCalls,beforeBlocked,'expired workspace actions reached upstream');
    assert.equal((await periodPost({days:30,code:'incorrect'})).status,403);
    const renewed=await periodPost({days:30,code:'test-renewal-key'});assert.equal(renewed.status,200);assert.equal((await renewed.json()).state,'active');
    console.log('Period PHP facade: HttpOnly identity, bounds, CSRF, expired API guards and renewal OK');
    console.log('Shared PHP facade: exact JSON/text bytes, wrong-code errors and same-origin enforcement OK');
  } finally {
    php.kill();
    await new Promise(resolve => upstream.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
