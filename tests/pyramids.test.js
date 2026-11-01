import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePyramids, pyramidPattern, pyramidPrize, settlePyramids, hotPyramidCells, pyramidExtraOffer,
  SIDES, PYRAMID_BALL_MAX, drawPyramidSequence, PYRAMID_DRAW_BIAS,
} from '../src/engine/pyramids.js';
import { shuffleRange } from '../src/engine/draw.js';
import { makeSeededRandomInt } from '../src/engine/rng.js';

const PYR = [3, 5, 12, 18, 20, 27, 31, 33, 43, 52, 53, 60, 62, 73, 89]; // pirâmide da foto
const marked = (idx) => PYR.map((_, i) => idx.includes(i));
const drawnOf = (idx) => new Set(idx.map((i) => PYR[i]));

test('generatePyramids: 4 pirâmides de 15 números ordenados, todos diferentes, de 1 a 90', () => {
  const p = generatePyramids(4, makeSeededRandomInt(3));
  assert.equal(p.length, 4);
  const all = p.flat();
  assert.equal(new Set(all).size, 60);
  assert.ok(all.every((n) => n >= 1 && n <= PYRAMID_BALL_MAX));
  for (const pyr of p) {
    assert.equal(pyr.length, 15);
    assert.deepEqual([...pyr], [...pyr].sort((a, b) => a - b));
  }
});

test('mesma semente, mesmas pirâmides', () => {
  assert.deepEqual(generatePyramids(4, makeSeededRandomInt(8)), generatePyramids(4, makeSeededRandomInt(8)));
});

test('shuffleRange(90) é uma permutação de 1..90', () => {
  const seq = shuffleRange(90, makeSeededRandomInt(1));
  assert.deepEqual([...seq].sort((a, b) => a - b), Array.from({ length: 90 }, (_, i) => i + 1));
});

test('os lados têm 5 casas e se encontram nos cantos', () => {
  assert.deepEqual(SIDES.left.filter((i) => SIDES.right.includes(i)), [0]);
  assert.deepEqual(SIDES.left.filter((i) => SIDES.base.includes(i)), [10]);
  assert.deepEqual(SIDES.right.filter((i) => SIDES.base.includes(i)), [14]);
});

test('prêmios: nada, 1, 2, 3 lados e Bingo', () => {
  assert.equal(pyramidPattern(marked([0, 1, 2, 3, 4, 5])), null);
  assert.equal(pyramidPattern(marked(SIDES.base)).multiplier, 3);
  assert.equal(pyramidPattern(marked(SIDES.left)).multiplier, 3);
  assert.equal(pyramidPattern(marked([...SIDES.left, ...SIDES.base])).multiplier, 70);
  assert.equal(pyramidPattern(marked([...SIDES.left, ...SIDES.right])).multiplier, 70);
  const tres = [...SIDES.left, ...SIDES.right, ...SIDES.base];
  assert.equal(pyramidPattern(marked(tres)).multiplier, 200);
  assert.equal(tres.length - new Set(tres).size, 3); // cantos repetidos
  const all = PYR.map((_, i) => i);
  assert.equal(pyramidPattern(marked(all)).multiplier, 1000);
  assert.equal(pyramidPattern(marked(all)).name, 'Bingo');
});

test('pyramidPrize multiplica pela aposta; só o maior prêmio', () => {
  const p = pyramidPrize(PYR, drawnOf([...SIDES.left, ...SIDES.base]), 5);
  assert.equal(p.win, 350);
  assert.equal(p.pattern.name, '2 lados');
});

test('settlePyramids ignora as desligadas', () => {
  const full = new Set(PYR);
  const { perCard, total } = settlePyramids({ cards: [PYR, PYR], active: [true, false], bet: 2, drawnSet: full });
  assert.equal(perCard[1], null);
  assert.equal(total, 2000);
});

