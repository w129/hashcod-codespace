'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const frontend = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.css'), 'utf8');
const rescue = fs.readFileSync(path.join(root, 'components/toolbox-secure-ui-rescue.js'), 'utf8');
const signatureCopy = fs.readFileSync(path.join(root, 'components/toolbox-signature-copy.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'toolbox-secure.php'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');
const router = fs.readFileSync(path.join(root, 'router.php'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260913_create_secure_toolbox_links.sql'), 'utf8');
const accessMigration = fs.readFileSync(path.join(root, 'supabase/migrations/20260913_add_toolbox_access_signature_hash.sql'), 'utf8');

function check(name, fn) {
    try {
        fn();
        console.log('✓ ' + name);
    } catch (error) {
        console.error('✗ ' + name + ': ' + error.message);
        process.exitCode = 1;
    }
}

check('all real 4x4 Toolbox circles are intercepted', () => {
    assert(frontend.includes("const SLOT_SELECTOR = '.tb-slot[data-slot]'"));
    assert(frontend.includes("document.addEventListener('click'"));
    assert(frontend.includes('stopImmediatePropagation'));
});

check('each circle uses its own user-defined access signature', () => {
    assert(backend.includes('function htlHashSignature'));
    assert(backend.includes('password_hash'));
    assert(backend.includes('password_verify'));
    assert(backend.includes("'access_signature_hash' => $signatureHash"));
    assert(backend.includes('htlRequireStoredSignature($body, $row);'));
    assert(backend.includes('htlRequireStoredSignature($body, $existing);'));
    assert(!backend.includes('DILITHIUM5_ADMIN_SIGNATURE_EXACT'));
    assert(!backend.includes('hash_equals($master, $signature)'));
});

check('configuration writes remain Windows Hello admin protected', () => {
    const savePart = backend.split("if ($action === 'save')")[1] || '';
    const deletePart = backend.split("if ($action === 'delete')")[1] || '';
    assert(savePart.includes('adminRequire();'));
    assert(deletePart.includes('adminRequire();'));
});

check('SVG is sanitized on both client and server', () => {
    assert(frontend.includes('function sanitizeSvgClient'));
    assert(backend.includes('function htlSanitizeSvg'));
    assert(backend.includes('script|foreignObject|iframe|object|embed'));
    assert(backend.includes("stripos($svg, '<!DOCTYPE')"));
});

check('protected URL identity and signature hash are not returned by public pull', () => {
    const publicList = backend.split('function htlPublicList(): array')[1].split('function htlSave')[0];
    assert(publicList.includes('slot_key,icon_svg,label,updated_at_ms'));
    assert(!publicList.includes("'url' =>"));
    assert(!publicList.includes("'identity' =>"));
    assert(!publicList.includes('access_signature_hash'));
});

check('links open inside the Hashcod browser, never via window.open(destination)', () => {
    assert(frontend.includes('id="hslBrowserFrame"'));
    assert(frontend.includes('function openBrowser'));
    assert(!frontend.includes('window.open(body.url'));
    assert(frontend.includes('frame.src = state.frameUrl'));
});

check('Hashcod identity handoff is explicit and origin-scoped', () => {
    assert(frontend.includes('HASHCOD_IDENTITY_V1'));
    assert(frontend.includes('browserTargetOrigin'));
    assert(frontend.includes('postMessage'));
});

check('in-platform browser keeps top navigation sandboxed', () => {
    assert(frontend.includes('sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads"'));
    assert(!frontend.includes('allow-top-navigation'));
});

check('new assets are cache-busted and secure Toolbox has production fallbacks', () => {
    assert(html.includes('toolbox-secure-links.css?v=20260913-3'));
    assert(html.includes('toolbox-secure-links.js?v=20260913-4'));
    assert(html.includes('toolbox-signature-copy.js?v=20260913-2'));
    assert(html.includes('toolbox-secure-ui-rescue.js?v=20260913-1'));
    assert(html.includes('vector-link-board-reconcile.js?v=20260913-6'));
    assert(html.includes('hashcod-toolbox-secure-inline'));
    assert(html.includes('hashcod-toolbox-ui-rescue-inline'));
    assert(html.includes("file_get_contents($secureCssPath)"));
    assert(html.includes("file_get_contents($rescueJsPath)"));
});

check('signature UI tells users to choose and repeat their own signature', () => {
    assert(signatureCopy.includes('Elige cualquier firma secreta que quieras'));
    assert(signatureCopy.includes('Escribe la misma firma que elegiste'));
    assert(signatureCopy.includes('MISMA FIRMA DEL CÍRCULO'));
});

check('signature copy layer cannot leave a page-wide mutation loop running', () => {
    assert(signatureCopy.includes('if (applyCopy()) return;'));
    assert(signatureCopy.includes('observer.disconnect()'));
    assert(signatureCopy.includes("node.textContent !== value"));
});

check('rescue layer force-hides closed modals and browser', () => {
    assert(rescue.includes("el.style.setProperty('display', open ? 'grid' : 'none', 'important')"));
    assert(rescue.includes("browser.style.setProperty('display', browserOpen ? 'flex' : 'none', 'important')"));
    assert(rescue.includes('MutationObserver'));
    assert(rescue.includes('.hsl-modal.is-open'));
});

check('router explicitly admits both secure Toolbox controller paths', () => {
    assert(router.includes("'/toolbox-secure.php'"));
    assert(router.includes("'/api/toolbox-secure'"));
    assert(router.includes("require __DIR__ . '/toolbox-secure.php'"));
});

check('Supabase schema is RLS protected, limited to 4x4 slots and stores only signature hashes', () => {
    assert(migration.includes('create table if not exists public.hashcod_toolbox_links'));
    assert(migration.includes("slot_key ~ '^[1-4]-[1-4]$'"));
    assert(migration.includes('enable row level security'));
    assert(migration.includes('using (false) with check (false)'));
    assert(accessMigration.includes('access_signature_hash'));
    assert(accessMigration.includes('char_length(access_signature_hash) <= 255'));
});

check('visual integration includes secure slot, modal and browser layers', () => {
    assert(styles.includes('.tb-slot.hashcod-secure-link-slot'));
    assert(styles.includes('.hsl-modal'));
    assert(styles.includes('.hsl-browser'));
    assert(styles.includes('.hsl-browser-identity'));
});

if (process.exitCode) process.exit(process.exitCode);
console.log('Secure Toolbox link static regression suite passed.');
