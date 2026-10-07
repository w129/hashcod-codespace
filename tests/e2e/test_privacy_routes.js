'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');

// Consume complete responses with an isolated connection. Node 22's bundled
// Undici can abort its parser on larger PHP/HEAD responses during this suite.
function fetchPolicy(url, options = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method: options.method || 'GET', headers: { Connection: 'close' } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        const status = response.statusCode;
        if (status >= 300 && status < 400 && response.headers.location && options.redirect !== 'manual') {
          if (redirects >= 5) return reject(new Error('Policy redirect loop'));
          return resolve(fetchPolicy(new URL(response.headers.location, url), options, redirects + 1));
        }
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status, ok: status >= 200 && status < 300,
          headers: { get: name => response.headers[name.toLowerCase()] ?? null }, text: async () => body });
      });
    });
    request.setTimeout(5000, () => request.destroy(new Error('Policy request timed out')));
    request.on('error', reject);
    request.end();
  });
}

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
      try { ready = (await fetchPolicy(base + '/privacy')).ok; } catch (_) {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, 'PHP privacy page must start: ' + logs.slice(-1500));
    for (const prefix of ['', '/l8', '/l8-codespace']) {
      for (const route of ['/privacy', '/privacy/', '/privacy.php', '/politica', '/politica/', '/politica-de-privacidad', '/politica-de-privacidad/']) {
        const url = base + prefix + route + '?from=policy';
        const response = await fetchPolicy(url);
        assert.equal(response.status, 200, router + ': ' + url);
        assert.match(response.headers.get('content-type'), /^text\/html/);
        const html = await response.text();
        assert(html.includes('Documento de Aceptación Contractual, Privacidad y Evidencia de Registro'), url);
        assert(html.includes('Declaración de aceptación'), 'complete document must be rendered');
        assert(html.includes('id="data-processing-license"'), 'DPA must be available through every policy URL');
        assert(html.includes('href="#data-processing-license"'), 'policy must provide direct navigation to the DPA');
        assert(html.includes('Licencia de procesamiento de datos y acuerdo de tratamiento (DPA)'), 'adapted license must be rendered');
        assert(html.includes('Anexo 5 · Proveedores y ubicaciones operativas'), 'subprocessor annex must be present');
        assert(html.includes('no equivalen a aceptar retroactivamente'), 'publication must not invent past consent');
        assert(html.includes('Files utiliza un listado compartido'), 'known shared-space privacy boundary must be disclosed');
        assert(!html.includes('<?php'), 'PHP source must never be served');
        if (route !== '/privacy') {
          const alias = await fetchPolicy(url, { redirect: 'manual' });
          assert.equal(alias.status, 308, 'legacy and trailing-slash links must redirect');
          assert.equal(alias.headers.get('location'), prefix + '/privacy?from=policy');
          assert.match(alias.headers.get('cache-control'), /no-store/);
        }
      }
    }
    const head = await fetchPolicy(base + '/privacy.php', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    for (const route of ['/security.php', '/platform-registration-contract.php', '/data-processing-addendum.php', '/privacy.php/extra', '/privacy/missing']) {
      assert.equal((await fetchPolicy(base + route)).status, 404, 'private and unknown paths remain denied: ' + route);
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
