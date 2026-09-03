const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('TEXT EDITOR & ADMIN NOTIFICATIONS TDD SUITE');
console.log('====================================================');

const repoDir = path.resolve(__dirname, '../../');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');

[indexPath, htmlPath, notFoundPath].forEach(filePath => {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');

    console.log(`\n[Test 1] Column & Table Cell Button in ${filename}...`);
    assert(content.includes('user_text_data'), `Column user_text_data missing in ${filename}`);
    assert(content.includes('M15,3C8.373,3,3,8.373,3,15c0,6.627'), `User provided 30x30 SVG icon missing in ${filename}`);
    assert(content.includes('openTextEditorModal'), `openTextEditorModal handler missing in ${filename}`);

    console.log(`[Test 2] Confidentiality & Admin-Only Visibility in ${filename}...`);
    assert(content.includes('placeholder="${hasText'), `Masked password placeholder logic missing in ${filename}`);
    assert(content.includes('isAuthedAdmin ? (rowData.user_text_data || \'\') : \'\''), `Admin-only privacy check missing in openTextEditorModal in ${filename}`);

    console.log(`[Test 3] Notifications Dropdown Layering & z-index (In Front of Table) in ${filename}...`);
    assert(content.includes('z-index: 100060 !important;'), `z-index 100060 missing for notifications dropdown in ${filename}`);
    assert(content.includes('z-index: 50 !important;'), `z-index 50 missing for table-header-controls in ${filename}`);
    assert(content.includes('overflow: visible !important;'), `overflow visible missing in ${filename}`);

    console.log(`[Test 4] Text Editor Modal (600x734 Figma) in ${filename}...`);
    assert(content.includes('id="textEditorModal"'), `textEditorModal missing in ${filename}`);
    assert(content.includes('text-editor-modal'), `text-editor-modal CSS class missing in ${filename}`);
    assert(content.includes('width: 600px;'), `600px width missing in ${filename}`);
    assert(content.includes('height: 734px;'), `734px height missing in ${filename}`);
    assert(content.includes('id="textEditingArea"'), `textEditingArea missing in ${filename}`);
    assert(content.includes('id="textEditorSaveBtn"'), `Save button missing in ${filename}`);

    console.log(`[Test 5] Formatting Toolbar Tools (Atom Standard) in ${filename}...`);
    assert(content.includes('formatTextCmd'), `formatTextCmd toolbar function missing in ${filename}`);
    assert(content.includes('style-group'), `style-group missing in ${filename}`);
    assert(content.includes('alignment-group'), `alignment-group missing in ${filename}`);
    assert(content.includes('list-group'), `list-group missing in ${filename}`);

    console.log(`[Test 6] Admin Notifications Dropdown (450x250 Figma) in ${filename}...`);
    assert(content.includes('id="adminNotificationsDropdown"'), `adminNotificationsDropdown missing in ${filename}`);
    assert(content.includes('notifications-dropdown'), `notifications-dropdown class missing in ${filename}`);
    assert(content.includes('width: 450px;'), `450px width missing in ${filename}`);
    assert(content.includes('height: 250px;'), `250px height missing in ${filename}`);
    assert(content.includes('dropdown-arrow'), `dropdown-arrow missing in ${filename}`);
    assert(content.includes('id="adminNotifBellBtn"'), `Bell button in admin missing in ${filename}`);

    console.log(`[Test 7] Text Presentation Modal (550x634 Figma) in ${filename}...`);
    assert(content.includes('id="textPresentationModal"'), `textPresentationModal missing in ${filename}`);
    assert(content.includes('text-presentation-modal'), `text-presentation-modal class missing in ${filename}`);
    assert(content.includes('width: 550px;'), `550px width missing in ${filename}`);
    assert(content.includes('height: 634px;'), `634px height missing in ${filename}`);
    assert(content.includes('id="textPresentationDisplay"'), `textPresentationDisplay missing in ${filename}`);
    assert(content.includes('id="textPresentationCopyBtn"'), `Copy button missing in ${filename}`);

    console.log(`[Test 8] Platform Monitor Logo in Grey Circles in ${filename}...`);
    const countPlatformLogos = (content.match(/viewBox="0 0 470 440"/g) || []).length;
    assert(countPlatformLogos >= 4, `Platform logo in grey circles should appear across all modals (found ${countPlatformLogos}) in ${filename}`);

    console.log(`  ✓ All frontend requirements verified in ${filename}!`);
});

console.log('\n====================================================');
console.log('ALL TEXT EDITOR, NOTIFICATIONS & PRIVACY TESTS PASSED 100%!');
console.log('====================================================');
