import React from 'react';
import { Label } from 'radix-ui';
import { Checkbox } from './animate-ui/checkbox-radix';
import { usePolicyConsent } from './policy-consent';
import './policy-consent.css';

// Required acceptance of the Use and Privacy Policy. `id` keeps the footer and checkout copies distinct.
export default function PolicyConsent({ id = 'hpc-footer', className = '' }) {
  const [accepted, setAccepted] = usePolicyConsent();
  return (
    <div className={`hpc ${className}`.trim()} data-accepted={accepted ? 'true' : 'false'}>
      <Label.Root htmlFor={id} className="flex items-center gap-x-3 hpc-label">
        <Checkbox id={id} checked={accepted} onCheckedChange={value => setAccepted(value === true)} required aria-required="true" aria-describedby={`${id}-hint`} />
        <span>Acepto los términos de la <a href="/privacy" target="_self">Use and Privacy Policy</a></span>
      </Label.Root>
      <p id={`${id}-hint`} className="hpc-hint" role="status">{accepted ? 'Gracias, ya puedes continuar.' : 'Es necesario marcar esta casilla para aceptar los términos y continuar.'}</p>
    </div>
  );
}
