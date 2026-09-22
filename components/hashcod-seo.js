(function () {
  'use strict';

  if (window.__hashcodSeoSignalsLoaded) return;
  window.__hashcodSeoSignalsLoaded = true;

  const CANONICAL_URL = 'https://hashcodcodespace.dev/';
  const SITE_NAME = 'Hashcod Codespace';
  const TITLE = 'Hashcod Codespace | Plataforma de desarrollo e IA';
  const DESCRIPTION = 'Hashcod Codespace es una plataforma para desarrolladores con herramientas de IA, edición, automatización, seguridad y certificación de proyectos digitales.';

  function ensureMeta(selector, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement('meta');
      document.head.appendChild(node);
    }
    Object.keys(attributes).forEach(function (name) {
      node.setAttribute(name, attributes[name]);
    });
    return node;
  }

  function ensureLink(rel, href) {
    let node = document.head.querySelector('link[rel="' + rel + '"]');
    if (!node) {
      node = document.createElement('link');
      node.rel = rel;
      document.head.appendChild(node);
    }
    node.href = href;
    return node;
  }

  function ensureJsonLd(id, payload) {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('script');
      node.id = id;
      node.type = 'application/ld+json';
      document.head.appendChild(node);
    }
    node.textContent = JSON.stringify(payload);
  }

  function installEntryButtonRestoreStyles() {
    if (document.getElementById('hashcodEntryButtonRestoreStyles')) return;
    const style = document.createElement('style');
    style.id = 'hashcodEntryButtonRestoreStyles';
    style.textContent = [
      '#hashcodEntryHold{isolation:isolate;}',
      '#hashcodEntryHold .hashcod-hold-slogan{pointer-events:none!important;}',
      '#hashcodEntryHold .hashcod-hold-cta-wrap{position:fixed!important;left:50%!important;right:auto!important;bottom:max(82px,calc(env(safe-area-inset-bottom,0px) + 48px))!important;top:auto!important;transform:translateX(-50%)!important;z-index:2147483300!important;display:flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;width:auto!important;min-width:min(92vw,260px)!important;pointer-events:auto!important;}',
      '#hashcodEntryHold #hashcodHoldContinue{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:220px!important;min-height:48px!important;padding:0 18px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 10px 24px rgba(0,0,0,.14)!important;}',
      '#hashcodEntryHold #hashcodHoldContinue:not(:disabled):hover{transform:translateY(-1px)!important;box-shadow:0 14px 30px rgba(0,0,0,.18)!important;}',
      '#hashcodEntryHold #hashcodHoldContinue:disabled{opacity:.62!important;cursor:wait!important;}',
      'html[data-hashcod-final-entry-screen="true"] #hashcodEntryHold .hashcod-hold-cta-wrap{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
      '@media(max-width:620px){#hashcodEntryHold .hashcod-hold-cta-wrap{bottom:max(56px,calc(env(safe-area-inset-bottom,0px) + 28px))!important;min-width:calc(100vw - 36px)!important;}#hashcodEntryHold #hashcodHoldContinue{width:100%!important;min-width:0!important;}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function restoreEntryContinueButton() {
    installEntryButtonRestoreStyles();
    const hold = document.getElementById('hashcodEntryHold');
    if (!hold || document.documentElement.dataset.hashcodFinalEntryScreen === 'true') return false;

    let button = document.getElementById('hashcodHoldContinue');
    let wrap = button && button.closest ? button.closest('.hashcod-hold-cta-wrap') : null;

    if (!button) {
      wrap = document.createElement('div');
      wrap.className = 'hashcod-hold-cta-wrap';
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'hashcodHoldContinue';
      button.className = 'hashcod-hold-continue';
      button.setAttribute('aria-label', 'Continuar al registro de plataforma de Hashcod');
      button.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
      wrap.appendChild(button);
      hold.appendChild(wrap);
    }

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'hashcod-hold-cta-wrap';
      button.parentNode.insertBefore(wrap, button);
      wrap.appendChild(button);
    }

    button.hidden = false;
    button.removeAttribute('hidden');
    if (!button.textContent || /verifying/i.test(button.textContent)) {
      window.setTimeout(function () {
        if (!button || !button.isConnected) return;
        if (/verifying/i.test(button.textContent || '')) {
          button.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
        }
      }, 1300);
    }
    return true;
  }

  function bootEntryButtonHotfix() {
    restoreEntryContinueButton();
    [80, 260, 700, 1200, 1800, 2600, 4200].forEach(function (delay) {
      window.setTimeout(restoreEntryContinueButton, delay);
    });
    if (typeof MutationObserver !== 'function') return;
    const root = document.body || document.documentElement;
    if (!root) return;
    const observer = new MutationObserver(function () {
      restoreEntryContinueButton();
    });
    observer.observe(root, { childList: true, subtree: true });
    window.setTimeout(function () {
      restoreEntryContinueButton();
      observer.disconnect();
    }, 45000);
    window.addEventListener('hashcod:final-entry-screen', function () { observer.disconnect(); }, { once: true });
  }

  function fixRegistrationPlazaPrice() {
    const list = document.querySelector('.hashcod-registration-price-list');
    if (!list) return false;

    const targetLabel = 'Aquilar en la primera plaza';
    const targetPrice = 'US$ 78';
    const oldLabels = [
      'Pase hacia la primera plaza',
      'Pase hacia  la primera plaza',
      'Pase hacia la primera plaza :',
      'Pase hacia la primera plaza:'
    ];

    let fixed = false;
    const rows = Array.from(list.children || []).filter(function (node) {
      return node && node.nodeType === 1;
    });

    rows.forEach(function (row) {
      const span = row.querySelector && row.querySelector('span');
      const strong = row.querySelector && row.querySelector('strong');
      const text = span ? String(span.textContent || '').trim() : '';
      const amount = strong ? String(strong.textContent || '').trim() : '';
      const isOld = oldLabels.indexOf(text) >= 0 || amount === 'US$ 545' || row.getAttribute('data-hashcod-price') === 'first-plaza-pass';
      if (!isOld) return;
      row.setAttribute('data-hashcod-price', 'first-plaza-pass');
      if (span) span.textContent = targetLabel;
      if (strong) strong.textContent = targetPrice;
      fixed = true;
    });

    if (!fixed) {
      const row = document.createElement('div');
      row.setAttribute('data-hashcod-price', 'first-plaza-pass');
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      span.textContent = targetLabel;
      strong.textContent = targetPrice;
      row.appendChild(span);
      row.appendChild(strong);
      list.appendChild(row);
      fixed = true;
    }

    return fixed;
  }

  function bootRegistrationPlazaHotfix() {
    fixRegistrationPlazaPrice();
    if (typeof MutationObserver !== 'function') return;
    const root = document.body || document.documentElement;
    if (!root) return;
    const observer = new MutationObserver(function () {
      fixRegistrationPlazaPrice();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    window.setTimeout(function () {
      fixRegistrationPlazaPrice();
      observer.disconnect();
    }, 45000);
    window.addEventListener('hashcod:registration-form-mounted', fixRegistrationPlazaPrice);
    window.addEventListener('hashcod:final-entry-screen', fixRegistrationPlazaPrice);
  }

  document.title = TITLE;
  document.documentElement.lang = document.documentElement.lang || 'es';

  ensureMeta('meta[name="description"]', { name: 'description', content: DESCRIPTION });
  ensureMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
  ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
  ensureMeta('meta[property="og:title"]', { property: 'og:title', content: TITLE });
  ensureMeta('meta[property="og:description"]', { property: 'og:description', content: DESCRIPTION });
  ensureMeta('meta[property="og:url"]', { property: 'og:url', content: CANONICAL_URL });
  ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
  ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: TITLE });
  ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: DESCRIPTION });
  ensureMeta('meta[name="application-name"]', { name: 'application-name', content: SITE_NAME });
  ensureLink('canonical', CANONICAL_URL);

  ensureJsonLd('hashcodSeoWebsiteSchema', {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': CANONICAL_URL + '#website',
    url: CANONICAL_URL,
    name: SITE_NAME,
    alternateName: ['Hashcod', 'Hashcod Codespace'],
    inLanguage: 'es'
  });

  ensureJsonLd('hashcodSeoSoftwareSchema', {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': CANONICAL_URL + '#software',
    name: SITE_NAME,
    url: CANONICAL_URL,
    description: DESCRIPTION,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web, Windows',
    publisher: {
      '@type': 'Organization',
      name: 'DIKTATCART / Hashcod',
      url: CANONICAL_URL
    }
  });

  function bootHotfixes() {
    bootRegistrationPlazaHotfix();
    bootEntryButtonHotfix();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHotfixes, { once: true });
  } else {
    bootHotfixes();
  }
})();
