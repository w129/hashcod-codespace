const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { randomBytes } = require('crypto');

const source = fs.readFileSync(path.resolve(__dirname, '../../components/file-vault-fast-upload-v5.js'), 'utf8');
const transfer = source.slice(source.indexOf('async function parseJson('), source.indexOf('function waitForTotpApi('));

async function scenario(prepareStatus = 200, storageStatus = 200, withFallback = false, localFailure = false) {
  const calls = [];
  const code = 'MiCodigo-Verde! 2026';
  const ticket = randomBytes(24).toString('base64url');
  const file = new File(['document bytes'], 'document.pdf', { type: 'application/pdf' });
  class StorageXHR {
    constructor() { this.upload = {}; }
    open(method, url) { calls.push({ stage: 'storage', method, url }); }
    setRequestHeader() {}
    send(bytes) {
      assert(bytes instanceof File, 'signed upload must send the original file bytes');
      calls.at(-1).file = bytes;
      assert.strictEqual(bytes.name, file.name);
      assert.strictEqual(bytes.size, file.size);
      this.status = storageStatus;
      queueMicrotask(() => this.onload());
    }
  }
  const context = vm.createContext({
    FAST_ENDPOINT: '/hashcod-file-vault-fast-upload.php',
    RETRY_DELAYS: [0, 0, 0],
    sleep: async () => {},
    FormData,
    XMLHttpRequest: StorageXHR,
    window: { HashcodFileVaultTotp: { saveLocal: async (chosen, id, accessCode) => {
      calls.push({ stage: 'device', chosen, id, accessCode });
      if (localFailure) throw new Error('Device quota exceeded.');
      return { id, name: chosen.name, local: true, cloud: false, accessProtection: 'local-code' };
    } } },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body);
      if (url.endsWith('action=prepare')) {
        calls.push({ stage: 'prepare', body });
        return new Response(JSON.stringify({ ok: prepareStatus === 200, error: 'TOTP setup could not be verified.', ticket, uploadUrl: 'https://storage.invalid/signed-upload' }), { status: prepareStatus });
      }
      calls.push({ stage: 'complete', body });
      assert.strictEqual(body.ticket, ticket);
      assert(!('totp_secret' in body), 'completion must use the signed ticket');
      return new Response(JSON.stringify({ ok: true, file: { id: 'fv_transfer123', name: file.name } }), { status: 201 });
    },
  });
  vm.runInContext(transfer, context);
  let result, error;
  try { result = await (withFallback ? context.uploadProtectedFile : context.performDirectUpload)(file, 'fv_transfer123', code); }
  catch (caught) { error = caught; }
  assert.strictEqual(calls[0].body.access_code, code);
  assert.strictEqual('totp_code' in calls[0].body, false);
  assert.strictEqual(calls[0].body.type, 'application/pdf');
  return { calls, result, error };
}

(async () => {
  const success = await scenario();
  assert(!success.error, success.error?.message);
  assert.deepStrictEqual(success.calls.map((call) => call.stage), ['prepare', 'storage', 'complete']);
  assert.strictEqual(success.result.file.name, 'document.pdf');
  assert.strictEqual(await success.calls[1].file.text(), 'document bytes', 'original bytes must reach Storage');
  const invalidCode = await scenario(400);
  assert(invalidCode.error);
  assert.strictEqual(invalidCode.calls.length, 1, 'rejected code must never transfer bytes');
  const failedStorage = await scenario(200, 503);
  assert(failedStorage.error);
  assert.strictEqual(failedStorage.calls.filter((call) => call.stage === 'storage').length, 3);
  assert(!failedStorage.calls.some((call) => call.stage === 'complete'), 'failed storage must never be indexed as saved');
  const unavailable = await scenario(503, 200, true);
  assert(!unavailable.error);
  assert.equal(unavailable.result.file.cloud, false, 'device save must never claim cloud success');
  assert.deepStrictEqual(unavailable.calls.map(call => call.stage), ['prepare', 'device']);
  assert.equal(unavailable.calls.at(-1).accessCode, 'MiCodigo-Verde! 2026');
  for (const status of [400, 401, 403, 413, 429]) {
    const denied = await scenario(status, 200, true);
    assert(denied.error);
    assert(!denied.calls.some(call => call.stage === 'device'), 'validation/rate guards must not fall back');
  }
  const quota = await scenario(503, 200, true, true);
  assert(quota.error, 'aborted device save must not claim success');
  console.log('File Vault direct transfer: file code → original bytes → signed completion; failures stop before false saves');
})().catch((error) => { console.error(error); process.exitCode = 1; });
