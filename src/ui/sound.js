import { getState, totalBet } from '../state.js';

let ctx = null;
let master = null;
let echo = null;

// Só cria/retoma o AudioContext depois de um toque (exigência do iPhone).
export function unlockAudio() {
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    // Eco curto: atraso de 120 ms com retorno baixo, criado uma vez só.
    echo = ctx.createDelay(0.5);
    echo.delayTime.value = 0.12;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    echo.connect(feedback).connect(echo);
    echo.connect(wet).connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const ready = () => ctx && getState().settings.sound;

// Uma nota com ataque rápido e queda exponencial (sem estalos no início nem no fim).
function tone({ freq, start = 0, duration = 0.15, type = 'sine', gain = 0.15, attack = 0.008, toFreq, wet = false }) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(master);
  if (wet) amp.connect(echo);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// Sino: fundamental + harmônico agudo, com eco.
function bell(freq, start = 0, duration = 0.5, gain = 0.12) {
  tone({ freq, start, duration, gain, wet: true });
  tone({ freq: freq * 2.01, start, duration: duration * 0.6, gain: gain * 0.35, type: 'triangle', wet: true });
}

export function playBall() {
  if (!ready()) return;
  bell(988, 0, 0.45, 0.13);
  bell(1319, 0.06, 0.4, 0.08);
}

export function playMark() {
  if (!ready()) return;
  tone({ freq: 1600, start: 0.09, duration: 0.06, type: 'triangle', gain: 0.07, attack: 0.003, toFreq: 1100 });
}

export function playClick() {
  if (!ready()) return;
  tone({ freq: 700, duration: 0.035, type: 'triangle', gain: 0.05, attack: 0.002, toFreq: 450 });
}

export function playExtra() {
  if (!ready()) return;
  tone({ freq: 300, duration: 0.35, type: 'sine', gain: 0.08, attack: 0.03, toFreq: 1200 });
  bell(1568, 0.3, 0.5, 0.1);
}

// Vitória: quanto maior o prêmio em relação à aposta total, mais longa a fanfarra.
const SCALE = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];

export function playWin(total = 0) {
  if (!ready()) return;
  const cost = totalBet(getState()) || 1;
  const ratio = total / cost;
  const notes = ratio >= 30 ? 7 : ratio >= 5 ? 5 : 4;
  const step = 0.13;
  SCALE.slice(0, notes).forEach((freq, i) => bell(freq, i * step, 0.35, 0.1));
  const end = notes * step;
  // Acorde final.
  [523.25, 659.25, 783.99].forEach((freq) =>
    tone({ freq: freq * 2, start: end, duration: 1.1, type: 'triangle', gain: 0.06, attack: 0.02, wet: true }),
  );
  if (ratio >= 30) {
    // Brilho extra nos prêmios grandes.
    for (let i = 0; i < 6; i++) bell(2093 + i * 220, end + 0.2 + i * 0.09, 0.25, 0.04);
  }
}