test('hotPyramidCells: só quando uma bola leva a 2 lados ou mais', () => {
  const um = drawnOf(SIDES.base); // 1 lado; falta marcar o lado esquerdo (4 casas) → nada com 1 bola
  assert.deepEqual(hotPyramidCells(PYR, um), []);
  const quase = drawnOf([...SIDES.base, 0, 1, 3, 6]); // esquerda só sem a casa 10? 10 está na base → esquerda completa
  assert.equal(pyramidPattern(PYR.map((n) => quase.has(n))).multiplier, 70);
  const falta1 = drawnOf([...SIDES.base.slice(0, 4), 0, 1, 3, 6, 2, 5, 9]); // falta só a casa 14 (canto)
  const hot = hotPyramidCells(PYR, falta1);
  assert.deepEqual(hot.map((h) => h.cell), [14]);
});

test('pyramidExtraOffer: custo = ganho / bolas restantes, sem proposta se nada melhora', () => {
  const none = pyramidExtraOffer({ cards: [PYR], active: [true], bet: 1, drawnSet: new Set() });
  assert.equal(none.cost, 0);
  const drawnSet = drawnOf([...SIDES.base, 0, 1, 3, 6]); // 2 lados feitos; falta a direita (2,5,9 + 14 já)… falta 2, 5, 9
  assert.equal(pyramidExtraOffer({ cards: [PYR], active: [true], bet: 1, drawnSet }).cost, 0); // precisa de 3 bolas
  const d2 = drawnOf([...SIDES.base, 0, 1, 3, 6, 2, 5]); // falta só a casa 9 para 3 lados
  const o = pyramidExtraOffer({ cards: [PYR], active: [true], bet: 1, drawnSet: d2 });
  assert.equal(o.totalGain, 130); // 200 − 70
  assert.equal(o.cost, Math.ceil(130 / (90 - d2.size)));
  assert.deepEqual([...o.hotNumbers], [PYR[9]]);
  assert.equal(pyramidExtraOffer({ cards: [PYR], active: [false], bet: 1, drawnSet: d2 }).cost, 0);
});

test('drawPyramidSequence é uma permutação de 1..90 e a mesma semente repete', () => {
  const cards = generatePyramids(4, makeSeededRandomInt(2));
  const a = drawPyramidSequence(cards, [true, true, true, true], makeSeededRandomInt(5));
  assert.deepEqual([...a].sort((x, y) => x - y), Array.from({ length: 90 }, (_, i) => i + 1));
  assert.deepEqual(a, drawPyramidSequence(cards, [true, true, true, true], makeSeededRandomInt(5)));
});

test('empurrãozinho: mais números das pirâmides entre as 45 primeiras bolas (e só das ligadas)', () => {
  const cards = generatePyramids(4, makeSeededRandomInt(4));
  const rng = makeSeededRandomInt(11);
  const mean = (bias, active) => {
    let sum = 0;
    const on = new Set(cards.flatMap((c, i) => (active[i] ? c : [])));
    for (let k = 0; k < 400; k++) sum += drawPyramidSequence(cards, active, rng, bias).slice(0, 45).filter((n) => on.has(n)).length;
    return sum / 400;
  };
  const all = [true, true, true, true];
  assert.ok(Math.abs(mean(1, all) - 30) < 1, 'justo: 45 × 60/90 = 30');
  assert.ok(mean(PYRAMID_DRAW_BIAS, all) > 34, 'com empurrão passa de 34');
  assert.ok(mean(2, [true, false, false, false]) > 15 * 45 / 90 * 1.2, 'só conta pirâmide ligada');
});

test('bola extra mais cara quando o sorteio tem empurrãozinho; igual ao justo com bias 1', () => {
  const d2 = drawnOf([...SIDES.base, 0, 1, 3, 6, 2, 5]);
  const args = { cards: [PYR], active: [true], bet: 1, drawnSet: d2 };
  assert.equal(pyramidExtraOffer({ ...args, bias: 1 }).cost, Math.ceil(130 / (90 - d2.size)));
  assert.ok(pyramidExtraOffer({ ...args, bias: 2 }).cost > pyramidExtraOffer({ ...args, bias: 1 }).cost);
});
