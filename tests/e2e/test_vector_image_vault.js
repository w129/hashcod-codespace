const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/vector-image-vault.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/vector-image-vault.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');
const tray = fs.readFileSync(path.join(repoDir, 'components/platform-entry-slogan.js'), 'utf8');

assert(source.includes("const DB_NAME = 'hashcod_image_vault_v1'"), 'PNG vault IndexedDB namespace missing');
assert(source.includes("const STORE_NAME = 'images'"), 'PNG vault image store missing');
assert(source.includes('window.indexedDB.open'), 'PNG vault must persist images in IndexedDB');
assert(source.includes("document.documentElement.dataset.adminAuthenticated === 'true'"), 'vault must read the platform Windows Hello verification state');
assert(source.includes('await window.HashcodAdmin.require()'), 'vault must require positive Windows Hello verification before protected upload actions');
assert(source.includes("window.addEventListener('hashcod:admin-auth'"), 'vault must stay synchronized with the platform Windows Hello session');
assert(source.includes('accept="image/png,.png"'), 'file chooser must be restricted to PNG');
assert(source.includes('async function hasPngSignature(file)'), 'PNG magic-byte validation missing');
assert(source.includes("const expected = [137, 80, 78, 71, 13, 10, 26, 10]"), 'PNG signature must be checked, not just the filename');
assert(source.includes("window.crypto.subtle.digest('SHA-256'"), 'save code must not be persisted as plaintext');
assert(source.includes('codeHash: codeHash'), 'stored records must contain the protected save-code hash');
assert(source.includes('suppliedHash !== record.codeHash'), 'download must reject an incorrect save code');
assert(source.includes('data-vault-download'), 'saved images must expose a protected download action');
assert(source.includes('URL.createObjectURL(record.blob)'), 'saved PNG files must be previewable in the gallery');
assert(source.includes("slot: 0"), 'PNG vault must attach to the first vector tray cube');
assert(source.includes("id: SLOT_ID"), 'PNG vault must replace the first cube behavior without changing its module identity');
assert(source.includes('onClick: openVault'), 'first tray cube must open the PNG vault');
assert(source.includes('MAX_FILE_BYTES = 15 * 1024 * 1024'), 'PNG size guard missing');
assert(!source.includes('localStorage.setItem'), 'image blobs and save-code hashes must not be written to localStorage');

assert(css.includes('#hashcodImageVaultOverlay'), 'PNG vault overlay style missing');
assert(css.includes('.hashcod-image-vault-gallery'), 'PNG gallery layout style missing');
assert(css.includes('.hashcod-image-vault-auth'), 'Windows Hello state style missing');
assert(css.includes('.hashcod-image-vault-code-dialog'), 'protected download code dialog style missing');

assert(loader.includes("vector-image-vault.css?v=20260911-1"), 'PNG vault stylesheet is not loaded by the platform');
assert(loader.includes("vector-image-vault.js?v=20260912-1"), 'PNG vault script is not loaded by the platform');
assert(loader.includes("platform-entry-slogan.js?v=20260922-force1"), 'tray script cache bust must include the current functional version');

assert(tray.includes('const HASHCOD_STORE_MODULE_ICON'), 'second tray icon constant missing');
assert(tray.includes('slot: 1'), 'second vector tray cube must be registered');
assert(tray.includes("id: 'store-module'"), 'second vector tray cube module id missing');
assert(tray.includes('iconSvg: HASHCOD_STORE_MODULE_ICON'), 'second vector tray cube must render the supplied store icon');

console.log('vector image vault contract: OK');