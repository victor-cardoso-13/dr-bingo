import { ANY_MULTIPLIERS, LOTTO_DIGITS, MAX_LOTTO, MAX_LOTTO_SIZE, SEQ_MULTIPLIERS, decodeBall, generateLotto, lottoHits, lottoPrize } from '../engine/lotto.js';
import { getState, setLottoCard, setLottoDigit, subscribe } from '../state.js';
import { getRound, subscribeRound } from '../round.js';
import { formatMoney } from '../format.js';

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(className, text, label) {
  const b = el('button', className, text);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
}

// Tabela de prêmios ao lado (iPad deitado): "6 → ×250".
function table(title, className, rows) {
  const box = el('section', `ltable ${className}`);
  box.append(el('h3', 'ltable__title', title));
  for (const [n, mult] of rows) {
    const row = el('div', 'ltable__row');
    row.append(el('span', 'ltable__n', String(n)), el('span', 'ltable__x', `×${mult}`));
    box.append(row);
  }
  return box;
}

const rowsOf = (m) => Object.entries(m).map(([n, x]) => [Number(n), x]).reverse();

// O Lotto inteiro: Acumulado, as 4 cartelas de 6 dígitos (▲ dígito ▼, IGUAIS, SORTEAR), as 6 bolas e as tabelas.
// Os filhos são todos irmãos na grade, para o CSS poder arrumar em pé (coluna) e deitado (como no iPad do jogo de referência).
export function renderLotto(root) {
  root.innerHTML = '';
  const board = el('div', 'lotto');
  root.append(board);

  const jack = el('div', 'ljack');
  const jackValue = el('b', 'ljack__value');
  jack.append(el('span', 'ljack__label', 'ACUMULADO'), jackValue);

  const balls = el('div', 'lballs');
  balls.setAttribute('aria-label', 'Bolas sorteadas');
  balls.setAttribute('aria-live', 'polite');
  const ballEls = Array.from({ length: LOTTO_DIGITS }, () => {
    const b = el('span', 'lball');
    balls.append(b);
    return b;
  });

  const cards = Array.from({ length: MAX_LOTTO }, (_, k) => {
    const box = el('section', `lcard lcard--${k + 1}`);
    const prize = el('span', 'lcard__prize');
    const row = el('div', 'lrow');
    const cols = Array.from({ length: MAX_LOTTO_SIZE }, (_, i) => {
      const col = el('div', 'lcol');
      const up = button('lcol__arrow', '▲', `Aumentar dígito ${i + 1} da cartela ${k + 1}`);
      const digit = button('lcol__digit', '0', `Dígito ${i + 1} da cartela ${k + 1}: toque para trocar`);
      const down = button('lcol__arrow', '▼', `Diminuir dígito ${i + 1} da cartela ${k + 1}`);
      const move = (d) => () => setLottoDigit(k, i, getState().lotto[k][i] + d);
      up.addEventListener('click', move(1));
      digit.addEventListener('click', move(1));
      down.addEventListener('click', move(-1));
      col.append(up, digit, down);
      row.append(col);
      return { col, up, digit, down };
    });
    const acts = el('div', 'lact');
    const same = button('lact__btn', 'IGUAIS', `Cartela ${k + 1}: todos os dígitos iguais ao primeiro`);
    const draw = button('lact__btn', 'SORTEAR', `Cartela ${k + 1}: sortear os dígitos`);
    same.addEventListener('click', () => setLottoCard(k, Array(MAX_LOTTO_SIZE).fill(getState().lotto[k][0])));
    draw.addEventListener('click', () => setLottoCard(k, generateLotto(1)[0]));
    acts.append(same, draw);
    box.append(prize, row, acts);
    board.append(box);
    return { box, prize, cols, same, draw };
  });

  const side = el('aside', 'lside');
  side.append(
    table('SEQUÊNCIA', 'ltable--seq', rowsOf(SEQ_MULTIPLIERS)),
    table('QUALQUER', 'ltable--any', rowsOf(ANY_MULTIPLIERS)),
  );
  const legend = el('p', 'llegend');
  legend.append(el('span', 'llegend__dot llegend__dot--silver'), ' ×2  ', el('span', 'llegend__dot llegend__dot--gold'), ' ×3');
  side.append(legend);

  side.prepend(jack);
  board.append(balls, side);

  let shownBalls = -1;
  const paint = (s) => {
    const round = getRound();
    const locked = round.phase !== 'idle';
    const live = round.mode === 'lotto' && round.snapshot ? round.snapshot : null;
    const src = locked && live ? live : { bet: s.bet, acc: s.lottoAcc };
    jackValue.textContent = formatMoney(src.acc * src.bet);

    const size = locked && live ? live.size ?? 6 : s.lottoSize;
    const drawn = s.mode === 'lotto' ? s.lastDrawn : [];
    const drawnSet = new Set(drawn);
    if (shownBalls !== drawn.length) {
      ballEls.forEach((b, k) => {
        const n = drawn.find((x) => decodeBall(x).pos === k);
        b.className = 'lball';
        b.replaceChildren();
        if (n === undefined) return;
        const { digit, tier } = decodeBall(n);
        b.classList.add('lball--in', ...(tier === 1 ? ['lball--silver'] : tier === 2 ? ['lball--gold'] : []));
        b.append(String(digit));
        if (tier) b.append(el('i', 'lball__tag', `×${tier + 1}`));
      });
      shownBalls = drawn.length;
    }

    cards.forEach((c, k) => {
      const card = s.lotto[k];
      c.box.hidden = k >= s.lottoCount;
      const { cells } = lottoHits(card, drawnSet, size);
      const hitCells = new Set(cells.filter((x) => x >= 0));
      c.box.querySelector('.lrow').style.setProperty('--n', String(size));
      c.cols.forEach((col, i) => {
        col.col.hidden = i >= size;
        col.digit.textContent = String(card[i]);
        col.digit.classList.toggle('hit', hitCells.has(i));
        for (const b of [col.up, col.digit, col.down]) b.disabled = locked;
      });
      c.same.disabled = locked;
      c.draw.disabled = locked;
      const prize = drawn.length > 0 ? lottoPrize(card, drawnSet, src.bet, src.acc, size) : null;
      c.prize.hidden = !prize?.pattern;
      if (prize?.pattern) c.prize.textContent = `${prize.pattern.name}${prize.mult > 1 ? ` ×${prize.mult}` : ''} · ${formatMoney(prize.win)}`;
    });
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
