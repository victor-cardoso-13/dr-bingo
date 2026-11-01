import { getState, subscribe } from '../state.js';
import { GAMES, subscribeRound } from '../round.js';


// Cor da bola pela faixa de números (no Bingo, as mesmas faixas das colunas da cartela; no Faraó, 5 faixas de 18).
const ballClass = (n, mode) => `ball--c${Math.min(4, Math.floor((n - 1) / (mode === 'farao' ? 18 : 12)))}`;

function numberSpan(n) {
  const num = document.createElement('span');
  num.className = 'ball__num';
  num.textContent = String(n);
  return num;
}

function ball(className, n, mode) {
  const b = document.createElement('span');
  b.className = `${className} ${ballClass(n, mode)}`;
  b.append(numberSpan(n));
  return b;
}

// Bolas por pista: 2 pistas para as do sorteio; a 3ª (extras) só aparece quando há extra.
const LANES = { bingo: [15, 15, 10], farao: [15, 15, 15, 10] };

export function renderBallboard(root) {
  let mode = null;
  let current;
  let info;
  let slots;
  let lanes;
  let shown;

  const build = (m) => {
    mode = m;
    shown = null;
    const { mainBalls } = GAMES[m];
    const sizes = LANES[m];
    root.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'ballboard__panel';

    const globe = document.createElement('div');
    globe.className = 'globe';
    current = document.createElement('div');
    current.className = 'ball-current';
    globe.append(current);

    info = document.createElement('div');
    info.className = 'ballboard__info';
    info.setAttribute('aria-live', 'polite');

    // Pistas de aço: cada bola sorteada rola até o seu lugar.
    const tracks = document.createElement('div');
    tracks.className = 'tracks';
    tracks.setAttribute('aria-label', 'Bolas sorteadas');
    slots = [];
    lanes = sizes.map((size, l) => {
      const lane = document.createElement('div');
      const first = sizes.slice(0, l).reduce((a, b) => a + b, 0);
      lane.className = first >= mainBalls ? 'lane lane--extra' : 'lane';
      lane.style.setProperty('--cols', String(Math.max(...sizes)));
      lane.style.gridTemplateColumns = `repeat(${Math.max(...sizes)}, minmax(0, 1fr))`;
      for (let k = 0; k < size; k++) {
        const slot = document.createElement('i');
        slot.className = 'slot';
        slot.style.setProperty('--i', String(k));
        slots.push(slot);
        lane.append(slot);
      }
      tracks.append(lane);
      return lane;
    });
    panel.append(globe, info, tracks);
    root.append(panel);
  };

  const paint = (s) => {
    if (s.mode !== mode) build(s.mode);
    const { mainBalls: MAIN_BALLS, maxExtra: MAX_EXTRA } = GAMES[mode];
    const drawn = s.lastDrawn;
    lanes[lanes.length - 1].hidden = drawn.length <= MAIN_BALLS;
    if (drawn.length === 0) {
      current.className = 'ball-current ball-current--empty';
      current.textContent = '';
      info.textContent = 'Toque em JOGAR';
      slots.forEach((slot) => slot.replaceChildren());
      shown = null;
      return;
    }
    const last = drawn[drawn.length - 1];
    info.textContent =
      drawn.length > MAIN_BALLS
        ? `Extra ${drawn.length - MAIN_BALLS} de ${MAX_EXTRA}`
        : `Bola ${drawn.length} de ${MAIN_BALLS}`;
    if (shown === drawn.length) return;
    const isNew = shown !== null && drawn.length === shown + 1;
    current.className = `ball-current ${ballClass(last, mode)}`;
    current.replaceChildren(numberSpan(last));
    void current.offsetWidth;
    current.classList.add('ball-current--in');
    slots.forEach((slot, k) => {
      if (k >= drawn.length) return slot.replaceChildren();
      if (slot.firstChild?.dataset.n === String(drawn[k])) return;
      const b = ball('ball-small', drawn[k], mode);
      b.dataset.n = String(drawn[k]);
      if (isNew && k === drawn.length - 1) b.classList.add('ball-small--roll');
      slot.replaceChildren(b);
    });
    shown = drawn.length;
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
