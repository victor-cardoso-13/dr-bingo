import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCard, generateCards, markedCells } from '../src/engine/cards.js';
import { makeSeededRandomInt } from '../src/engine/rng.js';

test('1.000 cartelas são válidas', () => {
  const rnd = makeSeededRandomInt(7);
  for (let n = 0; n < 1000; n++) {
    const card = generateCard(rnd);
    assert.equal(card.length, 15);
    assert.equal(new Set(card).size, 15);
    for (let c = 0; c < 5; c++) {
      const col = [card[c], card[5 + c], card[10 + c]];
      for (const v of col) assert.ok(v >= 12 * c + 1 && v <= 12 * c + 12, `col ${c}: ${v}`);
      assert.ok(col[0] < col[1] && col[1] < col[2], `col ${c} fora de ordem`);
    }
  }
});

test('generateCards(4) devolve 4 cartelas', () => {
  assert.equal(generateCards(4, makeSeededRandomInt(1)).length, 4);
  assert.equal(generateCards().length, 4);
});

test('markedCells marca exatamente os números do Set', () => {
  const card = generateCard(makeSeededRandomInt(3));
  const drawn = new Set([card[0], card[7], card[14], 99]);
  const marked = markedCells(card, drawn);
  assert.equal(marked.length, 15);
  marked.forEach((m, i) => assert.equal(m, drawn.has(card[i])));
  assert.equal(marked.filter(Boolean).length, 3);
});
