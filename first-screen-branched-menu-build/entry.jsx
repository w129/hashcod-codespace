import React from 'react';
import { createRoot } from 'react-dom/client';
import { Rocket01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import BranchedMenu from './BranchedMenu';

const FaqIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 48 48"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M 17 4 C 9.2854554 4 3 10.284385 3 17.998047 C 3 20.214327 3.5841038 22.283367 4.5039062 24.146484 L 3.0820312 29.236328 C 2.6451621 30.796136 4.1999681 32.353712 5.7597656 31.919922 A 1.50015 1.50015 0 0 0 5.7617188 31.917969 L 10.857422 30.496094 C 12.719786 31.413923 14.784843 31.998047 17 31.998047 C 17.053808 31.998047 17.106491 31.994743 17.160156 31.994141 C 18.135569 38.764659 23.964993 43.998047 31 43.998047 C 33.215157 43.998047 35.280214 43.413923 37.142578 42.496094 L 42.238281 43.917969 A 1.50015 1.50015 0 0 0 42.240234 43.919922 C 43.799363 44.353526 45.352943 42.797417 44.917969 41.238281 L 43.496094 36.146484 C 44.415896 34.283367 45 32.214327 45 29.998047 C 45 22.284385 38.714545 16 31 16 C 30.951182 16 30.904171 16.00731 30.855469 16.007812 C 29.885594 9.2284033 24.038037 4 17 4 z M 17 7 C 22.536331 7 27.088257 11.057183 27.875 16.365234 C 25.48026 16.914944 23.322859 18.079654 21.568359 19.685547 L 18.458984 12.105469 A 1.50015 1.50015 0 0 0 16.96875 10.980469 A 1.50015 1.50015 0 0 0 16.933594 10.982422 A 1.50015 1.50015 0 0 0 15.539062 12.105469 L 11.111328 22.931641 A 1.5004805 1.5004805 0 1 0 13.888672 24.068359 L 14.734375 22 L 19.53125 22 C 18.123084 24.011538 17.236228 26.406186 17.050781 28.994141 C 17.033545 28.994218 17.01726 28.998047 17 28.998047 C 15.055106 28.998047 13.241826 28.492503 11.65625 27.609375 A 1.50015 1.50015 0 0 0 10.523438 27.474609 L 6.3632812 28.636719 L 7.5253906 24.478516 A 1.50015 1.50015 0 0 0 7.390625 23.34375 C 6.5060643 21.758765 6 19.943606 6 17.998047 C 6 11.905709 10.906545 7 17 7 z M 17.001953 16.457031 L 18.044922 19 L 15.962891 19 L 17.001953 16.457031 z M 31 19 C 37.093455 19 42 23.905709 42 29.998047 C 42 31.943606 41.493936 33.758765 40.609375 35.34375 A 1.50015 1.50015 0 0 0 40.474609 36.478516 L 41.636719 40.636719 L 37.476562 39.474609 A 1.50015 1.50015 0 0 0 36.34375 39.609375 C 34.758174 40.492503 32.944894 40.998047 31 40.998047 C 25.083419 40.998047 20.298923 36.367156 20.025391 30.521484 A 1.50015 1.50015 0 0 0 20.007812 30.152344 C 20.007096 30.100385 20 30.050181 20 29.998047 C 20 23.905709 24.906545 19 31 19 z M 31 23 C 28.256343 23 26 25.256343 26 28 L 26 31 C 26 33.45214 27.834043 35.421347 30.175781 35.832031 C 30.686527 36.597537 32.107648 38.5 35 38.5 A 1.50015 1.50015 0 1 0 35 35.5 C 34.55744 35.5 34.236092 35.194012 33.867188 34.976562 C 35.123854 34.064775 36 32.657302 36 31 L 36 28 C 36 25.256343 33.743657 23 31 23 z M 31 26 C 32.122343 26 33 26.877657 33 28 L 33 31 C 33 32.105358 32.14089 32.956402 31.042969 32.982422 A 1.50015 1.50015 0 0 0 30.960938 32.984375 C 29.860722 32.960703 29 32.106951 29 31 L 29 28 C 29 26.877657 29.877657 26 31 26 z" />
  </svg>
);

const items = [
  {
    label: 'Getting started',
    children: [
      { value: 'faq', label: 'FAQ', icon: FaqIcon },
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
    version: '20261003-faq1'
  });
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountBranchedMenu, { once: true });
} else {
  mountBranchedMenu();
}
