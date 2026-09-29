const fs=require('fs'),assert=require('assert');

const gate=fs.readFileSync('mldsa-access.php','utf8');
const gateJs=fs.readFileSync('components/mldsa-access-gate.js','utf8');
const gateCss=fs.readFileSync('components/mldsa-access-gate.css','utf8');
const tracker=fs.readFileSync('components/device-usage-tracker.js','utf8');
const backend=fs.readFileSync('device-usage.php','utf8');
const router=fs.readFileSync('router.php','utf8');
const html=fs.readFileSync('l8-html.php','utf8');

assert(gate.includes('id="d5EntryUsageCard"'),'level-3 UsageQuotaCard missing');
assert(gate.includes('Usage this month'),'usage card title missing');
assert(gate.includes('>HSCUs</span>'),'HSCUs label missing');
assert(gate.includes('>Number of touches</span>'),'Number of touches label missing');
assert(gate.includes('id="d5EntryHscuProgress"')&&gate.includes('id="d5EntryTouchProgress"'),'usage progress bars missing');
assert(gateCss.includes('.entry-usage-card{')&&gateCss.includes('.entry-usage-track{')&&gateCss.includes('.entry-usage-progress{'),'usage card Spectrum-style CSS missing');

assert(gateJs.includes("ENTRY_USAGE_API=entryProductBasePath()+'/api/device-usage'"),'usage card API binding missing');
assert(gateJs.includes('function entryUsageLoad()'),'usage card refresh loader missing');
assert(gateJs.includes('function entryUsageRender(data)'),'usage card renderer missing');
assert(gateJs.includes('if(next===3)entryUsageLoad()'),'level 3 must refresh usage when opened');
assert(gateJs.includes('window.HashcodEntryUsageCard'),'usage card public controller missing');

assert(backend.includes("const HDU_COOKIE = 'hashcod_device_usage_v1'"),'signed device cookie name missing');
assert(backend.includes("hash_hmac('sha256', $payload, hduSecret(), true)"),'device identifier HMAC signature missing');
assert(backend.includes("'httponly' => true"),'device cookie must be HttpOnly');
assert(backend.includes("'samesite' => 'Lax'"),'device cookie SameSite protection missing');
assert(backend.includes("bin2hex(random_bytes(16))"),'device identifier must be cryptographically random');
assert(backend.includes("secretGet('HASHCOD_DEVICE_USAGE_SECRET', '')"),'dedicated signing secret override missing');
assert(!backend.includes("hashcod-device-usage-fallback', true"),'predictable device signing fallback must not exist');

assert(backend.includes("'hscu_half_units'"),'HSCU half-unit storage missing');
assert(backend.includes("$state['hscu_half_units']")&&backend.includes("+ 1"),'each entry must add one half-unit');
assert(backend.includes("$state['touches']")&&backend.includes("+ 1"),'each toolbox touch must increment by one');
assert(backend.includes("((int)($state['hscu_half_units'] ?? 0)) / 2"),'HSCUs must expose half-unit counter as increments of 0.5');
assert(backend.includes("const HDU_HSCU_LIMIT = 100.0"),'HSCU visual quota limit missing');
assert(backend.includes("const HDU_TOUCH_LIMIT = 1000"),'touch visual quota limit missing');
assert(backend.includes("hduNextResetIso()"),'monthly reset metadata missing');
assert(backend.includes("supabaseDbUpsert('l8_app_states'"),'per-device usage must persist to Supabase app state');
assert(backend.includes("data_storage/device_usage"),'per-device local fallback storage missing');
assert(backend.includes('recent_event_ids'),'event idempotency storage missing');
assert(backend.includes("if ($windowCount >= 120)"),'touch anti-abuse rate cap missing');

assert(tracker.includes("event.isTrusted===false"),'synthetic toolbox clicks must not count');
assert(tracker.includes("target.closest('.toolbox-panel .tb-slot')"),'Toolbox button selector missing');
assert(tracker.includes("post('touch')"),'Toolbox touch event tracking missing');
assert(tracker.includes("post('enter')"),'platform entry HSCU tracking missing');
assert(tracker.includes("window.addEventListener('hashcod:platform-entered',countEnter"),'platform-entered HSCU hook missing');
assert(tracker.includes("var queue=Promise.resolve()"),'usage writes must be serialized client-side');

assert(router.includes("'/api/device-usage'"),'device usage API route missing');
const routeIndex=router.indexOf("if ($bootstrapSyncPath === '/api/device-usage')");
const bootstrapIndex=router.indexOf("securityBootstrap('web');");
assert(routeIndex>=0&&routeIndex<bootstrapIndex,'device usage endpoint must be available before generic web bootstrap');
assert(html.includes('components/device-usage-tracker.js'),'platform usage tracker injection missing');

console.log('PASS: per-device HSCUs and Toolbox touch usage tracking contract verified');
