const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/../../components/admin-device.js', 'utf8');
async function runScenario({ipAllowed = true, authenticated = false, cancel = false, rejected = false, force = false, mixed = false} = {}) {
    const calls = [], alerts = [], prompts = [];
    const context = {
        document: {documentElement: {dataset: {}}, getElementById: () => null},
        sessionStorage: {removeItem() {}},
        navigator: {credentials: {get: async options => {
            prompts.push(options);
            if (cancel) throw Object.assign(new Error('cancelled'), {name:'NotAllowedError'});
            return {id:'enrolled',type:'public-key',response:{clientDataJSON:new Uint8Array([1,2]),authenticatorData:new Uint8Array([3,4]),signature:new Uint8Array([5,6])}};
        }}},
        alert: message => alerts.push(message),
        setTimeout: () => 1, clearTimeout() {}, Uint8Array,
        atob: value => Buffer.from(value, 'base64').toString('binary'),
        btoa: value => Buffer.from(value, 'binary').toString('base64'),
        fetch: async (url, options) => {
            calls.push({url, options});
            assert.equal(options.credentials, 'same-origin');
            assert.equal(options.cache, 'no-store');
            let data = {ok:true};
            if (url.endsWith('/status')) Object.assign(data, {ipAllowed,authenticated});
            if (url.endsWith('/challenge')) Object.assign(data, {challenge:'YWJj',credentialId:'ZGVm',rpId:'hashcod-codespace-1.onrender.com'});
            if (url.endsWith('/verify')) Object.assign(data, rejected ? {ok:false,error:'denied'} : {expiresIn:600});
            return {ok:data.ok, json:async () => data};
        }
    };
    context.window = context;
    context.PublicKeyCredential = function () {};
    vm.runInNewContext(source,context);
    await new Promise(resolve => setImmediate(resolve));
    const results = await Promise.all([context.HashcodAdmin.require({force: mixed ? false : force}),context.HashcodAdmin.require({force})]);
    return {calls, alerts, prompts, results, context};
}
(async () => {
    let test = await runScenario({ipAllowed:false});
    assert.deepEqual(test.results,[false,false]); assert.equal(test.prompts.length,0);
    assert.equal(test.context.document.documentElement.dataset.adminIp,'denied');
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'false');

    test = await runScenario();
    assert.deepEqual(test.results,[true,true]); assert.equal(test.prompts.length,1);
    assert.equal(test.prompts[0].publicKey.userVerification,'required');
    assert.equal(test.prompts[0].publicKey.allowCredentials[0].transports[0],'internal');
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    test = await runScenario({cancel:true});
    assert.deepEqual(test.results,[false,false]);
    assert.equal(test.calls.filter(x=>x.url.endsWith('/verify')).length,0);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'false');

    test = await runScenario({rejected:true});
    assert.deepEqual(test.results,[false,false]);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'false');

    test = await runScenario({authenticated:true});
    assert.deepEqual(test.results,[true,true]); assert.equal(test.prompts.length,0);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    test = await runScenario({authenticated:true, force:true});
    assert.deepEqual(test.results,[true,true]); assert.equal(test.prompts.length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    test = await runScenario({authenticated:true, force:true, mixed:true});
    assert.deepEqual(test.results,[true,true]); assert.equal(test.prompts.length,1);
    assert.equal(test.context.document.documentElement.dataset.adminAuthenticated,'true');

    console.log('PASS: browser gate denies wrong IP, cancelled Hello and server rejection; hidden admin tools activate only after a valid Windows Hello session');
})().catch(error => {console.error(error); process.exitCode=1;});
