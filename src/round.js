import { getState, totalBet, update } from './state.js';
import { MAIN_BALLS, MAX_EXTRA, shuffleBalls } from './engine/draw.js';
import { settleRound } from './engine/payout.js';
import { extraBallOffer } from './engine/extraBalls.js';
import { showWin } from './ui/modals.js';
import { playBall, playMark, playWin } from './ui/sound.js';
import { keepAwake, release } from './ui/wakelock.js';

const DELAYS = { lento: 1600, normal: 900, rapido: 350 };
const FIRST_BALL_DELAY = 400;

let round = freshRound();
let timer = null;
const listeners = new Set();

function freshRound() {
  return { phase: 'idle', sequence: [], drawnCount: 0, speedOverride: null, snapshot: null, extrasUsed: 0, offer: null };
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
  return DELAYS[round.speedOverride ?? getState().settings.speed] ?? DELAYS.normal;
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
  if (round.drawnCount < MAIN_BALLS) scheduleBall();
  else finishMainDraw();
}

const drawnSet = () => new Set(round.sequence.slice(0, round.drawnCount));

function finishMainDraw() {
  round.extrasUsed = 0;
  evaluateExtra();
}

// Oferece a próxima bola extra, ou acerta se não há proposta ou se as 10 já saíram.
function evaluateExtra() {
  if (round.extrasUsed >= MAX_EXTRA) return settle();
  round.offer = extraBallOffer({ ...round.snapshot, drawnSet: drawnSet() });
  if (round.offer.cost === 0) return settle();
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
function settle() {
  const { total } = settleRound({
    ...round.snapshot,
    drawnSet: drawnSet(),
  });
  update((s) => {
    s.credits += total;
    s.stats.biggestWin = Math.max(s.stats.biggestWin, total);
    s.pendingRound = null;
  });
  release();
  if (total > 0) playWin(total);
  setPhase('result');
  showWin(total, { onClose: () => setPhase('idle') });
}

// Rodada interrompida: acerta na hora, com no mínimo as 30 bolas principais.
export function recoverPendingRound() {
  const pending = getState().pendingRound;
  if (!pending) return;
  const count = Math.max(MAIN_BALLS, pending.drawnCount);
  const drawn = pending.sequence.slice(0, count);
  const { total } = settleRound({
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
  round = {
    phase: 'drawing',
    sequence: shuffleBalls(),
    drawnCount: 0,
    speedOverride: null,
    snapshot: { cards: s.cards.map((c) => [...c]), active: [...s.active], bet: s.bet },
  };
  update((st) => {
    st.credits -= cost;
    st.stats.rounds += 1;
    st.lastDrawn = [];
    st.pendingRound = { sequence: round.sequence, ...round.snapshot, drawnCount: 0 };
  });
  notify();
  keepAwake();
  scheduleBall(true);
  return true;
}

// Segundo toque no Acelerar: mostra de uma vez as bolas que faltam das 30.
export function finishDraw() {
  if (round.phase !== 'drawing') return;
  clearTimeout(timer);
  const before = round.drawnCount;
  round.drawnCount = MAIN_BALLS;
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

export function accelerate() {
  if (round.phase === 'drawing') {
    round.speedOverride = 'rapido';
    notify();
  }
}
