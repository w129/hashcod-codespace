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

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M 13 2 L 13 8 L 15 8 L 15 6 L 18 6 L 18 4 L 15 4 L 15 2 L 13 2 z M 18 6 L 18 8 L 21 8 L 21 6 L 18 6 z M 21 8 L 21 10 L 24 10 L 24 8 L 21 8 z M 24 10 L 24 13 L 17 13 L 17 17 L 19 17 L 19 15 L 26 15 L 26 10 L 24 10 z M 19 17 L 19 20 L 21 20 L 21 17 L 19 17 z M 21 20 L 21 22 L 11 22 L 11 10 L 9 10 L 9 22 L 7 22 L 7 24 L 25 24 L 25 22 L 23 22 L 23 20 L 21 20 z M 25 24 L 25 26 L 7 26 L 7 24 L 5 24 L 5 28 L 27 28 L 27 24 L 25 24 z M 11 10 L 13 10 L 13 8 L 11 8 L 11 10 z"/></svg>';
  var current = doc.currentScript, base = current && current.src ? current.src.replace(/components\/platform-intro\.js.*$/, '') : '/';

  var root = doc.createElement('div');
  root.id = 'hashcodPlatformIntro';
  root.className = 'hpi';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Bienvenida a Hashcod');
  var stage = doc.createElement('div');
  stage.className = 'hpi-stage';
  var img = doc.createElement('img');
  img.className = 'hpi-img';
  img.src = base + 'assets/intro/platform-intro.webp?v=20261010-4';
  img.width = 1672; img.height = 941; img.decoding = 'async';
  img.alt = 'Ilustración en pixel art de una ciudad nocturna en blanco y negro: bloques con iconos de código, terminal, base de datos y un engranaje de IA apilados junto a la silueta de una ciudad.';
  var button = doc.createElement('button');
  button.id = 'hashcodPlatformIntroEnter';
  button.className = 'hpi-enter';
  button.type = 'button';
  button.setAttribute('aria-label', 'Entrar a la plataforma');
  button.innerHTML = svg + '<span class="hpi-sr">Entrar a la plataforma</span>';
  var logo = doc.createElement('img');
  logo.className = 'hpi-logo';
  logo.src = base + 'assets/intro/hashcod-logo.webp?v=20261010-4';
  logo.width = 1818; logo.height = 321; logo.decoding = 'async';
  logo.alt = 'Hashcod Codespace · PSOT · Registro de comprobación';
  stage.appendChild(img); root.appendChild(stage); root.appendChild(logo); root.appendChild(button);
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
  img.addEventListener('load', focus, { once: true });

  var leaving = false;
  function enter() {
    if (leaving) return;
    leaving = true;
    root.classList.add('is-leaving');
    var finish = function () {
      if (!root.parentNode) return;
      watcher.disconnect();
      root.parentNode.removeChild(root);
      held.forEach(function (node) { node.inert = false; });
      html.style.overflow = saved[0];
      body.style.overflow = saved[1];
      window.dispatchEvent(new CustomEvent('hashcod:platform-intro-done'));
    };
    root.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 800); // also covers reduced-motion / no transition
  }
  button.addEventListener('click', enter);
})();
