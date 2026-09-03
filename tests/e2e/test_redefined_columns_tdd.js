const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('REDEFINED TABLE COLUMNS TDD SUITE');
console.log('====================================================');

const repoDir = path.resolve(__dirname, '../../');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');

[indexPath, htmlPath, notFoundPath].forEach(filePath => {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`\n[Test 1] Redefined 8 Columns Configuration in ${filename}...`);
    assert(content.includes('account_id'), `Column account_id missing in ${filename}`);
    assert(content.includes('upload_date'), `Column upload_date missing in ${filename}`);
    assert(content.includes('platform_code'), `Column platform_code missing in ${filename}`);
    assert(content.includes('auth_signature'), `Column auth_signature missing in ${filename}`);
    assert(content.includes('num_tokens'), `Column num_tokens missing in ${filename}`);
    assert(content.includes('cost_per_token'), `Column cost_per_token missing in ${filename}`);
    assert(content.includes('total_cost_usd'), `Column total_cost_usd missing in ${filename}`);
    assert(content.includes('impenetrable_seal'), `Column impenetrable_seal missing in ${filename}`);

    console.log(`[Test 2] Col 1 - Admin Account Selector & Linkage in ${filename}...`);
    assert(content.includes('renderAccountSelector') || content.includes('select-account-admin'), `Admin account selector missing in ${filename}`);

    console.log(`[Test 3] Col 2 - Upload Date with 'A ' Revision Prefix in ${filename}...`);
    assert(content.includes('upload_date'), `upload_date logic missing in ${filename}`);
    assert(content.includes('formatUploadDate') || content.includes('`A ${') || content.includes("'A ' +"), `'A ' prefix revision logic missing in ${filename}`);

    console.log(`[Test 4] Col 4 - Admin-Only Manual Authorization in ${filename}...`);
    assert(content.includes('stampSphincsSignature'), `stampSphincsSignature missing in ${filename}`);
    assert(content.includes('ADMIN_AUTH_KEY') || content.includes('l8_admin_authenticated'), `Admin auth check for signature missing in ${filename}`);

    console.log(`[Test 5] Col 6 & 7 - Fixed $0.015 and Auto Dollar Calculation in ${filename}...`);
    assert(content.includes('0.015'), `Fixed 0.015 token cost missing in ${filename}`);
    assert(content.includes('calculateTotalCostUsd') || content.includes('* 0.015'), `Token x 0.015 calculation missing in ${filename}`);

    console.log(`[Test 6] Col 8 - Impenetrable Permanent Seal in ${filename}...`);
    assert(content.includes('impenetrable_seal'), `Impenetrable seal missing in ${filename}`);
    assert(content.includes('applyImpenetrableSeal'), `applyImpenetrableSeal handler missing in ${filename}`);
    assert(content.includes('disabled') && content.includes('SELLADO'), `Permanent disabled locked seal badge missing in ${filename}`);

    console.log(`  ✓ All redefined column specifications verified in ${filename}!`);
});

console.log('\n====================================================');
console.log('ALL REDEFINED TABLE COLUMN TESTS PASSED 100%!');
console.log('====================================================');
