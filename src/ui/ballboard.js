import { getState, subscribe } from '../state.js';
import { MAIN_BALLS, MAX_EXTRA } from '../engine/draw.js';
import { subscribeRound } from '../round.js';


// Cor da bola pela faixa de números (mesmas faixas das colunas da cartela).
const ballClass = (n) => `ball--c${Math.min(4, Math.floor((n - 1) / 12))}`;

function numberSpan(n) {
  const num = document.createElement('span');
  num.className = 'ball__num';
  num.textContent = String(n);
  return num;
}

function ball(className, n) {
  const b = document.createElement('span');
  b.className = `${className} ${ballClass(n)}`;
  b.append(numberSpan(n));
  return b;
}

const LANE = 15; // bolas por pista: 2 pistas para as 30 do sorteio; a 3ª (extras) só aparece quando há extra

export function renderBallboard(root) {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'ballboard__panel';

  const globe = document.createElement('div');
  globe.className = 'globe';
  const current = document.createElement('div');
  current.className = 'ball-current';
  globe.append(current);

  const info = document.createElement('div');
  info.className = 'ballboard__info';
  info.setAttribute('aria-live', 'polite');

  // Pistas de aço: cada bola sorteada rola até o seu lugar.
  const tracks = document.createElement('div');
  tracks.className = 'tracks';
  tracks.setAttribute('aria-label', 'Bolas sorteadas');
  const total = MAIN_BALLS + MAX_EXTRA;
  const slots = Array.from({ length: total }, (_, k) => {
    const slot = document.createElement('i');
    slot.className = 'slot';
    slot.style.setProperty('--i', String(k % LANE));
    return slot;
  });
  const lanes = [];
  for (let l = 0; l < Math.ceil(total / LANE); l++) {
    const lane = document.createElement('div');
    lane.className = l * LANE >= MAIN_BALLS ? 'lane lane--extra' : 'lane';
    lane.append(...slots.slice(l * LANE, (l + 1) * LANE));
    tracks.append(lane);
    lanes.push(lane);
  }

  panel.append(globe, info, tracks);
  root.append(panel);

  let shown = null;
  const paint = (s) => {
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
    current.className = `ball-current ${ballClass(last)}`;
    current.replaceChildren(numberSpan(last));
    void current.offsetWidth;
    current.classList.add('ball-current--in');
    slots.forEach((slot, k) => {
      if (k >= drawn.length) return slot.replaceChildren();
      if (slot.firstChild?.dataset.n === String(drawn[k])) return;
      const b = ball('ball-small', drawn[k]);
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
