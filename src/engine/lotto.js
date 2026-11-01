import { cryptoRandomInt } from './rng.js';

// Modo Lotto (sessão 20): até 4 cartelas de 6 dígitos (0–9). O sorteio tem 6 bolas; a bola k só confere com a casa k.
export const LOTTO_DIGITS = 6;
export const MAX_LOTTO = 4;
export const LOTTO_MAIN_BALLS = 6;

// Sequência = acertos seguidos a partir da esquerda; Qualquer = acertos em qualquer casa. Vale só o maior prêmio da cartela.
export const SEQ_MULTIPLIERS = { 2: 2, 3: 3, 4: 5, 5: 25, 6: 250 };
export const ANY_MULTIPLIERS = { 2: 1, 3: 2, 4: 3, 5: 8 };

// "Empurrãozinho": chance média de cada casa acertar (sem empurrão seria 0,10). Vale para qualquer cartela e qualquer número de cartelas.
export const LOTTO_HIT_CHANCE = 0.23;
// Bola prateada (×2) e dourada (×3): chance, por rodada, de cada uma aparecer (em %).
export const SILVER_PERCENT = 40;
export const GOLD_PERCENT = 20;
// Acumulado: um múltiplo da aposta que começa em ACC_START, sobe ACC_GROWTH por rodada e volta ao início quando sai (6 seguidos).
export const ACC_START = 100;
export const ACC_GROWTH = 0.1;
export const ACC_MAX = 1000;

const SCALE = 1_000_000;

// Uma bola do sorteio é guardada como um número só: posição * 100 + tipo * 10 + dígito (tipo 0 comum, 1 prateada, 2 dourada).
export const encodeBall = (pos, tier, digit) => pos * 100 + tier * 10 + digit;
export function decodeBall(n) {
  const tier = Math.floor((n % 100) / 10);
  return { pos: Math.floor(n / 100), tier, digit: n % 10, mult: tier + 1 };
}

export function generateLotto(count = MAX_LOTTO, randomInt = cryptoRandomInt) {
  return Array.from({ length: count }, () => Array.from({ length: LOTTO_DIGITS }, () => randomInt(10)));
}

// Sorteio das 6 bolas. Em cada casa, com chance `q` a bola copia o dígito de uma cartela ligada (escolhida ao acaso); senão sai 0–9 puro.
// `q` é calculado casa a casa para a chance média de acerto ser sempre `hitChance`, mesmo com cartelas iguais (sem brecha).
export function drawLotto(cards, active, randomInt = cryptoRandomInt, hitChance = LOTTO_HIT_CHANCE) {
  const on = cards.filter((_, i) => active[i]);
  const n = on.length;
  const digits = [];
  for (let k = 0; k < LOTTO_DIGITS; k++) {
    const counts = new Array(10).fill(0);
    on.forEach((card) => counts[card[k]]++);
    const same = counts.reduce((sum, c) => sum + (c / n) ** 2, 0);
    const q = Math.min(1, Math.max(0, (hitChance - 0.1) / (same - 0.1)));
    digits.push(randomInt(SCALE) < q * SCALE ? on[randomInt(n)][k] : randomInt(10));
  }
  const tiers = new Array(LOTTO_DIGITS).fill(0);
  if (randomInt(100) < SILVER_PERCENT) tiers[randomInt(LOTTO_DIGITS)] = 1;
  if (randomInt(100) < GOLD_PERCENT) {
    const free = tiers.map((t, k) => (t === 0 ? k : -1)).filter((k) => k >= 0);
    tiers[free[randomInt(free.length)]] = 2;
  }
  return digits.map((d, k) => encodeBall(k, tiers[k], d));
}

// Acertos de uma cartela: hits[k] = true se a bola k saiu igual ao dígito k. Casas cujas bolas ainda não saíram ficam false.
export function lottoHits(card, drawnSet) {
  const hits = new Array(LOTTO_DIGITS).fill(false);
  const mults = new Array(LOTTO_DIGITS).fill(1);
  for (const n of drawnSet) {
    const b = decodeBall(n);
    if (b.digit === card[b.pos]) {
      hits[b.pos] = true;
      mults[b.pos] = b.mult;
    }
  }
  return { hits, mults };
}

export function lottoPattern(hits) {
  let seq = 0;
  while (seq < LOTTO_DIGITS && hits[seq]) seq++;
  const any = hits.filter(Boolean).length;
  const bySeq = SEQ_MULTIPLIERS[seq] ?? 0;
  const byAny = ANY_MULTIPLIERS[any] ?? 0;
  if (bySeq === 0 && byAny === 0) return null;
  if (bySeq >= byAny) return { id: `seq${seq}`, name: `Sequência de ${seq}`, multiplier: bySeq, seq, any };
  return { id: `any${any}`, name: `${any} acertos`, multiplier: byAny, seq, any };
}

export function lottoPrize(card, drawnSet, bet, acc = 0) {
  const { hits, mults } = lottoHits(card, drawnSet);
  const pattern = lottoPattern(hits);
  if (!pattern) return { pattern: null, win: 0, hits, mult: 1, accWin: 0 };
  // Prateada/dourada que acertou multiplica o prêmio (a maior vale; nunca multiplicam entre si).
  const mult = Math.max(...mults.filter((_, k) => hits[k]));
  const accWin = pattern.id === 'seq6' ? Math.round(acc * bet) : 0;
  return { pattern, win: pattern.multiplier * mult * bet + accWin, hits, mult, accWin };
}

// Mesmo formato dos outros modos. As cartelas em `active` pagam; `acc` é o múltiplo do Acumulado no momento do JOGAR.
export function settleLotto({ cards, active, bet, drawnSet, acc = 0 }) {
  let total = 0;
  const perCard = cards.map((card, i) => {
    if (!active[i]) return null;
    const prize = lottoPrize(card, drawnSet, bet, acc);
    total += prize.win;
    return prize;
  });
  return { perCard, total };
}

export const nextAcc = (acc) => Math.min(ACC_MAX, acc + ACC_GROWTH);
