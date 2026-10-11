/* Incremental SHA-512 (FIPS 180-4) for big files in the browser: WebCrypto only hashes whole buffers, which does not
   work for multi-gigabyte weights or datasets. Plain 32-bit pair arithmetic, no dependencies; tested against node:crypto.
   Usage: var h = HashcodSha512.create(); h.update(uint8array); ...; h.hex()   |   HashcodSha512.hex(uint8array) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HashcodSha512 = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var K = new Uint32Array([
    0x428a2f98,0xd728ae22, 0x71374491,0x23ef65cd, 0xb5c0fbcf,0xec4d3b2f, 0xe9b5dba5,0x8189dbbc,
    0x3956c25b,0xf348b538, 0x59f111f1,0xb605d019, 0x923f82a4,0xaf194f9b, 0xab1c5ed5,0xda6d8118,
    0xd807aa98,0xa3030242, 0x12835b01,0x45706fbe, 0x243185be,0x4ee4b28c, 0x550c7dc3,0xd5ffb4e2,
    0x72be5d74,0xf27b896f, 0x80deb1fe,0x3b1696b1, 0x9bdc06a7,0x25c71235, 0xc19bf174,0xcf692694,
    0xe49b69c1,0x9ef14ad2, 0xefbe4786,0x384f25e3, 0x0fc19dc6,0x8b8cd5b5, 0x240ca1cc,0x77ac9c65,
    0x2de92c6f,0x592b0275, 0x4a7484aa,0x6ea6e483, 0x5cb0a9dc,0xbd41fbd4, 0x76f988da,0x831153b5,
    0x983e5152,0xee66dfab, 0xa831c66d,0x2db43210, 0xb00327c8,0x98fb213f, 0xbf597fc7,0xbeef0ee4,
    0xc6e00bf3,0x3da88fc2, 0xd5a79147,0x930aa725, 0x06ca6351,0xe003826f, 0x14292967,0x0a0e6e70,
    0x27b70a85,0x46d22ffc, 0x2e1b2138,0x5c26c926, 0x4d2c6dfc,0x5ac42aed, 0x53380d13,0x9d95b3df,
    0x650a7354,0x8baf63de, 0x766a0abb,0x3c77b2a8, 0x81c2c92e,0x47edaee6, 0x92722c85,0x1482353b,
    0xa2bfe8a1,0x4cf10364, 0xa81a664b,0xbc423001, 0xc24b8b70,0xd0f89791, 0xc76c51a3,0x0654be30,
    0xd192e819,0xd6ef5218, 0xd6990624,0x5565a910, 0xf40e3585,0x5771202a, 0x106aa070,0x32bbd1b8,
    0x19a4c116,0xb8d2d0c8, 0x1e376c08,0x5141ab53, 0x2748774c,0xdf8eeb99, 0x34b0bcb5,0xe19b48a8,
    0x391c0cb3,0xc5c95a63, 0x4ed8aa4a,0xe3418acb, 0x5b9cca4f,0x7763e373, 0x682e6ff3,0xd6b2b8a3,
    0x748f82ee,0x5defb2fc, 0x78a5636f,0x43172f60, 0x84c87814,0xa1f0ab72, 0x8cc70208,0x1a6439ec,
    0x90befffa,0x23631e28, 0xa4506ceb,0xde82bde9, 0xbef9a3f7,0xb2c67915, 0xc67178f2,0xe372532b,
    0xca273ece,0xea26619c, 0xd186b8c7,0x21c0c207, 0xeada7dd6,0xcde0eb1e, 0xf57d4f7f,0xee6ed178,
    0x06f067aa,0x72176fba, 0x0a637dc5,0xa2c898a6, 0x113f9804,0xbef90dae, 0x1b710b35,0x131c471b,
    0x28db77f5,0x23047d84, 0x32caab7b,0x40c72493, 0x3c9ebe0a,0x15c9bebc, 0x431d67c4,0x9c100d4c,
    0x4cc5d4be,0xcb3e42b6, 0x597f299c,0xfc657e2a, 0x5fcb6fab,0x3ad6faec, 0x6c44198c,0x4a475817
  ]);
  var IV = [0x6a09e667,0xf3bcc908, 0xbb67ae85,0x84caa73b, 0x3c6ef372,0xfe94f82b, 0xa54ff53a,0x5f1d36f1, 0x510e527f,0xade682d1, 0x9b05688c,0x2b3e6c1f, 0x1f83d9ab,0xfb41bd6b, 0x5be0cd19,0x137e2179];

  function Sha512() {
    this.h = new Uint32Array(IV);
    this.block = new Uint8Array(128);
    this.fill = 0;
    this.total = 0;
    this.w = new Uint32Array(160);
    this.done = false;
  }

  Sha512.prototype._compress = function (data, off) {
    var w = this.w, h = this.h, i, t;
    for (i = 0; i < 32; i++, off += 4) w[i] = ((data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]) >>> 0;
    for (t = 16; t < 80; t++) {
      var xh = w[(t - 15) * 2], xl = w[(t - 15) * 2 + 1];
      var s0h = ((xh >>> 1) | (xl << 31)) ^ ((xh >>> 8) | (xl << 24)) ^ (xh >>> 7);
      var s0l = ((xl >>> 1) | (xh << 31)) ^ ((xl >>> 8) | (xh << 24)) ^ ((xl >>> 7) | (xh << 25));
      var yh = w[(t - 2) * 2], yl = w[(t - 2) * 2 + 1];
      var s1h = ((yh >>> 19) | (yl << 13)) ^ ((yl >>> 29) | (yh << 3)) ^ (yh >>> 6);
      var s1l = ((yl >>> 19) | (yh << 13)) ^ ((yh >>> 29) | (yl << 3)) ^ ((yl >>> 6) | (yh << 26));
      var lo = (w[(t - 16) * 2 + 1] >>> 0) + (s0l >>> 0) + (w[(t - 7) * 2 + 1] >>> 0) + (s1l >>> 0);
      var hi = (w[(t - 16) * 2] >>> 0) + (s0h >>> 0) + (w[(t - 7) * 2] >>> 0) + (s1h >>> 0) + Math.floor(lo / 4294967296);
      w[t * 2] = hi >>> 0; w[t * 2 + 1] = lo >>> 0;
    }
    var ah = h[0], al = h[1], bh = h[2], bl = h[3], ch = h[4], cl = h[5], dh = h[6], dl = h[7];
    var eh = h[8], el = h[9], fh = h[10], fl = h[11], gh = h[12], gl = h[13], hh = h[14], hl = h[15];
    for (t = 0; t < 80; t++) {
      var S1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
      var S1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
      var chh = (eh & fh) ^ (~eh & gh), chl = (el & fl) ^ (~el & gl);
      var l1 = (hl >>> 0) + (S1l >>> 0) + (chl >>> 0) + K[t * 2 + 1] + w[t * 2 + 1];
      var h1 = (hh >>> 0) + (S1h >>> 0) + (chh >>> 0) + K[t * 2] + w[t * 2] + Math.floor(l1 / 4294967296);
      var t1l = l1 >>> 0, t1h = h1 >>> 0;
      var S0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
      var S0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
      var mjh = (ah & bh) ^ (ah & ch) ^ (bh & ch), mjl = (al & bl) ^ (al & cl) ^ (bl & cl);
      var t2l = (S0l >>> 0) + (mjl >>> 0), t2h = (S0h >>> 0) + (mjh >>> 0) + Math.floor(t2l / 4294967296);
      t2l >>>= 0;
      hh = gh; hl = gl; gh = fh; gl = fl; fh = eh; fl = el;
      var nl = (dl >>> 0) + t1l; eh = ((dh >>> 0) + t1h + Math.floor(nl / 4294967296)) >>> 0; el = nl >>> 0;
      dh = ch; dl = cl; ch = bh; cl = bl; bh = ah; bl = al;
      var ml = t1l + t2l; ah = (t1h + (t2h >>> 0) + Math.floor(ml / 4294967296)) >>> 0; al = ml >>> 0;
    }
    var add = function (idx, vh, vl) {
      var l = (h[idx + 1] >>> 0) + (vl >>> 0);
      h[idx] = ((h[idx] >>> 0) + (vh >>> 0) + Math.floor(l / 4294967296)) >>> 0; h[idx + 1] = l >>> 0;
    };
    add(0, ah, al); add(2, bh, bl); add(4, ch, cl); add(6, dh, dl); add(8, eh, el); add(10, fh, fl); add(12, gh, gl); add(14, hh, hl);
  };

  Sha512.prototype.update = function (data) {
    if (this.done) throw new Error('already finalized');
    var pos = 0, n = data.length;
    this.total += n;
    if (this.fill) {
      var take = Math.min(128 - this.fill, n);
      this.block.set(data.subarray(0, take), this.fill);
      this.fill += take; pos = take;
      if (this.fill < 128) return this;
      this._compress(this.block, 0); this.fill = 0;
    }
    for (; pos + 128 <= n; pos += 128) this._compress(data, pos);
    if (pos < n) { this.block.set(data.subarray(pos), 0); this.fill = n - pos; }
    return this;
  };

  Sha512.prototype.digest = function () {
    if (this.done) throw new Error('already finalized');
    this.done = true;
    var b = this.block, i;
    b[this.fill++] = 0x80;
    if (this.fill > 112) { b.fill(0, this.fill); this._compress(b, 0); this.fill = 0; }
    b.fill(0, this.fill);
    var bits = this.total * 8;
    var hi = Math.floor(bits / 4294967296), lo = bits >>> 0;
    for (i = 0; i < 4; i++) { b[120 + i] = (hi >>> (24 - 8 * i)) & 255; b[124 + i] = (lo >>> (24 - 8 * i)) & 255; }
    this._compress(b, 0);
    var out = new Uint8Array(64);
    for (i = 0; i < 16; i++) for (var j = 0; j < 4; j++) out[i * 4 + j] = (this.h[i] >>> (24 - 8 * j)) & 255;
    return out;
  };

  function toHex(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
    return s;
  }
  Sha512.prototype.hex = function () { return toHex(this.digest()); };

  return {
    create: function () { return new Sha512(); },
    hex: function (bytes) { return new Sha512().update(bytes).hex(); },
    bytes: function (bytes) { return new Sha512().update(bytes).digest(); },
    toHex: toHex,
    fromHex: function (hex) { var o = new Uint8Array(hex.length / 2); for (var i = 0; i < o.length; i++) o[i] = parseInt(hex.substr(i * 2, 2), 16); return o; }
  };
});
