import { MAX_PYRAMIDS, SIDES, hotPyramidCells, pyramidPrize } from '../engine/pyramids.js';
import { getState, subscribe, togglePyramid } from '../state.js';
import { getRound, subscribeRound } from '../round.js';
import { formatCredits, formatMoney } from '../format.js';

const ROWS = [1, 2, 3, 4, 5];

// As 4 pirâmides do modo Faraó, em 2 × 2. Tocar no cabeçalho liga/desliga (como nas cartelas).
export function renderPyramids(root) {
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'pyr-grid';
  root.append(grid);

  const boxes = Array.from({ length: MAX_PYRAMIDS }, (_, i) => {
    const box = document.createElement('section');
    box.className = 'pyr';

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'pyr__head';
    const name = document.createElement('span');
    name.className = 'pyr__name';
    name.textContent = `PIRÂMIDE ${i + 1}`;
    const betTag = document.createElement('span');
    betTag.className = 'pyr__bet';
    const top = document.createElement('span');
    top.className = 'pyr__top';
    top.append(name, betTag);
    const foot = document.createElement('span');
    foot.className = 'pyr__foot';
    foot.textContent = '—';
    head.append(top, foot);
    head.addEventListener('click', () => togglePyramid(i));

    const body = document.createElement('div');
    body.className = 'pyr__body';
    box.append(head, body);
    grid.append(box);
    return { box, head, body, foot, betTag };
  });

  let shownPyramids = null;
  const paint = (s) => {
    const round = getRound();
    const locked = round.phase !== 'idle';
    // Durante a rodada, tudo vem da foto tirada no JOGAR.
    const src = locked && round.snapshot && round.mode === 'farao' ? round.snapshot : { cards: s.pyramids, active: s.pyramidActive, bet: s.bet };
    const drawn = new Set(s.lastDrawn);
    const live = round.phase === 'drawing' || round.phase === 'extra';
    boxes.forEach(({ box, head, body, foot, betTag }, i) => {
      betTag.replaceChildren('APOSTA: ', formatCredits(src.bet));
      box.hidden = i >= s.pyramidCount;
      box.classList.toggle('pyr--off', !s.pyramidActive[i]);
      head.setAttribute('aria-pressed', String(s.pyramidActive[i]));
      head.disabled = locked;
      if (shownPyramids !== s.pyramids) {
        body.innerHTML = '';
        let idx = 0;
        for (const n of ROWS) {
          const row = document.createElement('div');
          row.className = 'pyr__row';
          for (let k = 0; k < n; k++, idx++) {
            const cell = document.createElement('span');
            cell.className = 'pcell';
            cell.dataset.index = String(idx);
            cell.dataset.number = String(s.pyramids[i][idx]);
            cell.textContent = String(s.pyramids[i][idx]);
            row.append(cell);
          }
          body.append(row);
        }
      }
      const cells = [...body.querySelectorAll('.pcell')];
      const on = s.pyramidActive[i];
      const marked = cells.map((c) => on && drawn.has(Number(c.dataset.number)));
      const sideCells = new Set(Object.values(SIDES).filter((side) => side.every((k) => marked[k])).flat());
      const showPrize = src.active[i] && drawn.size > 0;
      const prize = showPrize ? pyramidPrize(src.cards[i], drawn, src.bet) : null;
      const hot = new Set(showPrize && live ? hotPyramidCells(src.cards[i], drawn).map((h) => h.cell) : []);
      cells.forEach((c, k) => {
        c.classList.toggle('marked', marked[k]);
        c.classList.toggle('side', sideCells.has(k) || prize?.pattern?.id === 'bingo');
        c.classList.toggle('hot', hot.has(k));
      });
      if (prize?.pattern) {
        const money = Object.assign(document.createElement('span'), { className: 'nowrap', textContent: formatMoney(prize.win) });
        foot.replaceChildren(`${prize.pattern.name} · `, money);
      } else {
        foot.textContent = '—';
      }
    });
    shownPyramids = s.pyramids;
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
