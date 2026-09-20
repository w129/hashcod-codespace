'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const runtime = fs.readFileSync(path.join(root, 'components/toolbox-growth.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function run() {
    for (const filename of ['index.php', '404.html']) {
        const source = fs.readFileSync(path.join(root, filename), 'utf8');
        const markup = source.slice(source.indexOf('<!-- Panel Toolbox ('), source.indexOf('<!-- toolbox-growth-end -->'));
        const dom = new JSDOM('<div>' + markup, { runScripts: 'outside-only' });
        const { window } = dom;
        const { document } = window;
        window.eval(runtime);
        await flush();
        const count = () => document.querySelectorAll('.toolbox-panel').length;
        const active = () => document.querySelector('.toolbox-panel.active').dataset.toolboxPage;
        const fill = async (page, slots = 16) => {
            [...document.querySelectorAll('[data-toolbox-page="' + page + '"] .tb-slot')]
                .slice(0, slots).forEach(slot => slot.classList.add('is-filled'));
            await flush();
        };
        assert.equal(count(), 4);
        assert.equal(document.querySelector('#slot-1-1').getAttribute('onclick'), 'toggleExcelBlog()');
        await fill('1');
        assert.equal(count(), 4);
        await fill('4', 15);
        assert.equal(count(), 4);
        await fill('4');
        assert.equal(count(), 5);
        assert.equal(document.querySelectorAll('#toolboxPanel5 .tb-slot').length, 16);
        assert.equal(document.querySelectorAll('#toolboxPanel5 .is-filled, #toolboxPanel5 [onclick]').length, 0);
        await fill('4');
        assert.equal(count(), 5);
        for (let i = 5; i <= 100; i++) await fill(String(i));
        assert.equal(count(), 101);
        window.switchToolboxPage('100');
        assert.equal(active(), '100');
        assert(document.querySelectorAll('.tb-page-chip').length <= 7);
        window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true }));
        assert.equal(active(), '101');
        window.nextToolboxPage();
        assert.equal(active(), '1');
        window.prevToolboxPage();
        assert.equal(active(), '101');
        for (const value of ['0', '-1', '01', '1e3', '102', '<script>', 9007199254740992]) window.switchToolboxPage(value);
        assert.equal(active(), '101');
        document.querySelector('#toolboxPanel100 .tb-slot').classList.remove('is-filled');
        await flush();
        assert.equal(count(), 101);
        const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
        assert.equal(new Set(ids).size, ids.length);
        // Rerunning the component cannot duplicate handlers, pages or chips.
        window.eval(runtime);
        assert.equal(count(), 101);
        dom.window.close();
        console.log(filename + ': 101 bars, idempotency, IDs, navigation and invalid inputs passed');
    }
    const source = fs.readFileSync(path.join(root, '404.html'), 'utf8');
    const markup = source.slice(source.indexOf('<!-- Panel Toolbox ('), source.indexOf('<!-- toolbox-growth-end -->'));
    const manifest = '<script type="application/json" id="hashcodToolboxGrowth">{"version":1,"pages":["1","2","3","4","999999999999999999999"]}</script>';
    const dom = new JSDOM('<div>' + markup + manifest, { runScripts: 'outside-only' });
    dom.window.eval(runtime);
    await flush();
    const document = dom.window.document;
    document.querySelectorAll('#toolboxPanel999999999999999999999 .tb-slot').forEach(slot => slot.classList.add('is-filled'));
    await flush();
    assert(document.getElementById('toolboxPanel1000000000000000000000'));
    assert.equal(document.querySelectorAll('.toolbox-panel').length, 6);
    dom.window.close();
    console.log('Server manifest and exact large-ordinal successor passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
