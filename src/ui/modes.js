import { getState, setMode, subscribe } from '../state.js';
import { getRound, subscribeRound } from '../round.js';

const MODES = [['bingo', 'Bingo'], ['farao', 'Faraó']];

// Dois botões grandes: o modo só troca com a rodada parada.
export function renderModes(root) {
  root.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'modes';
  const buttons = MODES.map(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode-btn';
    b.textContent = label;
    b.addEventListener('click', () => setMode(id));
    row.append(b);
    return [id, b];
  });
  root.append(row);
  const paint = (s) => {
    const idle = getRound().phase === 'idle';
    for (const [id, b] of buttons) {
      b.setAttribute('aria-pressed', String(s.mode === id));
      b.disabled = !idle && s.mode !== id;
    }
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
