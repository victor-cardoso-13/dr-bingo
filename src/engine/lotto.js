import { cryptoRandomInt } from './rng.js';

// Modo Lotto (sessão 20): até 4 cartelas de 6 a 9 dígitos (0–9). O sorteio tem sempre 6 bolas.
// Com 6 dezenas a bola k só confere com a casa k; com `size` dezenas ela confere com a "janela" de casas k … k + size − 6 (acertou se o dígito está em alguma delas).
export const LOTTO_DIGITS = 6; // bolas por rodada (e casas da cartela mínima)
export const MAX_LOTTO_SIZE = 9; // as cartelas guardam sempre 9 dígitos; só os `size` primeiros jogam
export const LOTTO_SIZES = [6, 7, 8, 9];
// Preço da cartela × aposta, por quantidade de dezenas (mais casas = mais fácil acertar = mais caro, para o retorno continuar ≈ 95%).
export const LOTTO_PRICE = { 6: 1, 7: 3, 8: 6, 9: 11 };
// Chance média de cada bola acertar a cartela (o empurrãozinho mira nisto). Com mais casas sobe, mas sempre abaixo do que dá para alcançar com 4 cartelas
// aleatórias, para o retorno ser o mesmo com cartelas aleatórias, copiadas ou iguais (sem brecha).
export const LOTTO_TARGET = { 6: 0.23, 7: 0.35, 8: 0.43, 9: 0.5 };
export const lottoTargetChance = (size) => LOTTO_TARGET[size];
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
  return Array.from({ length: count }, () => Array.from({ length: MAX_LOTTO_SIZE }, () => randomInt(10)));
}

// Casa da cartela que a bola acertou (a 1ª da janela com o mesmo dígito), ou -1.
export function ballCell(card, n, size = LOTTO_DIGITS) {
  const b = decodeBall(n);
  for (let i = b.pos; i <= b.pos + size - LOTTO_DIGITS; i++) if (card[i] === b.digit) return i;
  return -1;
}

// Sorteio das 6 bolas. Em cada bola, com chance `q` o dígito vem de uma "escolha dirigida" (dígitos que as cartelas têm na janela da bola, mais os que mais cartelas têm); senão sai 0–9 puro.
// `q` é calculado bola a bola para a chance média de acerto ser sempre `hitChance` (ou o máximo possível), mesmo com cartelas iguais ou linhas IGUAIS (sem brecha).
export function drawLotto(cards, active, randomInt = cryptoRandomInt, size = LOTTO_DIGITS, hitChance = lottoTargetChance(size)) {
  const on = cards.filter((_, i) => active[i]);
  const n = on.length;
  const digits = [];
  for (let k = 0; k < LOTTO_DIGITS; k++) {
    // cover[d] = em quantas cartelas ligadas o dígito d está na janela desta bola
    const cover = new Array(10).fill(0);
    for (const card of on) for (const d of new Set(card.slice(k, k + size - LOTTO_DIGITS + 1))) cover[d]++;
    const m = cover.map((c) => c / n);
    const sumM = m.reduce((a, b) => a + b, 0);
    const sumM2 = m.reduce((a, b) => a + b * b, 0);
    const aimed = sumM2 / sumM; // acerto médio se sempre dirigir (dígito sorteado com peso M, a fração das cartelas que o têm na janela)
    const natural = sumM / 10;
    const q = aimed > natural ? Math.min(1, Math.max(0, (hitChance - natural) / (aimed - natural))) : 0;
    if (randomInt(SCALE) < q * SCALE) {
      let ticket = randomInt(Math.round(sumM * 1e6));
      let d = 0;
      for (; d < 9; d++) {
        const w = Math.round(m[d] * 1e6);
        if (ticket < w) break;
        ticket -= w;
      }
      digits.push(d);
    } else {
      digits.push(randomInt(10));
    }
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
export function lottoHits(card, drawnSet, size = LOTTO_DIGITS) {
  const hits = new Array(LOTTO_DIGITS).fill(false);
  const mults = new Array(LOTTO_DIGITS).fill(1);
  const cells = new Array(LOTTO_DIGITS).fill(-1);
  for (const n of drawnSet) {
    const b = decodeBall(n);
    const cell = ballCell(card, n, size);
    if (cell >= 0) {
      hits[b.pos] = true;
      mults[b.pos] = b.mult;
      cells[b.pos] = cell;
    }
  }
  return { hits, mults, cells };
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

export function lottoPrize(card, drawnSet, bet, acc = 0, size = LOTTO_DIGITS) {
  const { hits, mults, cells } = lottoHits(card, drawnSet, size);
  const pattern = lottoPattern(hits);
  if (!pattern) return { pattern: null, win: 0, hits, cells, mult: 1, accWin: 0 };
  // Prateada/dourada que acertou multiplica o prêmio (a maior vale; nunca multiplicam entre si).
  const mult = Math.max(...mults.filter((_, k) => hits[k]));
  const accWin = pattern.id === 'seq6' ? Math.round(acc * bet) : 0;
  return { pattern, win: pattern.multiplier * mult * bet + accWin, hits, cells, mult, accWin };
}

// Mesmo formato dos outros modos. As cartelas em `active` pagam; `acc` é o múltiplo do Acumulado no momento do JOGAR.
export function settleLotto({ cards, active, bet, drawnSet, acc = 0, size = LOTTO_DIGITS }) {
  let total = 0;
  const perCard = cards.map((card, i) => {
    if (!active[i]) return null;
    const prize = lottoPrize(card, drawnSet, bet, acc, size);
    total += prize.win;
    return prize;
  });
  return { perCard, total };
}

export const nextAcc = (acc) => Math.min(ACC_MAX, acc + ACC_GROWTH);
