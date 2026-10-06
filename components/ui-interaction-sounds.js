(function () {
  'use strict';
  if (window.HashcodUiSounds) return;

  // Original Beautiful UI interaction timbres (beautifului.dev), recreated with
  // native Web Audio. No remote audio asset or third-party runtime is required.
  const presets = {
    press: [
      { type: 'noise', filter: 'highpass', hz: 2400, attack: 0.0003, decay: 0.009, gain: 0.13 },
      { type: 'sine', hz: 680, attack: 0.0006, decay: 0.022, release: 0.008, gain: 0.24 },
    ],
    tick: [{ type: 'square', hz: 2100, filter: 'bandpass', filterHz: 2600, q: 1.6, attack: 0.0004, decay: 0.028, gain: 0.24 }],
    release: [{ type: 'noise', filter: 'lowpass', hz: 1600, q: 0.9, attack: 0.001, decay: 0.055, gain: 0.32 }],
    page: [{ type: 'sine', hz: 430, endHz: 640, attack: 0.002, decay: 0.11, release: 0.03, gain: 0.4 }],
    pulse: [{ type: 'sine', hz: 330, filter: 'lowpass', filterHz: 2200, attack: 0.002, decay: 0.13, release: 0.04, gain: 0.5 }],
  };
  const controls = "button,a[href],input:not([type='hidden']),select,textarea,summary,[role='button'],[role='checkbox'],[role='menuitem'],[role='menuitemcheckbox'],[role='menuitemradio'],[role='option'],[role='radio'],[role='switch'],[role='tab']";
  const preference = 'hashcod:ui-sounds';
  let enabled = true, context = null, master = null, reported = false;
  try { enabled = localStorage.getItem(preference) !== 'off'; }
  catch (_) { /* Storage restrictions do not disable optional interaction feedback. */ }

  function unavailable() {
    if (reported) return;
    reported = true;
    // Audio is optional: report once for diagnostics without interrupting actions.
    if (window.console && console.debug) console.debug('[Hashcod UI sounds] Audio unavailable in this browser.');
  }

  function ensureContext() {
    if (context && context.state !== 'closed') return context;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { unavailable(); return null; }
    context = new Audio();
    master = context.createGain();
    master.gain.value = 0.32;
    master.connect(context.destination);
    return context;
  }

  function synthesize(name, audio) {
    if (!enabled || audio !== context || audio.state !== 'running') return;
    for (const layer of presets[name]) {
      const at = audio.currentTime;
      const duration = layer.attack + layer.decay + (layer.release || 0);
      const envelope = audio.createGain();
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.linearRampToValueAtTime(layer.gain, at + layer.attack);
      envelope.gain.setTargetAtTime(0.0001, at + layer.attack, layer.decay / 3);
      envelope.connect(master);

      let source;
      if (layer.type === 'noise') {
        source = audio.createBufferSource();
        const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * (duration + 0.1)), audio.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        source.buffer = buffer;
      } else {
        source = audio.createOscillator();
        source.type = layer.type;
        source.frequency.setValueAtTime(layer.hz, at);
        if (layer.endHz) source.frequency.exponentialRampToValueAtTime(layer.endHz, at + duration);
      }
      let filter = null;
      if (layer.filter) {
        filter = audio.createBiquadFilter();
        filter.type = layer.filter;
        filter.frequency.setValueAtTime(layer.filterHz || layer.hz, at);
        filter.Q.value = layer.q || 1;
        source.connect(filter);
        filter.connect(envelope);
      } else source.connect(envelope);
      source.onended = function () {
        source.disconnect();
        if (filter) filter.disconnect();
        envelope.disconnect();
      };
      source.start(at);
      source.stop(at + duration + 0.1);
    }
  }

  function soundFor(control) {
    const explicit = control.getAttribute('data-sound');
    if (Object.hasOwn(presets, explicit)) return explicit;
    const label = (control.getAttribute('aria-label') || '') + ' ' + (control.textContent || '');
    if (/close|dismiss|remove|delete|collapse|cancel|clear|cerrar|eliminar|borrar|contraer|limpiar/i.test(label)) return 'release';
    if (control.matches("input[type='checkbox'],input[type='radio'],select,[role='checkbox'],[role='radio'],[role='switch'],[role='tab'],[aria-pressed]")) return 'tick';
    if (control.matches('a[href]')) return 'page';
    if (/send|save|submit|calculate|create|add|upgrade|replay|enviar|guardar|calcular|crear|agregar|añadir|subir/i.test(label)) return 'pulse';
    if (control.matches('input,textarea')) return 'tick';
    return 'press';
  }

  document.addEventListener('click', function (event) {
    if (!enabled || !event.isTrusted) return;
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    const control = target.closest(controls);
    if (!control || control.closest('[data-sound-silent],[inert],[aria-disabled="true"],:disabled')) return;
    const sound = soundFor(control);
    try {
      const audio = ensureContext();
      if (!audio) return;
      if (audio.state === 'suspended') {
        // Resume inside the trusted click activation; mouse, keyboard and touch
        // each produce one click, so pointer events do not duplicate the sound.
        audio.resume().then(function () { synthesize(sound, audio); }).catch(unavailable);
      } else synthesize(sound, audio);
    } catch (_) { unavailable(); }
  }, true);

  window.HashcodUiSounds = Object.freeze({
    version: '20261006-ui-sounds1',
    get enabled() { return enabled; },
    setEnabled(value) {
      enabled = Boolean(value);
      if (master) master.gain.value = enabled ? 0.32 : 0;
      try { localStorage.setItem(preference, enabled ? 'on' : 'off'); }
      catch (_) { /* The current session preference still applies. */ }
    },
  });
})();
