import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const { ACCOUNT_KEY, STORAGE_KEY, anonymousProgress, applyShared, currentAccount, getState, sharedOf, switchAccount, update, MAX_CARDS, loadState, stepCardCount, totalBet, toggleCard, stepBet, BET_STEPS } = await import('../src/state.js');

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

test('sharedAt só muda quando saldo, aposta, cartelas ou estatísticas mudam', () => {
  store.clear();
  loadState();
  update((s) => { s.settings.sound = false; s.lastDrawn = [1, 2]; });
  assert.equal(getState().sharedAt, 0);
  update((s) => { s.credits += 5; });
  assert.ok(getState().sharedAt > 0);
});

test('cada conta tem a sua gaveta, separada de "sem conta"', () => {
  store.clear();
  loadState();
  update((s) => { s.credits = 777; });
  assert.equal(anonymousProgress().credits, 777);

  // entra numa conta levando o progresso do aparelho
  switchAccount('ana', { seed: { ...anonymousProgress(), updatedAt: 50 }, clearAnonymous: true });
  assert.equal(currentAccount(), 'ana');
  assert.equal(store.has(STORAGE_KEY), false);
  assert.equal(loadState().credits, 777);
  assert.equal(getState().sharedAt, 50);
  update((s) => { s.credits = 100; });
  assert.ok(store.has(`${STORAGE_KEY}:ana`));

  // sai: volta para "sem conta", vazio; a conta continua guardada
  switchAccount(null);
  assert.equal(currentAccount(), null);
  assert.equal(store.has(ACCOUNT_KEY), false);
  assert.equal(loadState().credits, 1000);
  switchAccount('ana');
  assert.equal(loadState().credits, 100);
});

test('applyShared põe na tela o que veio da nuvem e guarda o carimbo dela', () => {
  store.clear();
  loadState();
  applyShared({ credits: 5000, bet: 20, cardCount: 6, stats: { rounds: 3, biggestWin: 40 }, updatedAt: 999 });
  const s = getState();
  assert.equal(s.credits, 5000);
  assert.equal(s.cardCount, 6);
  assert.equal(s.active.filter(Boolean).length, 6);
  assert.equal(s.sharedAt, 999);
  assert.deepEqual(sharedOf(s).stats, { rounds: 3, biggestWin: 40 });
});
