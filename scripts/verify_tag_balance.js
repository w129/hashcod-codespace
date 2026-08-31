const fs = require('fs');
const path = require('path');

// Sync static HTML files first
require('./sync_static_html.js');

const files = ['index.php', 'index.html', '404.html'];

files.forEach(f => {
    const filePath = path.resolve(__dirname, '..', f);
    const content = fs.readFileSync(filePath, 'utf8');

    // Strip scripts, styles, and PHP tags to evaluate DOM markup only
    const domOnly = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '')
        .replace(/<\?php[\s\S]*?\?>/gis, '');

    const openHtml = (domOnly.match(/<html\b[^>]*>/gi) || []).length;
    const closeHtml = (domOnly.match(/<\/html>/gi) || []).length;
    const openHead = (domOnly.match(/<head\b[^>]*>/gi) || []).length;
    const closeHead = (domOnly.match(/<\/head>/gi) || []).length;
    const openBody = (domOnly.match(/<body\b[^>]*>/gi) || []).length;
    const closeBody = (domOnly.match(/<\/body>/gi) || []).length;
    const openDiv = (domOnly.match(/<div\b[^>]*>/gi) || []).length;
    const closeDiv = (domOnly.match(/<\/div>/gi) || []).length;

    console.log(`\n--- Tag Balance Report for ${f} ---`);
    console.log(`<html> open: ${openHtml}, close: ${closeHtml} -> ${openHtml === 1 && closeHtml === 1 ? 'BALANCED (1/1)' : 'MISMATCH'}`);
    console.log(`<head> open: ${openHead}, close: ${closeHead} -> ${openHead === 1 && closeHead === 1 ? 'BALANCED (1/1)' : 'MISMATCH'}`);
    console.log(`<body> open: ${openBody}, close: ${closeBody} -> ${openBody === 1 && closeBody === 1 ? 'BALANCED (1/1)' : 'MISMATCH'}`);
    console.log(`<div>  open: ${openDiv}, close: ${closeDiv} -> ${openDiv === closeDiv ? `BALANCED (${openDiv}/${closeDiv})` : `MISMATCH (Diff: ${openDiv - closeDiv})`}`);
});
