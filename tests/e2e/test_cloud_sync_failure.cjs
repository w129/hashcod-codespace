const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('components/cloud-device-sync.js', 'utf8');
async function scenario(status) {
    const events = [];
    const context = {
        navigator: {onLine: true},
        document: {addEventListener() {}},
        CustomEvent: function (name, options) {this.detail = options.detail;},
        fetch: async () => ({ok: true, status: 200, json: async () => status}),
        window: {addEventListener() {}, dispatchEvent(e) {events.push(e.detail);}, setTimeout() {}, setInterval() {}}
    };
    vm.runInNewContext(source, context);
    assert.equal(await context.window.HashcodCloudSync.syncNow(), false);
    assert.equal(context.window.HashcodCloudSync.status().lastSyncAt, 0);
    assert.equal(events.some(e => e.phase === 'complete'), false);
    assert.equal(events.at(-1).phase, 'error');
}
(async () => {
    await scenario({ok: true, supabase_configured: true, postgres: false});
    await scenario({ok: true, supabase_configured: false});
    console.log('PASS: unavailable persistence never reports a completed sync');
})().catch(error => {console.error(error); process.exitCode = 1;});
