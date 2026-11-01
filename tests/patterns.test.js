import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_A } from './fixtures.js';
import { PATTERNS, bestPattern, improvingCells } from '../src/engine/patterns.js';

const marksOf = (indexes) => Array.from({ length: 15 }, (_, i) => indexes.includes(i));

test('tabela de prêmios bate com o DESIGN', () => {
  assert.deepEqual(
    PATTERNS.map((p) => [p.id, p.multiplier]),
    [['full', 2000], ['frame', 500], ['twoLines', 120], ['letterU', 70],
     ['cross', 30], ['letterT', 25], ['line', 5], ['corners', 3]],
  );
});

test('cada padrão é detectado com a sua máscara', () => {
  for (const p of PATTERNS) {
    for (const mask of p.masks) {
      assert.equal(bestPattern(marksOf(mask)).id, p.id, `${p.id} ${mask}`);
    }
  }
});

test('cartela toda marcada é full; nada marcado é null', () => {
  assert.equal(bestPattern(marksOf([...Array(15).keys()])).id, 'full');
  assert.equal(bestPattern(marksOf([])), null);
});

test('cantos, linha e duas linhas', () => {
  assert.equal(bestPattern(marksOf([0, 4, 10, 14])).id, 'corners');
  assert.equal(bestPattern(marksOf([5, 6, 7, 8, 9])).id, 'line');
  assert.equal(bestPattern(marksOf([0, 1, 2, 3, 4, 10, 11, 12, 13, 14])).id, 'twoLines');
});

test('exemplo "A sozinha": twoLines e casa quente só no índice 14', () => {
  const drawn = new Set(CARD_A.filter((n) => n !== 51));
  const marked = CARD_A.map((n) => drawn.has(n));
  assert.equal(bestPattern(marked).id, 'twoLines');
  assert.deepEqual(improvingCells(CARD_A, drawn), [14]);
});
