import test from 'node:test';
import assert from 'node:assert/strict';
import { cryptoRandomInt, makeSeededRandomInt } from '../src/engine/rng.js';

test('cryptoRandomInt fica em [0, max)', () => {
  for (const max of [1, 7, 60]) {
    for (let i = 0; i < 10000; i++) {
      const v = cryptoRandomInt(max);
      assert.ok(Number.isInteger(v) && v >= 0 && v < max, `max ${max}: ${v}`);
    }
  }
});

test('cryptoRandomInt(6) é uniforme o bastante', () => {
  const counts = new Array(6).fill(0);
  for (let i = 0; i < 60000; i++) counts[cryptoRandomInt(6)]++;
  for (const c of counts) assert.ok(c > 9000 && c < 11000, `contagem ${c}`);
});

test('makeSeededRandomInt repete a sequência com a mesma semente', () => {
  const a = makeSeededRandomInt(42);
  const b = makeSeededRandomInt(42);
  const seqA = Array.from({ length: 100 }, () => a(60));
  const seqB = Array.from({ length: 100 }, () => b(60));
  assert.deepEqual(seqA, seqB);
  assert.ok(seqA.every((v) => v >= 0 && v < 60));
});
