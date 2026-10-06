const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { indexedDB, IDBDatabase } = require('fake-indexeddb');
globalThis.indexedDB = indexedDB;
Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
const filename = path.resolve(__dirname, '../../file-vault-totp-build/local-vault.js');
async function load() { return import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(filename)).toString('base64')); }
function rawStore(store, id, change) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('hashcod_file_vault_v1', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction(store, change ? 'readwrite' : 'readonly');
      const get = tx.objectStore(store).get(id);
      let result;
      get.onsuccess = () => { result = get.result; if (change) tx.objectStore(store).put(change(result)); };
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
    request.onerror = () => reject(request.error);
  });
}
(async () => {
  const vault = await load();
  for (const [id, name, bytes] of [['fv_localpdf123', 'document.pdf', 'original PDF bytes'], ['fv_localzip123', 'archive.zip', '\u0000\u0001\u00ff'], ['fv_localempty1', 'empty.bin', '']]) {
    const code = ' código Verde! 2026 ';
    const file = new File([bytes], name, { type: 'application/octet-stream' });
    const meta = await vault.saveLocalFile(file, id, code);
    assert.equal(meta.cloud, false);
    assert.equal(meta.accessProtection, 'local-code');
    assert.equal(meta.local, true);
    const stored = await rawStore('blobs', id);
    assert.equal(stored.blob, undefined, 'plaintext file must never be stored');
    assert.equal(JSON.stringify(await rawStore('files', id)).includes(code), false);
    await assert.rejects(vault.readLocalFile(id, 'wrong-code'), error => error.status === 401);
    await assert.rejects(vault.deleteLocalFile(id, 'wrong-code'), error => error.status === 401);
    assert(await vault.findLocalFile(id), 'wrong delete code must preserve file');
    const reloaded = await load();
    assert.equal(await (await reloaded.readLocalFile(id, code)).text(), bytes, 'reload must restore exact bytes');
    assert.equal(await vault.deleteLocalFile(id, code), true);
    assert.equal(await vault.findLocalFile(id), null);
    assert.equal(await rawStore('blobs', id), undefined);
  }
  const file = new File(['private content'], 'secret.txt');
  await assert.rejects(vault.saveLocalFile(file, 'fv_invalid123', ''));
  await assert.rejects(vault.saveLocalFile(file, '../traversal', 'code'));
  await vault.saveLocalFile(file, 'fv_tampered123', 'same-code');
  await assert.rejects(vault.saveLocalFile(file, 'fv_tampered123', 'replacement-code'), error => error.status === 507);
  assert.equal(await (await vault.readLocalFile('fv_tampered123', 'same-code')).text(), 'private content', 'duplicate IDs must preserve original bytes and code');
  const nativeTransaction = IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction = function (...args) {
    const tx = nativeTransaction.apply(this, args);
    if (args[1] === 'readwrite') queueMicrotask(() => tx.abort());
    return tx;
  };
  try { await assert.rejects(vault.saveLocalFile(file, 'fv_aborted123', 'code'), error => error.status === 507); }
  finally { IDBDatabase.prototype.transaction = nativeTransaction; }
  assert.equal(await vault.findLocalFile('fv_aborted123'), null, 'aborted storage must never leave a visible saved row');
  assert.equal(await rawStore('blobs', 'fv_aborted123'), undefined, 'aborted transaction must roll back ciphertext too');
  await rawStore('blobs', 'fv_tampered123', row => { const cipher = new Uint8Array(row.cipher); cipher[0] ^= 1; return { ...row, cipher: cipher.buffer }; });
  await assert.rejects(vault.readLocalFile('fv_tampered123', 'same-code'), error => error.status === 401);
  await rawStore('blobs', 'fv_legacy123', () => ({ id: 'fv_legacy123', blob: file }));
  await assert.rejects(vault.readLocalFile('fv_legacy123', 'any'), error => error.status === 409);
  console.log('Encrypted device vault: exact codes, reload, original bytes, wrong-code deletion, tampering and legacy bypass OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
