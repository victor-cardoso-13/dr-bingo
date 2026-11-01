import { getState, update } from '../state.js';
import { formatAmount, formatCredits, formatMoney } from '../format.js';
import { PATTERNS } from '../engine/patterns.js';
import { BINGO_MULTIPLIER, SIDES, SIDE_MULTIPLIERS } from '../engine/pyramids.js';
import { contaSection, observarSituacao } from './conta.js';

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

function confetti(pieces = CONFETTI_PIECES) {
  const box = document.createElement('div');
  box.className = 'confetti';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < pieces; i++) {
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

// Aviso de prêmio. tier: 'small' = some sozinho em 0,8 s; 'big' (um dos 3 maiores prêmios) fica até o OK ou 4 s;
// 'jackpot' (tudo preenchido de primeira) é a grande festa: confete, vibração e fica até o OK (ou 15 s).
export function showWin(total, { message, onClose, tier = 'big', fullName = 'BINGO!' } = {}) {
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
  const quick = tier === 'small';
  const jackpot = tier === 'jackpot';
  if (jackpot) {
    const big = document.createElement('p');
    big.className = 'win__jackpot';
    big.textContent = fullName;
    body.prepend(big);
    navigator.vibrate?.([200, 100, 200, 100, 400, 150, 200, 100, 600]);
  }
  let timer = null;
  const close = openModal({
    title: jackpot ? 'BINGO!!!' : total > 0 ? 'Parabéns!' : 'Fim da rodada',
    body,
    className: `${total > 0 ? 'modal--win modal--prize' : 'modal--win'}${quick ? ' modal--quick' : ''}${jackpot ? ' modal--jackpot' : ''}`,
    actions: quick ? [] : [{ label: 'OK', primary: true }],
    onClose: () => {
      clearTimeout(timer);
      if (onClose) onClose();
    },
  });
  // O confete cobre a tela inteira, não só a janela.
  if (total > 0 && !quick) body.closest('.modal-overlay')?.append(confetti(jackpot ? 150 : CONFETTI_PIECES));
  if (jackpot) body.closest('.modal-overlay')?.classList.add('overlay--jackpot');
  timer = setTimeout(close, quick ? 800 : jackpot ? 15000 : 4000);
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

// Mini pirâmide (15 casas em 5 fileiras) com as casas `mask` acesas.
function miniPyramid(mask) {
  const box = document.createElement('div');
  box.className = 'mini-pyr';
  box.setAttribute('aria-hidden', 'true');
  let idx = 0;
  for (let r = 1; r <= 5; r++) {
    const row = document.createElement('div');
    for (let k = 0; k < r; k++, idx++) {
      const c = document.createElement('span');
      if (mask.includes(idx)) c.className = 'on';
      row.append(c);
    }
    box.append(row);
  }
  return box;
}

export function openPyramidPrizeTable() {
  const bet = getState().bet;
  const all = Array.from({ length: 15 }, (_, i) => i);
  const rows = [
    ['Bingo', BINGO_MULTIPLIER, all],
    ['3 lados', SIDE_MULTIPLIERS[3], [...SIDES.left, ...SIDES.right, ...SIDES.base]],
    ['2 lados', SIDE_MULTIPLIERS[2], [...SIDES.left, ...SIDES.base]],
    ['1 lado', SIDE_MULTIPLIERS[1], SIDES.base],
  ];
  const list = document.createElement('ul');
  list.className = 'prize-list';
  for (const [name, mult, mask] of rows) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    const money = Object.assign(document.createElement('span'), { className: 'nowrap', textContent: formatMoney(mult * bet) });
    label.append(`${name}: `, money);
    li.append(miniPyramid(mask), label);
    list.append(li);
  }
  return openModal({
    title: 'Prêmios do Faraó',
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
      contaSection(render),
      optionGroup('Velocidade', [['lento', 'Lento'], ['normal', 'Normal'], ['rapido', 'Rápido']], settings.speed, set('speed')),
      optionGroup('Sons', ON_OFF, settings.sound, set('sound')),
      optionGroup('Música de fundo', ON_OFF, settings.music, set('music')),
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
  const stop = observarSituacao(render);

  return openModal({
    title: 'Ajustes',
    body,
    className: 'modal--settings',
    onClose: stop,
    actions: [{ label: 'Fechar', primary: true }],
  });
}
