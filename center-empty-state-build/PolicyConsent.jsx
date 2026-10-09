import React from 'react';
import { Label } from 'radix-ui';
import { Checkbox } from './animate-ui/checkbox-radix';
import { usePolicyConsent } from './policy-consent';
import './policy-consent.css';

// Required, one-way acceptance of the Use and Privacy Policy. Ticking it records the evidence on the
// server and sets a signed cookie; once accepted it stays checked and cannot be undone from the page.
export default function PolicyConsent() {
  const { accepted, busy, error, accept } = usePolicyConsent();
  return (
    <div className="hpc" data-accepted={accepted ? 'true' : 'false'}>
      <Label.Root htmlFor="hpc-consent" className="flex items-center gap-x-3 hpc-label">
        <Checkbox id="hpc-consent" checked={accepted} disabled={accepted || busy} onCheckedChange={value => { if (value === true) accept(); }} required aria-required="true" aria-describedby={accepted ? undefined : 'hpc-note'} />
        <span>Acepto los términos de la <a href="/privacy" target="_blank" rel="noopener noreferrer">Use and Privacy Policy</a></span>
      </Label.Root>
      {!accepted && <p id="hpc-note" className="hpc-note" role={error ? 'alert' : 'status'}>{error || (busy ? 'Guardando tu aceptación…' : 'Es obligatorio marcar esta casilla para usar la plataforma.')}</p>}
    </div>
  );
}
