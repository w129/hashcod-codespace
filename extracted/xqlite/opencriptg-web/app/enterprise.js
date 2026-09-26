/* opencriptG enterprise production guard
   Pure browser module. Runs deterministic crypto self-tests, catalog checks,
   and exposes a signed-ish local readiness manifest for enterprise review.
*/

(function () {
  'use strict';

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const K = {
    STATUS: 'opencriptG_enterprise_status_v1',
  };

  const toHex = (buf) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  const fromHex = (hex) => {
    const clean = String(hex || '').replace(/[^0-9a-f]/gi, '');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
  };

  async function sha256Hex(text) {
    return toHex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
  }

  async function hmacSha256Hex(keyText, messageText) {
    const key = await crypto.subtle.importKey('raw', enc.encode(keyText), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(messageText)));
  }

  async function pbkdf2Sha256Hex(passText, saltText, iterations, bytes) {
    const base = await crypto.subtle.importKey('raw', enc.encode(passText), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(saltText), iterations, hash: 'SHA-256' },
      base,
      bytes * 8
    );
    return toHex(bits);
  }

  async function aesGcmKnownVectorHex() {
    const key = await crypto.subtle.importKey('raw', fromHex('00000000000000000000000000000000'), 'AES-GCM', false, ['encrypt']);
    const out = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: fromHex('000000000000000000000000'), tagLength: 128 },
      key,
      fromHex('00000000000000000000000000000000')
    );
    return toHex(out);
  }

  function catalogReport() {
    const catalog = window.OCG_CATALOG || [];
    const ids = catalog.flatMap(cat => (cat.types || []).map(type => type.id));
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    const neo = catalog.find(cat => cat.id === 'neo_crypto_200');
    const neoIds = neo ? neo.types.map(type => type.id) : [];
    const apex = catalog.find(cat => cat.id === 'apex_crypto_300');
    const apexIds = apex ? apex.types.map(type => type.id) : [];
    const hashcod = catalog.find(cat => cat.id === 'hashcod_advanced_8282');
    const hashcodIds = hashcod ? hashcod.types.map(type => type.id) : [];
    const missingNeo = [];
    for (let i = 1; i <= 200; i++) {
      const id = `neo_code_${String(i).padStart(3, '0')}`;
      if (!neoIds.includes(id)) missingNeo.push(id);
    }
    const missingApex = [];
    for (let i = 1; i <= 300; i++) {
      const id = `apex_code_${String(i).padStart(3, '0')}`;
      if (!apexIds.includes(id)) missingApex.push(id);
    }
    const missingHashcod = [];
    for (let i = 1; i <= 8282; i++) {
      const id = `hc10000_code_${String(i).padStart(5, '0')}`;
      if (!hashcodIds.includes(id)) missingHashcod.push(id);
    }
    return {
      categories: catalog.length,
      primitives: ids.length,
      duplicateIds: [...new Set(duplicates)],
      neoCount: neoIds.length,
      missingNeo,
      apexCount: apexIds.length,
      missingApex,
      hashcodCount: hashcodIds.length,
      missingHashcod,
    };
  }

  function rngReport() {
    const a = new Uint8Array(32);
    const b = new Uint8Array(32);
    crypto.getRandomValues(a);
    crypto.getRandomValues(b);
    return {
      nonZero: a.some(x => x !== 0) && b.some(x => x !== 0),
      distinct: toHex(a) !== toHex(b),
      sampleBytes: a.length + b.length,
    };
  }

  async function runSelfTests() {
    const startedAt = Date.now();
    const checks = [];
    const push = (id, pass, detail) => checks.push({ id, pass: !!pass, detail: detail || '' });

    try {
      push('secure-context', window.isSecureContext === true || location.hostname === '127.0.0.1' || location.hostname === 'localhost', 'Secure context or localhost required.');
      push('subtlecrypto-present', !!(crypto && crypto.subtle), 'Web Crypto SubtleCrypto availability.');

      const sha = await sha256Hex('abc');
      push('sha256-known-vector', sha === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', sha);

      const hmac = await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog');
      push('hmac-sha256-known-vector', hmac === 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', hmac);

      const pbkdf2 = await pbkdf2Sha256Hex('password', 'salt', 1, 32);
      push('pbkdf2-sha256-known-vector', pbkdf2 === '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b', pbkdf2);

      const aes = await aesGcmKnownVectorHex();
      push('aes-gcm-known-vector', aes === '0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf', aes);

      const rng = rngReport();
      push('csprng-basic-health', rng.nonZero && rng.distinct, JSON.stringify(rng));

      const catalog = catalogReport();
      push('catalog-unique-ids', catalog.duplicateIds.length === 0, `${catalog.primitives} primitives`);
      push('catalog-total-10100', catalog.primitives === 10100, `${catalog.primitives}/10100 primitives`);
      push('neo-200-complete', catalog.neoCount === 200 && catalog.missingNeo.length === 0, `${catalog.neoCount}/200`);
      push('apex-300-complete', catalog.apexCount === 300 && catalog.missingApex.length === 0, `${catalog.apexCount}/300`);
      push('hashcod-8282-complete', catalog.hashcodCount === 8282 && catalog.missingHashcod.length === 0, `${catalog.hashcodCount}/8282`);
      const mobile = (window.OCG_CATALOG || []).find(cat => cat.id === 'mobile_pattern_codes_100');
      push('mobile-pattern-100-complete', mobile && mobile.types && mobile.types.length === 100, `${mobile?.types?.length || 0}/100`);

      if (window.OCG_GEN && window.OCG_GEN.generate) {
        const neo = await window.OCG_GEN.generate('neo_code_200', 32, {});
        push('neo-generator-health', /^OCG-NEO\./.test(neo) && /^CHECK=/m.test(neo), neo.split('\n')[0]);
        const apex = await window.OCG_GEN.generate('apex_code_300', 32, {});
        push('apex-generator-health', /^OCG-APEX\./.test(apex) && /^CHECK=/m.test(apex), apex.split('\n')[0]);
        const hashcod = await window.OCG_GEN.generate('hc10000_code_08282', 32, {});
        push('hashcod-10000-generator-health', /^HASHCOD\./.test(hashcod) && /^CHECK=/m.test(hashcod), hashcod.split('\n')[0]);
        const mobilePattern = await window.OCG_GEN.generate('mobile_pattern_code_100', 32, {});
        push('mobile-pattern-generator-health', /^HASHCOD\.MOBILE_PATTERN\.v1\./.test(mobilePattern) && /PATTERN_VIEW\n/.test(mobilePattern), mobilePattern.split('\n')[0]);
      } else {
        push('generator-present', false, 'window.OCG_GEN.generate missing');
      }
    } catch (err) {
      push('enterprise-selftest-exception', false, err && err.message ? err.message : String(err));
    }

    const failed = checks.filter(check => !check.pass);
    const status = {
      ok: failed.length === 0,
      profile: 'enterprise-production-baseline',
      app: 'opencriptG',
      version: window.APP_VERSION || 12,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks,
      failed,
      manifest: {
        localFirst: true,
        noTelemetry: true,
        requiredCrypto: ['CSPRNG', 'SHA-256', 'HMAC-SHA-256', 'PBKDF2-SHA-256', 'AES-GCM'],
        exportFormats: ['md', 'txt', 'json', 'csv', 'png', 'qr'],
        productionGate: failed.length === 0 ? 'PASS' : 'FAIL',
      },
    };
    try { localStorage.setItem(K.STATUS, JSON.stringify(status)); } catch (e) {}
    try { window.OCGSecurity?.audit?.('enterprise.selftest', { ok: status.ok, failed: failed.length }, status.ok ? 'info' : 'crit'); } catch (e) {}
    return status;
  }

  function lastStatus() {
    try { return JSON.parse(localStorage.getItem(K.STATUS) || 'null'); }
    catch (e) { return null; }
  }

  window.OCGEnterprise = {
    runSelfTests,
    lastStatus,
    catalogReport,
    storageKeys: K,
  };
})();
