'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const kotlin = fs.readFileSync(path.join(root, 'local-app/native-kotlin/src/main/kotlin/app/hashcod/codespace/Main.kt'), 'utf8');
const kotlinBuild = fs.readFileSync(path.join(root, 'local-app/native-kotlin/build.gradle.kts'), 'utf8');
const swift = fs.readFileSync(path.join(root, 'local-app/native-swift/Sources/HashcodCodespace/App.swift'), 'utf8');
const swiftPackage = fs.readFileSync(path.join(root, 'local-app/native-swift/Package.swift'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'desktop-runtime.php'), 'utf8');
const router = fs.readFileSync(path.join(root, 'router.php'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/native-local-runtime.yml'), 'utf8');

function check(label, fn) {
    try {
        fn();
        console.log('✓ ' + label);
    } catch (error) {
        console.error('✗ ' + label + ': ' + error.message);
        process.exitCode = 1;
    }
}

check('Kotlin runtime replaces Electron responsibilities with a native WebView2/WebKit shell', () => {
    assert(kotlinBuild.includes('kotlin("jvm") version "2.4.20"'));
    assert(kotlinBuild.includes('cn.enaium.webview:webview-kmp-jvm:1.0.1'));
    assert(kotlin.includes('createWebview(debug = false)'));
    assert(kotlin.includes('SecureRandom()'));
    assert(kotlin.includes('127.0.0.1'));
    assert(kotlin.includes('HASHCOD_DESKTOP_ADMIN_TOKEN'));
    assert(kotlin.includes('/api/desktop/bootstrap'));
    for (const preserved of ['.env', 'LOCAL-DB-CREDENTIALS.txt', 'data_storage', 'uploads']) {
        assert(kotlin.includes(preserved), 'missing preserved path ' + preserved);
    }
});

check('Swift runtime provides the native Apple host with the same local contract', () => {
    assert(swiftPackage.includes('// swift-tools-version: 6.4'));
    assert(swift.includes('WKWebView'));
    assert(swift.includes('SecRandomCopyBytes'));
    assert(swift.includes('HASHCOD_DESKTOP_ADMIN_TOKEN'));
    assert(swift.includes('/api/desktop/bootstrap'));
    assert(swift.includes('127.0.0.1'));
});

check('native bridge uses an HttpOnly loopback bootstrap cookie without weakening Electron compatibility', () => {
    assert(runtime.includes("'hashcod_desktop_token'"));
    assert(runtime.includes("HTTP_X_HASHCOD_DESKTOP_TOKEN"));
    assert(runtime.includes('hash_equals($expected, $provided)'));
    assert(runtime.includes('function hashcodDesktopBootstrap(): void'));
    assert(router.includes("$bootstrapSyncPath === '/api/desktop/bootstrap'"));
    assert(router.indexOf("$bootstrapSyncPath === '/api/desktop/bootstrap'") < router.indexOf("securityBootstrap('web')"));
});

check('CI compiles both local runtimes and validates the bridge contract', () => {
    assert(workflow.includes('Build Kotlin native local runtime'));
    assert(workflow.includes('Build Swift native local runtime'));
    assert(workflow.includes('test_native_local_runtime_contract.js'));
    assert(workflow.includes('php -l desktop-runtime.php'));
    assert(workflow.includes('php -l router.php'));
});

if (process.exitCode) process.exit(process.exitCode);
console.log('Native Swift/Kotlin local runtime contract: OK');
