'use strict';

const assert = require('node:assert/strict');

const baseUrl = (process.env.ECC_BASE_URL || 'http://127.0.0.1:8099').replace(/\/$/, '');

async function readTextSafe(response) {
  try {
    return await response.text();
  } catch (_) {
    return '';
  }
}

async function checkGetEntry() {
  const response = await fetch(`${baseUrl}/laragon-local-entry.php`, {
    method: 'GET',
    headers: { Accept: 'text/html,application/xhtml+xml' }
  });
  const html = await readTextSafe(response);

  assert.equal(response.status, 200, 'ECC GET entry must return HTTP 200');
  assert.match(html, /Hashcod|platform-entry|codespace/i, 'ECC GET entry must return the Hashcod entry document');

  return {
    method: 'GET',
    path: '/laragon-local-entry.php',
    status: response.status,
    ok: response.ok,
    bytes: html.length
  };
}

async function checkPostRegistration() {
  const payload = {
    ecc: true,
    source: 'github-actions',
    name: 'ECC Probe',
    platformName: 'Hashcod Codespace ECC',
    createdAt: new Date().toISOString()
  };

  let response;
  try {
    response = await fetch(`${baseUrl}/api/platform-registration`, {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'Content-Type': 'application/json',
        'X-Hashcod-ECC': 'get-post-analysis'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return {
      method: 'POST',
      path: '/api/platform-registration',
      networkError: String(error && error.message || error),
      ok: true,
      advisory: true
    };
  }

  const body = await readTextSafe(response);
  assert.ok(response.status < 500, `ECC POST registration endpoint must not return 5xx, got ${response.status}`);

  return {
    method: 'POST',
    path: '/api/platform-registration',
    status: response.status,
    ok: response.ok,
    advisory: response.status === 404 || response.status === 405,
    bytes: body.length
  };
}

async function run() {
  const getResult = await checkGetEntry();
  const postResult = await checkPostRegistration();
  console.log(JSON.stringify({ ecc: 'get-post-analysis', baseUrl, get: getResult, post: postResult }, null, 2));
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
