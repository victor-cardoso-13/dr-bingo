import { getState, totalBet, update } from './state.js';
import { MAIN_BALLS, MAX_EXTRA, shuffleBalls, shuffleRange } from './engine/draw.js';
import { settleRound } from './engine/payout.js';
import { extraBallOffer } from './engine/extraBalls.js';
import {
  FREE_EXTRA, PYRAMID_BALL_MAX, PYRAMID_MAIN_BALLS, PYRAMID_MAX_EXTRA, pyramidExtraOffer, settlePyramids,
} from './engine/pyramids.js';
import { showWin } from './ui/modals.js';
import { playBall, playJackpot, playMark, playWin } from './ui/sound.js';
import { keepAwake, release } from './ui/wakelock.js';

// Cada modo tem o seu sorteio, as suas bolas extras e o seu acerto de contas.
// O que os dois guardam como `cards`/`active` (cartelas ou pirâmides) é tratado igual pelo resto do jogo.
export const GAMES = {
  bingo: { mainBalls: MAIN_BALLS, maxExtra: MAX_EXTRA, shuffle: () => shuffleBalls(), settle: settleRound, offer: extraBallOffer, freeExtra: 0,
    jackpotId: 'full', bigIds: ['full', 'frame', 'twoLines'], fullName: 'CARTELA CHEIA!' },
  farao: {
    mainBalls: PYRAMID_MAIN_BALLS,
    maxExtra: PYRAMID_MAX_EXTRA,
    shuffle: () => shuffleRange(PYRAMID_BALL_MAX),
    settle: settlePyramids,
    offer: pyramidExtraOffer,
    freeExtra: FREE_EXTRA,
    jackpotId: 'bingo',
    bigIds: ['bingo', 'sides3', 'sides2'],
    fullName: 'PIRÂMIDE CHEIA!',
  },
};
const game = () => GAMES[round.mode ?? 'bingo'];

const DELAYS = { lento: 1600, normal: 900, rapido: 350 };
const FIRST_BALL_DELAY = 400;

let round = freshRound();
let timer = null;
const listeners = new Set();

function freshRound() {
  return { phase: 'idle', mode: 'bingo', sequence: [], drawnCount: 0, snapshot: null, extrasUsed: 0, offer: null };
}

export function getRound() {
  return round;
}

export function getRoundPhase() {
  return round.phase;
}

export function subscribeRound(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of [...listeners]) fn(round);
}

function setPhase(phase) {
  round.phase = phase;
  notify();
}

function ballDelay(first) {
  if (first) return FIRST_BALL_DELAY;
  return DELAYS[getState().settings.speed] ?? DELAYS.normal;
}

function scheduleBall(first = false) {
  timer = setTimeout(drawNextBall, ballDelay(first));
}

function announceBall(n) {
  playBall();
  const { cards, active } = round.snapshot;
  if (cards.some((card, i) => active[i] && card.includes(n))) playMark();
}

function drawNextBall() {
  round.drawnCount += 1;
  const drawn = round.sequence.slice(0, round.drawnCount);
  update((s) => {
    s.lastDrawn = drawn;
    s.pendingRound.drawnCount = round.drawnCount;
  });
  notify();
  announceBall(round.sequence[round.drawnCount - 1]);
  if (round.drawnCount < game().mainBalls) scheduleBall();
  else finishMainDraw();
}

const drawnSet = () => new Set(round.sequence.slice(0, round.drawnCount));

function finishMainDraw() {
  round.extrasUsed = 0;
  evaluateExtra();
}

// Oferece a próxima bola extra, ou acerta se não há proposta ou se as 10 já saíram.
function evaluateExtra() {
  if (round.extrasUsed >= game().maxExtra) return settle();
  round.offer = game().offer({ ...round.snapshot, drawnSet: drawnSet() });
  if (round.offer.cost === 0) return settle();
  // A bola extra de número `freeExtra` sai de graça (só no Faraó).
  round.offer.free = round.extrasUsed + 1 === game().freeExtra;
  if (round.offer.free) round.offer.cost = 0;
  return setPhase('extra');
}

