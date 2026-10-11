/* Shows the full-screen welcome before the platform and lifts it when the bottom-right button is pressed.
   Loaded synchronously at the top of <body>, so the overlay exists before the page behind it paints.
   Automated browsers (navigator.webdriver) skip it so end-to-end suites keep testing the platform itself;
   add ?intro=1 to the URL to force it. */
(function () {
  'use strict';
  var forced = /(?:^|[?&])intro=1(?:&|$)/.test(location.search);
  if (navigator.webdriver && !forced) return;
  var doc = document, body = doc.body;
  if (!body || doc.getElementById('hashcodPlatformIntro')) return;

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><g transform="scale(10.66667)"><path fill="currentColor" d="M12,2c-5.185,0 -9.448,3.947 -9.95,9h6.95v-3l4,4l-4,4v-3h-6.95c0.502,5.053 4.764,9 9.95,9c5.523,0 10,-4.477 10,-10c0,-5.523 -4.477,-10 -10,-10z"/></g></svg>';
  var current = doc.currentScript, base = current && current.src ? current.src.replace(/components\/platform-intro\.js.*$/, '') : '/';

  var root = doc.createElement('div');
  root.id = 'hashcodPlatformIntro';
  root.className = 'hpi';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Bienvenida a Hashcod');
  var stage = doc.createElement('div');
  stage.className = 'hpi-stage';
  var canvas = doc.createElement('canvas');
  canvas.className = 'hpi-terrain';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Animación de vuelo sobre un valle de montañas en líneas blancas sobre fondo negro.');
  var button = doc.createElement('button');
  button.id = 'hashcodPlatformIntroEnter';
  button.className = 'hpi-enter';
  button.type = 'button';
  button.setAttribute('aria-label', 'Entrar a la plataforma');
  button.innerHTML = svg + '<span class="hpi-sr">Entrar a la plataforma</span>';
  var logo = doc.createElement('img');
  logo.className = 'hpi-logo';
  logo.src = base + 'assets/intro/hashcod-logo.webp?v=20261010-8';
  logo.width = 778; logo.height = 154; logo.decoding = 'async';
  logo.alt = 'Hashcod Codespace · PSOT · Registro de comprobación';
  stage.appendChild(canvas); root.appendChild(stage); root.appendChild(logo); root.appendChild(button);
  body.insertBefore(root, body.firstChild);

  // Keep the platform behind the welcome out of reach of the keyboard and screen readers until it lifts.
  var held = [], html = doc.documentElement, saved = [html.style.overflow, body.style.overflow];
  function hold(node) {
    if (node !== root && node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'LINK' && !node.inert) { node.inert = true; held.push(node); }
  }
  // This script runs before the rest of <body> is parsed, so watch for the nodes that arrive afterwards.
  var watcher = new MutationObserver(function (records) {
    records.forEach(function (record) { Array.prototype.forEach.call(record.addedNodes, hold); });
  });
  watcher.observe(body, { childList: true });
  Array.prototype.forEach.call(body.children, hold);
  html.style.setProperty('overflow', 'hidden', 'important');
  body.style.setProperty('overflow', 'hidden', 'important');
  var focus = function () { try { button.focus({ preventScroll: true }); } catch (e) { button.focus(); } };
  focus();

  // Live background: Wire Terrain (WebGL). If WebGL or the script is unavailable the black welcome stays.
  var terrain = null;
  var engine = doc.createElement('script');
  engine.src = base + 'components/platform-intro-terrain.js?v=20261010-8';
  engine.async = true;
  engine.onload = function () {
    if (root.parentNode && window.HashcodPlatformIntroTerrain && !leaving) terrain = window.HashcodPlatformIntroTerrain.start({ root: root, canvas: canvas });
  };
  doc.head.appendChild(engine);

  var leaving = false;
  function enter() {
    if (leaving) return;
    leaving = true;
    root.classList.add('is-leaving');
    var finish = function () {
      if (!root.parentNode) return;
      watcher.disconnect();
      if (terrain) terrain.stop();
      root.parentNode.removeChild(root);
      // Release only what this welcome held. While the policy is still unaccepted the platform must stay locked
      // (everything but the consent footer), and policy-consent.js releases those nodes once it is accepted.
      var policyLocked = body.classList.contains('hpc-locked');
      held.forEach(function (node) {
        if (policyLocked && node.id !== 'd5PreviewPolicyFooter') { node.dataset.hpcInert = '1'; return; }
        node.inert = false;
      });
      html.style.overflow = saved[0];
      body.style.overflow = saved[1];
      window.dispatchEvent(new CustomEvent('hashcod:platform-intro-done'));
    };
    root.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 800); // also covers reduced-motion / no transition
  }
  button.addEventListener('click', enter);
})();
