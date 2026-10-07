(function () {
  'use strict';
  const handlers = new Map();
  const attached = new WeakMap();
  const events = ['click','change','input','submit','keydown','keyup','mouseover','mouseout','dragover','dragleave','drop','load','error','focus','blur'];
  const attributes = events.map(type => 'data-hc-' + type);
  const selector = attributes.map(name => '[' + name + ']').join(',');
  function bind(node) {
    if (!(node instanceof Element)) return;
    let bindings = attached.get(node);
    if (!bindings) { bindings = new Map(); attached.set(node, bindings); }
    for (const type of events) {
      const id = node.getAttribute('data-hc-' + type);
      const previous = bindings.get(type);
      if (previous?.id === id) continue;
      if (previous) { node.removeEventListener(type, previous.listener); bindings.delete(type); }
      const handler = handlers.get(id);
      if (!handler) continue;
      const listener = function (event) {
        let args = [];
        const encoded = this.getAttribute('data-hc-args-' + type) || this.getAttribute('data-hc-args');
        if (encoded) {
          if (encoded.length > 16000) return;
          try { args = JSON.parse(decodeURIComponent(encoded)); }
          catch (_) { return; }
          if (!Array.isArray(args) || args.length > 32) return;
        }
        // Only functions compiled from repository source can run; DOM text is
        // never evaluated and dynamic argument values remain data.
        if (handler.call(this, event, args) === false) event.preventDefault();
      };
      node.addEventListener(type, listener);
      bindings.set(type, {id, listener});
    }
  }
  function scan(root) {
    if (root instanceof Element) bind(root);
    root.querySelectorAll?.(selector).forEach(bind);
  }
  function register(map) {
    for (const [id, handler] of Object.entries(map)) {
      if (typeof handler === 'function' && !handlers.has(id)) handlers.set(id, handler);
    }
    scan(document);
  }
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') bind(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document, {subtree:true, childList:true, attributes:true, attributeFilter:attributes});
  window.HashcodCspEvents = Object.freeze({register});
  for (const map of window.__hashcodCspEventQueue || []) register(map);
  delete window.__hashcodCspEventQueue;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(document), {once:true});
})();
