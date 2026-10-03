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

function navigate(value, item) {
  try {
    const url = new URL(window.location.href);
    url.hash = value;
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
  } catch (_) {}

  try {
    window.dispatchEvent(new CustomEvent('hashcod:first-screen-branched-menu-select', {
      detail: { value, item }
    }));
  } catch (_) {}
}

function mountBranchedMenu() {
  const node = document.getElementById('d5FirstBranchedMenuMount');
  if (!node || node.dataset.reactMounted === 'true') return Boolean(node);

  const root = createRoot(node);
  root.render(
    <BranchedMenu
      items={items}
      defaultOpen={[0]}
      defaultActive="quick"
      onSelect={(value, item) => navigate(value, item)}
      color="#0a0a0a"
      accentColor="#0a0a0a"
      lineColor="#0a0a0a"
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

  node.dataset.reactMounted = 'true';
  window.HashcodFirstScreenBranchedMenu = Object.freeze({
    mounted: true,
    version: '20261003-reactbits1'
  });
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountBranchedMenu, { once: true });
} else {
  mountBranchedMenu();
}
