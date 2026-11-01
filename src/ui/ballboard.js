import { getState, subscribe } from '../state.js';
import { MAIN_BALLS, MAX_EXTRA } from '../engine/draw.js';
import { subscribeRound } from '../round.js';

const BULBS = 12;
const RECENT = 10; // bolas anteriores mostradas (2 fileiras de 5)

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

function bulbRow(where) {
  const row = document.createElement('div');
  row.className = `bulbs bulbs--${where}`;
  row.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < BULBS; i++) row.append(document.createElement('i'));
  return row;
}

export function renderBallboard(root) {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'ballboard__panel';

  const globe = document.createElement('div');
  globe.className = 'globe';
  const current = document.createElement('div');
  current.className = 'ball-current';
  globe.append(current);

  const side = document.createElement('div');
  side.className = 'ballboard__side';
  const info = document.createElement('div');
  info.className = 'ballboard__info';
  info.setAttribute('aria-live', 'polite');
  const recent = document.createElement('div');
  recent.className = 'ballboard__recent';
  side.append(info, recent);

  panel.append(bulbRow('top'), globe, side, bulbRow('bottom'));
  root.append(panel);

  let shown = null;
  const paint = (s) => {
    const drawn = s.lastDrawn;
    if (drawn.length === 0) {
      current.className = 'ball-current ball-current--empty';
      current.textContent = '';
      info.textContent = 'Toque em JOGAR';
      recent.innerHTML = '';
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
    recent.innerHTML = '';
    drawn.slice(-(RECENT + 1), -1).reverse().forEach((n, i) => {
      const b = ball('ball-small', n);
      // A bola anterior sai do globo rolando até a fila.
      if (i === 0 && isNew) b.classList.add('ball-small--roll');
      recent.append(b);
    });
    shown = drawn.length;
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
