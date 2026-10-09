import { useEffect, useState } from 'react';

// Acceptance of the Use and Privacy Policy. Kept per browser session only (no personal data) and
// shared between the footer checkbox and the checkout through a window event.
export const POLICY_CONSENT_KEY = 'hashcod:policy-consent';
export const POLICY_CONSENT_EVENT = 'hashcod:policy-consent';

export function readPolicyConsent() {
  try { return window.sessionStorage.getItem(POLICY_CONSENT_KEY) === 'accepted'; } catch { return false; }
}

export function writePolicyConsent(accepted) {
  try {
    if (accepted) window.sessionStorage.setItem(POLICY_CONSENT_KEY, 'accepted');
    else window.sessionStorage.removeItem(POLICY_CONSENT_KEY);
  } catch { /* storage may be blocked; the event still updates every listener */ }
  window.dispatchEvent(new CustomEvent(POLICY_CONSENT_EVENT, { detail: { accepted } }));
}

export function usePolicyConsent() {
  const [accepted, setAccepted] = useState(readPolicyConsent);
  useEffect(() => {
    const sync = event => setAccepted(typeof event.detail?.accepted === 'boolean' ? event.detail.accepted : readPolicyConsent());
    window.addEventListener(POLICY_CONSENT_EVENT, sync);
    return () => window.removeEventListener(POLICY_CONSENT_EVENT, sync);
  }, []);
  return [accepted, writePolicyConsent];
}
