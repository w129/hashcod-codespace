(function () {
  'use strict';

  if (window.__hashcodToolboxOneEmptyLoaded) return;
  window.__hashcodToolboxOneEmptyLoaded = true;

  const PANEL_SELECTOR = '.toolbox-panel';
  const SLOT_SELECTOR = '.tb-slot';

  function makeFocalCenter() {
    const focal = document.createElement('div');
    focal.className = 'tb-focal-center';
    focal.setAttribute('aria-hidden', 'true');
    return focal;
  }

  function clearSlot(slot) {
    if (!(slot instanceof HTMLElement)) return;

    const dataSlot = slot.getAttribute('data-slot');
    const id = slot.id;

    if (slot.className !== 'tb-slot hashcod-toolbox-one-empty-slot') {
      slot.className = 'tb-slot hashcod-toolbox-one-empty-slot';
    }

    [
      'onclick',
      'onkeydown',
      'onkeypress',
      'onkeyup',
      'title',
      'role',
      'tabindex',
      'aria-label',
      'data-tool-id',
      'data-tool',
      'data-action',
      'data-hashcod-secure-link',
      'data-hashcod-link-capable'
    ].forEach(function (name) {
      if (slot.hasAttribute(name)) slot.removeAttribute(name);
    });

    if (slot.hasAttribute('style')) slot.removeAttribute('style');
    slot.setAttribute('aria-disabled', 'true');
    if (dataSlot) slot.setAttribute('data-slot', dataSlot);
    if (id) slot.id = id;

    let ring = slot.querySelector(':scope > .tb-inner-ring');
    if (!ring) {
      ring = document.createElement('div');
      ring.className = 'tb-inner-ring';
      slot.prepend(ring);
    }

    if (ring.className !== 'tb-inner-ring') ring.className = 'tb-inner-ring';
    if (ring.hasAttribute('style')) ring.removeAttribute('style');

    const hasOnlyFocal =
      ring.children.length === 1 &&
      ring.firstElementChild &&
      ring.firstElementChild.classList.contains('tb-focal-center');

    if (!hasOnlyFocal) {
      ring.replaceChildren(makeFocalCenter());
    }

    Array.from(slot.children).forEach(function (child) {
      if (child === ring) return;
      if (child.classList && child.classList.contains('tb-corner-dot')) return;
      child.remove();
    });

    const cornerClasses = ['d-tl', 'd-tr', 'd-bl', 'd-br'];
    cornerClasses.forEach(function (cornerClass) {
      if (!slot.querySelector(':scope > .tb-corner-dot.' + cornerClass)) {
        const dot = document.createElement('div');
        dot.className = 'tb-corner-dot ' + cornerClass;
        dot.setAttribute('aria-hidden', 'true');
        slot.appendChild(dot);
      }
    });
  }

  let cleaning = false;
  let observer = null;

  function emptyToolboxOne() {
    if (cleaning) return;
    cleaning = true;

    try {
      const panel = document.querySelector(PANEL_SELECTOR);
      if (!panel) return;

      panel.setAttribute('data-hashcod-toolbox-one-empty', 'true');
      panel.querySelectorAll(SLOT_SELECTOR).forEach(clearSlot);
    } finally {
      cleaning = false;
    }
  }

  function installObserver() {
    if (observer) return;

    observer = new MutationObserver(function () {
      if (cleaning) return;
      window.requestAnimationFrame(emptyToolboxOne);
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'class',
        'style',
        'onclick',
        'onkeydown',
        'title',
        'role',
        'tabindex',
        'aria-label',
        'data-tool-id',
        'data-tool',
        'data-action'
      ]
    });
  }

  function blockLegacyToolboxActions(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const slot = target.closest(PANEL_SELECTOR + ' ' + SLOT_SELECTOR);
    if (!slot) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
  }

  document.addEventListener('click', blockLegacyToolboxActions, true);
  document.addEventListener('dblclick', blockLegacyToolboxActions, true);
  document.addEventListener('contextmenu', blockLegacyToolboxActions, true);
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    blockLegacyToolboxActions(event);
  }, true);

  const style = document.createElement('style');
  style.id = 'hashcod-toolbox-one-empty-style';
  style.textContent =
    '.toolbox-panel[data-hashcod-toolbox-one-empty="true"] .tb-slot{' +
      'cursor:default!important;pointer-events:auto!important;' +
    '}' +
    '.toolbox-panel[data-hashcod-toolbox-one-empty="true"] .tb-slot:hover{' +
      'transform:none!important;background:rgba(0,0,0,.0196078)!important;' +
      'box-shadow:none!important;border-color:#000!important;' +
    '}' +
    '.toolbox-panel[data-hashcod-toolbox-one-empty="true"] .tb-inner-ring{' +
      'background:transparent!important;border-color:#000!important;opacity:.35!important;' +
    '}' +
    '.toolbox-panel[data-hashcod-toolbox-one-empty="true"] .tb-slot-badge,' +
    '.toolbox-panel[data-hashcod-toolbox-one-empty="true"] .tb-slot-icon{' +
      'display:none!important;' +
    '}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      emptyToolboxOne();
      installObserver();
    }, { once: true });
  } else {
    emptyToolboxOne();
    installObserver();
  }

  window.addEventListener('hashcod:platform-entered', emptyToolboxOne);
  window.addEventListener('pageshow', emptyToolboxOne);

  [0, 50, 250, 750, 1500, 3000].forEach(function (delay) {
    window.setTimeout(emptyToolboxOne, delay);
  });

  window.emptyHashcodToolboxOne = emptyToolboxOne;
})();
