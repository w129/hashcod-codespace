const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'file-vault-totp-build/entry.jsx'), 'utf8');

function functions(from, to) { return source.slice(source.indexOf(from), source.indexOf(to)); }

async function downloadScenario(statuses, answers) {
  const requests = [], dialogs = [], saves = [];
  const context = vm.createContext({
    ENDPOINT: '/api/hashcod-file-vault',
    requestTotpDialog: async (options) => { dialogs.push(options); return answers.shift() ?? null; },
    fetch: async (url, options) => {
      requests.push({ url, ...options, body: JSON.parse(options.body) });
      const status = statuses.shift() ?? 200;
      return new Response(status === 200 ? 'protected bytes' : JSON.stringify({ error: 'Verification unavailable.' }), { status });
    },
    URL: { createObjectURL: () => 'blob:verified', revokeObjectURL() {} },
    document: { body: { appendChild() {} }, createElement: () => ({ click() { saves.push(this.download); }, remove() {} }) },
    window: { setTimeout() {} },
  });
  vm.runInContext(functions('async function parseError(', 'async function verifiedDelete('), context);
  await context.verifiedDownload({ id: 'fv_second123', name: 'same-name.pdf', local: true });
  return { requests, dialogs, saves };
}

(async () => {
  const cancelled = await downloadScenario([], [null]);
  assert.strictEqual(cancelled.requests.length, 0, 'cancel must not download');
  const valid = await downloadScenario([200], [{ code: '123456' }]);
  assert.strictEqual(valid.requests[0].body.id, 'fv_second123');
  assert.strictEqual(valid.requests[0].body.code, '123456');
  assert.strictEqual(valid.requests[0].method, 'POST');
  assert(!('secret' in valid.requests[0].body), 'downloader cannot supply a replacement TOTP key');
  assert.deepStrictEqual(valid.saves, ['same-name.pdf']);
  assert.strictEqual(valid.dialogs[0].purpose, 'download', 'must show a dedicated download dialog');
  const retry = await downloadScenario([401, 200], [{ code: '111111' }, { code: '123456' }]);
  assert.strictEqual(retry.dialogs.length, 2);
  assert.strictEqual(retry.saves.length, 1);
  for (const status of [404, 409, 429, 503]) {
    const failed = await downloadScenario([status], [{ code: '123456' }]);
    assert.strictEqual(failed.saves.length, 0, `HTTP ${status} must not release any bytes`);
    assert.strictEqual(failed.dialogs.at(-1).mode, 'notice', 'failure must stay in an explanatory modal');
  }
  const interruptedDialogs = [];
  const interruptedContext = vm.createContext({
    actionBusy: false,
    verifiedDownload: async () => { throw new Error('Interrupted response body'); },
    requestTotpDialog: async (options) => interruptedDialogs.push(options),
  });
  vm.runInContext(functions('async function downloadSelectedFile(', 'async function verifiedDelete('), interruptedContext);
  await interruptedContext.downloadSelectedFile({ id: 'fv_second123', name: 'same-name.pdf' });
  assert.strictEqual(interruptedDialogs[0].mode, 'notice', 'interrupted download must show a recoverable error');
  assert.strictEqual(vm.runInContext('actionBusy', interruptedContext), false, 'failed transfer must release the download lock');
  const identityContext = vm.createContext({ cloudFiles: [{ id: 'fv_first123', name: 'same-name.pdf', size: 5 }, { id: 'fv_second123', name: 'same-name.pdf', size: 5 }], formatSize: () => '5 B' });
  vm.runInContext(functions('function rowIdentity(', 'function decorateRows('), identityContext);
  const row = { dataset: { hfvFileId: 'fv_second123' }, querySelector: () => ({ textContent: 'same-name.pdf' }) };
  assert.strictEqual(identityContext.matchCloudFile(row).id, 'fv_second123', 'duplicate names must use the clicked file ID');
  row.dataset.hfvFileId = 'fv_unknown123';
  assert.strictEqual(identityContext.matchCloudFile(row), null, 'unknown ID must never fall back to another file with the same name');
  delete row.dataset.hfvFileId;
  assert.strictEqual(identityContext.matchCloudFile(row), null, 'ambiguous legacy rows must fail closed');
  const intercepted = [];
  let clickHandler;
  const guardContext = vm.createContext({
    window: {},
    document: { addEventListener: (name, handler) => { clickHandler = handler; } },
    rowIdentity: () => ({ name: 'same-name.pdf' }),
    resolveProtectedFile: async () => null,
    downloadSelectedFile: async (file) => intercepted.push(file),
  });
  vm.runInContext(functions('function installActionGuard(', 'function boot('), guardContext);
  guardContext.installActionGuard();
  const button = { dataset: { hfvTotpBypass: '1' }, getAttribute: () => 'Download', closest: () => ({ dataset: { hfvFileId: 'fv_second123' } }), click: () => { throw new Error('Legacy download bypass'); } };
  await clickHandler({ target: { closest: () => button }, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {} });
  assert.strictEqual(intercepted[0].id, 'fv_second123', 'download interception must use the ID even with a legacy bypass marker');

  const core = fs.readFileSync(path.join(root, 'center-empty-state-build/entry.jsx'), 'utf8');
  const coreDownload = core.slice(core.indexOf('  const downloadFile = async'), core.indexOf('  const deleteFile = async')).replace('const downloadFile =', 'globalThis.downloadFile =');
  const notices = [], delegated = [];
  const coreContext = vm.createContext({ window: {}, setNotice: (text) => notices.push(text), fileVaultGetLocalBlob: () => { throw new Error('Unverified local read'); } });
  vm.runInContext(coreDownload, coreContext);
  const localFile = { id: 'fv_second123', name: 'same-name.pdf', local: true };
  await coreContext.downloadFile(localFile);
  assert(notices.at(-1).includes('File-code verification is not ready'), 'missing dialog API must fail closed');
  coreContext.window.HashcodFileVaultTotp = { download: async (file) => delegated.push(file) };
  await coreContext.downloadFile(localFile);
  assert.strictEqual(delegated[0], localFile, 'local files must use the verified download API');
  console.log('File Vault downloads require uploader access code; cancellation, retry, server failures and duplicate IDs OK');
})().catch((error) => { console.error(error); process.exitCode = 1; });
