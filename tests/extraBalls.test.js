import test from 'node:test';
import assert from 'node:assert/strict';
import { extraBallOffer } from '../src/engine/extraBalls.js';
import { BASE_DRAWN, CARD_A, CARD_B } from './fixtures.js';

const drawn = new Set(BASE_DRAWN);

test('as 30 bolas do exemplo', () => {
  assert.equal(drawn.size, 30);
});

test('E1: só A, aposta 1 → custo 63', () => {
  const o = extraBallOffer({ cards: [CARD_A, CARD_B], active: [true, false], bet: 1, drawnSet: drawn });
  assert.equal(o.totalGain, 1880);
  assert.equal(o.cost, 63);
  assert.deepEqual([...o.hotNumbers], [51]);
});

test('E2: A e B, aposta 2 → custo 126', () => {
  const o = extraBallOffer({ cards: [CARD_A, CARD_B], active: [true, true], bet: 2, drawnSet: drawn });
  assert.equal(o.totalGain, 3766);
  assert.equal(o.cost, 126);
  assert.deepEqual([...o.hotNumbers].sort(), [51, 54]);
});

test('E3: só B, aposta 1 → custo 1', () => {
  const o = extraBallOffer({ cards: [CARD_A, CARD_B], active: [false, true], bet: 1, drawnSet: drawn });
  assert.equal(o.totalGain, 3);
  assert.equal(o.cost, 1);
});

test('E4: cartela sem marcas → custo 0', () => {
  const o = extraBallOffer({ cards: [CARD_A], active: [true], bet: 1, drawnSet: new Set([60, 59]) });
  assert.equal(o.cost, 0);
  assert.equal(o.totalGain, 0);
  assert.equal(o.hotNumbers.size, 0);
});
