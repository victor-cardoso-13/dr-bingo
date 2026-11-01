const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Do maior para o menor multiplicador (seção 5 do DESIGN).
export const PATTERNS = [
  { id: 'full', name: 'Cartela Cheia', multiplier: 2000, masks: [range(0, 14)] },
  { id: 'frame', name: 'Moldura', multiplier: 500, masks: [[0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14]] },
  {
    id: 'twoLines',
    name: 'Duas Linhas',
    multiplier: 120,
    masks: [range(0, 9), [...range(0, 4), ...range(10, 14)], range(5, 14)],
  },
  { id: 'letterU', name: 'Letra U', multiplier: 70, masks: [[0, 4, 5, 9, 10, 11, 12, 13, 14]] },
  { id: 'cross', name: 'Xis', multiplier: 30, masks: [[0, 4, 6, 7, 8, 10, 14]] },
  { id: 'letterT', name: 'Letra T', multiplier: 25, masks: [[0, 1, 2, 3, 4, 7, 12]] },
  { id: 'line', name: 'Linha', multiplier: 5, masks: [range(0, 4), range(5, 9), range(10, 14)] },
  { id: 'corners', name: 'Cantos', multiplier: 3, masks: [[0, 4, 10, 14]] },
];

// marked: boolean[15]. Devolve o padrão de maior multiplicador ou null.
export function bestPattern(marked) {
  return (
    PATTERNS.find((p) => p.masks.some((mask) => mask.every((i) => marked[i]))) ?? null
  );
}

// Casas não marcadas que, sozinhas, aumentariam o prêmio da cartela.
export function improvingCells(card, drawnSet) {
  const marked = card.map((n) => drawnSet.has(n));
  const current = bestPattern(marked)?.multiplier ?? 0;
  const cells = [];
  for (let i = 0; i < marked.length; i++) {
    if (marked[i]) continue;
    marked[i] = true;
    if ((bestPattern(marked)?.multiplier ?? 0) > current) cells.push(i);
    marked[i] = false;
  }
  return cells;
}
