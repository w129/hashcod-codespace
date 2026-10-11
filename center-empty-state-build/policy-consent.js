import { useCallback, useEffect, useState } from 'react';

// The signed, HttpOnly consent cookie is the source of truth; the server renders its state into <body>.
// Acceptance is stored server-side as append-only evidence and can never be withdrawn from the UI.
export const POLICY_CONSENT_EVENT = 'hashcod:policy-consent';

export function readPolicyConsent() {
  return document.body?.dataset.hashcodPolicyConsent === '1';
}

export async function postPolicyConsent() {
  const version = document.body.dataset.hashcodPolicyVersion || '';
  const response = await fetch('/api/policy-consent', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accept: true, version }),
  });
  let data = null;
  try { data = await response.json(); } catch { /* handled below */ }
  if (!response.ok || !data?.ok || data.accepted !== true) throw new Error(data?.error || 'No se pudo guardar tu aceptación. Intenta de nuevo.');
  document.body.dataset.hashcodPolicyConsent = '1';
  window.dispatchEvent(new CustomEvent(POLICY_CONSENT_EVENT, { detail: { accepted: true } }));
}

// Until accepted, everything on the page except the consent footer is inert and dimmed.
export function lockPlatform(locked) {
  document.body.classList.toggle('hpc-locked', locked);
  for (const node of document.body.children) {
    if (!(node instanceof HTMLElement) || node.id === 'd5PreviewPolicyFooter' || node.id === 'hashcodPlatformIntro' || /^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(node.tagName)) continue;
    if (locked) { if (!node.inert) { node.inert = true; node.dataset.hpcInert = '1'; } }
    else if (node.dataset.hpcInert === '1') { node.inert = false; delete node.dataset.hpcInert; }
  }
}

// Read-only view of the acceptance, for components that must wait for it (e.g. the checkout).
export function usePolicyAccepted() {
  const [accepted, setAccepted] = useState(readPolicyConsent);
  useEffect(() => {
    const sync = () => setAccepted(readPolicyConsent());
    window.addEventListener(POLICY_CONSENT_EVENT, sync);
    sync();
    return () => window.removeEventListener(POLICY_CONSENT_EVENT, sync);
  }, []);
  return accepted;
}

// Owner of the consent checkbox: records the acceptance and keeps the platform locked until then.
export function usePolicyConsent() {
  const accepted = usePolicyAccepted();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { lockPlatform(!accepted); return () => lockPlatform(false); }, [accepted]);
  const accept = useCallback(async () => {
    if (busy || accepted) return;
    setBusy(true); setError('');
    try { await postPolicyConsent(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, [busy, accepted]);
  return { accepted, busy, error, accept };
}
