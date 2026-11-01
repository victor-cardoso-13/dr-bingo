import { cryptoRandomInt } from './rng.js';

// Modo Faraó (sessão 19): pirâmides de 15 números (fileiras de 1 a 5), bolas de 1 a 90.
export const PYRAMID_BALL_MAX = 90;
export const PYRAMID_MAIN_BALLS = 45;
export const PYRAMID_MAX_EXTRA = 10;
export const FREE_EXTRA = 5; // a 5ª bola extra sai de graça
export const MAX_PYRAMIDS = 4;
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
export function pyramidExtraOffer({ cards, active, bet, drawnSet }) {
  let totalGain = 0;
  const hotNumbers = new Set();
  cards.forEach((pyramid, i) => {
    if (!active[i]) return;
    for (const { cell, gain } of hotPyramidCells(pyramid, drawnSet)) {
      totalGain += gain * bet;
      hotNumbers.add(pyramid[cell]);
    }
  });
  const remaining = PYRAMID_BALL_MAX - drawnSet.size;
  const cost = totalGain > 0 && remaining > 0 ? Math.max(1, Math.ceil(totalGain / remaining)) : 0;
  return { cost, totalGain, hotNumbers };
}
