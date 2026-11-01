import { generateCards } from './engine/cards.js';
import { MAX_PYRAMIDS, generatePyramids } from './engine/pyramids.js';
import { ACC_MAX, ACC_START, LOTTO_PRICE, LOTTO_SIZES, MAX_LOTTO, MAX_LOTTO_SIZE, generateLotto } from './engine/lotto.js';

// "Gaveta" do aparelho: sem conta fica em STORAGE_KEY; cada conta tem a sua (STORAGE_KEY:uid).
// ACCOUNT_KEY lembra quem estava dentro, para o jogo abrir já com o saldo certo, até sem internet.
export const STORAGE_KEY = 'bingo-vovo:v1';
export const ACCOUNT_KEY = 'bingo-vovo:conta';
export const BET_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
export const MAX_CARDS = 8;
export const ADD_AMOUNT = 10000;
export const MODES = ['bingo', 'farao', 'lotto'];

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
    // Modo Faraó (pirâmides): o modo e as pirâmides ficam em cada aparelho; saldo e aposta são os mesmos do Bingo.
    mode: 'bingo',
    pyramids: null,
    pyramidActive: [true, true, true, true],
    pyramidCount: 4,
    // Modo Lotto: as cartelas (6 dígitos), quantas jogam e o Acumulado (um múltiplo da aposta) ficam em cada aparelho.
    lotto: null,
    lottoCount: 4,
    lottoSize: 6,
    lottoAcc: ACC_START,
    settings: { speed: 'normal', voice: true, sound: true, music: true, bigText: false },
    stats: { rounds: 0, biggestWin: 0 },
    pendingRound: null,
    // Quando saldo, aposta, nº de cartelas ou estatísticas mudaram pela última vez (decide quem vale na nuvem).
    sharedAt: 0,
  };
}

// O que vai para a nuvem e é compartilhado entre aparelhos. Ajustes (som, texto grande…) ficam em cada aparelho.
export function sharedOf(s) {
  return { credits: s.credits, bet: s.bet, cardCount: s.cardCount, stats: { rounds: s.stats.rounds, biggestWin: s.stats.biggestWin } };
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

function storageKey(uid) {
  return uid ? `${STORAGE_KEY}:${uid}` : STORAGE_KEY;
}

// Quem está dentro neste aparelho (uid) ou null.
export function currentAccount() {
  try {
    return localStorage.getItem(ACCOUNT_KEY) || null;
  } catch {
    return null;
  }
}

// Lê e conserta o estado de uma gaveta. `changed` = precisou gerar cartelas (vale gravar).
function readDrawer(uid) {
  const defaults = defaultState();
  let loaded = defaults;
  let found = false;
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) {
      loaded = merge(defaults, JSON.parse(raw));
      found = true;
    }
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
  if (!Number.isFinite(loaded.sharedAt) || loaded.sharedAt < 0) loaded.sharedAt = 0;
  let changed = false;
  if (!validCards) {
    loaded.cards = generateCards(MAX_CARDS);
    changed = true;
  } else if (loaded.cards.length < MAX_CARDS) {
    // Estado salvo antes das 8 cartelas: completa com cartelas novas.
    loaded.cards = [...loaded.cards, ...generateCards(MAX_CARDS - loaded.cards.length)];
    changed = true;
  }
  if (!MODES.includes(loaded.mode)) loaded.mode = defaults.mode;
  const validPyramids =
    Array.isArray(loaded.pyramids) &&
    loaded.pyramids.length === MAX_PYRAMIDS &&
    loaded.pyramids.every((c) => Array.isArray(c) && c.length === 15);
  if (!validPyramids) {
    loaded.pyramids = generatePyramids(MAX_PYRAMIDS);
    changed = true;
  }
  const okCard = (c) => Array.isArray(c) && (c.length === 6 || c.length === MAX_LOTTO_SIZE) && c.every((d) => Number.isInteger(d) && d >= 0 && d <= 9);
  const validLotto = Array.isArray(loaded.lotto) && loaded.lotto.length === MAX_LOTTO && loaded.lotto.every(okCard);
  if (validLotto) {
    // Cartelas salvas com 6 dígitos (antes das "dezenas"): completa até 9.
    if (loaded.lotto.some((c) => c.length !== MAX_LOTTO_SIZE)) changed = true;
    loaded.lotto = loaded.lotto.map((c) => (c.length === MAX_LOTTO_SIZE ? c : [...c, ...generateLotto(1)[0].slice(c.length)]));
  }
  if (!validLotto) {
    loaded.lotto = generateLotto(MAX_LOTTO);
    changed = true;
  }
  if (!Number.isInteger(loaded.lottoCount) || loaded.lottoCount < 1 || loaded.lottoCount > MAX_LOTTO) loaded.lottoCount = defaults.lottoCount;
  if (!LOTTO_SIZES.includes(loaded.lottoSize)) loaded.lottoSize = defaults.lottoSize;
  if (!Number.isFinite(loaded.lottoAcc) || loaded.lottoAcc < ACC_START || loaded.lottoAcc > ACC_MAX) loaded.lottoAcc = ACC_START;
  if (!Number.isInteger(loaded.pyramidCount) || loaded.pyramidCount < 1 || loaded.pyramidCount > MAX_PYRAMIDS) {
    loaded.pyramidCount = defaults.pyramidCount;
  }
  loaded.pyramidActive = Array.from(
    { length: MAX_PYRAMIDS },
    (_, i) => i < loaded.pyramidCount && loaded.pyramidActive[i] !== false,
  );
  if (!loaded.pyramidActive.some(Boolean)) loaded.pyramidActive[0] = true;
  loaded.active = Array.from({ length: MAX_CARDS }, (_, i) => i < loaded.cardCount && loaded.active[i] === true);
  if (!loaded.active.some(Boolean)) loaded.active[0] = true;
  return { state: loaded, found, changed };
}

