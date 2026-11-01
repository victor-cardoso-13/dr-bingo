import { cryptoRandomInt } from './rng.js';

const ROWS = 3;
const COLS = 5;
const COLUMN_SIZE = 12;

// Cartela como number[15], índice = linha * 5 + coluna.
export function generateCard(randomInt = cryptoRandomInt) {
  const card = new Array(ROWS * COLS);
  for (let c = 0; c < COLS; c++) {
    const pool = Array.from({ length: COLUMN_SIZE }, (_, k) => COLUMN_SIZE * c + 1 + k);
    const picked = [];
    for (let k = 0; k < ROWS; k++) {
      picked.push(pool.splice(randomInt(pool.length), 1)[0]);
    }
    picked.sort((a, b) => a - b);
    for (let r = 0; r < ROWS; r++) card[r * COLS + c] = picked[r];
  }
  return card;
}

export function generateCards(count = 4, randomInt = cryptoRandomInt) {
  return Array.from({ length: count }, () => generateCard(randomInt));
}

export function markedCells(card, drawnSet) {
  return card.map((n) => drawnSet.has(n));
}
