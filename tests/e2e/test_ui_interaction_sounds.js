'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync(path.resolve(__dirname, '../../components/ui-interaction-sounds.js'), 'utf8');

function fixture({ unavailable = false, suspended = false, rejects = false } = {}) {
  const dom = new JSDOM('<body><button id="plain">Accept</button><button id="save">Save file</button><button id="close">Cerrar</button><button id="disabled" disabled>Accept</button><div inert><button id="inert">Accept</button></div><div aria-disabled="true"><button id="aria">Accept</button></div><div data-sound-silent><button id="silent">Accept</button></div><button id="toggle" aria-pressed="false">Toggle</button><a id="link" href="/privacy">Privacy</a><input id="input"><button id="explicit" data-sound="page">Close</button><div id="background">Background</div></body>', { url: 'https://hashcod.test/', runScripts: 'outside-only' });
  const window = dom.window, contexts = [], handlers = [];
  const add = window.document.addEventListener.bind(window.document);
  window.document.addEventListener = (name, fn, opts) => { if (name === 'click') handlers.push({ fn, opts }); add(name, fn, opts); };
  class Param {
    constructor() { this.events = []; }
    setValueAtTime(...args) { this.events.push(['set', ...args]); }
    linearRampToValueAtTime(...args) { this.events.push(['linear', ...args]); }
    exponentialRampToValueAtTime(...args) { this.events.push(['exponential', ...args]); }
    setTargetAtTime(...args) { this.events.push(['target', ...args]); }
  }
  class AudioContext {
    constructor() { this.state = suspended ? 'suspended' : 'running'; this.currentTime = 2; this.sampleRate = 48000; this.nodes = []; this.destination = {}; this.resumes = 0; contexts.push(this); }
    node(kind) { const n = { kind, connections: [], disconnected: false, gain: new Param(), frequency: new Param(), Q: {}, connect(target) { this.connections.push(target); }, disconnect() { this.disconnected = true; }, start(t) { this.started = t; }, stop(t) { this.stopped = t; } }; this.nodes.push(n); return n; }
    createGain() { return this.node('gain'); }
    createBiquadFilter() { return this.node('filter'); }
    createOscillator() { return this.node('oscillator'); }
    createBufferSource() { return this.node('noise'); }
    createBuffer(channels, length, rate) { assert.equal(channels, 1); assert.equal(rate, this.sampleRate); const samples = new Float32Array(length); return { samples, getChannelData() { return samples; } }; }
    resume() { this.resumes++; if (rejects) return Promise.reject(new Error('Audio blocked')); this.state = 'running'; return Promise.resolve(); }
  }
  if (!unavailable) window.AudioContext = AudioContext;
  window.console.debug = () => {};
  window.eval(source);
  const click = (id, trusted = true) => handlers[0].fn({ isTrusted: trusted, target: window.document.getElementById(id) });
  const sources = () => contexts.flatMap(c => c.nodes.filter(n => n.kind === 'oscillator' || n.kind === 'noise'));
  return { dom, window, contexts, handlers, click, sources };
}

async function run() {
  const f = fixture();
  assert.equal(f.contexts.length, 0, 'audio must remain lazy before a user gesture');
  f.window.eval(source);
  assert.equal(f.handlers.length, 1, 'repeated loading must not duplicate click sounds');
  assert.equal(f.handlers[0].opts, true, 'capture keeps classification stable before React updates');
  for (const id of ['disabled', 'aria', 'inert', 'silent', 'background']) f.click(id);
  f.click('plain', false);
  assert.equal(f.contexts.length, 0, 'disabled, inert and programmatic clicks must be silent');
  f.click('plain');
  assert.equal(f.sources().length, 2, 'Beautiful UI press mixes white noise and a sine');
  const ctx = f.contexts[0], noise = f.sources()[0], sine = f.sources()[1];
  assert.equal(sine.type, 'sine');
  assert.deepEqual(sine.frequency.events[0], ['set', 680, 2]);
  const highpass = ctx.nodes.find(n => n.kind === 'filter');
  assert.equal(highpass.type, 'highpass');
  assert.deepEqual(highpass.frequency.events[0], ['set', 2400, 2]);
  assert.equal(highpass.Q.value, 1);
  assert.equal(noise.buffer.samples.length, Math.floor(48000 * (0.0003 + 0.009 + 0.1)));
  assert(noise.buffer.samples.some(x => x !== 0), 'white noise samples must contain audio');
  const envelope = sine.connections[0];
  assert.deepEqual(envelope.gain.events, [['set', 0.0001, 2], ['linear', 0.24, 2.0006], ['target', 0.0001, 2.0006, 0.022 / 3]]);
  assert.equal(envelope.connections[0].gain.value, 0.32, 'match the original master volume');
  assert(Math.abs(sine.stopped - (2 + 0.0006 + 0.022 + 0.008 + 0.1)) < 1e-12);
  sine.onended();
  assert(sine.disconnected && envelope.disconnected, 'short-lived nodes must disconnect after playback');
  f.click('toggle'); assert.equal(f.sources().at(-1).type, 'square');
  f.click('input'); assert.equal(f.sources().at(-1).type, 'square');
  f.click('close'); assert.equal(f.sources().at(-1).kind, 'noise');
  f.click('save'); assert.equal(f.sources().at(-1).frequency.events[0][1], 330);
  for (const id of ['link', 'explicit']) { f.click(id); assert.equal(f.sources().at(-1).frequency.events[0][1], 430); assert.equal(f.sources().at(-1).frequency.events[1][1], 640); }
  f.window.document.body.insertAdjacentHTML('beforeend', '<div role="dialog"><button id="portal"><svg><path></path></svg>Accept</button></div>');
  f.handlers[0].fn({ isTrusted: true, target: f.window.document.querySelector('#portal path') });
  assert.equal(f.sources().at(-1).frequency.events[0][1], 680, 'delegation covers dynamic dialog buttons and SVG targets');
  const count = f.sources().length;
  f.window.HashcodUiSounds.setEnabled(false); f.click('plain');
  assert.equal(f.sources().length, count);
  assert.equal(f.window.localStorage.getItem('hashcod:ui-sounds'), 'off');
  f.window.HashcodUiSounds.setEnabled(true); f.click('plain');
  assert.equal(f.sources().length, count + 2);
  assert.equal(f.contexts.length, 1, 'all interactions reuse one context');
  f.dom.window.close();
  for (const options of [{ unavailable: true }, { suspended: true, rejects: true }, { suspended: true }]) {
    const g = fixture(options);
    assert.doesNotThrow(() => g.click('plain'), 'unavailable audio must never break the button action');
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(g.sources().length, options.unavailable || options.rejects ? 0 : 2);
    if (options.suspended) assert.equal(g.contexts[0].resumes, 1);
    g.dom.window.close();
  }
  console.log('PASS Beautiful UI sound synthesis, delegation, disabled controls, mute and audio fallback');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
