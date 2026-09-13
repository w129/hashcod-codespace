(function () {
  'use strict';

  if (window.__hashcodToolboxUiRescueLoaded) return;
  window.__hashcodToolboxUiRescueLoaded = true;

  var STYLE_ID = 'hashcod-toolbox-ui-rescue-style';
  var ROOT_ID = 'hashcodSecureToolboxRoot';

  var css = `
#${ROOT_ID}, #${ROOT_ID} * { box-sizing: border-box !important; }
#${ROOT_ID} { font-family: "IBM Plex Sans", Inter, "Segoe UI", sans-serif !important; color:#171717 !important; }
#${ROOT_ID} .hsl-modal { position:fixed !important; inset:0 !important; z-index:2147483300 !important; display:none !important; place-items:center !important; padding:24px !important; margin:0 !important; width:auto !important; height:auto !important; background:transparent !important; }
#${ROOT_ID} .hsl-modal.is-open { display:grid !important; }
#${ROOT_ID} .hsl-modal[aria-hidden="true"] { display:none !important; }
#${ROOT_ID} .hsl-backdrop { position:absolute !important; inset:0 !important; background:rgba(238,238,234,.9) !important; backdrop-filter:blur(10px) !important; }
#${ROOT_ID} .hsl-panel { position:relative !important; z-index:2 !important; width:min(900px,calc(100vw - 32px)) !important; max-height:min(860px,calc(100vh - 32px)) !important; display:flex !important; flex-direction:column !important; overflow:hidden !important; border:1px solid #9d9d97 !important; border-radius:18px !important; background:#fff !important; box-shadow:0 28px 70px rgba(0,0,0,.16) !important; margin:0 !important; padding:0 !important; }
#${ROOT_ID} .hsl-access-panel { width:min(600px,calc(100vw - 32px)) !important; }
#${ROOT_ID} .hsl-panel-head { min-height:76px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; gap:20px !important; padding:18px 20px 16px !important; border-bottom:1px solid #c9c9c3 !important; background:linear-gradient(180deg,#fff,#f5f5f2) !important; }
#${ROOT_ID} .hsl-panel-head h2 { margin:3px 0 0 !important; font:620 18px/1.2 "IBM Plex Sans",Inter,sans-serif !important; letter-spacing:-.02em !important; color:#171717 !important; }
#${ROOT_ID} .hsl-kicker { display:block !important; color:#686864 !important; font:600 10px/1.2 "IBM Plex Mono",ui-monospace,monospace !important; letter-spacing:.12em !important; }
#${ROOT_ID} .hsl-x, #${ROOT_ID} .hsl-browser-close { width:36px !important; height:36px !important; min-width:36px !important; padding:0 !important; border:1px solid #9d9d97 !important; border-radius:50% !important; background:#fff !important; color:#111 !important; font:400 22px/1 sans-serif !important; cursor:pointer !important; }
#${ROOT_ID} .hsl-panel-body { overflow:auto !important; padding:20px !important; background:linear-gradient(90deg,rgba(0,0,0,.025) 1px,transparent 1px),linear-gradient(rgba(0,0,0,.025) 1px,transparent 1px),#fbfbf9 !important; background-size:28px 28px !important; }
#${ROOT_ID} .hsl-slot-chip { display:inline-flex !important; align-items:center !important; height:26px !important; margin:0 0 14px !important; padding:0 9px !important; border:1px solid #b6b6b0 !important; border-radius:999px !important; background:#fff !important; font:650 9px/1 "IBM Plex Mono",ui-monospace,monospace !important; letter-spacing:.08em !important; }
#${ROOT_ID} .hsl-field { display:block !important; margin:0 0 14px !important; }
#${ROOT_ID} .hsl-field > span, #${ROOT_ID} .hsl-identity-box legend { display:block !important; margin:0 0 6px !important; color:#555550 !important; font:650 9px/1.2 "IBM Plex Mono",ui-monospace,monospace !important; letter-spacing:.1em !important; }
#${ROOT_ID} .hsl-field input, #${ROOT_ID} .hsl-field textarea { display:block !important; width:100% !important; border:1px solid #b9b9b4 !important; border-radius:9px !important; background:#fff !important; color:#111 !important; outline:none !important; font:500 13px/1.45 "IBM Plex Mono",ui-monospace,monospace !important; box-shadow:none !important; }
#${ROOT_ID} .hsl-field input { height:42px !important; padding:0 12px !important; }
#${ROOT_ID} .hsl-field textarea { min-height:150px !important; padding:11px 12px !important; resize:vertical !important; }
#${ROOT_ID} .hsl-field textarea.hsl-signature { min-height:84px !important; max-height:170px !important; word-break:break-all !important; }
#${ROOT_ID} .hsl-svg-grid { display:grid !important; grid-template-columns:minmax(0,1fr) 160px !important; gap:14px !important; align-items:stretch !important; }
#${ROOT_ID} .hsl-svg-side { display:flex !important; flex-direction:column !important; gap:10px !important; padding-top:18px !important; }
#${ROOT_ID} .hsl-preview { min-height:132px !important; display:grid !important; place-items:center !important; padding:24px !important; border:1px dashed #9d9d97 !important; border-radius:14px !important; background:#fff !important; color:#888883 !important; font:600 10px/1.2 "IBM Plex Mono",ui-monospace,monospace !important; }
#${ROOT_ID} .hsl-preview svg { display:block !important; width:72px !important; height:72px !important; max-width:100% !important; max-height:90px !important; }
#${ROOT_ID} .hsl-file { position:relative !important; display:block !important; }
#${ROOT_ID} .hsl-file input { position:absolute !important; opacity:0 !important; pointer-events:none !important; }
#${ROOT_ID} .hsl-file span { height:36px !important; display:grid !important; place-items:center !important; border:1px solid #a8a8a2 !important; border-radius:8px !important; background:#f4f4f1 !important; font:650 9px/1 "IBM Plex Mono",ui-monospace,monospace !important; letter-spacing:.08em !important; cursor:pointer !important; }
#${ROOT_ID} .hsl-identity-box { margin:4px 0 16px !important; padding:14px !important; border:1px solid #c7c7c1 !important; border-radius:12px !important; background:rgba(255,255,255,.8) !important; }
#${ROOT_ID} .hsl-identity-grid { display:grid !important; grid-template-columns:1fr 1fr !important; gap:0 12px !important; }
#${ROOT_ID} .hsl-identity-grid .hsl-wide { grid-column:1/-1 !important; }
#${ROOT_ID} .hsl-identity-box p { margin:-2px 0 0 !important; color:#686864 !important; font:500 11px/1.5 "IBM Plex Mono",ui-monospace,monospace !important; }
#${ROOT_ID} .hsl-error { min-height:18px !important; color:#8c1d18 !important; font:600 11px/1.45 "IBM Plex Mono",ui-monospace,monospace !important; }
#${ROOT_ID} .hsl-panel-actions { min-height:66px !important; display:flex !important; align-items:center !important; gap:8px !important; padding:12px 16px !important; border-top:1px solid #c9c9c3 !important; background:#f4f4f1 !important; }
#${ROOT_ID} .hsl-actions-spacer { flex:1 1 auto !important; }
#${ROOT_ID} .hsl-btn { min-height:38px !important; padding:0 13px !important; border:1px solid #aaa9a3 !important; border-radius:8px !important; background:#fff !important; color:#111 !important; font:650 9px/1 "IBM Plex Mono",ui-monospace,monospace !important; letter-spacing:.07em !important; cursor:pointer !important; }
#${ROOT_ID} .hsl-btn.hsl-primary { border-color:#111 !important; background:#111 !important; color:#fff !important; }
#${ROOT_ID} .hsl-btn.hsl-danger { color:#7b1915 !important; border-color:#c9a5a1 !important; }
#${ROOT_ID} .hsl-access-icon { width:116px !important; height:116px !important; display:grid !important; place-items:center !important; margin:0 auto 12px !important; padding:28px !important; border:2px solid #111 !important; border-radius:50% !important; background:#fff !important; }
#${ROOT_ID} .hsl-access-copy { margin:0 auto 20px !important; max-width:460px !important; text-align:center !important; color:#5e5e59 !important; font-size:12px !important; line-height:1.55 !important; }
#${ROOT_ID} .hsl-toast { position:fixed !important; left:50% !important; bottom:24px !important; z-index:2147483646 !important; max-width:min(640px,calc(100vw - 32px)) !important; padding:10px 14px !important; border:1px solid #aaa9a3 !important; border-radius:999px !important; background:#111 !important; color:#fff !important; opacity:0 !important; transform:translate(-50%,14px) !important; pointer-events:none !important; font:600 10px/1.35 "IBM Plex Mono",ui-monospace,monospace !important; }
#${ROOT_ID} .hsl-toast.is-visible { opacity:1 !important; transform:translate(-50%,0) !important; }
#${ROOT_ID} .hsl-browser { position:fixed !important; inset:0 !important; z-index:2147483400 !important; display:none !important; flex-direction:column !important; background:#efefec !important; }
#${ROOT_ID} .hsl-browser.is-open { display:flex !important; }
#${ROOT_ID} .hsl-browser[aria-hidden="true"] { display:none !important; }
#${ROOT_ID} .hsl-browser-head { height:56px !important; flex:0 0 56px !important; display:flex !important; align-items:center !important; gap:12px !important; padding:0 14px !important; border-bottom:1px solid #a9a9a3 !important; background:linear-gradient(180deg,#fff,#ededeb) !important; }
#${ROOT_ID} .hsl-browser-address { min-width:0 !important; flex:1 1 auto !important; height:34px !important; display:flex !important; align-items:center !important; padding:0 12px !important; overflow:hidden !important; border:1px solid #b6b6b0 !important; border-radius:8px !important; background:#fff !important; color:#40403c !important; white-space:nowrap !important; text-overflow:ellipsis !important; font:500 10px/1 "IBM Plex Mono",ui-monospace,monospace !important; }
#${ROOT_ID} .hsl-browser-reload { height:34px !important; padding:0 12px !important; border:1px solid #aaa9a3 !important; border-radius:8px !important; background:#fff !important; font:650 8px/1 "IBM Plex Mono",ui-monospace,monospace !important; cursor:pointer !important; }
#${ROOT_ID} .hsl-browser-body { min-height:0 !important; flex:1 1 auto !important; display:grid !important; grid-template-columns:minmax(0,1fr) 286px !important; }
#${ROOT_ID} .hsl-frame-wrap { min-width:0 !important; min-height:0 !important; display:flex !important; flex-direction:column !important; background:#fff !important; }
#${ROOT_ID} #hslBrowserFrame { flex:1 1 auto !important; width:100% !important; min-height:0 !important; border:0 !important; background:#fff !important; }
#${ROOT_ID} .hsl-browser-identity { min-height:0 !important; overflow:auto !important; padding:20px 16px !important; border-left:1px solid #b9b9b4 !important; background:#f4f4f1 !important; }
.tb-slot[data-hashcod-link-capable="true"] { cursor:pointer !important; }
.tb-slot.hashcod-secure-link-slot { position:relative !important; }
.tb-slot.hashcod-secure-link-slot .tb-inner-ring { display:flex !important; align-items:center !important; justify-content:center !important; overflow:hidden !important; }
.tb-slot.hashcod-secure-link-slot .hsl-custom-icon { display:grid !important; place-items:center !important; width:58% !important; height:58% !important; pointer-events:none !important; }
.tb-slot.hashcod-secure-link-slot .hsl-custom-icon svg { display:block !important; width:100% !important; height:100% !important; max-width:58px !important; max-height:58px !important; }
@media (max-width:760px) {
  #${ROOT_ID} .hsl-modal { padding:8px !important; }
  #${ROOT_ID} .hsl-panel { width:calc(100vw - 16px) !important; max-height:calc(100vh - 16px) !important; border-radius:13px !important; }
  #${ROOT_ID} .hsl-svg-grid, #${ROOT_ID} .hsl-identity-grid { grid-template-columns:1fr !important; }
  #${ROOT_ID} .hsl-identity-grid .hsl-wide { grid-column:auto !important; }
  #${ROOT_ID} .hsl-browser-body { grid-template-columns:1fr !important; grid-template-rows:minmax(0,1fr) auto !important; }
  #${ROOT_ID} .hsl-browser-identity { max-height:210px !important; border-left:0 !important; border-top:1px solid #b9b9b4 !important; }
}
`;

  function installStyle() {
    var style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function forceVisibility() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    root.querySelectorAll('.hsl-modal').forEach(function (el) {
      var open = el.classList.contains('is-open') && el.getAttribute('aria-hidden') !== 'true';
      el.style.setProperty('display', open ? 'grid' : 'none', 'important');
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('inset', '0', 'important');
      el.style.setProperty('z-index', '2147483300', 'important');
    });

    var browser = root.querySelector('.hsl-browser');
    if (browser) {
      var browserOpen = browser.classList.contains('is-open') && browser.getAttribute('aria-hidden') !== 'true';
      browser.style.setProperty('display', browserOpen ? 'flex' : 'none', 'important');
      browser.style.setProperty('position', 'fixed', 'important');
      browser.style.setProperty('inset', '0', 'important');
      browser.style.setProperty('z-index', '2147483400', 'important');
    }
  }

  function boot() {
    installStyle();
    forceVisibility();

    var observer = new MutationObserver(function () {
      installStyle();
      forceVisibility();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'aria-hidden']
    });

    window.setInterval(forceVisibility, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