export function loadState() {
  const { state: loaded, changed } = readDrawer(currentAccount());
  state = loaded;
  if (changed) save();
  return state;
}

// Há progresso na gaveta "sem conta" deste aparelho? Devolve o que seria compartilhado, ou null.
export function anonymousProgress() {
  const { state: s, found } = readDrawer(null);
  if (!found) return null;
  const d = defaultState();
  const played = s.sharedAt > 0 || s.stats.rounds > 0 || s.credits !== d.credits || s.bet !== d.bet || s.cardCount !== d.cardCount;
  return played ? { ...sharedOf(s), updatedAt: s.sharedAt || 1 } : null;
}

// Troca de gaveta (entrar/sair de uma conta). `seed` = o que a conta já começa tendo (ou null: vazia).
// `clearAnonymous` apaga a gaveta "sem conta" (quando o progresso dela foi levado para a conta).
// Depois de chamar isto, recarregue a página: tudo é refeito a partir da gaveta nova.
export function switchAccount(uid, { seed = null, clearAnonymous = false } = {}) {
  try {
    if (uid && seed) {
      const s = { ...defaultState(), ...seed, sharedAt: seed.updatedAt ?? 0 };
      delete s.updatedAt;
      s.active = Array.from({ length: MAX_CARDS }, (_, i) => i < s.cardCount);
      s.cards = generateCards(MAX_CARDS);
      localStorage.setItem(storageKey(uid), JSON.stringify(s));
    }
    if (clearAnonymous) localStorage.removeItem(storageKey(null));
    if (uid) localStorage.setItem(ACCOUNT_KEY, uid);
    else localStorage.removeItem(ACCOUNT_KEY);
  } catch {
    // sem espaço ou modo privado
  }
}

