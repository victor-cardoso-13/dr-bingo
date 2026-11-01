// Sessão 19d: avisos de prêmio (pequeno some em 0,8 s; grande fica; tudo preenchido de primeira = festa), nos 2 jogos.
import { launch } from './cdp.mjs';
import { shuffleRange } from '../../src/engine/draw.js';
const out = process.argv[2] ?? '/tmp';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const URL = 'http://localhost:8081/';
const zero = () => 0;

async function play(state, label) {
  await p.goto(URL);
  await p.eval(`localStorage.setItem('bingo-vovo:v1', ${JSON.stringify(JSON.stringify(state))})`);
  await p.goto(URL);
  await p.eval(`crypto.getRandomValues = (a) => { a.fill(0); return a; }`);
  await p.click('.btn-play'); await p.sleep(150);
  await p.click('.btn-accel'); await p.sleep(250);
  for (let i = 0; i < 5 && (await p.eval(`!document.querySelector('.extra').hidden`)); i++) { await p.click('.extra .btn-end'); await p.sleep(150); }
  return label;
}
const modal = () => p.eval(`(()=>{const m=document.querySelector('.modal');return m?m.className:null})()`);

// ---------- Bingo ----------
const sb = shuffleRange(60, zero);
const filler = (from) => Array.from({ length: 15 }, (_, i) => sb[from + i]);
const bingoState = (card) => ({ credits: 100000, bet: 1, cardCount: 1, cards: [card, filler(30), filler(45), filler(30)] });
// linha (×5): 5 números marcados + 10 que não saem nas 30 primeiras
const unmarked = sb.slice(30);
await play(bingoState([...sb.slice(0, 5), ...unmarked.slice(0, 10)]), 'bingo pequeno');
let m = await modal();
ok(m && m.includes('modal--quick'), 'Bingo, prêmio pequeno: aviso rápido (' + m + ')');
await p.sleep(1100);
ok((await modal()) === null, 'Bingo, prêmio pequeno: some sozinho em ~0,8 s');
// moldura (×500, um dos 3 maiores): 12 casas marcadas
const frame = [0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14];
const cardFrame = Array(15).fill(0); let k = 0, u = 0;
for (let i = 0; i < 15; i++) cardFrame[i] = frame.includes(i) ? sb[k++] : unmarked[u++];
await play(bingoState(cardFrame), 'bingo grande');
m = await modal();
ok(m && !m.includes('modal--quick') && !m.includes('jackpot'), 'Bingo, Moldura: aviso grande (' + m + ')');
await p.sleep(1200);
ok((await modal()) !== null, 'Bingo, Moldura: continua na tela depois de 1,2 s');
await p.click('.modal__actions button');
// cartela cheia sem bola extra
await play(bingoState(sb.slice(0, 15)), 'bingo festa');
m = await modal();
ok(m && m.includes('modal--jackpot'), 'Bingo, cartela cheia de primeira: FESTA (' + m + ')');
ok((await p.eval(`document.querySelectorAll('.confetti span').length`)) >= 100, 'muito confete');
ok((await p.text('.win__jackpot')) === 'CARTELA CHEIA!', 'texto CARTELA CHEIA!');
await p.screenshot(out + '/festa-bingo.png');
await p.sleep(1500);
ok((await modal()) !== null, 'festa fica na tela');
await p.click('.modal__actions button');
ok(await p.eval(`!document.querySelector('.modal') && document.querySelector('.btn-play').textContent === 'PRÓXIMA RODADA'`), 'OK fecha; PRÓXIMA RODADA');

// ---------- Faraó ----------
const sf = shuffleRange(90, zero);
const freeF = sf.slice(55);
const pyr = (marked) => { const c = Array(15).fill(0); let a = 0, b = 0; for (let i = 0; i < 15; i++) c[i] = marked.includes(i) ? sf[a++] : freeF[b++]; return c; };
const other = (from) => Array.from({ length: 15 }, (_, i) => sf[from + i]);
const faraoState = (pyramid) => ({ credits: 100000, bet: 1, mode: 'farao', pyramidCount: 1, pyramids: [pyramid, other(70), other(60), other(70)] });
await play(faraoState(pyr([10, 11, 12, 13, 14])), 'farao pequeno'); // 1 lado ×3
m = await modal();
ok(m && m.includes('modal--quick'), 'Faraó, 1 lado: aviso rápido (' + m + ')');
await p.sleep(1100);
ok((await modal()) === null, 'Faraó, 1 lado: some sozinho');
await play(faraoState(pyr([10, 11, 12, 13, 14, 0, 1, 3, 6])), 'farao grande'); // 2 lados ×70
m = await modal();
ok(m && !m.includes('modal--quick') && !m.includes('jackpot'), 'Faraó, 2 lados: aviso grande (' + m + ')');
await p.sleep(1200);
ok((await modal()) !== null, 'Faraó, 2 lados: continua na tela');
await p.click('.modal__actions button');
await play(faraoState(pyr(Array.from({ length: 15 }, (_, i) => i))), 'farao festa');
m = await modal();
ok(m && m.includes('modal--jackpot'), 'Faraó, pirâmide cheia de primeira: FESTA (' + m + ')');
ok((await p.text('.win__jackpot')) === 'PIRÂMIDE CHEIA!', 'texto PIRÂMIDE CHEIA!');
await p.screenshot(out + '/festa-farao.png');
console.log('errors', p.errors);
await p.close();
