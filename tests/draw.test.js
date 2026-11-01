import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleBalls, BALL_MAX, MAIN_BALLS, MAX_EXTRA } from '../src/engine/draw.js';
import { makeSeededRandomInt } from '../src/engine/rng.js';

test('constantes', () => {
  assert.deepEqual([BALL_MAX, MAIN_BALLS, MAX_EXTRA], [60, 30, 10]);
});

test('shuffleBalls devolve uma permutação de 1..60', () => {
  const seq = shuffleBalls(makeSeededRandomInt(5));
  assert.equal(seq.length, 60);
  assert.equal(new Set(seq).size, 60);
  assert.deepEqual([...seq].sort((a, b) => a - b), Array.from({ length: 60 }, (_, i) => i + 1));
});

test('mesma semente, mesma sequência; sementes diferentes, sequências diferentes', () => {
  assert.deepEqual(shuffleBalls(makeSeededRandomInt(9)), shuffleBalls(makeSeededRandomInt(9)));
  assert.notDeepEqual(shuffleBalls(makeSeededRandomInt(9)), shuffleBalls(makeSeededRandomInt(10)));
});
