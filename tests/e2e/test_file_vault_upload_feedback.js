const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../components/file-vault-fast-upload-v5.js'), 'utf8');
const queue = source.slice(source.indexOf('async function processUiFiles('), source.indexOf('function captureFilesEvent('));

async function run(failures) {
  const states = [];
  const clears = [];
  const input = { value: 'selected' };
  const context = vm.createContext({
    uiBusy: false,
    uploadFromUi: async (file) => {
      if (failures.includes(file.name)) throw new Error('Cloud storage unavailable.');
      states.push([file.name, 100, 'Stored in cloud', 'done']);
    },
    sleep: async () => {},
    setUi: (...args) => states.push(args),
    clearUi: (delay) => clears.push(delay),
    document: { getElementById: () => input },
  });
  vm.runInContext(queue, context);
  await context.processUiFiles([{ name: 'document.pdf' }, { name: 'archive.zip' }]);
  assert.strictEqual(context.uiBusy, false, 'queue must unlock after completion');
  assert.strictEqual(input.value, '', 'same file must be selectable again');
  return { states, clears };
}

(async () => {
  for (const failed of [['document.pdf'], ['archive.zip'], ['document.pdf', 'archive.zip']]) {
    const result = await run(failed);
    assert.strictEqual(result.clears.length, 0, 'upload error must remain visible until the next attempt');
    assert.strictEqual(result.states.at(-1)[3], 'error', 'later success must not hide an earlier failed file');
    assert.strictEqual(result.states.at(-1)[0], failed.at(-1));
  }
  assert.strictEqual((await run([])).clears.length, 1, 'successful queue should clear progress');
  console.log('File Vault upload errors stay visible and allow reselection; successful uploads clear progress');
})().catch((error) => { console.error(error); process.exitCode = 1; });