// Põe na tela o que veio da nuvem (só chamar com a rodada parada).
export function applyShared(shared) {
  const oldCount = state.cardCount;
  state.credits = shared.credits;
  state.bet = shared.bet;
  state.cardCount = shared.cardCount;
  state.stats = { ...shared.stats };
  state.sharedAt = shared.updatedAt;
  state.active = Array.from({ length: MAX_CARDS }, (_, i) => i < shared.cardCount && (i < oldCount ? state.active[i] === true : true));
  if (!state.active.some(Boolean)) state.active[0] = true;
  save();
  for (const fn of [...listeners]) fn(state);
}

let state = defaultState();
const listeners = new Set();

export function getState() {
  return state;
}

function save() {
  try {
    localStorage.setItem(storageKey(currentAccount()), JSON.stringify(state));
  } catch {
    // sem espaço ou modo privado: o jogo segue sem salvar
  }
}

export function update(mutator) {
  const before = JSON.stringify(sharedOf(state));
  mutator(state);
  if (JSON.stringify(sharedOf(state)) !== before) state.sharedAt = Date.now();
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
  if (s.mode === 'lotto') return s.lottoCount;
  return (s.mode === 'farao' ? s.pyramidActive : s.active).filter(Boolean).length;
}

export function totalBet(s = state) {
  return s.bet * activeCount(s) * (s.mode === 'lotto' ? LOTTO_PRICE[s.lottoSize] : 1);
}

export function toggleCard(i) {
  update((s) => {
    if (i >= s.cardCount || (s.active[i] && s.active.filter(Boolean).length === 1)) return;
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

// ===== Modo Faraó =====
export function setMode(mode) {
  update((s) => {
    if (!MODES.includes(mode) || s.mode === mode) return;
    s.mode = mode;
    s.lastDrawn = [];
  });
}

export function togglePyramid(i) {
  update((s) => {
    if (i >= s.pyramidCount || (s.pyramidActive[i] && s.pyramidActive.filter(Boolean).length === 1)) return;
    s.pyramidActive[i] = !s.pyramidActive[i];
  });
}

export function stepPyramidCount(direction) {
  update((s) => {
    const next = s.pyramidCount + direction;
    if (next < 1 || next > MAX_PYRAMIDS) return;
    if (direction > 0) s.pyramidActive[next - 1] = true;
    else s.pyramidActive[s.pyramidCount - 1] = false;
    s.pyramidCount = next;
    if (!s.pyramidActive.some(Boolean)) s.pyramidActive[0] = true;
  });
}

export function newPyramids() {
  update((s) => {
    s.pyramids = generatePyramids(MAX_PYRAMIDS);
    s.lastDrawn = [];
  });
}

// ===== Modo Lotto =====
// Qualquer mudança nos dígitos apaga as bolas da tela (para não sobrar bola antiga em cima de dígito novo).
export function setLottoDigit(card, pos, digit) {
  update((s) => {
    s.lotto[card][pos] = ((digit % 10) + 10) % 10;
    s.lastDrawn = [];
  });
}

export function setLottoCard(card, digits) {
  update((s) => {
    s.lotto[card] = [...digits];
    s.lastDrawn = [];
  });
}

export function stepLottoCount(direction) {
  update((s) => {
    const next = s.lottoCount + direction;
    if (next < 1 || next > MAX_LOTTO) return;
    s.lottoCount = next;
  });
}

export function newLotto() {
  update((s) => {
    s.lotto = generateLotto(MAX_LOTTO);
    s.lastDrawn = [];
  });
}

// Quantas dezenas (casas) cada cartela do Lotto tem: 6 a 9. Mais casas = mais fácil e mais caro.
export function stepLottoSize(direction) {
  update((s) => {
    const next = LOTTO_SIZES.indexOf(s.lottoSize) + direction;
    if (next < 0 || next >= LOTTO_SIZES.length) return;
    s.lottoSize = LOTTO_SIZES[next];
    s.lastDrawn = [];
  });
}
