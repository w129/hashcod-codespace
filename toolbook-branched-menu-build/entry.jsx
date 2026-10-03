import React from 'react';
import { createRoot } from 'react-dom/client';
import { Download04Icon, Rocket01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import BranchedMenu from './BranchedMenu';

const items = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation', icon: Download04Icon },
      { value: 'quick', label: 'Quick start', icon: Rocket01Icon },
      { value: 'config', label: 'Configuration', icon: Settings02Icon }
    ]
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons' },
      { value: 'overlays', label: 'Overlays' }
    ]
  }
];

let root = null;
let mountedOn = null;

function navigate(value, item) {
  if (typeof window.hashcodBranchedMenuNavigate === 'function') {
    window.hashcodBranchedMenuNavigate(value, item);
  } else {
    try {
      const url = new URL(window.location.href);
      url.hash = value;
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    } catch (_) {}
  }
  try {
    window.dispatchEvent(new CustomEvent('hashcod:branched-menu-select', { detail: { value, item } }));
  } catch (_) {}
}

function mount() {
  const node = document.getElementById('hashcodToolbookBranchedMenuMount');
  if (!node || node === mountedOn) return Boolean(node);
  if (root) {
    try { root.unmount(); } catch (_) {}
  }
  mountedOn = node;
  root = createRoot(node);
  root.render(
    <BranchedMenu
      items={items}
      defaultOpen={[0]}
      defaultActive="quick"
      onSelect={(value, item) => navigate(value, item)}
      onToggle={(index, open) => {
        try {
          window.dispatchEvent(new CustomEvent('hashcod:branched-menu-toggle', { detail: { index, open } }));
        } catch (_) {}
      }}
      color="#f5f5f5"
      accentColor="#f5f5f5"
      lineColor="#3f3f46"
      width={240}
      rowHeight={36}
      indent={40}
      trunk={14}
      radius={10}
      lineWidth={1.5}
      fontSize={14}
      drawDuration={400}
      foldDuration={300}
    />
  );
  node.dataset.hashcodReactBranchedMenuMounted = 'true';
  window.HashcodBranchedMenuReact = { mounted: true, version: '20261003-react1' };
  return true;
}

function watch() {
  if (mount()) return;
  const observer = new MutationObserver(() => {
    if (mount()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashcod:toolbook-page-blanked', mount);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watch, { once: true });
} else {
  watch();
}
