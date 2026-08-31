const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const phpPath = path.join(rootDir, 'index.php');
const htmlPath = path.join(rootDir, 'index.html');
const notFoundPath = path.join(rootDir, '404.html');

const phpContent = fs.readFileSync(phpPath, 'utf8');

// Find where <!DOCTYPE html> begins
const docTypeIndex = phpContent.indexOf('<!DOCTYPE html>');
if (docTypeIndex === -1) {
    console.error('Could not find <!DOCTYPE html> in index.php');
    process.exit(1);
}

let htmlContent = phpContent.slice(docTypeIndex);

// Replace PHP base script block in <head>
const oldHeadBaseRegex = /<script>window\.L8_BASE_PATH\s*=\s*<\?php[\s\S]*?<\/head>/i;
const newHeadBase = `<script>
    (function () {
      var host = (location.hostname || '').toLowerCase();
      var base = '/';
      if (host.indexOf('github.io') !== -1) {
        var parts = (location.pathname || '/').split('/').filter(Boolean);
        if (parts.length) base = '/' + parts[0] + '/';
      }
      window.L8_BASE_PATH = base;
      var b = document.createElement('base');
      b.href = base;
      var first = document.currentScript;
      if (first && first.parentNode) first.parentNode.insertBefore(b, first.nextSibling);
      else document.head.insertBefore(b, document.head.firstChild);
    })();
    </script>
    <link rel="icon" href="favicon.svg?v=10" type="image/svg+xml">
    <link rel="shortcut icon" href="favicon.svg?v=10" type="image/svg+xml">
    <link rel="apple-touch-icon" href="favicon.svg?v=10">
    <meta name="application-name" content="Hashcod codespace">
    <link rel="stylesheet" href="components/durable-objects.css?v=2026.1">
    <link rel="stylesheet" href="components/warp-terminal.css?v=2026.1">
    <link rel="stylesheet" href="components/polyglot-grid.css?v=2026.1">
</head>`;

htmlContent = htmlContent.replace(oldHeadBaseRegex, newHeadBase);

// Replace any remaining <?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>
htmlContent = htmlContent.replace(/<\?php\s+echo\s+htmlspecialchars\(\$L8_BASE,\s*ENT_QUOTES,\s*'UTF-8'\);\s*\?>/g, '');

// Write to index.html and 404.html
fs.writeFileSync(htmlPath, htmlContent, 'utf8');
fs.writeFileSync(notFoundPath, htmlContent, 'utf8');

console.log('Successfully synchronized index.html and 404.html from index.php');
console.log('index.html size:', fs.statSync(htmlPath).size, 'bytes');
console.log('404.html size:', fs.statSync(notFoundPath).size, 'bytes');
