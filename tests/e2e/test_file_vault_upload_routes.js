const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// Execute the real front controller with isolated dependencies. This catches
// missing early routes rather than merely checking for a route string.
const root = path.resolve(__dirname, '../..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hfv-routes-'));
const php = process.env.PHP_BIN || 'php';
try {
  fs.copyFileSync(path.join(root, 'router.php'), path.join(fixture, 'router.php'));
  fs.writeFileSync(path.join(fixture, 'security.php'), `<?php
function securityBootstrap($mode) { throw new RuntimeException('Generic bootstrap blocked upload'); }
`);
  fs.writeFileSync(path.join(fixture, 'l8-html.php'), '<?php');
  fs.writeFileSync(path.join(fixture, 'pqc-actions-lib.php'), `<?php
function pqaRequirePermitForMutation($path) { throw new RuntimeException('Upload fell through routing'); }
`);
  fs.writeFileSync(path.join(fixture, 'hashcod-file-vault-fast-upload.php'), `<?php
echo json_encode(['controller' => 'fast-upload', 'uri' => $_SERVER['REQUEST_URI'], 'action' => $_GET['action']]);
`);
  for (const prefix of ['', '/l8', '/l8-codespace']) {
    for (const route of ['/hashcod-file-vault-fast-upload.php', '/api/hashcod-file-vault-fast-upload']) {
      for (const action of ['verify-totp', 'prepare', 'complete']) {
        const uri = prefix + route + '?action=' + action;
        const code = `$_SERVER['REQUEST_URI']=${JSON.stringify(uri)}; $_SERVER['REQUEST_METHOD']='POST'; $_GET['action']=${JSON.stringify(action)}; require ${JSON.stringify(path.join(fixture, 'router.php'))};`;
        const result = spawnSync(php, ['-r', code], { encoding: 'utf8' });
        assert.strictEqual(result.status, 0, `${uri}: ${result.error || result.stderr || result.stdout}`);
        assert(result.stdout.startsWith('{'), `${uri}: ${result.stdout}`);
        const payload = JSON.parse(result.stdout);
        assert.strictEqual(payload.controller, 'fast-upload', uri);
        assert.strictEqual(payload.action, action, uri);
        assert.strictEqual(payload.uri, '/api/admin-device/status?action=' + action, uri);
      }
    }
  }
  console.log('File Vault setup/prepare/complete routing OK (18 production + loopback routes)');

  // Exercise the actual upload controller's security boundary through the
  // real router. Cloud calls are unnecessary for rejected/invalid requests.
  fs.copyFileSync(path.join(root, 'hashcod-file-vault-fast-upload.php'), path.join(fixture, 'hashcod-file-vault-fast-upload.php'));
  fs.copyFileSync(path.join(root, 'hashcod-file-vault-access-code.php'), path.join(fixture, 'hashcod-file-vault-access-code.php'));
  fs.writeFileSync(path.join(fixture, 'auth.php'), '<?php');
  fs.writeFileSync(path.join(fixture, 'supabase.php'), '<?php');
  fs.writeFileSync(path.join(fixture, 'hashcod-workspace-access.php'), '<?php');
  fs.writeFileSync(path.join(fixture, 'security.php'), `<?php
function securityBootstrap($mode) {
  if ($mode !== 'api' || !str_starts_with($_SERVER['REQUEST_URI'], '/api/admin-device/status')) throw new RuntimeException('Wrong security bootstrap');
}
function securityIsHttps() { return ($_SERVER['HTTPS'] ?? '') === 'on'; }
function securityRateAllowSliding($bucket, $limit, $period) { return ['allowed' => empty($_SERVER['TEST_RATE_BLOCK'])]; }
`);
  const base = { REQUEST_URI: '/hashcod-file-vault-fast-upload.php?action=unknown', REQUEST_METHOD: 'POST', HTTP_HOST: 'hashcodcodespace.dev', HTTPS: 'on', HTTP_X_REQUESTED_WITH: 'XMLHttpRequest', HTTP_ORIGIN: 'https://hashcodcodespace.dev' };
  const cases = [
    [{ REQUEST_METHOD: 'GET' }, 405],
    [{ HTTP_X_REQUESTED_WITH: '' }, 403],
    [{ HTTP_ORIGIN: 'https://unrelated.invalid' }, 403],
    [{ HTTP_SEC_FETCH_SITE: 'cross-site' }, 403],
    [{ TEST_RATE_BLOCK: '1' }, 429],
    [{}, 400],
    [{ HTTP_HOST: '127.0.0.1:8000', HTTP_ORIGIN: 'http://127.0.0.1:8000', HTTPS: 'off' }, 400],
  ];
  const statusFile = path.join(fixture, 'status.txt');
  for (const [overrides, expected] of cases) {
    const values = { ...base, ...overrides };
    const setters = Object.entries(values).map(([key, value]) => `$_SERVER[${JSON.stringify(key)}]=${JSON.stringify(value)};`).join('');
    const code = setters + `register_shutdown_function(function(){file_put_contents(${JSON.stringify(statusFile)}, (string)http_response_code());}); require ${JSON.stringify(path.join(fixture, 'router.php'))};`;
    const result = spawnSync(php, ['-r', code], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);
    assert.strictEqual(payload.ok, false);
    assert.strictEqual(Number(fs.readFileSync(statusFile, 'utf8')), expected, JSON.stringify(overrides));
  }
  console.log('File Vault HTTP method, origin, AJAX and rate-limit guards OK (hosted + loopback)');
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
