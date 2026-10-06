// Device fallback shares the shell's IndexedDB schema. Neither a plaintext
// Blob nor the chosen code/key is persisted. Cloud rows keep server validation.
import { validateUsdCents } from './file-value.js';
const DB = 'hashcod_file_vault_v1';
const MODE = 'local-code';
const ITERATIONS = 310000;
const encoder = new TextEncoder();
const failures = new Map();

function fail(status, message) { const error = new Error(message); error.status = status; return error; }
function validateId(id) {
  if (!/^fv_[A-Za-z0-9_-]{8,64}$/.test(id)) throw fail(400, 'Invalid file id.');
}
function validateCode(code) {
  if (typeof code !== 'string' || !code.trim() || Array.from(code).length > 128 || code.includes('\0')) {
    throw fail(400, 'Choose a file code with 1 to 128 characters.');
  }
}
function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(fail(503, 'Device storage is unavailable. Enable browser storage and try again.'));
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      for (const name of ['files', 'blobs']) {
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
      }
    };
    let blocked = false;
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
    request.onerror = () => reject(fail(503, 'Could not open device storage.'));
    request.onblocked = () => { blocked = true; reject(fail(503, 'Close older vault tabs and try again.')); };
  });
}
async function transaction(mode, operation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    let result;
    let tx;
    try { tx = db.transaction(['files', 'blobs'], mode); }
    catch { db.close(); reject(fail(503, 'Device storage is unavailable.')); return; }
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(fail(507, 'Could not save or update the file on this device. Check available storage and try again.'));
    };
    try { operation(tx, value => { result = value; }); }
    catch { tx.abort(); }
  });
}
async function storedFile(id) {
  validateId(id);
  return transaction('readonly', (tx, done) => {
    const result = {};
    const meta = tx.objectStore('files').get(id);
    const data = tx.objectStore('blobs').get(id);
    meta.onsuccess = () => { result.meta = meta.result; };
    data.onsuccess = () => { result.data = data.result; };
    done(result);
  });
}
export async function findLocalFile(id) {
  const { meta } = await storedFile(id);
  return meta?.accessProtection === MODE && meta.cloud === false ? meta : null;
}
async function keyFor(code, salt, id) {
  if (!globalThis.crypto?.subtle) throw fail(503, 'Protected device storage needs a secure connection.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveKey']);
  const boundSalt = new Uint8Array([...salt, ...encoder.encode('|hashcod-file-vault-local-v1|' + id)]);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: boundSalt, iterations: ITERATIONS }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function algorithm(id, iv) { return { name: 'AES-GCM', iv, additionalData: encoder.encode('hashcod-file-vault-local-v1|' + id), tagLength: 128 }; }
export async function saveLocalFile(file, id, code, priceUsdCents = null) {
  validateId(id);
  validateCode(code);
  priceUsdCents = validateUsdCents(priceUsdCents);
  if (!(file instanceof Blob) || file.size > 99614720) throw fail(413, 'Files must be 95 MB or smaller.');
  if (!globalThis.crypto?.subtle) throw fail(503, 'Protected device storage needs a secure connection.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(code, salt, id);
  const cipher = await crypto.subtle.encrypt(algorithm(id, iv), key, await file.arrayBuffer());
  const meta = { id, name: file.name || 'file', type: file.type || 'application/octet-stream', size: file.size,
    uploadedAt: new Date().toISOString(), cloud: false, local: true, totpProtected: true, accessProtection: MODE, priceUsdCents };
  await transaction('readwrite', (tx, done) => {
    // add, not put: retries/duplicate IDs cannot replace someone else's code.
    tx.objectStore('files').add(meta);
    tx.objectStore('blobs').add({ id, version: 1, salt, iv, cipher });
    done(true);
  });
  return meta;
}
async function unlock(id, code) {
  validateCode(code);
  const { meta, data } = await storedFile(id);
  if (!meta || meta.accessProtection !== MODE || meta.cloud !== false || data?.version !== 1 || !data.cipher) {
    throw fail(409, 'This device file has no stored uploader code. Upload the original file again to protect it.');
  }
  const recent = (failures.get(id) || []).filter(time => Date.now() - time < 60000);
  if (recent.length >= 8) throw fail(429, 'Too many verification attempts. Try again shortly.');
  failures.set(id, [...recent, Date.now()]);
  const key = await keyFor(code, data.salt, id);
  let bytes;
  try { bytes = await crypto.subtle.decrypt(algorithm(id, data.iv), key, data.cipher); }
  catch { throw fail(401, 'Use the exact code chosen by the person who uploaded this file.'); }
  failures.delete(id);
  return { meta, data, bytes };
}
export async function readLocalFile(id, code) {
  const { meta, bytes } = await unlock(id, code);
  return new Blob([bytes], { type: meta.type });
}
export async function deleteLocalFile(id, code) {
  const { data } = await unlock(id, code);
  return transaction('readwrite', (tx, done) => {
    const request = tx.objectStore('blobs').get(id);
    request.onsuccess = () => {
      const current = request.result;
      if (!current || String(current.iv) !== String(data.iv) || String(current.salt) !== String(data.salt)) { tx.abort(); return; }
      tx.objectStore('files').delete(id);
      tx.objectStore('blobs').delete(id);
      done(true);
    };
  });
}
