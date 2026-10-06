const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('file-vault-totp-build/entry.jsx', 'utf8');
const core = fs.readFileSync('center-empty-state-build/entry.jsx', 'utf8');
const section = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));

async function deletion(statuses, answers) {
  const requests = [], dialogs = [];
  const context = vm.createContext({
    ENDPOINT: '/api/hashcod-file-vault', actionBusy: false,
    cloudFiles: [{ id: 'fv_first123' }, { id: 'fv_second123' }],
    requestTotpDialog: async (options) => { dialogs.push(options); return answers.shift() ?? null; },
    parseError: async (response) => (await response.json()).error || 'Deletion unavailable.',
    fetch: async (url, options) => {
      requests.push({ url, ...options, body: JSON.parse(options.body) });
      const status = statuses.shift() ?? 200;
      if (status === 'network') throw new Error('Connection lost');
      const malformed = status === 'wrong-id' || status === 'ok-false';
      const body = malformed ? { ok: status !== 'ok-false', id: 'fv_first123' } : status === 200 ? { ok: true, id: 'fv_second123' } : { ok: false, error: 'Deletion unavailable.' };
      return new Response(JSON.stringify(body), { status: malformed ? 200 : status });
    },
  });
  vm.runInContext(section('async function verifiedDelete(', 'function installActionGuard('), context);
  const result = await context.deleteSelectedFile({ id: 'fv_second123', name: 'duplicate.txt', local: true });
  return { result, requests, dialogs, rows: vm.runInContext('cloudFiles', context), busy: vm.runInContext('actionBusy', context) };
}

(async () => {
  const cancelled = await deletion([], [null]);
  assert.strictEqual(cancelled.result, false);
  assert.strictEqual(cancelled.requests.length, 0);
  assert.strictEqual(cancelled.rows.length, 2);
  const valid = await deletion([200], [{ code: '123456' }]);
  assert.strictEqual(valid.result, true);
  assert.strictEqual(valid.requests[0].method, 'POST');
  assert.deepStrictEqual(valid.requests[0].body, { id: 'fv_second123', code: '123456' });
  assert.strictEqual(valid.rows.length, 1);
  assert.strictEqual(valid.rows[0].id, 'fv_first123');
  assert.strictEqual(valid.dialogs[0].purpose, 'delete');
  const retry = await deletion([401, 200], [{ code: '000000' }, { code: '123456' }]);
  assert.strictEqual(retry.dialogs.length, 2);
  assert.strictEqual(retry.result, true);
  for (const status of [404, 409, 429, 502, 503, 'network', 'wrong-id', 'ok-false']) {
    const failed = await deletion([status], [{ code: '123456' }]);
    assert.strictEqual(failed.result, false);
    assert.strictEqual(failed.rows.length, 2, `${status} must preserve the index`);
    assert.strictEqual(failed.dialogs.at(-1).mode, 'notice');
    assert.strictEqual(failed.dialogs.at(-1).purpose, 'delete');
    assert.strictEqual(failed.busy, false);
  }
  const locked = vm.createContext({ actionBusy: true, requestTotpDialog: () => { throw new Error('Concurrent dialog'); } });
  vm.runInContext(section('async function deleteSelectedFile(', 'function installActionGuard('), locked);
  assert.strictEqual(await locked.deleteSelectedFile({ id: 'fv_second123' }), false, 'concurrent file actions must not start another verification');

  const start = core.indexOf('  const deleteFile = async');
  const handler = core.slice(start, core.indexOf('  const modal =', start)).replace('const deleteFile =', 'globalThis.deleteFile =');
  const effects = [], notices = [];
  const context = vm.createContext({ window: {}, setNotice: text => notices.push(text), setFiles: () => effects.push('index'), fileVaultDeleteLocal: async () => effects.push('local') });
  vm.runInContext(handler, context);
  const file = { id: 'fv_second123', local: true, cloud: true };
  await context.deleteFile(file);
  assert.deepStrictEqual(effects, [], 'missing verification API must not erase local bytes');
  assert(notices.at(-1).includes('TOTP verification is not ready'));
  context.window.HashcodFileVaultTotp = { delete: async () => false };
  await context.deleteFile(file);
  assert.deepStrictEqual(effects, [], 'cancel and server errors must preserve device data');
  context.window.HashcodFileVaultTotp.delete = async () => { effects.push('verified'); return true; };
  await context.deleteFile(file);
  assert.deepStrictEqual(effects, ['verified', 'local', 'index'], 'local cleanup must follow server authorization');

  let capture;
  const selected = [];
  const guard = vm.createContext({ window: {}, document: { addEventListener: (_, handler) => { capture = handler; } }, rowIdentity: () => ({ name: 'duplicate.txt' }), resolveProtectedFile: async () => null, deleteSelectedFile: async file => { selected.push(file); return false; } });
  vm.runInContext(section('function installActionGuard(', 'function boot('), guard);
  guard.installActionGuard();
  const button = { dataset: { hfvTotpBypass: '1' }, getAttribute: () => 'Delete', closest: () => ({ dataset: { hfvFileId: 'fv_second123' } }) };
  let stopped = 0;
  await capture({ target: { closest: () => button }, preventDefault() { stopped++; }, stopPropagation() {}, stopImmediatePropagation() {} });
  assert.strictEqual(stopped, 1, 'legacy delete bypass must be intercepted');
  assert.strictEqual(selected[0].id, 'fv_second123');
  console.log('File Vault delete requires uploader TOTP before local cleanup; cancellation, retry, failures and legacy bypass covered');
})().catch(error => { console.error(error); process.exitCode = 1; });
