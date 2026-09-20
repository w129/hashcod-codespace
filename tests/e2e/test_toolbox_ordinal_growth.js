'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const runtime = path.join(root, 'components/toolbox-growth.js');

async function fixture(page, filename, manifest) {
    const source = fs.readFileSync(path.join(root, filename), 'utf8');
    const start = source.indexOf('<!-- Panel Toolbox (');
    const end = source.indexOf('<!-- toolbox-growth-end -->');
    assert(start > 0 && end > start);
    assert(source.includes('components/toolbox-growth.js?v=20260920-ordinal1'));
    assert(!source.includes('const totalToolboxPages = 4'));
    const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
    await page.setContent('<style>' + styles + '</style><div>' + source.slice(start, end)
        + (manifest ? '<script type="application/json" id="hashcodToolboxGrowth">' + JSON.stringify(manifest) + '</script>' : ''));
    await page.addStyleTag({ path: path.join(root, 'components/toolbox-growth.css') });
    await page.addScriptTag({ path: runtime });
}
async function fill(page, number, count = 16) {
    await page.evaluate(({ number, count }) => {
        const panel = document.querySelector('[data-toolbox-page="' + number + '"]');
        Array.from(panel.querySelectorAll('.tb-slot')).slice(0, count).forEach(slot => slot.classList.add('is-filled'));
    }, { number: String(number), count });
}
async function run() {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
    try {
        for (const filename of ['index.php', '404.html']) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('**/*', route => route.abort());
            await fixture(page, filename);
            assert.equal(await page.locator('.toolbox-panel').count(), 4);
            // Existing tool handler remains attached and functional.
            await page.evaluate(() => { window.toggleExcelBlog = () => { window.blogOpened = true; }; });
            await page.locator('#slot-1-1').click({ force: true });
            assert.equal(await page.evaluate(() => window.blogOpened), true);
            await fill(page, 1);
            assert.equal(await page.locator('.toolbox-panel').count(), 4, 'Reuse existing page 2');
            await fill(page, 4, 15);
            assert.equal(await page.locator('.toolbox-panel').count(), 4, 'Do not expand partial bar');
            await fill(page, 4);
            await page.waitForSelector('#toolboxPanel5', { state: 'attached' });
            assert.equal(await page.locator('#toolboxPanel5 .tb-slot').count(), 16);
            assert.equal(await page.locator('#toolboxPanel5 .is-filled, #toolboxPanel5 [onclick]').count(), 0);
            await fill(page, 4);
            assert.equal(await page.locator('#toolboxPanel5').count(), 1, 'Idempotent repeated fill');
            for (let n = 5; n <= 25; n++) {
                await fill(page, n);
                await page.waitForSelector('#toolboxPanel' + (n + 1), { state: 'attached' });
            }
            assert.equal(await page.locator('.toolbox-panel').count(), 26);
            await page.evaluate(() => window.switchToolboxPage('25'));
            assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '25');
            assert((await page.locator('.tb-page-chip').count()) <= 7);
            await page.keyboard.press('Alt+ArrowRight');
            assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '26');
            await page.keyboard.press('Alt+ArrowRight');
            assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '1');
            await page.evaluate(() => window.prevToolboxPage());
            assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '26');
            for (const invalid of ['0', '-1', '01', '27', '1e3', '<img>', 9007199254740992]) {
                await page.evaluate(value => window.switchToolboxPage(value), invalid);
                assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '26');
            }
            await page.evaluate(() => document.querySelector('#toolboxPanel25 .tb-slot').classList.remove('is-filled'));
            assert.equal(await page.locator('.toolbox-panel').count(), 26, 'Do not delete pages on unfill');
            await page.setViewportSize({ width: 375, height: 812 });
            const width = await page.locator('#toolboxPaginationBar').evaluate(node => node.getBoundingClientRect().width);
            assert(width <= 375, 'Mobile pagination fits viewport');
            const duplicates = await page.evaluate(() => {
                const ids = [...document.querySelectorAll('.toolbox-panel [id]')].map(node => node.id);
                return ids.length - new Set(ids).size;
            });
            assert.equal(duplicates, 0);
            assert.deepEqual(errors, []);
            await page.close();
            console.log(filename + ': growth, existing tools, navigation, mobile and duplicate checks passed');
        }
        const page = await browser.newPage();
        await page.route('**/*', route => route.abort());
        await fixture(page, '404.html', { version: 1, pages: ['1', '2', '3', '4', '999999999999999999999'] });
        await fill(page, '999999999999999999999');
        await page.waitForSelector('#toolboxPanel1000000000000000000000', { state: 'attached' });
        await page.evaluate(() => window.switchToolboxPage('1000000000000000000000'));
        assert.equal(await page.locator('.toolbox-panel.active').getAttribute('data-toolbox-page'), '1000000000000000000000');
        assert.equal(await page.locator('.toolbox-panel').count(), 6, 'Huge ordinal must not allocate intervening pages');
        await page.close();
        console.log('Server manifest and arbitrary-precision successor checks passed');
    } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
