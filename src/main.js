import { loadState, subscribe } from './state.js';
import { playClick, unlockAudio } from './ui/sound.js';
import { recoverPendingRound } from './round.js';
import { renderTopbar } from './ui/topbar.js';
import { renderBallboard } from './ui/ballboard.js';
import { renderCards } from './ui/cards.js';
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
}

function start() {
  travarZoomDoDuploToque();
  const state = loadState();
  const applyBigText = (s) => document.documentElement.classList.toggle('big-text', s.settings.bigText);
  applyBigText(state);
  subscribe(applyBigText);
  document.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('click', (e) => {
    if (e.target.closest('button')) playClick();
  });

  renderTopbar(document.getElementById('topbar'));
  renderBallboard(document.getElementById('ballboard'));
  renderCards(document.getElementById('cards'));
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
