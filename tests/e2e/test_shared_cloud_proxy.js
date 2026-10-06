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
  const upstream = http.createServer(async (req, res) => {
    upstreamCalls++;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    if (new URL(req.url, 'http://localhost').searchParams.get('action') === 'files.download') {
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
  const headers = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Origin: base };
  const post = (body, requestHeaders = headers) => fetch(url, { method: 'POST', headers: requestHeaders, body: JSON.stringify(body) });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (spawnError) throw spawnError;
      try { ready = (await fetch(base + '/api/hashcod-shared-files?action=list')).ok; } catch (_) {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'PHP facade must start');
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
    console.log('Shared PHP facade: exact JSON/text bytes, wrong-code errors and same-origin enforcement OK');
  } finally {
    php.kill();
    await new Promise(resolve => upstream.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
