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

type SubmitState = {
  enabled: boolean;
  submitting: boolean;
};

function readState(): SubmitState {
  const host = document.getElementById(HOST_ID);
  return {
    enabled: host?.dataset.enabled === 'true',
    submitting: host?.dataset.submitting === 'true',
  };
}

function HashcodRegistrationFlipButton() {
  const [state, setState] = React.useState<SubmitState>(readState);
  const actionable = state.enabled && !state.submitting;

  React.useEffect(() => {
    const sync = (event?: Event) => {
      const custom = event as CustomEvent<Partial<SubmitState>>;
      if (
        typeof custom?.detail?.enabled === 'boolean' ||
        typeof custom?.detail?.submitting === 'boolean'
      ) {
        setState((previous) => ({
          enabled:
            typeof custom.detail.enabled === 'boolean'
              ? custom.detail.enabled
              : previous.enabled,
          submitting:
            typeof custom.detail.submitting === 'boolean'
              ? custom.detail.submitting
              : previous.submitting,
        }));
        return;
      }
      setState(readState());
    };

    window.addEventListener(STATE_EVENT, sync);
    return () => window.removeEventListener(STATE_EVENT, sync);
  }, []);

  return (
    <FlipButton
      id="hashcodRegistrationSubmit"
      data-animate-ui-flip="official"
      from="top"
      tapScale={actionable ? 0.95 : 1}
      type={actionable ? 'submit' : 'button'}
      aria-disabled={actionable ? 'false' : 'true'}
      aria-busy={state.submitting ? 'true' : 'false'}
      aria-label="Enviar registro"
      className="hashcod-animate-ui-flip-button"
      onClick={(event) => {
        if (actionable) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <FlipButtonFront
        variant="default"
        size="lg"
        className="hashcod-animate-ui-flip-face hashcod-animate-ui-flip-front"
      >
        {state.submitting ? 'ENVIANDO…' : 'ENVIAR REGISTRO'}
      </FlipButtonFront>
      <FlipButtonBack
        variant="outline"
        size="icon"
        className="hashcod-animate-ui-flip-face hashcod-animate-ui-flip-back"
        aria-label="Enviar registro"
      >
        {state.submitting ? (
          <span className="hashcod-animate-ui-sending-dot" aria-hidden="true" />
        ) : (
          <PlusIcon aria-hidden="true" />
        )}
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
