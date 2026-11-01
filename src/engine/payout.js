import { markedCells } from './cards.js';
import { bestPattern } from './patterns.js';

export function cardPrize(card, drawnSet, bet) {
  const pattern = bestPattern(markedCells(card, drawnSet));
  return { pattern, win: pattern ? pattern.multiplier * bet : 0 };
}

// Cartelas desligadas dão null em perCard e não somam.
export function settleRound({ cards, active, bet, drawnSet }) {
  let total = 0;
  const perCard = cards.map((card, i) => {
    if (!active[i]) return null;
    const prize = cardPrize(card, drawnSet, bet);
    total += prize.win;
    return prize;
  });
  return { perCard, total };
}
