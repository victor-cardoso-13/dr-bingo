// Sessão 19: modo Faraó (pirâmides). Uso: node scripts/e2e/t08.mjs [pasta-das-capturas]
import { launch } from './cdp.mjs';
const out = process.argv[2] ?? '/tmp';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const URL = 'http://localhost:8081/';
await p.goto(URL);
await p.eval(`localStorage.setItem('bingo-vovo:v1', JSON.stringify({credits:100000,bet:5}))`);
await p.goto(URL);
ok(await p.eval(`document.documentElement.dataset.mode === 'bingo' && !document.querySelector('#cards-bingo').offsetParent === false`), 'abre no Bingo');
await p.click('.mode-btn', 1);
ok(await p.eval(`document.documentElement.dataset.mode === 'farao' && document.querySelectorAll('.pyr:not([hidden])').length === 4`), 'Faraó em 1 toque, 4 pirâmides');
ok(await p.eval(`document.querySelectorAll('.pcell').length === 60`), '60 números');
ok((await p.text('.bet__total')) === 'Total: USD 20,00', 'total 4 × 5 = 20 → ' + await p.text('.bet__total'));
ok((await p.text('.bet__labels span:last-child')) === 'Pirâmides', 'rótulo Pirâmides');
const nums = await p.eval(`[...document.querySelectorAll('.pcell')].map(c=>+c.dataset.number)`);
ok(new Set(nums).size === 60 && nums.every((n) => n >= 1 && n <= 90), 'números únicos de 1 a 90');
ok(await p.eval(`(()=>{const a=document.querySelector('#cards');return a.scrollHeight<=a.clientHeight+1})()`), 'sem rolagem nas pirâmides');
await p.screenshot(out + '/farao-idle.png');
// persistência do modo
await p.goto(URL);
ok(await p.eval(`document.documentElement.dataset.mode === 'farao'`), 'lembra o modo após recarregar');
// prêmios
await p.click('.controls__row .btn-secondary', 0);
ok((await p.text('.modal__title')) === 'Prêmios do Faraó' && (await p.eval(`document.querySelectorAll('.prize-list li').length`)) === 4, 'janela de prêmios');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
// rodada
await p.click('.btn-play'); await p.sleep(200);
ok((await p.text('.topbar__value')).endsWith('99.980,00'), 'JOGAR desconta 20 → ' + await p.text('.topbar__value'));
ok(await p.eval(`document.querySelector('.mode-btn:not([aria-pressed=true])').disabled`), 'modo travado na rodada');
await p.sleep(1500);
ok(/Bola [12] de 45/.test(await p.text('.ballboard__info')), 'contador: ' + await p.text('.ballboard__info'));
await p.click('.btn-accel'); await p.sleep(200);
await p.screenshot(out + '/farao-45.png');
ok((await p.text('.ballboard__info')).includes('45'), 'terminou as 45');
let extras = 0, free = null;
for (let i = 0; i < 12; i++) {
  if (await p.eval(`!document.querySelector('.extra').hidden`)) {
    const title = await p.text('.extra__title');
    if (/de 10/.test(await p.text('.extra__count')) && (await p.text('.extra__count')).startsWith('Extra 5 ')) free = title;
    if (extras === 0) await p.screenshot(out + '/farao-extra.png');
    await p.click('.extra .btn-play'); extras++; await p.sleep(100);
  } else break;
}
console.log('extras pedidas:', extras, '| 5ª:', free);
if (free !== null) ok(free.includes('GRÁTIS'), '5ª extra grátis');
await p.sleep(300);
const st = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(st.lastDrawn.length === 45 + extras && new Set(st.lastDrawn).size === st.lastDrawn.length && st.lastDrawn.every((n) => n <= 90), 'bolas únicas até 90: ' + st.lastDrawn.length);
ok(st.pendingRound === null && st.stats.rounds === 1, 'rodada acertada');
const drawn = new Set(st.lastDrawn);
const expected = st.pyramids.map((pyr) => {
  const m = pyr.map((n) => drawn.has(n));
  const L = [0, 1, 3, 6, 10], R = [0, 2, 5, 9, 14], B = [10, 11, 12, 13, 14];
  if (m.every(Boolean)) return 1000;
  return [0, 3, 70, 200][[L, R, B].filter((s) => s.every((i) => m[i])).length];
}).reduce((a, b) => a + b * 5, 0);
if (extras === 0) ok(st.credits === 100000 - 20 + expected, 'conta confere: saldo ' + st.credits + ' = 99.980 + prêmio ' + expected);
const marks = await p.eval(`document.querySelectorAll('.pcell.marked').length`);
ok(marks === st.pyramids.flat().filter((n) => drawn.has(n)).length, 'marcações = bolas sorteadas nas pirâmides (' + marks + ')');
await p.screenshot(out + '/farao-fim.png');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
ok(await p.eval(`!document.querySelector('.btn-play').disabled`), 'JOGAR volta');
// saldo compartilhado: volta ao Bingo e o saldo é o mesmo
const saldo = await p.text('.topbar__value');
await p.click('.mode-btn', 0);
ok(await p.eval(`document.documentElement.dataset.mode === 'bingo'`) && (await p.text('.topbar__value')) === saldo, 'saldo igual no Bingo: ' + saldo);
ok((await p.text('.ballboard__info')) === 'Toque em JOGAR', 'painel zerado ao trocar de modo');
await p.screenshot(out + '/bingo-com-modos.png');
ok(await p.eval(`(()=>{const a=document.querySelector('#cards');return a.scrollHeight<=a.clientHeight+1})()`), 'Bingo continua sem rolagem');
// 1 a 4 pirâmides
await p.click('.mode-btn', 1);
await p.click('.bet__steppers .stepper:last-child .btn-step', 0);
ok(await p.eval(`document.querySelectorAll('.pyr:not([hidden])').length === 3`), 'diminuir para 3 pirâmides');
// tamanhos
for (const [w, h] of [[390, 844], [440, 800]]) {
  await p.setViewport(w, h); await p.sleep(300);
  await p.screenshot(`${out}/farao-${w}x${h}.png`);
  ok(await p.eval(`(()=>{const a=document.querySelector('#cards');return a.scrollHeight<=a.clientHeight+1})()`), `sem rolagem ${w}x${h}`);
}

