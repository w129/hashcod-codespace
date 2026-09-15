const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { webcrypto } = require('crypto');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const ROOT = path.resolve(__dirname, '..');
const enc = new TextEncoder();

const toHex = (buf) => Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

async function sha256Hex(text) {
  return toHex(await webcrypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacSha256Hex(keyText, messageText) {
  const key = await webcrypto.subtle.importKey('raw', enc.encode(keyText), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await webcrypto.subtle.sign('HMAC', key, enc.encode(messageText)));
}

async function pbkdf2Sha256Hex(passText, saltText, iterations, bytes) {
  const base = await webcrypto.subtle.importKey('raw', enc.encode(passText), 'PBKDF2', false, ['deriveBits']);
  const bits = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(saltText), iterations, hash: 'SHA-256' }, base, bytes * 8);
  return toHex(bits);
}

async function aesGcmKnownVectorHex() {
  const key = await webcrypto.subtle.importKey('raw', fromHex('00000000000000000000000000000000'), 'AES-GCM', false, ['encrypt']);
  const out = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fromHex('000000000000000000000000'), tagLength: 128 },
    key,
    fromHex('00000000000000000000000000000000')
  );
  return toHex(out);
}

async function pdfStampVectorSmoke() {
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  const input = await source.save();
  const pdf = await PDFDocument.load(input);
  const page = pdf.getPages()[0];
  const black = rgb(0, 0, 0);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 390, y: 28, width: 170, height: 66, borderColor: black, borderWidth: 2 });
  const logoOptions = { x: 402, y: 78, color: black, scale: 1.1 };
  page.drawSvgPath('M22.996 30H9.004a1.002 1.002 0 0 1-.821-1.577l6.998-9.996a1 1 0 0 1 1.638 0l6.998 9.996a1.002 1.002 0 0 1-.82 1.577Z', logoOptions);
  page.drawSvgPath('M28 24h-4v-2h4V6H4v16h4v2H4a2.002 2.002 0 0 1-2-2V6a2.002 2.002 0 0 1 2-2h24a2.002 2.002 0 0 1 2 2v16a2.002 2.002 0 0 1-2 2Z', logoOptions);
  page.drawText('HASHCOD', { x: 440, y: 66, size: 12, font, color: black });
  const output = await pdf.save();
  const reopened = await PDFDocument.load(output);
  return { inputBytes: input.length, outputBytes: output.length, pages: reopened.getPageCount() };
}

async function docusealAdapterPdfSmoke() {
  const ctx = { window: { PDFLib: { PDFDocument, StandardFonts, rgb }, crypto: webcrypto, Date } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public-source/hashcod-docuseal-tool/app/hashcod-docuseal-adapter.js'), 'utf8'), ctx);
  const source = await PDFDocument.create();
  source.addPage([595, 842]);
  const input = await source.save();
  const result = await ctx.window.HashcodDocuSealAdapter.signPdf({
    sourceBytes: input,
    signer: 'Hashcod Test Signer',
    signatureText: 'Hashcod Test Signature',
    position: 'bottom-right',
  });
  const reopened = await PDFDocument.load(result.bytes);
  return { inputBytes: input.length, outputBytes: result.bytes.length, pages: reopened.getPageCount(), digest: result.sourceDigest };
}

async function warpWorkspaceAdapterSmoke() {
  const memory = {};
  const ctx = {
    window: {},
    document: {
      createElement: () => ({ click() {}, remove() {}, set href(_) {}, set download(_) {} }),
      body: { appendChild() {} },
    },
    Blob,
    URL: { createObjectURL: () => 'blob:hashcod-warp', revokeObjectURL() {} },
    localStorage: { getItem: key => memory[key] || null, setItem: (key, value) => { memory[key] = String(value); } },
    Date,
    crypto: webcrypto,
    TextEncoder,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'public-source/hashcod-warp-tool/app/hashcod-warp-workspace.js'), 'utf8'), ctx);
  const api = ctx.window.HashcodWarpWorkspace;
  const ws = api.defaultWorkspace();
  const saved = api.saveWorkspace(ctx.localStorage, { ...ws, files: [...ws.files, { name: 'test.js', language: 'javascript', content: "console.log('ok')" }], active: 'test.js' });
  const loaded = api.loadWorkspace(ctx.localStorage);
  const sandbox = api.sandboxDocument("console.log('x')");
  const pythonPlan = await api.compilePlan({ name: 'main.js', language: 'python', content: 'print("ok")' }, loaded.files);
  return {
    files: loaded.files.length,
    active: loaded.active,
    formatted: api.formatSource('a=1;\\n\\n\\n').split('\n').length,
    sandboxLocked: sandbox.includes("connect-src 'none'") && sandbox.includes('hashcod-warp-log') && sandbox.includes("'unsafe-eval'"),
    pythonModeRespected: pythonPlan.language === 'python' && pythonPlan.mode === 'analysis',
    savedActive: saved.active,
  };
}

