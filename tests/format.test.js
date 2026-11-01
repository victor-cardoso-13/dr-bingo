import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAmount, formatCredits, formatMoney } from '../src/format.js';

test('formatCredits usa ponto de milhar', () => {
  assert.equal(formatCredits(1000), '1.000');
  assert.equal(formatCredits(12345), '12.345');
  assert.equal(formatCredits(0), '0');
});

test('formatMoney: USD com ponto de milhar e centavos', () => {
  assert.equal(formatMoney(1), 'USD 1,00');
  assert.equal(formatMoney(0), 'USD 0,00');
  assert.equal(formatMoney(126), 'USD 126,00');
  assert.equal(formatMoney(1000000), 'USD 1.000.000,00');
  assert.equal(formatAmount(4006), '4.006,00');
});
