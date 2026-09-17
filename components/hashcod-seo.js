(function () {
  'use strict';

  if (window.__hashcodSeoSignalsLoaded) return;
  window.__hashcodSeoSignalsLoaded = true;

  const CANONICAL_URL = 'https://hashcod-codespace-1.onrender.com/';
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
})();
