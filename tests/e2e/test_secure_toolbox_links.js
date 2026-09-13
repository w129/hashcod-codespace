'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const frontend = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.css'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'toolbox-secure.php'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');
const router = fs.readFileSync(path.join(root, 'router.php'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260913_create_secure_toolbox_links.sql'), 'utf8');

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

check('save and open both require the Dilithium gate', () => {
    assert(backend.includes("if ($action === 'save')"));
    assert(backend.includes("if ($action === 'open')"));
    assert(backend.includes('htlRequireSignature($body);'));
    assert(backend.includes('hash_equals($master, $signature)'));
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

check('protected URL and identity are not returned by public pull', () => {
    const publicList = backend.split('function htlPublicList(): array')[1].split('function htlSave')[0];
    assert(publicList.includes('slot_key,icon_svg,label,updated_at_ms'));
    assert(!publicList.includes("'url' =>"));
    assert(!publicList.includes("'identity' =>"));
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

check('new assets are cache-busted into the main PHP page', () => {
    assert(html.includes('toolbox-secure-links.css?v=20260913-1'));
    assert(html.includes('toolbox-secure-links.js?v=20260913-1'));
    assert(html.includes('vector-link-board-reconcile.js?v=20260913-6'));
});

check('router explicitly admits both secure Toolbox controller paths', () => {
    assert(router.includes("'/toolbox-secure.php'"));
    assert(router.includes("'/api/toolbox-secure'"));
    assert(router.includes("require __DIR__ . '/toolbox-secure.php'"));
});

check('Supabase schema is RLS protected and limited to 4x4 slots', () => {
    assert(migration.includes('create table if not exists public.hashcod_toolbox_links'));
    assert(migration.includes("slot_key ~ '^[1-4]-[1-4]$'"));
    assert(migration.includes('enable row level security'));
    assert(migration.includes('using (false) with check (false)'));
});

check('visual integration includes secure slot, modal and browser layers', () => {
    assert(styles.includes('.tb-slot.hashcod-secure-link-slot'));
    assert(styles.includes('.hsl-modal'));
    assert(styles.includes('.hsl-browser'));
    assert(styles.includes('.hsl-browser-identity'));
});

if (process.exitCode) process.exit(process.exitCode);
console.log('Secure Toolbox link static regression suite passed.');
