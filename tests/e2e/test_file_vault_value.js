const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../file-vault-totp-build/file-value.js'), 'utf8');
  const value = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  for (const [input, cents] of [['', null], ['  ', null], ['0', 0], ['0.01', 1], ['12.50', 1250], ['12,50', 1250], ['9.9', 990], ['9999999.99', 999999999]]) {
    assert.equal(value.parseUsdAmount(input), cents);
  }
  for (const input of ['-1', 'NaN', 'Infinity', '1e3', '1.001', '10000000', '<script>', '1,234.56']) {
    assert.throws(() => value.parseUsdAmount(input), /USD/);
  }
  assert.equal(value.formatUsdValue(null), null);
  assert.equal(value.formatUsdValue(0), '$0.00 USD');
  assert.equal(value.formatUsdValue(1250), '$12.50 USD');
  for (const cents of [-1, 1.5, NaN, Infinity, '1250', 1000000000]) assert.throws(() => value.validateUsdCents(cents));
  console.log('USD file value: optional/zero, exact cents, comma decimals, bounded input and explicit USD display OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
