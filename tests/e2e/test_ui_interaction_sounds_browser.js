'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(root, 'components/ui-interaction-sounds.js'));
const gate = execFileSync(process.env.PHP_BIN || 'php', ['-r', "require 'mldsa-access.php'; echo mldsaGateHtml('/platform/', true);"], { cwd: root }).toString();
assert.equal((gate.match(/data-hashcod-ui-sounds=/g) || []).length, 1, 'canonical entry must load one sound module');
assert(gate.includes('/platform/components/ui-interaction-sounds.js?v=20261006-ui-sounds1'), 'sound URL must respect hosted and desktop base paths');
const html = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><button id="plain">Accept</button><button id="toggle" aria-pressed="false">Toggle</button><button id="disabled" disabled>Disabled</button><div id="portal"></div><script src="/platform/components/ui-interaction-sounds.js?v=20261006-ui-sounds1"></script>';

async function run() {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/platform/components/ui-interaction-sounds.js')) { res.setHeader('Content-Type', 'text/javascript'); res.end(script); return; }
    res.setHeader('Content-Type', 'text/html'); res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, hasTouch: mobile, isMobile: mobile });
      await context.addInitScript(() => {
        const NativeAudio = window.AudioContext;
        window.__audioEvidence = { contexts: 0, starts: 0, peak: 0 };
        window.AudioContext = function (...args) {
          const audio = new NativeAudio(...args), evidence = window.__audioEvidence;
          evidence.contexts++;
          evidence.audio = audio;
          const gain = audio.createGain.bind(audio);
          let first = true;
          audio.createGain = function () {
            const node = gain();
            if (first) {
              first = false;
              const analyser = audio.createAnalyser();
              analyser.fftSize = 256;
              node.connect(analyser);
              const samples = new Float32Array(analyser.fftSize);
              evidence.timer = setInterval(() => {
                analyser.getFloatTimeDomainData(samples);
                for (const sample of samples) evidence.peak = Math.max(evidence.peak, Math.abs(sample));
              }, 5);
            }
            return node;
          };
          for (const method of ['createOscillator', 'createBufferSource']) {
            const create = audio[method].bind(audio);
            audio[method] = function () {
              const node = create(), start = node.start.bind(node);
              node.start = function (...args) { evidence.starts++; return start(...args); };
              return node;
            };
          }
          return audio;
        };
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:' + server.address().port + '/platform/');
      assert.equal(await page.evaluate(() => __audioEvidence.contexts), 0, 'no autoplay context before activation');
      if (mobile) await page.tap('#plain'); else await page.click('#plain');
      await page.waitForFunction(() => __audioEvidence.starts === 2 && __audioEvidence.peak > 0.00001);
      assert.equal(await page.evaluate(() => __audioEvidence.audio.state), 'running', 'trusted interaction must unlock real Web Audio');
      await page.focus('#toggle');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => __audioEvidence.starts === 3);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => __audioEvidence.starts === 4);
      await page.evaluate(() => {
        document.getElementById('disabled').click();
        document.getElementById('plain').click();
        document.getElementById('portal').innerHTML = '<div role="dialog"><button id="dynamic" data-sound="pulse">Save</button></div>';
      });
      assert.equal(await page.evaluate(() => __audioEvidence.starts), 4, 'disabled and programmatic actions remain silent');
      if (mobile) await page.tap('#dynamic'); else await page.click('#dynamic');
      await page.waitForFunction(() => __audioEvidence.starts === 5);
      await page.addScriptTag({ url: '/platform/components/ui-interaction-sounds.js' });
      await page.click('#toggle');
      await page.waitForFunction(() => __audioEvidence.starts === 6);
      await page.evaluate(() => HashcodUiSounds.setEnabled(false));
      await page.click('#plain');
      assert.equal(await page.evaluate(() => __audioEvidence.starts), 6);
      assert.equal(await page.evaluate(() => __audioEvidence.contexts), 1, 'mobile and keyboard share one audio engine');
      assert.deepEqual(errors, []);
      console.log('PASS real Chromium audio output and trusted ' + (mobile ? 'phone tap' : 'mouse click') + ', keyboard, dynamic dialogs and mute');
      await page.evaluate(() => { clearInterval(__audioEvidence.timer); __audioEvidence.audio.close(); });
      await context.close();
    }
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
