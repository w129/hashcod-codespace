const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const phpContent = fs.readFileSync(path.join(rootDir, 'index.php'), 'utf8');
const docTypeIndex = phpContent.indexOf('<!DOCTYPE html>');
if (docTypeIndex === -1) throw new Error('Could not find <!DOCTYPE html> in index.php');
let htmlContent = phpContent.slice(docTypeIndex);

// Replace only PHP's base-path bootstrap; preserve every stylesheet in the head.
const baseBootstrap = `<script>
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
    </script>`;
const phpBootstrap = /<script>window\.L8_BASE_PATH\s*=\s*<\?php[\s\S]*?\?>;<\/script>/;
if (!phpBootstrap.test(htmlContent)) throw new Error('PHP base bootstrap not found');
htmlContent = htmlContent.replace(phpBootstrap, baseBootstrap);
htmlContent = htmlContent.replace(/<base\b[^\n]*<\?php[^\n]*\?>[^\n]*>\s*/g, '');
htmlContent = htmlContent.replace(/<\?php\s+echo\s+htmlspecialchars\(\$L8_BASE,\s*ENT_QUOTES,\s*'UTF-8'\);\s*\?>/g, '');
// The site key is public; static hosting cannot evaluate PHP configuration.
htmlContent = htmlContent.replace(/<\?php echo htmlspecialchars\(function_exists\("cfTurnstileGetSiteKey"\) \? cfTurnstileGetSiteKey\(\) : "([^"]+)", ENT_QUOTES, "UTF-8"\); \?>/g, '$1');
if (/<\?(?:php|=)/.test(htmlContent)) throw new Error('Unconverted PHP remains in static HTML');
for (const name of ['index.html', '404.html']) {
    fs.writeFileSync(path.join(rootDir, name), htmlContent, 'utf8');
}
console.log('Static entry pages synchronized without removing platform styles.');
