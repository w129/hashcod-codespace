'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const main = fs.readFileSync(path.join(root, 'local-app/desktop/main.js'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'desktop-runtime.php'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'admin-device.php'), 'utf8');
const turnstile = fs.readFileSync(path.join(root, 'cloudflare-turnstile.php'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'components/cloud-device-sync.js'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/desktop-release.yml'), 'utf8');

function check(label, fn) {
    try {
        fn();
        console.log('✓ ' + label);
    } catch (error) {
        console.error('✗ ' + label + ': ' + error.message);
        process.exitCode = 1;
    }
}

check('desktop bridge uses a per-process cryptographic token', () => {
    assert(main.includes("crypto.randomBytes(32).toString('hex')"));
    assert(main.includes("requestHeaders['X-Hashcod-Desktop-Token'] = token"));
    assert(runtime.includes('function hashcodDesktopBridgeValid(): bool'));
    assert(runtime.includes("hash_equals($expected, $provided)"));
    assert(runtime.includes("$remote === '127.0.0.1' || $remote === '::1'"));
});

check('desktop renderer gets only the capabilities the local product needs', () => {
    assert(main.includes("'media'"));
    assert(main.includes("'clipboard-read'"));
    assert(main.includes('setPermissionRequestHandler'));
    assert(main.includes('setPermissionCheckHandler'));
    assert(main.includes("'Permissions-Policy', 'camera=(self), microphone=(self)"));
    assert(main.includes("frame-src 'self' https:"));
});

check('desktop mode is explicitly marked and stale web assets are cleared', () => {
    assert(main.includes("dataset.hashcodDesktop = 'true'"));
    assert(main.includes('window.__HASHCOD_DESKTOP__ = true'));
    assert(main.includes("window.turnstileTokens.register = 'desktop-loopback'"));
    assert(main.includes('session.defaultSession.clearCache()'));
});

check('admin-only tools remain protected on web but are available in the trusted desktop shell', () => {
    assert(admin.includes("require_once __DIR__ . '/desktop-runtime.php'"));
    assert(admin.includes('if (hashcodDesktopBridgeValid()) return true;'));
    assert(admin.includes("'authMode'=>$desktop ? 'desktop-loopback-bridge' : 'windows-hello'"));
    assert(admin.includes("ADMIN_DEVICE_NETWORK = '38.196.115.0/24'"));
});

check('Turnstile is bypassed only for authenticated desktop loopback requests', () => {
    assert(turnstile.includes('if (hashcodDesktopBridgeValid())'));
    assert(turnstile.includes("'desktop' => true"));
    assert(turnstile.includes("'desktop_bypass' => hashcodDesktopBridgeValid()"));
    assert(turnstile.includes('Turnstile omitido dentro de la aplicación de escritorio autenticada.'));
});

check('desktop keeps local persistence functional if cloud services are offline or unconfigured', () => {
    assert(sync.includes('localOnly: false'));
    assert(sync.includes("state.scope = 'desktop-local'"));
    assert(sync.includes("phase: 'local-only'"));
    assert(sync.includes('await refreshLocalSurfaces()'));
    assert(sync.includes('if (isDesktopMode())'));
});

check('Windows package carries broader PHP runtime and executes a real local backend smoke test', () => {
    for (const extension of ['curl', 'fileinfo', 'mbstring', 'openssl', 'zip', 'gd', 'intl', 'sodium']) {
        assert(workflow.includes(extension), 'missing PHP extension ' + extension);
    }
    assert(workflow.includes('Smoke test local PHP desktop backend'));
    assert(workflow.includes('/api/admin-device/status'));
    assert(workflow.includes('/api/cloudflare/turnstile/config'));
    assert(workflow.includes('Desktop local backend smoke test: OK'));
});

if (process.exitCode) process.exit(process.exitCode);
console.log('Desktop runtime full-functionality contract: OK');
