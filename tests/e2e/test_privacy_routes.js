'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');

async function check(router, railway) {
  const reservation = net.createServer();
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const server = spawn(process.env.PHP_BIN || 'php', ['-S', `127.0.0.1:${port}`, '-t', root, router], {
    cwd: root, env: { ...process.env, RAILWAY_ENVIRONMENT_ID: railway ? 'privacy-test' : '', L8_CODE_ACCESS_REQUIRED: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '', startupError;
  server.stderr.on('data', data => { logs += data; });
  server.on('error', error => { startupError = error; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (startupError) throw startupError;
      try { ready = (await fetch(base + '/privacy')).ok; } catch (_) {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'PHP privacy page must start: ' + logs.slice(-1500));
    for (const prefix of ['', '/l8', '/l8-codespace']) {
      for (const route of ['/privacy', '/privacy/', '/privacy.php', '/politica', '/politica/', '/politica-de-privacidad', '/politica-de-privacidad/']) {
        const url = base + prefix + route + '?from=policy';
        const response = await fetch(url);
        assert.equal(response.status, 200, router + ': ' + url);
        assert.match(response.headers.get('content-type'), /^text\/html/);
        const html = await response.text();
        assert(html.includes('Documento de Aceptación Contractual, Privacidad y Evidencia de Registro'), url);
        assert(html.includes('Declaración de aceptación'), 'complete document must be rendered');
        assert(!html.includes('<?php'), 'PHP source must never be served');
        if (route !== '/privacy') {
          const alias = await fetch(url, { redirect: 'manual' });
          assert.equal(alias.status, 308, 'legacy and trailing-slash links must redirect');
          assert.equal(alias.headers.get('location'), prefix + '/privacy?from=policy');
          assert.match(alias.headers.get('cache-control'), /no-store/);
        }
      }
    }
    const head = await fetch(base + '/privacy.php', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    for (const route of ['/security.php', '/platform-registration-contract.php', '/privacy.php/extra', '/privacy/missing']) {
      assert.equal((await fetch(base + route)).status, 404, 'private and unknown paths remain denied: ' + route);
    }
    console.log(router + ': privacy document, aliases, subpaths, HEAD and private-file denial passed');
  } finally {
    if (server.exitCode === null) {
      await new Promise(resolve => { server.once('exit', resolve); server.kill('SIGTERM'); });
    }
  }
}
(async () => { await check('router.php', false); await check('railway-router.php', true); })()
  .catch(error => { console.error(error); process.exitCode = 1; });
