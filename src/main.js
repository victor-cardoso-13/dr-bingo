import { loadState, subscribe } from './state.js';
import { initMusic, playClick, unlockAudio } from './ui/sound.js';
import { recoverPendingRound } from './round.js';
import { renderTopbar } from './ui/topbar.js';
import { renderModes } from './ui/modes.js';
import { renderBallboard } from './ui/ballboard.js';
import { renderCards } from './ui/cards.js';
import { renderPyramids } from './ui/pyramids.js';
import { renderLotto } from './ui/lotto.js';
import { renderControls } from './ui/controls.js';
import { iniciarNuvem } from './nuvem/sincronia.js';

// Duplo toque nunca dá zoom (iPad ignora o touch-action em alguns pontos). O segundo toque rápido
// é cortado aqui; se foi num botão, o clique é feito à mão para o "+" seguido continuar rápido.
function travarZoomDoDuploToque() {
  let ultimo = 0;
  document.addEventListener('touchend', (e) => {
    const agora = e.timeStamp;
    if (agora - ultimo < 500 && e.cancelable) {
      e.preventDefault();
      e.target.closest?.('button')?.click();
    }
    ultimo = agora;
  }, { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
  // Pinça (zoom) também nunca: o Safari do iPad ignora o user-scalable=no, então cortamos o gesto.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  }
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1 && e.cancelable) e.preventDefault(); }, { passive: false });
}

function start() {
  travarZoomDoDuploToque();
  const state = loadState();
  const applyBigText = (s) => {
    document.documentElement.classList.toggle('big-text', s.settings.bigText);
    document.documentElement.dataset.mode = s.mode;
  };
  applyBigText(state);
  subscribe(applyBigText);
  document.addEventListener('pointerdown', unlockAudio);
  initMusic();
  document.addEventListener('click', (e) => {
    if (e.target.closest('button')) playClick();
  });

  renderTopbar(document.getElementById('topbar'));
  renderModes(document.getElementById('modes'));
  renderBallboard(document.getElementById('ballboard'));
  const cardsArea = document.getElementById('cards');
  cardsArea.innerHTML = '<div id="cards-bingo"></div><div id="cards-farao"></div><div id="cards-lotto"></div>';
  renderCards(document.getElementById('cards-bingo'));
  renderPyramids(document.getElementById('cards-farao'));
  renderLotto(document.getElementById('cards-lotto'));
  renderControls(document.getElementById('controls'));
  recoverPendingRound();
  iniciarNuvem();
}

const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    if (isLocal && !new URLSearchParams(location.search).has('sw')) {
      // Desenvolvimento: nada de código velho preso no cache.
      for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
      if (globalThis.caches) {
        for (const name of await caches.keys()) {
          if (name.startsWith('bingo-vovo-')) await caches.delete(name);
        }
      }
      return;
    }
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) {
        reloaded = true;
        location.reload();
      }
    });
    await navigator.serviceWorker.register('./sw.js');
  } catch {
    // sem service worker o jogo continua funcionando
  }
}

start();
setupServiceWorker();
