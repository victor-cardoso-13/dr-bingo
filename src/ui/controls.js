import {
  BET_STEPS, MAX_CARDS, getState, newCards, newPyramids, stepBet, stepCardCount, stepPyramidCount, subscribe, totalBet,
} from '../state.js';
import { MAX_PYRAMIDS } from '../engine/pyramids.js';
import { formatCredits, formatMoney } from '../format.js';
import { openPrizeTable, openPyramidPrizeTable } from './modals.js';
import { playExtra } from './sound.js';
import { GAMES, endExtras, finishDraw, getRound, requestExtra, startRound, subscribeRound } from '../round.js';

function button(className, text) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = text;
  return b;
}

export function renderControls(root) {
  root.innerHTML = '';

  // Linha de cima: "Aposta   Total: 8   Cartelas"; embaixo, os dois seletores [−] valor [+].
  const betRow = document.createElement('div');
  betRow.className = 'bet';
  const labels = document.createElement('div');
  labels.className = 'bet__labels';
  const betLabel = document.createElement('span');
  betLabel.textContent = 'Aposta';
  const total = document.createElement('span');
  total.className = 'bet__total';
  const countLabel = document.createElement('span');
  countLabel.textContent = 'Cartelas';
  labels.append(betLabel, total, countLabel);

  const stepper = (valueClass, what) => {
    const box = document.createElement('div');
    box.className = 'stepper';
    const less = button('btn-step', '−');
    less.setAttribute('aria-label', `Diminuir ${what}`);
    const value = document.createElement('strong');
    value.className = valueClass;
    const more = button('btn-step', '+');
    more.setAttribute('aria-label', `Aumentar ${what}`);
    box.append(less, value, more);
    return { box, less, value, more };
  };
  const bet = stepper('bet__value', 'aposta');
  const count = stepper('bet__count', 'cartelas');
  const minus = bet.less;
  const plus = bet.more;
  const betValue = bet.value;
  const steppers = document.createElement('div');
  steppers.className = 'bet__steppers';
  steppers.append(bet.box, count.box);
  betRow.append(labels, steppers);

  const row = document.createElement('div');
  row.className = 'controls__row';
  const prizes = button('btn-secondary', 'Prêmios');
  const swap = button('btn-secondary', 'Trocar cartelas');

  const play = button('btn-play', 'JOGAR');

  const accel = button('btn-accel', 'Terminar sorteio');

  const extra = document.createElement('div');
  extra.className = 'extra';
  const extraTitle = document.createElement('p');
  extraTitle.className = 'extra__title';
  extraTitle.setAttribute('aria-live', 'polite');
  const extraCount = document.createElement('p');
  extraCount.className = 'extra__count';
  const askBtn = button('btn-play', 'Pedir bola extra');
  const endBtn = button('btn-secondary btn-end', 'Encerrar');
  const extraButtons = document.createElement('div');
  extraButtons.className = 'extra__buttons';
  extraButtons.append(askBtn, endBtn);
  extra.append(extraTitle, extraCount, extraButtons);

  // Uma linha só: [Prêmios] [JOGAR / Terminar sorteio] [Trocar cartelas].
  swap.innerHTML = 'Trocar<br>cartelas';
  swap.setAttribute('aria-label', 'Trocar cartelas');
  row.append(prizes, play, accel, swap);
  root.append(betRow, row, extra);

  minus.addEventListener('click', () => stepBet(-1));
  plus.addEventListener('click', () => stepBet(1));
  const farao = () => getState().mode === 'farao';
  count.less.addEventListener('click', () => (farao() ? stepPyramidCount(-1) : stepCardCount(-1)));
  count.more.addEventListener('click', () => (farao() ? stepPyramidCount(1) : stepCardCount(1)));
  swap.addEventListener('click', () => (farao() ? newPyramids() : newCards()));
  prizes.addEventListener('click', () => (farao() ? openPyramidPrizeTable() : openPrizeTable()));
  play.addEventListener('click', startRound);
  accel.addEventListener('click', finishDraw);
  askBtn.addEventListener('click', () => {
    playExtra();
    requestExtra();
  });
  endBtn.addEventListener('click', endExtras);

  const paint = (s) => {
    const round = getRound();
    const phase = round.phase;
    const idle = phase === 'idle';
    const cost = totalBet(s);
    betValue.textContent = formatCredits(s.bet);
    total.textContent = `Total: ${formatMoney(cost)}`;
    minus.disabled = !idle || s.bet === BET_STEPS[0];
    plus.disabled = !idle || s.bet === BET_STEPS[BET_STEPS.length - 1];
    const isFarao = s.mode === 'farao';
    const shown = isFarao ? s.pyramidCount : s.cardCount;
    countLabel.textContent = isFarao ? 'Pirâmides' : 'Cartelas';
    swap.innerHTML = isFarao ? 'Trocar<br>pirâmides' : 'Trocar<br>cartelas';
    count.value.textContent = String(shown);
    count.less.disabled = !idle || shown === 1;
    count.more.disabled = !idle || shown === (isFarao ? MAX_PYRAMIDS : MAX_CARDS);
    swap.disabled = !idle;
    const broke = s.credits < cost;
    play.disabled = !idle || broke;
    play.textContent = broke ? 'Adicione dólares' : s.lastDrawn.length > 0 ? 'PRÓXIMA RODADA' : 'JOGAR';
    play.classList.toggle('btn-play--long', !broke && s.lastDrawn.length > 0);
    const inExtra = phase === 'extra';
    betRow.hidden = inExtra;
    row.hidden = inExtra;
    play.hidden = phase === 'drawing' || inExtra;
    accel.hidden = phase !== 'drawing';
    extra.hidden = !inExtra;
    if (inExtra) {
      const price = round.offer.cost;
      const priceText = round.offer.free ? 'GRÁTIS' : formatMoney(price);
      extraTitle.replaceChildren('Bola extra: ', Object.assign(document.createElement('strong'), { textContent: priceText }));
      extraCount.textContent = `Extra ${round.extrasUsed + 1} de ${GAMES[round.mode].maxExtra}`;
      const short = s.credits < price;
      askBtn.disabled = short;
      askBtn.textContent = short ? 'Dólares insuficientes' : 'Pedir bola extra';
    }
  };
  const repaint = () => paint(getState());
  repaint();
  subscribe(repaint);
  subscribeRound(repaint);
}
