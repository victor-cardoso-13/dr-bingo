import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACC_MAX, ACC_START, decodeBall, drawLotto, encodeBall, generateLotto, lottoPattern, lottoPrize, nextAcc, settleLotto,
} from '../src/engine/lotto.js';
import { makeSeededRandomInt } from '../src/engine/rng.js';

const balls = (digits, tiers = []) => new Set(digits.map((d, k) => encodeBall(k, tiers[k] ?? 0, d)));

test('bola codificada volta igual', () => {
  assert.deepEqual(decodeBall(encodeBall(4, 2, 7)), { pos: 4, tier: 2, digit: 7, mult: 3 });
});

test('cartelas: 6 dígitos de 0 a 9', () => {
  const cards = generateLotto(4, makeSeededRandomInt(1));
  assert.equal(cards.length, 4);
  for (const c of cards) assert.ok(c.length === 6 && c.every((d) => d >= 0 && d <= 9));
});

test('padrões: Sequência conta da esquerda; Qualquer conta em qualquer casa; vale o maior', () => {
  assert.equal(lottoPattern([true, false, false, false, false, false]), null);
  assert.equal(lottoPattern([true, true, true, false, false, false]).id, 'seq3');
  assert.equal(lottoPattern([false, true, true, true, false, false]).id, 'any3'); // 3 soltos pagam menos que 3 seguidos
  assert.equal(lottoPattern([true, true, true, false, false, false]).multiplier, 3);
  assert.equal(lottoPattern([false, true, true, true, false, false]).multiplier, 2);
  assert.equal(lottoPattern([false, false, false, false, true, true]).id, 'any2');
  assert.equal(lottoPattern([true, true, true, true, true, true]).multiplier, 250);
  assert.equal(lottoPattern([true, true, true, true, true, false]).id, 'seq5');
  assert.equal(lottoPattern([true, false, true, true, true, true]).id, 'any5');
});

test('a bola k só vale na casa k', () => {
  const card = [1, 2, 3, 4, 5, 6];
  assert.equal(lottoPrize(card, balls([2, 1, 3, 4, 5, 6]), 10).pattern.id, 'any4');
  assert.equal(lottoPrize(card, balls([1, 2, 3, 0, 0, 0]), 10).win, 30);
});

test('prateada ×2 e dourada ×3 só valem se a bola acertou; a maior vale (não multiplicam entre si)', () => {
  const card = [1, 2, 3, 0, 0, 0];
  assert.equal(lottoPrize(card, balls([1, 2, 3, 9, 9, 9], [1, 0, 0, 0, 0, 0]), 10).win, 30 * 2);
  assert.equal(lottoPrize(card, balls([1, 2, 3, 9, 9, 9], [1, 2, 0, 0, 0, 0]), 10).win, 30 * 3);
  assert.equal(lottoPrize(card, balls([1, 2, 3, 9, 9, 9], [0, 0, 0, 2, 0, 0]), 10).win, 30); // dourada numa bola errada
});

test('6 seguidos pagam ×250 e mais o Acumulado (múltiplo da aposta)', () => {
  const card = [1, 2, 3, 4, 5, 6];
  const p = lottoPrize(card, balls([1, 2, 3, 4, 5, 6]), 10, 100);
  assert.equal(p.pattern.id, 'seq6');
  assert.equal(p.win, 250 * 10 + 100 * 10);
  assert.equal(lottoPrize(card, balls([1, 2, 3, 4, 5, 0]), 10, 100).accWin, 0);
});

test('settleLotto soma só as cartelas ligadas', () => {
  const cards = [[1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]];
  const r = settleLotto({ cards, active: [true, false], bet: 2, drawnSet: balls([1, 1, 0, 0, 0, 0]) });
  assert.equal(r.total, 4);
  assert.equal(r.perCard[1], null);
});

test('Acumulado sobe de pouco em pouco e tem teto', () => {
  assert.ok(nextAcc(ACC_START) > ACC_START);
  assert.equal(nextAcc(ACC_MAX), ACC_MAX);
});

test('sorteio: 6 bolas, uma por casa, no máximo 1 prateada e 1 dourada em casas diferentes', () => {
  const ri = makeSeededRandomInt(7);
  for (let i = 0; i < 2000; i++) {
    const cards = generateLotto(4, ri);
    const drawn = drawLotto(cards, [true, true, true, true], ri).map(decodeBall);
    assert.deepEqual(drawn.map((b) => b.pos), [0, 1, 2, 3, 4, 5]);
    assert.ok(drawn.every((b) => b.digit >= 0 && b.digit <= 9));
    assert.ok(drawn.filter((b) => b.tier === 1).length <= 1 && drawn.filter((b) => b.tier === 2).length <= 1);
  }
});

// Retorno com o empurrãozinho: precisa ficar perto de 90–100% em qualquer arrumação das cartelas (sem brecha).
function rtp(makeCards, count, rounds = 60000) {
  const ri = makeSeededRandomInt(99);
  let spent = 0;
  let paid = 0;
  let acc = ACC_START;
  for (let i = 0; i < rounds; i++) {
    const cards = makeCards(ri);
    const active = cards.map((_, k) => k < count);
    acc = nextAcc(acc);
    const { total, perCard } = settleLotto({ cards, active, bet: 1, drawnSet: new Set(drawLotto(cards, active, ri)), acc });
    spent += count;
    paid += total;
    if (perCard.some((p) => p?.accWin > 0)) acc = ACC_START;
  }
  return paid / spent;
}

test('retorno fica entre 85% e 110% com 4 cartelas aleatórias, 1 cartela, cartelas iguais e linhas IGUAIS', () => {
  const same = (ri) => { const c = generateLotto(1, ri)[0]; return [c, [...c], [...c], [...c]]; };
  const equalRows = (ri) => Array.from({ length: 4 }, () => Array(6).fill(ri(10)));
  for (const [name, mk, n] of [['4 aleatórias', (ri) => generateLotto(4, ri), 4], ['1 cartela', (ri) => generateLotto(4, ri), 1],
    ['cópias', same, 4], ['IGUAIS', equalRows, 4]]) {
    const r = rtp(mk, n);
    assert.ok(r > 0.85 && r < 1.1, `${name}: retorno ${(r * 100).toFixed(0)}%`);
  }
});
