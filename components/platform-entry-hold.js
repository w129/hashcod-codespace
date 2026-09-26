(function (window, document) {
  'use strict';

  var VERSION = '20260926-second-screen-restored1';
  if (window.__hashcodPlatformEntryHoldLoadedVersion === VERSION) return;

  window.__hashcodPlatformEntryHoldLoaded = true;
  window.__hashcodPlatformEntryHoldLoadedVersion = VERSION;
  window.__hashcodPlatformEntryHoldReady = true;

  var opening = false;

  var ICONS = [
    '<path d="M5 6h22v20H5zM8 9v14h16V9z"/>',
    '<path d="M4 8h24v16H4zM8 12h7v8H8zm10 0h6v2h-6zm0 4h6v2h-6zm0 4h4v2h-4z"/>',
    '<path d="M7 5h18v22H7zM10 9h12v2H10zm0 5h12v2H10zm0 5h8v2h-8z"/>',
    '<path d="M16 3l11 6v14l-11 6-11-6V9zm0 4L9 11v10l7 4 7-4V11z"/>',
    '<path d="M4 7h24v18H4zM7 10v12h18V10zm3 3h4v4h-4zm8 0h4v2h-4zm0 4h4v2h-4z"/>',
    '<path d="M6 5h20v22H6zm3 3v16h14V8zm3 3h8v2h-8zm0 4h8v2h-8zm0 4h5v2h-5z"/>'
  ];

  var POSITIONS = [
    ['01',0,'strong'],['02',2,'soft'],['03',4,'mid'],['04',1,'soft'],
    ['05',3,'strong'],['08',5,'strong'],['09',0,'mid'],['10',2,'soft'],
    ['11',4,'mid'],['12',1,'strong'],['15',3,'soft'],['17',5,'mid']
  ];

  function iconMarkup(item, index) {
    return '<span class="hashcod-hold-side-icon hashcod-hold-pos-' + item[0] +
      ' hashcod-hold-side-' + item[2] + '" style="--side-index:' + index +
      '" aria-hidden="true"><svg viewBox="0 0 32 32">' + ICONS[item[1]] + '</svg></span>';
  }

  function removeLandingVisuals() {
    var boot = document.getElementById('bootCliOverlay');
    if (boot) {
      boot.classList.add('hidden');
      boot.hidden = true;
      boot.setAttribute('aria-hidden', 'true');
      boot.style.setProperty('display', 'none', 'important');
      boot.style.setProperty('pointer-events', 'none', 'important');
    }

    ['hashcodEntryTransition','hashcodDuoShade','hashcodDuoHinge'].forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.parentNode) {
        try { node.parentNode.removeChild(node); } catch (_) {}
      }
    });

    document.documentElement.classList.remove('hashcod-duo-transitioning', 'hashcod-duo-arrival-pending');
    if (document.documentElement.dataset) delete document.documentElement.dataset.hashcodDuoBusy;
  }

  function buildOverlay() {
    var existing = document.getElementById('hashcodEntryHold');
    if (existing) return existing;

    var overlay = document.createElement('section');
    overlay.id = 'hashcodEntryHold';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Seguir entrando a Hashcod Codespace');
    overlay.innerHTML = [
      '<div class="hashcod-hold-grid" aria-hidden="true"></div>',
      '<div class="hashcod-hold-side-field" aria-hidden="true">',
        POSITIONS.map(iconMarkup).join(''),
      '</div>',
      '<div class="hashcod-hold-slogan" aria-label="One world, one epoca, one empire, on your computer">',
        '<span class="hashcod-hold-slogan-main">One world, one epoca, one empire</span>',
        '<span class="hashcod-hold-slogan-sub"><span aria-hidden="true">&gt;</span> on your computer</span>',
      '</div>',
      '<div class="hashcod-hold-cta-wrap">',
        '<button type="button" class="hashcod-hold-continue" id="hashcodHoldContinue" aria-label="Seguir entrando a Hashcod Codespace">',
          '<span>SEGUIR ENTRANDO</span><span aria-hidden="true">↵</span>',
        '</button>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);
    window.requestAnimationFrame(function () {
      overlay.classList.add('is-visible', 'is-ready');
    });

    var button = overlay.querySelector('#hashcodHoldContinue');
    if (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        if (button.disabled) return;

        button.disabled = true;
        var label = button.querySelector('span');
        if (label) label.textContent = 'ENTRANDO';
        overlay.classList.add('is-leaving');

        window.setTimeout(function () {
          overlay.classList.add('is-revealing');

          // Final entry is owned by the cache-resistant inline anti-freeze path.
          if (window.HashcodInlineDirectEntry && typeof window.HashcodInlineDirectEntry.enter === 'function') {
            window.HashcodInlineDirectEntry.enter();
          } else {
            var root = document.documentElement;
            root.dataset.hashcodPlatformEntered = 'true';
            root.classList.add('hashcod-platform-entered');
            document.body.classList.remove('boot-locked', 'auth-locked');
            document.body.classList.add('hashcod-platform-entered');
            try {
              window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
                detail: { source: 'second-entry-screen-fallback', direct: true }
              }));
            } catch (_) {}
          }

          window.setTimeout(function () {
            try { overlay.remove(); } catch (_) {}
            opening = false;
          }, 180);
        }, 90);
      }, { once: true });
    }

    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-hold-opened', {
        detail: { source: 'platform-entry-hold', version: VERSION, registration: false }
      }));
    } catch (_) {}

    return overlay;
  }

  function openSecondScreen(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    }

    if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return true;
    if (opening && document.getElementById('hashcodEntryHold')) return true;

    opening = true;
    removeLandingVisuals();
    buildOverlay();
    return true;
  }

  function closeSecondScreen() {
    var overlay = document.getElementById('hashcodEntryHold');
    if (overlay) {
      try { overlay.remove(); } catch (_) {}
    }
    opening = false;
  }

  window.HashcodPlatformEntryHold = Object.freeze({
    version: VERSION,
    open: openSecondScreen,
    close: closeSecondScreen,
    registrationRequired: false
  });

  document.documentElement.dataset.hashcodEntryGateReady = 'true';
  document.documentElement.dataset.hashcodRegistrationRetired = 'true';
  document.documentElement.dataset.hashcodFinalEntryScreen = 'false';

  try {
    window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
      detail: {
        source: 'platform-entry-hold',
        version: VERSION,
        mode: 'second-screen-direct-entry',
        registration: false
      }
    }));
  } catch (_) {}
})(window, document);
