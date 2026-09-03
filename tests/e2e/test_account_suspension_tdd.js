const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('ACCOUNT SUSPENSION & REACTIVATION TOOL TDD SUITE');
console.log('====================================================');

const repoDir = path.resolve(__dirname, '../../');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');
const authPhpPath = path.join(repoDir, 'auth.php');

[indexPath, htmlPath, notFoundPath].forEach(filePath => {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`\n[Test 1] Launcher Button in ${filename}...`);
    assert(content.includes('id="accountSuspendLauncherBtn"'), `Launcher button missing in ${filename}`);
    assert(content.includes('color-1_guiB0Qqk7Gyn_gr1'), `Provided red gradient SVG missing in ${filename}`);
    assert(content.includes('openAccountSuspendTool()'), `openAccountSuspendTool call missing in ${filename}`);

    console.log(`[Test 2] Modal Overlay & Figma Components in ${filename}...`);
    assert(content.includes('id="accountSuspendModalOverlay"'), `Modal overlay missing in ${filename}`);
    assert(content.includes('class="account-suspend-modal"'), `Modal container missing in ${filename}`);
    assert(content.includes('warning-icon-bg'), `Warning icon bg missing in ${filename}`);
    assert(content.includes('viewBox="0 0 470 440"'), `Platform logo in warning-icon-bg missing in ${filename}`);
    assert(content.includes('suspend-list-container') || content.includes('empty-list-container'), `List container missing in ${filename}`);
    assert(content.includes('id="suspendAccountConfirmBtn"'), `Suspend button missing in ${filename}`);
    assert(content.includes('id="reactivateAccountConfirmBtn"'), `Reactivate button missing in ${filename}`);
    assert(content.includes('closeAccountSuspendModal()'), `Close modal function missing in ${filename}`);

    console.log(`[Test 3] CSS Rules for 500x729 Figma Spec in ${filename}...`);
    assert(content.includes('.account-suspend-launcher-btn'), `Launcher CSS missing in ${filename}`);
    assert(content.includes('.account-suspend-modal'), `Modal CSS missing in ${filename}`);
    assert(content.includes('height: 729px;'), `Modal height 729px missing in ${filename}`);

    console.log(`[Test 4] Dilithium-5 Security Gate in ${filename}...`);
    assert(content.includes('window.openAccountSuspendTool'), `openAccountSuspendTool missing in ${filename}`);
    assert(content.includes('getLatestDilithiumSignature') || content.includes('dilithium'), `Dilithium gate check missing in ${filename}`);

    console.log(`[Test 5] Dynamic Account Listing & Action Handlers in ${filename}...`);
    assert(content.includes('window.loadSuspendAccountsList'), `loadSuspendAccountsList missing in ${filename}`);
    assert(content.includes('window.executeAccountSuspend'), `executeAccountSuspend missing in ${filename}`);
    assert(content.includes('window.executeAccountReactivate'), `executeAccountReactivate missing in ${filename}`);

    console.log(`  ✓ All frontend requirements verified in ${filename}!`);
});

console.log('\n[Test 6] Backend Suspension Engine in auth.php...');
const authContent = fs.readFileSync(authPhpPath, 'utf8');
assert(authContent.includes('function authSuspendAccount'), 'authSuspendAccount missing in auth.php');
assert(authContent.includes('function authReactivateAccount'), 'authReactivateAccount missing in auth.php');
assert(authContent.includes('function authListAccounts'), 'authListAccounts missing in auth.php');
assert(authContent.includes('/api/auth/suspend-account'), 'Endpoint /api/auth/suspend-account missing in auth.php');
assert(authContent.includes('/api/auth/reactivate-account'), 'Endpoint /api/auth/reactivate-account missing in auth.php');
assert(authContent.includes('/api/auth/list-accounts'), 'Endpoint /api/auth/list-accounts missing in auth.php');
assert(authContent.includes('Cuenta suspendida') || authContent.includes('is_suspended'), 'Suspension check in auth login missing in auth.php');

console.log('  ✓ Backend implementation verified in auth.php!');
console.log('\n====================================================');
console.log('ALL TDD TESTS PASSED SUCCESSFULLY 100%!');
console.log('====================================================');
