import { generateCards } from './engine/cards.js';

export const STORAGE_KEY = 'bingo-vovo:v1';
export const BET_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
export const MAX_CARDS = 8;
export const ADD_AMOUNT = 10000;

// Guardamos sempre 8 cartelas; só as `cardCount` primeiras aparecem. As outras ficam com
// active = false, então a rodada (que usa `active`) nunca as considera.

export function defaultState() {
  return {
    version: 1,
    credits: 1000,
    bet: 1,
    cardCount: 4,
    active: [true, true, true, true, false, false, false, false],
    cards: null,
    lastDrawn: [],
    settings: { speed: 'normal', voice: true, sound: true, bigText: false },
    stats: { rounds: 0, biggestWin: 0 },
    pendingRound: null,
  };
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Junta o salvo com os padrões: campos que faltam recebem o valor padrão.
function merge(defaults, saved) {
  if (!isPlainObject(defaults) || !isPlainObject(saved)) return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (!(key in defaults)) continue;
    const d = defaults[key];
    const s = saved[key];
    if (isPlainObject(d)) out[key] = merge(d, s);
    else if (s !== undefined && (d === null || typeof s === typeof d || s === null)) out[key] = s;
  }
  return out;
}

export function loadState() {
  const defaults = defaultState();
  let loaded = defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) loaded = merge(defaults, JSON.parse(raw));
  } catch {
    loaded = defaults;
  }
  if (!Number.isFinite(loaded.credits) || loaded.credits < 0) loaded.credits = defaults.credits;
  if (!BET_STEPS.includes(loaded.bet)) loaded.bet = defaults.bet;
  const validCards =
    Array.isArray(loaded.cards) &&
    (loaded.cards.length === 4 || loaded.cards.length === MAX_CARDS) &&
    loaded.cards.every((c) => Array.isArray(c) && c.length === 15);
  const validActive =
    Array.isArray(loaded.active) &&
    (loaded.active.length === 4 || loaded.active.length === MAX_CARDS) &&
    loaded.active.some(Boolean);
  if (!validActive) loaded.active = [...defaults.active];
  if (!Number.isInteger(loaded.cardCount) || loaded.cardCount < 1 || loaded.cardCount > MAX_CARDS) {
    loaded.cardCount = defaults.cardCount;
  }
  state = loaded;
  let changed = false;
  if (!validCards) {
    state.cards = generateCards(MAX_CARDS);
    changed = true;
  } else if (state.cards.length < MAX_CARDS) {
    // Estado salvo antes das 8 cartelas: completa com cartelas novas.
    state.cards = [...state.cards, ...generateCards(MAX_CARDS - state.cards.length)];
    changed = true;
  }
  state.active = Array.from({ length: MAX_CARDS }, (_, i) => i < state.cardCount && state.active[i] === true);
  if (!state.active.some(Boolean)) state.active[0] = true;
  if (changed) save();
  return state;
}

let state = defaultState();
const listeners = new Set();

export function getState() {
  return state;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sem espaço ou modo privado: o jogo segue sem salvar
  }
}

export function update(mutator) {
  mutator(state);
  save();
  for (const fn of [...listeners]) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addCredits(amount = ADD_AMOUNT) {
  update((s) => {
    s.credits += amount;
  });
}

export function activeCount(s = state) {
  return s.active.filter(Boolean).length;
}

export function totalBet(s = state) {
  return s.bet * activeCount(s);
}

export function toggleCard(i) {
  update((s) => {
    if (i >= s.cardCount || (s.active[i] && activeCount(s) === 1)) return;
    s.active[i] = !s.active[i];
  });
}

export function stepBet(direction) {
  update((s) => {
    const next = BET_STEPS.indexOf(s.bet) + direction;
    if (next >= 0 && next < BET_STEPS.length) s.bet = BET_STEPS[next];
  });
}

// Mostra uma cartela a mais (ligada) ou a menos (a que sai fica desligada).
export function stepCardCount(direction) {
  update((s) => {
    const next = s.cardCount + direction;
    if (next < 1 || next > MAX_CARDS) return;
    if (direction > 0) s.active[next - 1] = true;
    else s.active[s.cardCount - 1] = false;
    s.cardCount = next;
    if (!s.active.some(Boolean)) s.active[0] = true;
  });
}

export function newCards() {
  update((s) => {
    s.cards = generateCards(MAX_CARDS);
    s.lastDrawn = [];
  });
}
