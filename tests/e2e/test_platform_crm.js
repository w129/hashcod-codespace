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

assert(js.includes("20260927-platform-crm6"), 'CRM v5 runtime missing');
assert(js.includes("hashcodPlatformCrmButton"), 'CRM topbar button missing');
assert(js.includes("fill=\"#22A0E0\""), 'primary CRM icon blue missing');
assert(js.includes("fill=\"#1E8BC3\""), 'secondary CRM icon blue missing');

assert(js.includes("attachShadow({mode:'open'})"), 'CRM must isolate its window with Shadow DOM');
assert(js.includes("var SHADOW_CSS ="), 'isolated CRM visual system missing');
assert(js.includes("function isOccupiedSlot(node)"), 'occupied Toolbox detection missing');
assert(!js.includes("node.children.length > 0"), 'CRM must not treat every visual slot as occupied');
assert(js.includes("data-tool-id"), 'Toolbox tool-id detection missing');
assert(js.includes("hashcod-sync.php?action=links.pull"), 'cloud occupied-slot sync missing');

assert(js.includes("['nuevo', 'Nuevo']"), 'Nuevo stage missing');
assert(js.includes("['contactado', 'Contactado']"), 'Contactado stage missing');
assert(js.includes("['demo', 'Demo']"), 'Demo stage missing');
assert(js.includes("['negociacion', 'Negociación']"), 'Negociación stage missing');
assert(js.includes("['ganado', 'Ganado']"), 'Ganado stage missing');
assert(js.includes("['pausado', 'Pausado']"), 'Pausado stage missing');

assert(js.includes("draggable=\"true\""), 'CRM cards must support drag and drop');
assert(js.includes("addEventListener('drop'"), 'pipeline stage drop handler missing');
assert(js.includes("data-action=\"add\""), 'manual platform creation missing');
assert(js.includes("data-action=\"save-detail\""), 'record editing missing');
assert(js.includes("data-action=\"delete-record\""), 'record deletion missing');
assert(js.includes("hashcod_platform_crm_v2"), 'v2 CRM persistence missing');
assert(js.includes("localStorage.removeItem(LEGACY_KEY)"), 'legacy 64-slot cleanup missing');
assert(js.includes("HASHCOD_DESKCOMM_CRM_URL"), 'Deskcomm bridge missing');
assert(js.includes("iframe"), 'Deskcomm embedded view missing');

assert(css.includes("#hashcodPlatformCrmButton.hashcod-platform-crm-button"), 'launcher styling missing');
assert(css.includes("flex:0 0 32px!important"), 'launcher anti-collapse rule missing');
assert(css.includes("#hashcodPlatformCrmModal[hidden]"), 'CRM host hide contract missing');

assert(hosted.includes("hashcod-platform-crm-inline"), 'production must inline CRM runtime/styles');
assert(hosted.includes("$inlinePlatformCrmCssTag"), 'production inline CRM CSS missing');
assert(hosted.includes("$inlinePlatformCrmJsTag"), 'production inline CRM JS missing');
assert(hosted.includes("components/platform-crm.css?v=20260927-platformcrm6"), 'production CRM CSS fallback version stale');
assert(hosted.includes("components/platform-crm.js?v=20260927-platformcrm6"), 'production CRM JS fallback version stale');
assert(local.includes("components/platform-crm.css?v=20260927-platformcrm6"), 'local CRM CSS version stale');
assert(local.includes("components/platform-crm.js?v=20260927-platformcrm6"), 'local CRM JS version stale');

assert(security.includes("function securityDeskcommFrameSource()"), 'Deskcomm CSP helper missing');
assert(security.includes("securityDeskcommFrameSource() !== ''"), 'Deskcomm CSP allowlist not wired');
assert(docs.includes("DeskcommCRM"), 'Deskcomm integration documentation missing');
assert(docs.includes("MIT"), 'Deskcomm MIT attribution missing');

console.log('✓ Platform CRM v5 isolated functional contract verified');