// ---- Cenário fixo: sorteio determinístico para provar as bolas extras e a 5ª grátis ----
import { shuffleRange } from '../../src/engine/draw.js';
import { settlePyramids } from '../../src/engine/pyramids.js';
const seq = shuffleRange(90, () => 0);
const A = Array(15).fill(0);
[10, 11, 12, 13, 14, 0, 1, 3, 6, 2, 5].forEach((cell, k) => (A[cell] = seq[k]));
A[9] = seq[80]; A[4] = seq[81]; A[7] = seq[82]; A[8] = seq[83];
const rest = [...seq.slice(55, 80), ...seq.slice(84, 90), ...seq.slice(11, 25)];
const pyrs = [A, rest.slice(0, 15), rest.slice(15, 30), rest.slice(30, 45)];
await p.goto(URL);
await p.eval(`localStorage.setItem('bingo-vovo:v1', JSON.stringify({credits:100000,bet:5,mode:'farao',pyramids:${JSON.stringify(pyrs)}}))`);
await p.goto(URL);
await p.eval(`crypto.getRandomValues = (a) => { a.fill(0); return a; }`);
await p.click('.btn-play'); await p.sleep(200);
await p.click('.btn-accel'); await p.sleep(200);
const money = (t) => Number(t.replace(/[^0-9,]/g, '').replace(',', '.'));
let paid = 0, fifth = null, n = 0;
while (await p.eval(`!document.querySelector('.extra').hidden`)) {
  n++;
  const title = await p.text('.extra__title');
  const count = await p.text('.extra__count');
  if (n === 1) await p.screenshot(out + '/farao-extra.png');
  if (count.startsWith('Extra 5 ')) fifth = title;
  else paid += money(title);
  await p.click('.extra .btn-play'); await p.sleep(80);
  if (n === 1) await p.screenshot(out + '/farao-extra-comprada.png');
  if (n === 5) await p.screenshot(out + '/farao-extra-5.png');
}
ok(n === 10, 'as 10 bolas extras foram oferecidas (' + n + ')');
ok(fifth?.includes('GRÁTIS'), '5ª extra grátis: ' + fifth);
ok(paid > 0, 'as outras custaram, total ' + paid);
await p.sleep(300);
const st2 = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(st2.lastDrawn.length === 55 && st2.pendingRound === null, '55 bolas, rodada acertada');
const prize2 = settlePyramids({ cards: st2.pyramids, active: [true, true, true, true], bet: 5, drawnSet: new Set(st2.lastDrawn) }).total;
ok(prize2 >= 350, 'a pirâmide 1 paga 2 lados ×70 × 5 = 350 (prêmio total ' + prize2 + ')');
ok(Math.abs(st2.credits - (100000 - 20 - paid + prize2)) < 0.001, 'saldo = 100000 − 20 − extras ' + paid + ' + prêmio ' + prize2 + ' → ' + st2.credits);
ok(!!(await p.text('.win__text')), 'aviso de prêmio aparece');
await p.screenshot(out + '/farao-extras-fim.png');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
await p.sleep(200);
ok(await p.eval(`document.querySelector('.btn-play').textContent === 'PRÓXIMA RODADA'`), 'botão PRÓXIMA RODADA');
await p.screenshot(out + '/farao-proxima.png');
console.log('errors', p.errors);
await p.close();
