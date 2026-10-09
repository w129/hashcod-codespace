import React from 'react';
import { LOGO_HEIGHT, LOGO_PATH, LOGO_VIEWBOX, LOGO_WIDTH } from './hashcod-logo-path';

// Hashcod® Codespace · PSOT Registro de comprobación, as an inline vector element (no image file).
export default function HashcodLogo({ className = '' }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} width={LOGO_WIDTH} height={LOGO_HEIGHT} role="img" aria-labelledby="hco-logo-title" focusable="false">
      <title id="hco-logo-title">Hashcod Codespace · PSOT Prueba Sellada de Objeto y Tiempo</title>
      <path d={LOGO_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
