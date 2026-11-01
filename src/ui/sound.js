import { getState, subscribe, totalBet } from '../state.js';

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
function tone({ freq, start = 0, duration = 0.15, type = 'sine', gain = 0.15, attack = 0.008, toFreq, wet = false, out = master }) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(out);
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

export function playWin(total = 0, tier = 'big') {
  if (!ready()) return;
  if (tier === 'small') {
    // Prêmio pequeno: dois sinos rápidos (a janela some em 0,8 s).
    bell(1046.5, 0, 0.3, 0.1);
    bell(1568, 0.1, 0.4, 0.1);
    return;
  }
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

// Festa: tudo preenchido de primeira. ~5 s de fanfarra, escalas subindo, acordes e "fogos".
export function playJackpot() {
  if (!ready()) return;
  const loud = master.gain.value;
  master.gain.value = 1;
  setTimeout(() => (master.gain.value = loud), 6500);
  for (let r = 0; r < 3; r++) {
    SCALE.forEach((freq, i) => bell(freq * (r === 2 ? 2 : 1), r * 0.95 + i * 0.09, 0.45, 0.16));
  }
  [0, 1.1, 2.2].forEach((t, k) => {
    tone({ freq: 140 + k * 40, start: t, duration: 1, type: 'sawtooth', gain: 0.06, toFreq: 280 + k * 80, wet: true });
  });
  // Acordes cheios no final.
  [[523.25, 659.25, 783.99], [587.33, 739.99, 880], [659.25, 830.61, 987.77], [1046.5, 1318.51, 1567.98]].forEach((chord, k) =>
    chord.forEach((freq) => tone({ freq, start: 3.1 + k * 0.45, duration: k === 3 ? 2.2 : 0.55, type: 'triangle', gain: 0.1, attack: 0.02, wet: true })),
  );
  // Fogos: estalos agudos espalhados.
  for (let i = 0; i < 14; i++) {
    tone({ freq: 2200 + (i % 5) * 350, start: 1 + i * 0.28, duration: 0.18, type: 'square', gain: 0.035, attack: 0.002, toFreq: 700, wet: true });
  }
}

// ===== Música de fundo (gerada por código, bem baixinha) =====
// Cada música: [semitons a partir da nota-base, duração em tempos] (null = pausa); o baixo toca a cada 2 tempos.
const TUNES = {
  bingo: {
    base: 261.63, bpm: 126,
    melody: [[0, 1], [4, 1], [7, 1], [12, 1], [11, 1], [7, 1], [4, 1], [7, 1],
      [5, 1], [9, 1], [12, 1], [9, 1], [7, 1], [4, 1], [2, 1], [4, 1],
      [0, 1], [4, 1], [7, 1], [12, 1], [14, 1], [12, 1], [9, 1], [12, 1],
      [11, 1], [7, 1], [2, 1], [7, 1], [0, 2], [null, 2]],
    bass: [0, -7, -3, -5, -7, -3, -5, -12],
  },
  farao: {
    base: 220, bpm: 112,
    melody: [[0, 1], [1, 0.5], [4, 0.5], [5, 1], [4, 1], [1, 1], [0, 1], [-3, 1],
      [0, 1], [1, 0.5], [4, 0.5], [7, 1], [8, 1], [7, 1], [4, 1], [1, 1],
      [4, 1], [5, 1], [8, 1], [7, 1], [5, 1], [4, 1], [1, 1], [0, 1],
      [-3, 1], [0, 1], [1, 1], [4, 1], [0, 2], [null, 2]],
    bass: [-12, -12, -7, -12, -5, -12, -7, -12],
  },
};
let music = null; // { id, note, nextTime, timer, bus }

const semi = (base, n) => base * 2 ** (n / 12);

function scheduleMusic() {
  const tune = TUNES[music.id];
  const beat = 60 / tune.bpm;
  while (music.nextTime < ctx.currentTime + 0.6) {
    const [n, beats] = tune.melody[music.note % tune.melody.length];
    const t = Math.max(0, music.nextTime - ctx.currentTime);
    if (n !== null) {
      tone({ freq: semi(tune.base * 2, n), start: t, duration: beat * beats * 0.9, type: 'triangle', gain: 0.032, attack: 0.01, wet: true, out: music.bus });
    }
    if (music.note % 2 === 0) {
      const b = tune.bass[(music.note / 2) % tune.bass.length | 0];
      tone({ freq: semi(tune.base, b), start: t, duration: beat * 1.8, type: 'sine', gain: 0.05, attack: 0.02, out: music.bus });
    }
    music.nextTime += beat * beats;
    music.note += 1;
  }
}

function stopMusic() {
  if (!music) return;
  clearInterval(music.timer);
  music.bus.disconnect();
  music = null;
}

function startMusic(id) {
  const bus = ctx.createGain();
  bus.gain.value = 1;
  bus.connect(master);
  music = { id, note: 0, nextTime: ctx.currentTime + 0.1, bus, timer: setInterval(scheduleMusic, 200) };
  scheduleMusic();
}

// Liga/desliga/troca a música conforme os Ajustes, o modo e a tela estar à vista. Chamar depois de qualquer toque também.
export function syncMusic() {
  if (!ctx) return;
  const s = getState();
  const want = s.settings.music && s.settings.sound && !document.hidden ? (s.mode === 'farao' ? 'farao' : 'bingo') : null;
  if (music && music.id !== want) stopMusic();
  if (want && !music) startMusic(want);
}

export function initMusic() {
  subscribe(syncMusic);
  document.addEventListener('visibilitychange', syncMusic);
  document.addEventListener('pointerdown', () => setTimeout(syncMusic, 0));
}