export function requestExtra() {
  if (round.phase !== 'extra' || getState().credits < round.offer.cost) return;
  const cost = round.offer.cost;
  round.drawnCount += 1;
  round.extrasUsed += 1;
  const drawn = round.sequence.slice(0, round.drawnCount);
  update((s) => {
    s.credits -= cost;
    s.lastDrawn = drawn;
    s.pendingRound.drawnCount = round.drawnCount;
  });
  notify();
  announceBall(round.sequence[round.drawnCount - 1]);
  evaluateExtra();
}

export function endExtras() {
  if (round.phase === 'extra') settle();
}

// Acerto de contas: um único update() paga, atualiza o maior prêmio e limpa pendingRound.
// 'jackpot' = tudo preenchido sem comprar bola extra; 'big' = um dos 3 maiores prêmios; 'small' = o resto.
function winTier(perCard) {
  const prizes = perCard.filter((p) => p?.pattern);
  if (round.extrasUsed === 0 && prizes.some((p) => p.pattern.id === game().jackpotId)) return 'jackpot';
  return prizes.some((p) => game().bigIds.includes(p.pattern.id)) ? 'big' : 'small';
}

function settle() {
  const { total, perCard } = game().settle({
    ...round.snapshot,
    drawnSet: drawnSet(),
  });
  update((s) => {
    s.credits += total;
    s.stats.biggestWin = Math.max(s.stats.biggestWin, total);
    s.pendingRound = null;
  });
  release();
  // Sem prêmio não há janela: a rodada termina e o botão vira "PRÓXIMA RODADA".
  if (total === 0) return setPhase('idle');
  const tier = winTier(perCard);
  if (tier === 'jackpot') playJackpot();
  else playWin(total, tier);
  setPhase('result');
  showWin(total, { tier, fullName: game().fullName, onClose: () => setPhase('idle') });
}

// Rodada interrompida: acerta na hora, com no mínimo as 30 bolas principais.
export function recoverPendingRound() {
  const pending = getState().pendingRound;
  if (!pending) return;
  const rules = GAMES[pending.mode ?? 'bingo'];
  const count = Math.max(rules.mainBalls, pending.drawnCount);
  const drawn = pending.sequence.slice(0, count);
  const { total } = rules.settle({
    cards: pending.cards,
    active: pending.active,
    bet: pending.bet,
    drawnSet: new Set(drawn),
  });
  update((s) => {
    s.credits += total;
    s.stats.biggestWin = Math.max(s.stats.biggestWin, total);
    s.lastDrawn = drawn;
    s.pendingRound = null;
  });
  round = freshRound();
  setPhase('result');
  showWin(total, {
    message: (x) => `Sua rodada anterior foi concluída: você ganhou ${x}.`,
    onClose: () => setPhase('idle'),
  });
}

export function startRound() {
  const s = getState();
  const cost = totalBet(s);
  if (round.phase !== 'idle' || s.credits < cost) return false;
  const farao = s.mode === 'farao';
  round = {
    phase: 'drawing',
    mode: farao ? 'farao' : 'bingo',
    sequence: GAMES[farao ? 'farao' : 'bingo'].shuffle(),
    drawnCount: 0,
    snapshot: farao
      ? { cards: s.pyramids.map((c) => [...c]), active: [...s.pyramidActive], bet: s.bet }
      : { cards: s.cards.map((c) => [...c]), active: [...s.active], bet: s.bet },
  };
  update((st) => {
    st.credits -= cost;
    st.stats.rounds += 1;
    st.lastDrawn = [];
    st.pendingRound = { mode: round.mode, sequence: round.sequence, ...round.snapshot, drawnCount: 0 };
  });
  notify();
  keepAwake();
  scheduleBall(true);
  return true;
}

// Botão "Terminar sorteio": mostra de uma vez as bolas que faltam das 30.
export function finishDraw() {
  if (round.phase !== 'drawing') return;
  clearTimeout(timer);
  const before = round.drawnCount;
  round.drawnCount = game().mainBalls;
  const drawn = round.sequence.slice(0, round.drawnCount);
  update((s) => {
    s.lastDrawn = drawn;
    s.pendingRound.drawnCount = round.drawnCount;
  });
  notify();
  const { cards, active } = round.snapshot;
  playBall();
  if (drawn.slice(before).some((n) => cards.some((card, i) => active[i] && card.includes(n)))) playMark();
  finishMainDraw();
}

