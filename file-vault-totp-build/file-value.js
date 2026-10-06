export const MAX_USD_CENTS = 999999999;
export function validateUsdCents(value) {
  if (value === undefined || value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_USD_CENTS) {
    throw Object.assign(new Error('Enter a USD value from $0.00 to $9,999,999.99, with up to two decimals.'), { status: 400 });
  }
  return value;
}
export function parseUsdAmount(input) {
  const text = String(input ?? '').trim().replace(',', '.');
  if (!text) return null;
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(text)) throw new Error('Enter a valid USD amount with up to two decimals.');
  const [whole, fraction = ''] = text.split('.');
  return validateUsdCents(Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
}
export function formatUsdValue(value) {
  try {
    const cents = validateUsdCents(value);
    return cents === null ? null : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100) + ' USD';
  } catch { return null; }
}
