// Browser-side hashing for the constancia tool: the asset never leaves the device, only hex digests are sent.
import sha512 from '../components/sha512-stream.js';

const WHOLE_FILE_LIMIT = 64 * 1024 * 1024; // up to this size WebCrypto (hardware accelerated) hashes the buffer at once
const CHUNK = 4 * 1024 * 1024;
const utf8 = new TextEncoder();

export async function sha512File(file, onProgress = () => {}) {
  if (file.size <= WHOLE_FILE_LIMIT && globalThis.crypto?.subtle) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-512', await file.arrayBuffer()));
    onProgress(file.size);
    return sha512.toHex(digest);
  }
  const hasher = sha512.create();
  for (let offset = 0; offset < file.size; offset += CHUNK) {
    hasher.update(new Uint8Array(await file.slice(offset, offset + CHUNK).arrayBuffer()));
    onProgress(Math.min(file.size, offset + CHUNK));
    await new Promise(resolve => setTimeout(resolve, 0)); // let the UI breathe
  }
  return hasher.hex();
}

const compareBytes = (a, b) => {
  const x = utf8.encode(a), y = utf8.encode(b), n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return x.length - y.length;
};

// Same rule as constanciaMerkleRoot() on the server: leaf = SHA-512(path || raw SHA-512 of the file), paths sorted bytewise,
// odd node carried up unchanged. The server recomputes the root from the manifest; this value is only shown to the operator.
export function merkleRoot(manifest) {
  const level = [...manifest].sort((a, b) => compareBytes(a.path, b.path)).map(({ path, sha512: hex }) => {
    const leaf = new Uint8Array(utf8.encode(path).length + 64);
    leaf.set(utf8.encode(path)); leaf.set(sha512.fromHex(hex), utf8.encode(path).length);
    return sha512.bytes(leaf);
  });
  let nodes = level;
  while (nodes.length > 1) {
    const next = [];
    for (let i = 0; i < nodes.length; i += 2) {
      if (!nodes[i + 1]) { next.push(nodes[i]); continue; }
      const pair = new Uint8Array(128); pair.set(nodes[i]); pair.set(nodes[i + 1], 64);
      next.push(sha512.bytes(pair));
    }
    nodes = next;
  }
  return sha512.toHex(nodes[0]);
}
