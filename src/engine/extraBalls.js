import { BALL_MAX } from './draw.js';
import { bestPattern, improvingCells } from './patterns.js';

// Custo da próxima bola extra (seção 6 do DESIGN). cost 0 = sem proposta.
export function extraBallOffer({ cards, active, bet, drawnSet }) {
  let totalGain = 0;
  const hotNumbers = new Set();
  cards.forEach((card, i) => {
    if (!active[i]) return;
    const marked = card.map((n) => drawnSet.has(n));
    const current = bestPattern(marked)?.multiplier ?? 0;
    for (const cell of improvingCells(card, drawnSet)) {
      marked[cell] = true;
      const gain = ((bestPattern(marked)?.multiplier ?? 0) - current) * bet;
      marked[cell] = false;
      totalGain += gain;
      hotNumbers.add(card[cell]);
    }
  });
  const remaining = BALL_MAX - drawnSet.size;
  const cost = totalGain > 0 && remaining > 0 ? Math.max(1, Math.ceil(totalGain / remaining)) : 0;
  return { cost, totalGain, hotNumbers };
}
