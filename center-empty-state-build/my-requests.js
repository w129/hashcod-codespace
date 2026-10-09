import { useCallback, useEffect, useRef, useState } from 'react';
import { POLICY_CONSENT_EVENT } from './policy-consent';

export const REQUESTS_CHANGED_EVENT = 'hashcod:requests-changed';
const POLL_MS = 20000;

// The visitor's own tokenization requests (GET /api/platform-requests). The server derives identity from
// the signed cookies; the browser never sends an id. Refreshes on a timer, on focus and after a submission.
export function useMyRequests() {
  const [state, setState] = useState({ status: 'loading', requests: [], quota: null });
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const response = await fetch('/api/platform-requests', { credentials: 'same-origin', cache: 'no-store' });
      let data = null;
      try { data = await response.json(); } catch { /* generic error below */ }
      if (response.ok && data?.ok && Array.isArray(data.requests)) setState({ status: 'ready', requests: data.requests, quota: data.quota || null });
      else setState(current => ({ ...current, status: response.status === 403 ? 'locked' : 'error' }));
    } catch {
      setState(current => ({ ...current, status: 'error' }));
    } finally { busy.current = false; }
  }, []);

  useEffect(() => {
    load();
    const tick = () => { if (document.visibilityState === 'visible') load(); };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    window.addEventListener(REQUESTS_CHANGED_EVENT, load);
    window.addEventListener(POLICY_CONSENT_EVENT, load);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
      window.removeEventListener(REQUESTS_CHANGED_EVENT, load);
      window.removeEventListener(POLICY_CONSENT_EVENT, load);
    };
  }, [load]);

  return { ...state, reload: load };
}