function loadBrowserFiles() {
  const ctx = {
    window: {},
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Blob,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
  };
  vm.createContext(ctx);
  for (const file of ['data/icons.js', 'data/catalog.js', 'data/generators.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file });
  }
  return ctx;
}

function assert(ok, id, detail = '') {
  if (!ok) {
    const err = new Error(`${id} failed ${detail}`);
    err.id = id;
    throw err;
  }
  console.log(`PASS ${id}${detail ? ` ${detail}` : ''}`);
}

(async () => {
  assert(await sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256-known-vector');
  assert(await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog') === 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', 'hmac-sha256-known-vector');
  assert(await pbkdf2Sha256Hex('password', 'salt', 1, 32) === '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b', 'pbkdf2-sha256-known-vector');
  assert(await aesGcmKnownVectorHex() === '0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf', 'aes-gcm-known-vector');
  const pdfSmoke = await pdfStampVectorSmoke();
  assert(pdfSmoke.pages === 1 && pdfSmoke.outputBytes > pdfSmoke.inputBytes, 'pdf-stamp-vector-smoke', `${pdfSmoke.inputBytes}->${pdfSmoke.outputBytes} bytes`);
  const docusealSmoke = await docusealAdapterPdfSmoke();
  assert(docusealSmoke.pages === 1 && docusealSmoke.outputBytes > docusealSmoke.inputBytes && docusealSmoke.digest.length === 64, 'docuseal-adapter-pdf-smoke', `${docusealSmoke.inputBytes}->${docusealSmoke.outputBytes} bytes`);
  const warpSmoke = await warpWorkspaceAdapterSmoke();
  assert(warpSmoke.files >= 3 && warpSmoke.active === 'test.js' && warpSmoke.sandboxLocked && warpSmoke.pythonModeRespected, 'warp-workspace-adapter-smoke', `${warpSmoke.files} files`);

  const ctx = loadBrowserFiles();
  const catalog = ctx.window.OCG_CATALOG || [];
  const ids = catalog.flatMap(cat => (cat.types || []).map(type => type.id));
  const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  assert(duplicates.length === 0, 'catalog-unique-ids', `${ids.length} ids`);
  assert(ids.length === 10100, 'catalog-total-10100', `${ids.length}/10100 ids`);

  const neo = catalog.find(cat => cat.id === 'neo_crypto_200');
  assert(neo && neo.types && neo.types.length === 200, 'neo-200-complete', `${neo ? neo.types.length : 0}/200`);

  const apex = catalog.find(cat => cat.id === 'apex_crypto_300');
  assert(apex && apex.types && apex.types.length === 300, 'apex-300-complete', `${apex ? apex.types.length : 0}/300`);

  const hc10000 = catalog.find(cat => cat.id === 'hashcod_advanced_8282');
  assert(hc10000 && hc10000.types && hc10000.types.length === 8282, 'hashcod-8282-complete', `${hc10000 ? hc10000.types.length : 0}/8282`);

  const mobilePatterns = catalog.find(cat => cat.id === 'mobile_pattern_codes_100');
  assert(mobilePatterns && mobilePatterns.types && mobilePatterns.types.length === 100, 'mobile-pattern-100-complete', `${mobilePatterns ? mobilePatterns.types.length : 0}/100`);

  const variants = catalog.flatMap(cat => cat.types || []);
  const apiVariant = variants.find(type => type.hashcodVariant === 'HCV-00185');
  assert(apiVariant && apiVariant.id === 'apikey', 'hashcod-variant-00185-api-key', apiVariant ? apiVariant.id : 'missing');

  const apiPrefix = 'svc.prod_';
  const apiOut = await ctx.window.OCG_GEN.generate('apikey', 64, { prefix: apiPrefix, upper: true, lower: true, num: true, sym: true });
  const apiPayload = apiOut.slice(apiPrefix.length);
  assert(apiOut.startsWith(apiPrefix) && apiPayload.length === 64, 'api-key-prefix-length', `${apiPayload.length} chars`);
  assert(/[A-Z]/.test(apiPayload) && /[a-z]/.test(apiPayload) && /[0-9]/.test(apiPayload) && /[^A-Za-z0-9]/.test(apiPayload), 'api-key-charset-coverage');

  const out = await ctx.window.OCG_GEN.generate('neo_code_200', 32, {});
  assert(/^OCG-NEO\./.test(out) && /^CHECK=/m.test(out), 'neo-generator-health', out.split('\n')[0]);

  const apexOut = await ctx.window.OCG_GEN.generate('apex_code_300', 32, {});
  assert(/^OCG-APEX\./.test(apexOut) && /^CHECK=/m.test(apexOut), 'apex-generator-health', apexOut.split('\n')[0]);

  const hc10000Out = await ctx.window.OCG_GEN.generate('hc10000_code_08282', 32, {});
  assert(/^HASHCOD\./.test(hc10000Out) && /^CHECK=/m.test(hc10000Out), 'hashcod-10000-generator-health', hc10000Out.split('\n')[0]);

  const mobilePatternOut = await ctx.window.OCG_GEN.generate('mobile_pattern_code_100', 32, {});
  assert(/^HASHCOD\.MOBILE_PATTERN\.v1\./.test(mobilePatternOut) && /PATTERN_VIEW\n/.test(mobilePatternOut) && /ROUTE=\d-\d-\d-\d-\d-\d-\d-\d-\d/.test(mobilePatternOut), 'mobile-pattern-generator-health', mobilePatternOut.split('\n')[0]);

  const jwt = await ctx.window.OCG_GEN.generate('jwt_hs256_real', 32, {});
  assert(jwt.split('.').length === 3, 'jwt-real-shape');

  const appSource = fs.readFileSync(path.join(ROOT, 'app/app.jsx'), 'utf8');
  const stylesSource = fs.readFileSync(path.join(ROOT, 'app/styles.css'), 'utf8');
  const indexSource = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert(indexSource.includes('vendor/bootstrap.min.css?v=5.3.8'), 'bootstrap-local-stylesheet');
  assert(appSource.includes('app container-fluid p-0') && appSource.includes('tb-nav d-flex flex-nowrap overflow-x-auto'), 'bootstrap-shell-order-utilities');
  assert(appSource.includes('const CODE_TRANSFORM_CLI_TOTAL = 1100;'), 'transform-cmd-total-1100');
  assert(appSource.includes("['segment-permute', 'TRANSFORM'") && appSource.includes("['integrity-envelope', 'FORMAT'"), 'transform-cmd-extension-operations');
  assert(appSource.includes("'1100 commands: hcx0001 - hcx1100'"), 'transform-cmd-menu-range');
  assert(appSource.includes('const copyResult = async () =>') && appSource.includes('const exportPng = () =>'), 'transform-cmd-copy-png-actions');
  assert(appSource.includes("export json|txt|png") && appSource.includes("<button onClick={exportPng}>PNG</button>"), 'transform-cmd-png-command-ui');
  assert(appSource.includes('const FileZipPackagerDialog =') && appSource.includes('makeZipBlob(entries)'), 'file-zip-packager-dialog');
  assert(appSource.includes('TOP_MENU_ICONS.filePackager') && appSource.includes('FILE ZIP PACKAGER'), 'file-zip-packager-menu');
  assert(appSource.includes('const HashcodOrderRegistryDialog =') && appSource.includes('HASHCOD_ORDER_REGISTRY_KEY'), 'order-registry-dialog');
  assert(appSource.includes('TOP_MENU_ICONS.orderRegistry') && appSource.includes('ORDER REGISTRY'), 'order-registry-menu');
  assert(appSource.includes('const HashcodEquetMatrixDialog =') && appSource.includes('EQUET_MATRIX_DEFAULT') && appSource.includes('buildEquetParameters'), 'equet-matrix-dialog');
  assert(appSource.includes('TOP_MENU_ICONS.equetMatrix') && appSource.includes('EQUET MATRIX'), 'equet-matrix-menu');
  assert(appSource.includes('const BrandEvidenceVaultDialog =') && appSource.includes("authFetch('/api/brand-evidence'"), 'brand-evidence-vault-dialog');
  assert(appSource.includes('TOP_MENU_ICONS.brandEvidence') && appSource.includes('BRAND EVIDENCE'), 'brand-evidence-vault-menu');
  assert(appSource.includes("const logoOptions = { x: 58, y: 776, color: black, scale: 1.05 }") && appSource.includes("page.drawText('HASHCOD', { x: 102, y: 750"), 'brand-evidence-certificate-logo');
  assert(appSource.includes('const manifestForNote =') && appSource.includes('averageEntropy') && appSource.includes('manifestSha256'), 'sequence-a-verifiable-manifest');
  assert(appSource.includes('duplicateNote') && appSource.includes('rotateKey') && appSource.includes('removeAttachedCode'), 'sequence-a-operational-actions');
  assert(appSource.includes('<QrCanvas payload={verificationQr}') && appSource.includes('mnotes-code-search'), 'sequence-a-qr-search-ui');
  assert(appSource.includes("const GENERATION_PREFIX_STORAGE_KEY = 'hashcod_generation_prefix_v1'") && appSource.includes('withGenerationPrefix(generatedValue, generationPrefix)'), 'generation-global-prefix-runtime');
  assert(appSource.includes('cfg-global-prefix') && appSource.includes('setGenerationPrefix={setGenerationPrefix}'), 'generation-global-prefix-ui');
  assert(indexSource.includes('vendor/pdf-lib.min.js?v=1.17.1'), 'pdf-lib-local-runtime');
  assert(appSource.includes('const SIDEBAR_RENDER_LIMIT = 140;') && appSource.includes('useDeferredValue(query)') && appSource.includes('visibleTypes'), 'fluid-sidebar-window');
  assert(appSource.includes('const OUTPUT_INITIAL_RENDER_LIMIT = 1000;') && appSource.includes('showMoreOutput') && appSource.includes('out-window-actions') && appSource.includes('const OutputCard = memo(') && appSource.includes('onCopy={rememberSingleCopied}'), 'fluid-output-window');
  assert(stylesSource.includes('content-visibility:auto') && stylesSource.includes('.sb-list-more'), 'fluid-render-css');
  assert(indexSource.includes('app/build/app.js?v=hashcod-reference-skin-20260605-9') && indexSource.includes('app/styles.css?v=hashcod-reference-skin-20260605-9'), 'app-cache-buster');
  assert(appSource.includes('const PdfStampDialog =') && appSource.includes('drawHashcodStamp'), 'pdf-stamp-dialog');
  assert(appSource.includes('M22.996 30H9.004') && appSource.includes('M28 24h-4v-2h4V6H4v16h4v2H4'), 'pdf-stamp-official-hashcod-svg');
  assert(appSource.includes('Hashcod black QR stamp') && appSource.includes('buildStampQrPng') && appSource.includes('pdf.embedPng'), 'pdf-stamp-black-database-qr');
  assert(appSource.includes('rows={copyDb}') && appSource.includes('Database identifier code'), 'pdf-stamp-database-selector');
  assert(appSource.includes('TOP_MENU_ICONS.pdfStamp') && appSource.includes('PDF STAMP'), 'pdf-stamp-menu');
  const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  assert(serverSource.includes("frame-src 'self' blob: data:"), 'csp-allows-pdf-blob-preview');
  const ordersSource = fs.readFileSync(path.join(ROOT, 'orders.html'), 'utf8');
  assert(ordersSource.includes('Hashcod - Service Order Request') && ordersSource.includes('Pedido y solicitud de servicios') && ordersSource.includes('hashcod_service_orders') && ordersSource.includes('402-0936929-3'), 'orders-page-standalone');
  assert(ordersSource.includes('const HASHCOD_FIXED_DISCOUNT = 2') && ordersSource.includes('const HASHCOD_FIXED_TAX = 18') && ordersSource.includes('readonly aria-readonly="true"'), 'orders-fixed-tax-discount');
  assert(ordersSource.includes('data/catalog.js?v=orders-catalog-1') && ordersSource.includes('const catalogCodeServices =') && ordersSource.includes('10,000 cryptographic codes priced from Hashcod PDF'), 'orders-10000-code-pricing-options');
  assert(serverSource.includes("route === '/orders.html'") && serverSource.includes("route === '/pedidos.html'"), 'orders-page-public-route');
  const castorSource = fs.readFileSync(path.join(ROOT, 'castor.html'), 'utf8');
  const castorAliasSource = fs.readFileSync(path.join(ROOT, 'juego-castor.html'), 'utf8');
  assert(castorSource.includes('Castor Castor') && castorSource.includes('requestAnimationFrame(tick)') && castorSource.includes('scoreError') && castorSource.includes('Cronometro') && castorSource.includes('50% de descuento') && castorSource.includes('HASHCOD-CASTOR-50') && castorSource.includes('activateTrap') && castorSource.includes('SLOW+') && castorSource.includes('SAFE+') && castorSource.includes('repelFromTarget') && castorSource.includes('shiftTargetAway'), 'castor-game-standalone');
  assert(castorAliasSource.includes('/castor.html') && serverSource.includes("route === '/castor.html'") && serverSource.includes("route === '/juego-castor.html'"), 'castor-game-public-route');
  const blindSpotSource = fs.readFileSync(path.join(ROOT, 'blind-spot-shell.html'), 'utf8');
  const blindSpotAliasSource = fs.readFileSync(path.join(ROOT, 'blindspot.html'), 'utf8');
  const blindSpotSwSource = fs.readFileSync(path.join(ROOT, 'blind-spot-sw.js'), 'utf8');
  assert(blindSpotSource.includes('Blind spot shell') && blindSpotSource.includes('navigator.clipboard.readText') && blindSpotSource.includes("indexedDB.open(DB_NAME") && blindSpotSource.includes("serviceWorker.register('/blind-spot-sw.js?v=device-sync-live-1')"), 'blind-spot-shell-offline-office');
  assert(blindSpotSource.includes('Modo escucha') && blindSpotSource.includes('paste-box') && blindSpotSource.includes('exportRecords') && blindSpotSource.includes('phone-shell'), 'blind-spot-shell-mobile-clipboard');
  assert(blindSpotSource.includes('NDEFReader') && blindSpotSource.includes('BarcodeDetector') && blindSpotSource.includes('blind-spot-shell-transfer') && blindSpotSource.includes('USB import'), 'blind-spot-shell-offline-bridge');
  assert(blindSpotSource.includes('access-qr-dock') && blindSpotSource.includes('access-qr-inline') && blindSpotSource.includes('blind-spot-shell-access') && blindSpotSource.includes('renderAccessQr') && blindSpotSource.includes('BSS-ACCESS-'), 'blind-spot-shell-access-qr');
  assert(blindSpotSource.includes('rel="icon"') && blindSpotSource.includes('/app/hashcod-platform-icon.svg?v=hashcod-tab-1'), 'blind-spot-shell-favicon');
  assert(blindSpotSource.includes('microOfflineShell') && blindSpotSource.includes('data:text/html;charset=utf-8') && blindSpotSource.includes('BSS-MICRO-') && blindSpotSource.includes('copyMicroShellLink'), 'blind-spot-shell-true-offline-micro-qr');
  assert(blindSpotSource.includes('SYNC_CHANNEL') && blindSpotSource.includes('/api/device-sync') && blindSpotSource.includes('syncNowBtn') && blindSpotSource.includes('applySyncEvent'), 'blind-spot-shell-device-sync');
  assert(blindSpotSource.includes('Conexion viva laptop + telefono') && blindSpotSource.includes('requestNotificationAccess') && blindSpotSource.includes('showSystemNotification') && blindSpotSource.includes('announceRemoteClip'), 'blind-spot-shell-live-notifications');
  assert(serverSource.includes('async function handleDeviceSync') && serverSource.includes("routePath === '/api/device-sync'") && serverSource.includes('DEVICE_SYNC_FILE'), 'blind-spot-shell-device-sync-api');
  assert(blindSpotSwSource.includes('blind-spot-shell-v6') && blindSpotSwSource.includes('/blind-spot-shell.html') && blindSpotSwSource.includes('/app/hashcod-platform-icon.svg') && blindSpotSwSource.includes('/vendor/qrcode.min.js') && blindSpotSwSource.includes('notificationclick') && blindSpotSwSource.includes('fetch(event.request).then'), 'blind-spot-shell-service-worker');
  assert(blindSpotAliasSource.includes('/blind-spot-shell.html') && serverSource.includes("route === '/blind-spot-shell.html'") && serverSource.includes("route === '/blindspot.html'") && serverSource.includes("route === '/blind-spot-sw.js'"), 'blind-spot-shell-public-route');
  assert(serverSource.includes('async function handleBrandEvidence') && serverSource.includes("['brand-evidence'"), 'brand-evidence-persistent-api');
  assert(appSource.includes('const CodeRegistryTableDialog =') && appSource.includes("authFetch('/api/code-registry'"), 'code-registry-dialog');
  assert(appSource.includes('TOP_MENU_ICONS.codeRegistry') && appSource.includes('CODE REGISTRY'), 'code-registry-menu');
  assert(serverSource.includes('async function handleCodeRegistry') && serverSource.includes("routePath === '/api/code-registry'"), 'code-registry-persistent-api');
  assert(serverSource.includes('codeRegistryAudit') && serverSource.includes('GENESIS') && serverSource.includes('hashSha256'), 'code-registry-chained-audit');
  assert(indexSource.includes('hashcod-docuseal-adapter.js?v=1.0.0'), 'docuseal-adapter-runtime');
  assert(appSource.includes('const DocusealSignerDialog =') && appSource.includes('HashcodDocuSealAdapter.signPdf'), 'docuseal-signer-dialog');
  assert(appSource.includes('signedPreviewUrl') && appSource.includes('Vista firmada') && appSource.includes('signedPreviewUrl || previewUrl') && appSource.includes('<iframe key={signedPreviewUrl || previewUrl}') && appSource.includes('zoom=page-width'), 'docuseal-live-signed-preview');
  assert(appSource.includes('TOP_MENU_ICONS.docusealSigner') && appSource.includes('DOCUSEAL SIGNER'), 'docuseal-signer-menu');
  assert(appSource.includes('Download source code') && appSource.includes('AGPL-3.0') && appSource.includes('DocuSeal attribution retained'), 'docuseal-visible-source-disclosure');
  assert(fs.existsSync(path.join(ROOT, 'public-source/hashcod-docuseal-tool-source.zip')), 'docuseal-source-download');
  assert(indexSource.includes('hashcod-warp-workspace.js?v=1.1.0'), 'warp-workspace-runtime');
  assert(appSource.includes('const WarpWorkspaceDialog =') && appSource.includes('HashcodWarpWorkspace') && appSource.includes('sandbox=\"allow-scripts\"'), 'warp-workspace-dialog');
  assert(appSource.includes('template <language>') && appSource.includes('setActiveLanguage') && appSource.includes('warp-preview'), 'warp-multilanguage-ui');
  assert(fs.readFileSync(path.join(ROOT, 'public-source/hashcod-warp-tool/app/hashcod-warp-workspace.js'), 'utf8').includes('LANGUAGE_PROFILES') && fs.readFileSync(path.join(ROOT, 'public-source/hashcod-warp-tool/app/hashcod-warp-workspace.js'), 'utf8').includes('compilePlan'), 'warp-multilanguage-adapter');
  assert(appSource.includes("if (plan?.mode === 'sandbox')") && !appSource.includes("plan?.mode === 'sandbox' || /\\.m?js$/i.test(activeFile.name)"), 'warp-run-respects-selected-language');
  assert(appSource.includes('TOP_MENU_ICONS.warpWorkspace') && appSource.includes('WARP WORKSPACE'), 'warp-workspace-menu');
  assert(appSource.includes('AGPL-3.0 + MIT') && appSource.includes('Warp upstream') && appSource.includes('Download source code'), 'warp-visible-source-disclosure');
  assert(stylesSource.includes('.warp-dlg') && stylesSource.includes('.warp-terminal'), 'warp-workspace-css');
  assert(fs.existsSync(path.join(ROOT, 'public-source/hashcod-warp-tool/LICENSE-AGPL')) && fs.existsSync(path.join(ROOT, 'public-source/hashcod-warp-tool/LICENSE-MIT')), 'warp-license-files');
  assert(fs.existsSync(path.join(ROOT, 'public-source/hashcod-warp-tool-source.zip')), 'warp-source-download');

  console.log('ENTERPRISE SELFTEST OK');
})().catch(err => {
  console.error(`ENTERPRISE SELFTEST FAIL: ${err.message}`);
  process.exit(1);
});
