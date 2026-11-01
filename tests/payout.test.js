import test from 'node:test';
import assert from 'node:assert/strict';
import { cardPrize, settleRound } from '../src/engine/payout.js';
import { BASE_DRAWN as BASE, CARD_A, CARD_B } from './fixtures.js';

test('E2: extra 51 → total 4000', () => {
  const drawn = new Set([...BASE, 51]);
  const r = settleRound({ cards: [CARD_A, CARD_B], active: [true, true], bet: 2, drawnSet: drawn });
  assert.equal(r.perCard[0].win, 4000);
  assert.equal(r.perCard[1].win, 0);
  assert.equal(r.total, 4000);
});

test('E2: extra 54 → total 246', () => {
  const drawn = new Set([...BASE, 54]);
  const r = settleRound({ cards: [CARD_A, CARD_B], active: [true, true], bet: 2, drawnSet: drawn });
  assert.equal(r.perCard[0].win, 240);
  assert.equal(r.perCard[1].win, 6);
  assert.equal(r.total, 246);
});

test('cartela desligada é null e não soma', () => {
  const r = settleRound({ cards: [CARD_A, CARD_B], active: [true, false], bet: 1, drawnSet: new Set(BASE) });
  assert.equal(r.perCard[1], null);
  assert.equal(r.total, 120);
  assert.equal(cardPrize(CARD_B, new Set(), 1).win, 0);
});
