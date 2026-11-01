import { cryptoRandomInt } from './rng.js';

// Modo Faraó (sessão 19): pirâmides de 15 números (fileiras de 1 a 5), bolas de 1 a 90.
export const PYRAMID_BALL_MAX = 90;
export const PYRAMID_MAIN_BALLS = 45;
export const PYRAMID_MAX_EXTRA = 10;
export const FREE_EXTRA = 5; // a 5ª bola extra sai de graça
export const MAX_PYRAMIDS = 4;
// "Empurrãozinho": no sorteio, cada número que está numa pirâmide ligada vale 2 fichas em vez de 1 (inteiro).
export const PYRAMID_DRAW_BIAS = 2;
export const PYRAMID_SIZE = 15;

// Índice = posição na pirâmide, de cima para baixo e da esquerda para a direita:
//        0
//       1 2
//      3 4 5
//     6 7 8 9
//   10 11 12 13 14
export const SIDES = {
  left: [0, 1, 3, 6, 10],
  right: [0, 2, 5, 9, 14],
  base: [10, 11, 12, 13, 14],
};

export const BINGO_MULTIPLIER = 1000;
export const SIDE_MULTIPLIERS = [0, 3, 70, 200]; // por quantidade de lados completos

// Os 4 jogos de pirâmides usam números diferentes entre si; cada pirâmide é ordenada.
export function generatePyramids(count = MAX_PYRAMIDS, randomInt = cryptoRandomInt) {
  const balls = Array.from({ length: PYRAMID_BALL_MAX }, (_, i) => i + 1);
  for (let i = balls.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }
  return Array.from({ length: count }, (_, k) =>
    balls.slice(k * PYRAMID_SIZE, (k + 1) * PYRAMID_SIZE).sort((a, b) => a - b),
  );
}

// Ordem em que as 90 bolas saem. Sorteio por fichas, sem repetir: os números das pirâmides ligadas têm `bias` fichas, os outros 1.
export function drawPyramidSequence(cards, active, randomInt = cryptoRandomInt, bias = PYRAMID_DRAW_BIAS) {
  const on = new Set();
  cards.forEach((pyramid, i) => {
    if (active[i]) pyramid.forEach((n) => on.add(n));
  });
  const weight = (n) => (on.has(n) ? bias : 1);
  const pool = Array.from({ length: PYRAMID_BALL_MAX }, (_, i) => i + 1);
  let total = pool.reduce((sum, n) => sum + weight(n), 0);
  const sequence = [];
  while (pool.length) {
    let ticket = randomInt(total);
    let k = 0;
    while (ticket >= weight(pool[k])) {
      ticket -= weight(pool[k]);
      k++;
    }
    const [n] = pool.splice(k, 1);
    total -= weight(n);
    sequence.push(n);
  }
  return sequence;
}

export function completeSides(marked) {
  return Object.values(SIDES).filter((side) => side.every((i) => marked[i])).length;
}

// marked: boolean[15]. Multiplicador e nome do prêmio (só o maior vale).
export function pyramidPattern(marked) {
  if (marked.every(Boolean)) return { id: 'bingo', name: 'Bingo', multiplier: BINGO_MULTIPLIER, sides: 3 };
  const sides = completeSides(marked);
  if (sides === 0) return null;
  return { id: `sides${sides}`, name: sides === 1 ? '1 lado' : `${sides} lados`, multiplier: SIDE_MULTIPLIERS[sides], sides };
}

export function pyramidPrize(pyramid, drawnSet, bet) {
  const pattern = pyramidPattern(pyramid.map((n) => drawnSet.has(n)));
  return { pattern, win: pattern ? pattern.multiplier * bet : 0 };
}

// Mesmo formato do bingo: pirâmides desligadas dão null e não somam.
export function settlePyramids({ cards, active, bet, drawnSet }) {
  let total = 0;
  const perCard = cards.map((pyramid, i) => {
    if (!active[i]) return null;
    const prize = pyramidPrize(pyramid, drawnSet, bet);
    total += prize.win;
    return prize;
  });
  return { perCard, total };
}

// Casas que, com uma bola só, levam a pirâmide a 2 lados ou mais (ou ao Bingo).
export function hotPyramidCells(pyramid, drawnSet) {
  const marked = pyramid.map((n) => drawnSet.has(n));
  const current = pyramidPattern(marked)?.multiplier ?? 0;
  const cells = [];
  marked.forEach((on, i) => {
    if (on) return;
    marked[i] = true;
    const next = pyramidPattern(marked)?.multiplier ?? 0;
    marked[i] = false;
    if (next >= SIDE_MULTIPLIERS[2] && next > current) cells.push({ cell: i, gain: (next - current) });
  });
  return cells;
}

// Proposta da próxima bola extra: só quando falta uma bola para 2 lados e/ou Bingo.
// Mesmo cálculo do bingo (ganho médio por bola que ainda pode sair). cost 0 = sem proposta.
export function pyramidExtraOffer({ cards, active, bet, drawnSet, bias = 1 }) {
  let totalGain = 0;
  const hotNumbers = new Set();
  cards.forEach((pyramid, i) => {
    if (!active[i]) return;
    for (const { cell, gain } of hotPyramidCells(pyramid, drawnSet)) {
      totalGain += gain * bet;
      hotNumbers.add(pyramid[cell]);
    }
  });
  // Chance de cada bola que falta sair agora = fichas dela ÷ fichas que restam (com bias 1 é 1 ÷ bolas restantes).
  const onPyramids = new Set();
  cards.forEach((pyramid, i) => {
    if (active[i]) pyramid.forEach((n) => onPyramids.add(n));
  });
  let tickets = 0;
  for (let n = 1; n <= PYRAMID_BALL_MAX; n++) if (!drawnSet.has(n)) tickets += onPyramids.has(n) ? bias : 1;
  const cost = totalGain > 0 && tickets > 0 ? Math.max(1, Math.ceil((totalGain * bias) / tickets)) : 0;
  return { cost, totalGain, hotNumbers };
}
