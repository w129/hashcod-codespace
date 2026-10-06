import React from 'react';
import { FILE_VALUE_ICON_PATH, formatUsdValue } from './file-value.js';

export function FileValueIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor"><path d={FILE_VALUE_ICON_PATH} /></svg>;
}
export function FileValueBadge({ cents }) {
  const label = formatUsdValue(cents);
  return label ? <span className="hfv-file-value" data-hfv-price-usd-cents={cents} title={'File value: ' + label}><FileValueIcon />{label}</span> : null;
}
