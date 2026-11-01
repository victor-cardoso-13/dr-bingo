import { getState, update } from '../state.js';
import { formatAmount, formatCredits, formatMoney } from '../format.js';
import { PATTERNS } from '../engine/patterns.js';

const root = () => document.getElementById('modal-root');

// Janela genérica. actions: [{ label, primary, onClick(close) }]. Devolve close().
export function openModal({ title, body, actions = [], onClose, className = '' }) {
  const previousFocus = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const dialog = document.createElement('div');
  dialog.className = `modal ${className}`.trim();
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  const heading = document.createElement('h2');
  heading.className = 'modal__title';
  heading.id = `modal-title-${Date.now()}`;
  heading.textContent = title;
  dialog.setAttribute('aria-labelledby', heading.id);

  const content = document.createElement('div');
  content.className = 'modal__body';
  if (typeof body === 'string') content.textContent = body;
  else if (body) content.append(body);

  const bar = document.createElement('div');
  bar.className = 'modal__actions';

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    overlay.remove();
    if (previousFocus && previousFocus.focus) previousFocus.focus();
    if (onClose) onClose();
  };

  const buttons = actions.map((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a.label;
    if (a.primary) b.classList.add('modal__primary');
    b.addEventListener('click', () => (a.onClick ? a.onClick(close) : close()));
    bar.append(b);
    return b;
  });

  dialog.append(heading, content, bar);
  overlay.append(dialog);
  root().append(overlay);
  (buttons[0] ?? dialog).focus?.();
  return close;
}

const CONFETTI_COLORS = ['#ffd23f', '#ff7a00', '#21c45d', '#ffffff', '#ff4d8d', '#3fa9ff'];
const CONFETTI_PIECES = 48;

function confetti() {
  const box = document.createElement('div');
  box.className = 'confetti';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < CONFETTI_PIECES; i++) {
    const piece = document.createElement('span');
    piece.style.left = `${(i * 37) % 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDelay = `${(i % 12) * 0.12}s`;
    piece.style.animationDuration = `${2.4 + (i % 5) * 0.35}s`;
    if (i % 3 === 0) piece.classList.add('confetti--round');
    box.append(piece);
  }
  return box;
}

// Aviso de prêmio (seção 7). Fecha ao toque ou depois de 4 s.
export function showWin(total, { message, onClose } = {}) {
  const body = document.createElement('div');
  body.className = 'win';
  const text = document.createElement('p');
  text.className = 'win__text';
  if (message) {
    text.textContent = message(formatMoney(total));
  } else if (total > 0) {
    text.append('Você ganhou ');
    const n = document.createElement('strong');
    n.className = 'win__number';
    const cur = document.createElement('span');
    cur.className = 'win__currency';
    cur.textContent = 'USD ';
    n.append(cur, formatAmount(total));
    text.append(n);
  } else {
    text.textContent = 'Não foi dessa vez';
  }
  if (total > 0) {
    const rays = document.createElement('div');
    rays.className = 'win__rays';
    rays.setAttribute('aria-hidden', 'true');
    body.append(rays);
  }
  body.append(text);
  let timer = null;
  const close = openModal({
    title: total > 0 ? 'Parabéns!' : 'Fim da rodada',
    body,
    className: total > 0 ? 'modal--win modal--prize' : 'modal--win',
    actions: [{ label: 'OK', primary: true }],
    onClose: () => {
      clearTimeout(timer);
      if (onClose) onClose();
    },
  });
  // O confete cobre a tela inteira, não só a janela.
  if (total > 0) body.closest('.modal-overlay')?.append(confetti());
  timer = setTimeout(close, 4000);
  return close;
}

function miniGrid(mask) {
  const grid = document.createElement('div');
  grid.className = 'mini-grid';
  grid.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 15; i++) {
    const c = document.createElement('span');
    if (mask.includes(i)) c.className = 'on';
    grid.append(c);
  }
  return grid;
}

export function openPrizeTable() {
  const bet = getState().bet;
  const list = document.createElement('ul');
  list.className = 'prize-list';
  for (const p of PATTERNS) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    const money = Object.assign(document.createElement('span'), { className: 'nowrap', textContent: formatMoney(p.multiplier * bet) });
    label.append(`${p.name}: `, money);
    li.append(miniGrid(p.masks[0]), label);
    list.append(li);
  }
  return openModal({
    title: 'Prêmios',
    body: list,
    className: 'modal--prizes',
    actions: [{ label: 'Fechar', primary: true }],
  });
}

function optionGroup(label, options, current, onPick) {
  const group = document.createElement('div');
  group.className = 'opt';
  const name = document.createElement('p');
  name.className = 'opt__label';
  name.textContent = label;
  const row = document.createElement('div');
  row.className = 'opt__row';
  for (const [value, text] of options) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.setAttribute('aria-pressed', String(value === current));
    b.addEventListener('click', () => onPick(value));
    row.append(b);
  }
  group.append(name, row);
  return group;
}

const ON_OFF = [[true, 'Ligado'], [false, 'Desligado']];

export function openSettings() {
  const body = document.createElement('div');
  let confirming = false;

  const set = (key) => (value) => {
    update((s) => {
      s.settings[key] = value;
    });
    render();
  };

  function render() {
    const { settings, stats } = getState();
    body.replaceChildren(
      optionGroup('Velocidade', [['lento', 'Lento'], ['normal', 'Normal'], ['rapido', 'Rápido']], settings.speed, set('speed')),
      optionGroup('Sons', ON_OFF, settings.sound, set('sound')),
      optionGroup('Texto grande', ON_OFF, settings.bigText, set('bigText')),
    );
    const info = document.createElement('div');
    info.className = 'opt';
    const lines = document.createElement('p');
    lines.className = 'opt__stats';
    lines.append(
      `Rodadas jogadas: ${formatCredits(stats.rounds)}`,
      document.createElement('br'),
      `Maior prêmio: ${formatMoney(stats.biggestWin)}`,
    );
    info.append(lines);
    if (confirming) {
      const ask = document.createElement('p');
      ask.className = 'opt__label';
      ask.textContent = 'Tem certeza?';
      const row = document.createElement('div');
      row.className = 'opt__row';
      const yes = document.createElement('button');
      yes.type = 'button';
      yes.textContent = 'Sim';
      yes.addEventListener('click', () => {
        update((s) => {
          s.stats = { rounds: 0, biggestWin: 0 };
        });
        confirming = false;
        render();
      });
      const no = document.createElement('button');
      no.type = 'button';
      no.textContent = 'Não';
      no.addEventListener('click', () => {
        confirming = false;
        render();
      });
      row.append(yes, no);
      info.append(ask, row);
    } else {
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'opt__reset';
      reset.textContent = 'Zerar estatísticas';
      reset.addEventListener('click', () => {
        confirming = true;
        render();
      });
      info.append(reset);
    }
    body.append(info);
  }
  render();

  return openModal({
    title: 'Ajustes',
    body,
    className: 'modal--settings',
    actions: [{ label: 'Fechar', primary: true }],
  });
}
