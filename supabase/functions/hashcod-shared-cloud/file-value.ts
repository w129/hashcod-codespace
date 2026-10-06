import { fail } from './core.ts';
export function usdCents(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 999999999) {
    fail(400, 'Enter a USD value from $0.00 to $9,999,999.99, with up to two decimals.');
  }
  return value;
}
