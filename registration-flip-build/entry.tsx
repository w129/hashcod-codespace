import * as React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PlusIcon } from 'lucide-react';

import {
  FlipButton,
  FlipButtonBack,
  FlipButtonFront,
} from './src/components/buttons/flip';

const HOST_ID = 'hashcodRegistrationSubmitReactHost';
const STATE_EVENT = 'hashcod:registration-submit-state';
const MOUNT_EVENT = 'hashcod:registration-form-mounted';

let activeRoot: Root | null = null;
let activeHost: HTMLElement | null = null;

function readEnabled(): boolean {
  const host = document.getElementById(HOST_ID);
  return host?.dataset.enabled === 'true';
}

function HashcodRegistrationFlipButton() {
  const [enabled, setEnabled] = React.useState(readEnabled);

  React.useEffect(() => {
    const sync = (event?: Event) => {
      const custom = event as CustomEvent<{ enabled?: boolean }>;
      if (typeof custom?.detail?.enabled === 'boolean') {
        setEnabled(custom.detail.enabled);
        return;
      }
      setEnabled(readEnabled());
    };

    window.addEventListener(STATE_EVENT, sync);
    return () => window.removeEventListener(STATE_EVENT, sync);
  }, []);

  return (
    <FlipButton
      id="hashcodRegistrationSubmit"
      data-animate-ui-flip="official"
      from="top"
      tapScale={enabled ? 0.95 : 1}
      type={enabled ? 'submit' : 'button'}
      aria-disabled={enabled ? 'false' : 'true'}
      aria-label="Enviar registro"
      className="hashcod-animate-ui-flip-button"
      onClick={(event) => {
        if (enabled) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <FlipButtonFront
        variant="default"
        size="lg"
        className="hashcod-animate-ui-flip-face hashcod-animate-ui-flip-front"
      >
        ENVIAR REGISTRO
      </FlipButtonFront>
      <FlipButtonBack
        variant="outline"
        size="icon"
        className="hashcod-animate-ui-flip-face hashcod-animate-ui-flip-back"
        aria-label="Enviar registro"
      >
        <PlusIcon aria-hidden="true" />
      </FlipButtonBack>
    </FlipButton>
  );
}

function mount(): boolean {
  const host = document.getElementById(HOST_ID);
  if (!host) return false;
  if (host === activeHost && activeRoot) return true;

  if (activeRoot) {
    try { activeRoot.unmount(); } catch (_) {}
    activeRoot = null;
  }

  activeHost = host;
  activeRoot = createRoot(host);
  activeRoot.render(<HashcodRegistrationFlipButton />);
  return true;
}

window.addEventListener(MOUNT_EVENT, mount);
window.addEventListener('hashcod:final-entry-screen', mount);
window.addEventListener('hashcod:platform-entered', () => {
  if (activeRoot) {
    try { activeRoot.unmount(); } catch (_) {}
  }
  activeRoot = null;
  activeHost = null;
}, { once: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
