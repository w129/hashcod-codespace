const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../../components/admin-device.js', 'utf8');

function fakeFile(name = 'test-admin-codekey.ipynb', notebook = {nbformat: 4, nbformat_minor: 5}) {
    const text = JSON.stringify(notebook);
    return {
        name,
        size: Buffer.byteLength(text),
        text: async () => text
    };
}

async function runScenario({ipAllowed = true, authenticated = false, rejected = false, force = false, mixed = false, file = fakeFile()} = {}) {
    const calls = [], alerts = [];
    const documentElement = {dataset: {}};
    const head = {appendChild() {}};
    const body = {appendChild() {}};
    const context = {
        document: {
            currentScript: {src: 'https://example.test/components/admin-device.js'},
            documentElement,
            head,
            body,
            getElementById: () => null,
            querySelector: () => null,
            createElement: () => ({
                dataset: {}, style: {}, files: [], hidden: false,
                setAttribute() {}, addEventListener() {}, remove() {}, click() {}
            })
        },
        sessionStorage: {removeItem() {}},
        alert: message => alerts.push(message),
        setTimeout: () => 1,
        clearTimeout() {},
        CustomEvent: function (name, init) { this.type = name; this.detail = init && init.detail; },
        MutationObserver: function () { this.observe = function () {}; },
        dispatchEvent() {},
        addEventListener() {},
        fetch: async (url, options) => {
            calls.push({url, options});
            assert.equal(options.credentials, 'same-origin');
            assert.equal(options.cache, 'no-store');
            let data = {ok:true};
            if (url.endsWith('/status')) Object.assign(data, {ipAllowed, authenticated, configured: true, authMode: 'codekey-ipynb'});
            if (url.endsWith('/verify')) {
                const payload = JSON.parse(options.body);
                assert.equal(payload.filename, file.name);
                assert.equal(payload.notebook.nbformat, 4);
                Object.assign(data, rejected ? {ok:false,error:'denied'} : {authenticated:true,expiresIn:600,authMode:'codekey-ipynb'});
            }
            return {ok:data.ok, json:async () => data};
        }
    };
    context.window = context;
    vm.runInNewContext(source, context);
    await new Promise(resolve => setImmediate(resolve));
    const firstOptions = {force: mixed ? false : force, file};
    const secondOptions = {force, file};
    const results = await Promise.all([
        context.HashcodAdmin.require(firstOptions),
        context.HashcodAdmin.require(secondOptions)
    ]);
    return {calls, alerts, results, context};
}

(async () => {
    let test = await runScenario({ipAllowed:false});
    assert.deepEqual(test.results,[false,false]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,0);
    assert.equal(test.context.document.documentElement.dataset.adminIp,'denied');
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'false');

    test = await runScenario();
    assert.deepEqual(test.results,[true,true]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');
    const verifyPayload = JSON.parse(test.calls.find(x=>x.url.endsWith('/verify')).options.body);
    assert.equal(verifyPayload.filename,'test-admin-codekey.ipynb');
    assert.equal(verifyPayload.notebook.nbformat,4);

    test = await runScenario({rejected:true});
    assert.deepEqual(test.results,[false,false]);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'false');
    assert.equal(test.alerts[0],'denied');

    test = await runScenario({authenticated:true, force:false});
    assert.deepEqual(test.results,[true,true]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,0);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    test = await runScenario({authenticated:true, force:true});
    assert.deepEqual(test.results,[true,true]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    test = await runScenario({authenticated:true, force:true, mixed:true});
    assert.deepEqual(test.results,[true,true]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    const badName = fakeFile('not-a-notebook.txt');
    test = await runScenario({file: badName});
    assert.deepEqual(test.results,[false,false]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,0);
    assert.match(test.alerts[0],/\.ipynb/);

    assert(!source.includes('navigator.credentials'), 'WebAuthn browser call must be removed from CodeKey gate');
    assert(source.includes("request('verify', { filename: file.name, notebook })"), 'CodeKey notebook must be sent to server verification');

    console.log('PASS: browser gate denies wrong IP and invalid files; admin tools activate only after server-verified CodeKey notebook session');
})().catch(error => {console.error(error); process.exitCode=1;});
