const RANGE = 2 ** 32;

// Inteiro em [0, max), sem viés (rejeição).
export function cryptoRandomInt(max) {
  if (!Number.isInteger(max) || max < 1 || max > RANGE) {
    throw new RangeError('max deve ser um inteiro entre 1 e 2^32');
  }
  const limit = Math.floor(RANGE / max) * max;
  const buf = new Uint32Array(1);
  let value;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

// Gerador determinístico (mulberry32), para os testes.
export function makeSeededRandomInt(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / RANGE;
  };
  return (max) => Math.floor(next() * max);
}
