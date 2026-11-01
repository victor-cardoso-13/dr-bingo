import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
const { STORAGE_KEY, MAX_CARDS, loadState, stepCardCount, totalBet, toggleCard, stepBet, BET_STEPS } = await import('../src/state.js');

test('padrão: 8 cartelas guardadas, 4 aparecendo e ligadas', () => {
  store.clear();
  const s = loadState();
  assert.equal(s.cards.length, MAX_CARDS);
  assert.equal(s.cardCount, 4);
  assert.deepEqual(s.active, [true, true, true, true, false, false, false, false]);
});

test('estado antigo com 4 cartelas é completado e mantém as 4 primeiras', () => {
  const old = Array.from({ length: 4 }, (_, i) => Array.from({ length: 15 }, (_, j) => i * 15 + j + 1));
  store.set(STORAGE_KEY, JSON.stringify({ cards: old, active: [true, false, true, true], bet: 3 }));
  const s = loadState();
  assert.equal(s.cards.length, MAX_CARDS);
  assert.deepEqual(s.cards.slice(0, 4), old);
  assert.deepEqual(s.active, [true, false, true, true, false, false, false, false]);
  assert.equal(s.bet, 1); // 3 saiu dos degraus
});

test('mais/menos cartelas liga e desliga a última, entre 1 e 8', () => {
  store.clear();
  const s = loadState();
  stepCardCount(1);
  assert.equal(s.cardCount, 5);
  assert.equal(s.active[4], true);
  assert.equal(totalBet(s), 5);
  for (let i = 0; i < 10; i++) stepCardCount(1);
  assert.equal(s.cardCount, 8);
  for (let i = 0; i < 10; i++) stepCardCount(-1);
  assert.equal(s.cardCount, 1);
  assert.deepEqual(s.active, [true, false, false, false, false, false, false, false]);
  toggleCard(5); // escondida: não faz nada
  assert.equal(s.active[5], false);
});

test('aposta vai até 1.000', () => {
  store.clear();
  const s = loadState();
  for (let i = 0; i < 20; i++) stepBet(1);
  assert.equal(s.bet, 1000);
  assert.equal(BET_STEPS.at(-1), 1000);
});
