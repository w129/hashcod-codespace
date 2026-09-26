const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(root, 'components/platform-crm.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'components/platform-crm.css'), 'utf8');
const hosted = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(root, 'laragon-local-entry.php'), 'utf8');
const security = fs.readFileSync(path.join(root, 'security.php'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/DESKCOMM_CRM_INTEGRATION.md'), 'utf8');

assert(js.includes("hashcodPlatformCrmButton"), 'CRM topbar button id missing');
assert(js.includes("M18.841,5.791"), 'provided blue CRM SVG path missing');
assert(js.includes("fill=\"#22A0E0\""), 'primary CRM icon blue missing');
assert(js.includes("fill=\"#1E8BC3\""), 'secondary CRM icon blue missing');
assert(js.includes("document.querySelectorAll('.tb-slot[id], .tb-slot[data-slot]')"), 'Toolbox circle discovery missing');
assert(js.includes("hashcod-sync.php?action=links.pull"), 'cloud Toolbox slot discovery missing');
assert(js.includes("{ id: 'nuevo', label: 'Nuevo' }"), 'CRM pipeline stage Nuevo missing');
assert(js.includes("{ id: 'negociacion', label: 'Negociación' }"), 'CRM pipeline stage Negociación missing');
assert(js.includes("{ id: 'ganado', label: 'Ganado' }"), 'CRM pipeline stage Ganado missing');
assert(js.includes("owner"), 'CRM owner field missing');
assert(js.includes("contact"), 'CRM contact field missing');
assert(js.includes("nextAction"), 'CRM next-action field missing');
assert(js.includes("notes"), 'CRM notes field missing');
assert(js.includes("HASHCOD_DESKCOMM_CRM_URL"), 'Deskcomm URL bridge missing');
assert(js.includes("hcrmDeskcommFrame"), 'Deskcomm iframe bridge missing');
assert(js.includes("ABRIR APARTE"), 'Deskcomm external fallback missing');

assert(css.includes("#hashcodPlatformCrmButton.hashcod-platform-crm-button"), 'topbar CRM styling missing');
assert(css.includes("flex:0 0 32px!important"), 'CRM button must resist flex collapse');
assert(js.includes("button.style.setProperty(pair[0], pair[1], 'important')"), 'CRM button needs inline critical geometry fallback');
assert(js.includes("window.openHashcodPlatformCRM = open"), 'direct CRM open fallback missing');
assert(css.includes(".hashcod-platform-crm-modal"), 'CRM modal styling missing');
assert(css.includes(".hcrm-board"), 'CRM board styling missing');
assert(css.includes(".hcrm-deskcomm"), 'Deskcomm tab styling missing');

assert(hosted.includes("hashcod-platform-crm-inline"), 'production must inline the current CRM CSS/JS to defeat stale cache');
assert(hosted.includes("$inlinePlatformCrmCssTag"), 'production inline CRM CSS tag missing');
assert(hosted.includes("$inlinePlatformCrmJsTag"), 'production inline CRM JS tag missing');
assert(hosted.includes("components/platform-crm.css?v=20260926-platformcrm4"), 'production CRM CSS fallback missing');
assert(hosted.includes("components/platform-crm.js?v=20260926-platformcrm4"), 'production CRM JS fallback missing');
assert(hosted.includes("DESKCOMM_CRM_URL"), 'production Deskcomm env bridge missing');
assert(local.includes("components/platform-crm.css?v=20260926-platformcrm4"), 'local CRM CSS loader missing');
assert(local.includes("components/platform-crm.js?v=20260926-platformcrm4"), 'local CRM JS loader missing');

assert(security.includes("function securityDeskcommFrameSource()"), 'Deskcomm CSP origin helper missing');
assert(security.includes("securityDeskcommFrameSource() !== ''"), 'Deskcomm CSP allowlist not wired');
assert(!security.includes("frame-src 'self' https:;"), 'CSP must not broadly allow every HTTPS iframe');

assert(docs.includes("DeskcommCRM"), 'Deskcomm attribution docs missing');
assert(docs.includes("MIT"), 'Deskcomm MIT attribution missing');

console.log('✓ Hashcod Platform CRM + DeskcommCRM bridge contract verified');
