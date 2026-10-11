'use strict';
// Streaming SHA-512 must equal node:crypto for any chunking, including block/padding boundaries.
const crypto = require('node:crypto');
const S = require('../components/sha512-stream.js');
let bad = 0;
const check = (ok, name) => { console.log((ok ? '  [PASS] ' : '  [FAIL] ') + name); if (!ok) bad++; };
check(S.hex(new Uint8Array(0)) === crypto.createHash('sha512').update('').digest('hex'), 'empty input');
check(S.hex(Buffer.from('abc')) === crypto.createHash('sha512').update('abc').digest('hex'), '"abc" (FIPS 180-4 vector)');
let all = true;
for (const len of [1, 55, 56, 111, 112, 113, 127, 128, 129, 255, 256, 1000, 65537]) {
  const data = crypto.randomBytes(len);
  const want = crypto.createHash('sha512').update(data).digest('hex');
  if (S.hex(data) !== want) { all = false; console.log('   one-shot mismatch at', len); }
  const h = S.create(); let off = 0;
  while (off < len) { const step = 1 + Math.floor(Math.random() * 300); h.update(data.subarray(off, off + step)); off += step; }
  if (h.hex() !== want) { all = false; console.log('   chunked mismatch at', len); }
}
check(all, 'random data, boundary lengths, random chunking');
const big = crypto.randomBytes(5 * 1024 * 1024);
const t = Date.now(); const bh = S.create(); for (let o = 0; o < big.length; o += 1 << 20) bh.update(big.subarray(o, o + (1 << 20)));
check(bh.hex() === crypto.createHash('sha512').update(big).digest('hex'), '5 MiB in 1 MiB chunks (' + Math.round(5 / ((Date.now() - t) / 1000)) + ' MiB/s)');
check(S.hex(S.fromHex('00ff10')) === crypto.createHash('sha512').update(Buffer.from('00ff10', 'hex')).digest('hex'), 'fromHex');
console.log(bad ? `\n${bad} FAILED` : '\nAll passed'); process.exit(bad ? 1 : 0);
