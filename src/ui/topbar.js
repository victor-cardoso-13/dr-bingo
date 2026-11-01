import { ADD_AMOUNT, addCredits, getState, subscribe, totalBet } from '../state.js';
import { formatAmount, formatMoney } from '../format.js';
import { getRound, subscribeRound } from '../round.js';
import { openSettings } from './modals.js';

export function renderTopbar(root) {
  root.innerHTML = '';
  const bar = document.createElement('div');
  bar.className = 'topbar';

  const credits = document.createElement('div');
  credits.className = 'topbar__credits';
  const label = document.createElement('span');
  label.className = 'topbar__label';
  label.textContent = 'Saldo';
  const value = document.createElement('strong');
  value.className = 'topbar__value';
  value.setAttribute('aria-live', 'polite');
  credits.append(label, value);

  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn-add';
  add.textContent = '+ Adicionar';

  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'btn-settings';
  settings.setAttribute('aria-label', 'Ajustes');
  settings.textContent = '⚙';

  bar.append(credits, add, settings);
  root.append(bar);

  const paint = (s) => {
    // "USD" menor na frente; o tamanho da letra se ajusta ao tamanho do valor.
    const amount = formatAmount(s.credits);
    const cur = document.createElement('span');
    cur.className = 'topbar__currency';
    cur.textContent = 'USD ';
    value.replaceChildren(cur, amount);
    value.style.setProperty('--len', String(amount.length + 2));
    const round = getRound();
    const needed = round.phase === 'extra' ? round.offer.cost : round.phase === 'idle' ? totalBet(s) : 0;
    add.classList.toggle('pulse', s.credits < needed);
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);

  settings.addEventListener('click', openSettings);

  add.addEventListener('click', () => {
    addCredits();
    const float = document.createElement('span');
    float.className = 'topbar__float';
    float.textContent = `+${formatMoney(ADD_AMOUNT)}`;
    credits.append(float);
    float.addEventListener('animationend', () => float.remove());
    setTimeout(() => float.remove(), 1200);
  });
}
