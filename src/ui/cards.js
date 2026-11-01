import { MAX_CARDS, getState, subscribe, toggleCard } from '../state.js';
import { getRound, subscribeRound } from '../round.js';
import { formatCredits, formatMoney } from '../format.js';
import { improvingCells } from '../engine/patterns.js';
import { cardPrize } from '../engine/payout.js';

export function renderCards(root) {
  root.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'cards-grid';
  root.append(grid);

  const boxes = Array.from({ length: MAX_CARDS }, (_, i) => {
    const box = document.createElement('section');
    box.className = 'card';

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'card__head';
    const name = document.createElement('span');
    name.className = 'card__name';
    name.textContent = `CARTELA: ${i + 1}`;
    const betTag = document.createElement('span');
    betTag.className = 'card__bet';
    // O prêmio atual fica no cabeçalho, logo abaixo do nome.
    const foot = document.createElement('span');
    foot.className = 'card__foot';
    foot.textContent = '—';
    const top = document.createElement('span');
    top.className = 'card__top';
    top.append(name, betTag);
    head.append(top, foot);
    head.addEventListener('click', () => toggleCard(i));

    const cells = document.createElement('div');
    cells.className = 'card__grid';

    box.append(head, cells);
    grid.append(box);
    return { box, head, cells, foot, betTag };
  });

  let shownCards = null;
  const paint = (s) => {
    const round = getRound();
    const locked = round.phase !== 'idle';
    // Durante a rodada, tudo vem da foto tirada no JOGAR.
    const src = locked && round.snapshot ? round.snapshot : s;
    grid.style.setProperty('--card-rows', String(Math.ceil(s.cardCount / 4))); // iPad deitado: 4 cartelas por fileira
    const drawn = new Set(s.lastDrawn);
    const live = round.phase === 'drawing' || round.phase === 'extra';
    boxes.forEach(({ box, head, cells, foot, betTag }, i) => {
      betTag.replaceChildren('APOSTA: ', formatCredits(src.bet));
      box.hidden = i >= s.cardCount;
      box.classList.toggle('card--off', !s.active[i]);
      head.setAttribute('aria-pressed', String(s.active[i]));
      head.disabled = locked;
      if (shownCards !== s.cards) {
        cells.innerHTML = '';
        s.cards[i].forEach((n, idx) => {
          const cell = document.createElement('span');
          cell.className = 'cell';
          cell.dataset.index = String(idx);
          cell.dataset.number = String(n);
          cell.textContent = String(n);
          cells.append(cell);
        });
      }
      if (s.active[i]) {
        for (const cell of cells.children) {
          cell.classList.toggle('marked', drawn.has(Number(cell.dataset.number)));
        }
      } else {
        for (const cell of cells.children) cell.classList.remove('marked');
      }
      const showPrize = src.active[i] && drawn.size > 0;
      const prize = showPrize ? cardPrize(src.cards[i], drawn, src.bet) : null;
      if (prize?.pattern) {
        // "USD 120.000,00" nunca se separa em duas linhas.
        const money = Object.assign(document.createElement('span'), { className: 'nowrap', textContent: formatMoney(prize.win) });
        foot.replaceChildren(`${prize.pattern.name} · `, money);
      } else {
        foot.textContent = '—';
      }
      const hot = new Set(showPrize && live ? improvingCells(src.cards[i], drawn) : []);
      for (const cell of cells.children) {
        cell.classList.toggle('hot', hot.has(Number(cell.dataset.index)));
      }
    });
    shownCards = s.cards;
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
