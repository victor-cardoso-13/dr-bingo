import test from 'node:test';
import assert from 'node:assert/strict';
import { daNuvem, paraNuvem, quemVale } from '../src/nuvem/mesclar.js';

const shared = { credits: 12345, bet: 10, cardCount: 6, stats: { rounds: 7, biggestWin: 900 } };

test('vai e volta pela nuvem sem perder nada', () => {
  const doc = paraNuvem(shared, 1000);
  assert.deepEqual(daNuvem(JSON.parse(JSON.stringify(doc))), { ...shared, updatedAt: 1000 });
});

test('documento estragado ou de fora é recusado', () => {
  const ok = paraNuvem(shared, 1);
  assert.equal(daNuvem(null), null);
  assert.equal(daNuvem({}), null);
  assert.equal(daNuvem({ ...ok, credits: -1 }), null);
  assert.equal(daNuvem({ ...ok, credits: 'muito' }), null);
  assert.equal(daNuvem({ ...ok, bet: 3 }), null);
  assert.equal(daNuvem({ ...ok, cardCount: 9 }), null);
  assert.equal(daNuvem({ ...ok, stats: undefined }), null);
});

test('quem mudou por último vale (documento inteiro, nada de somar saldos)', () => {
  const remoto = daNuvem(paraNuvem(shared, 500));
  assert.equal(quemVale(100, remoto), 'nuvem');
  assert.equal(quemVale(900, remoto), 'aparelho');
  assert.equal(quemVale(500, remoto), 'igual');
});

test('nuvem vazia: aparelho que já jogou envia; aparelho novo não faz nada', () => {
  assert.equal(quemVale(300, null), 'aparelho');
  assert.equal(quemVale(0, null), 'igual');
});

test('aparelho novo (nunca mudou nada) pega o que está na nuvem', () => {
  assert.equal(quemVale(0, daNuvem(paraNuvem(shared, 5))), 'nuvem');
});
