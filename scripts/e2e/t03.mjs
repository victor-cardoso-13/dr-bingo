import { launch } from './cdp.mjs';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
await p.goto('http://localhost:8081/');
await p.eval(`localStorage.setItem('bingo-vovo:v1', JSON.stringify({credits:1000,bet:2}))`);
await p.goto('http://localhost:8081/');
await p.click('.card__head', 3); // desliga cartela 4 → total 6
ok((await p.text('.bet__total')) === 'Total: USD 6,00', 'total 6');
await p.click('.btn-play');
await p.sleep(200);
ok((await p.text('.topbar__value')) === 'USD 994,00', 'JOGAR desconta 6 → ' + await p.text('.topbar__value'));
ok(await p.eval(`document.querySelector('.btn-play').hidden && !document.querySelector('.btn-accel').hidden`), 'Terminar sorteio aparece no lugar do JOGAR');
ok(await p.eval(`[...document.querySelectorAll('.btn-step,.controls__row .btn-secondary:last-child,.card__head')].every(b=>b.disabled)`), 'controles desabilitados no sorteio');
await p.sleep(1500);
const t = await p.text('.ballboard__info');
ok(/Bola [12] de 30/.test(t), 'contador: ' + t);
await p.click('.btn-accel');
await p.screenshot((process.argv[2] ?? '/tmp') + '/s03a.png');
for (let i = 0; i < 40; i++) { if (await p.eval(`!document.querySelector('.btn-accel').offsetParent`)) break; await p.sleep(500); }
await p.sleep(300);
if (await p.eval(`!document.querySelector('.extra').hidden`)) await p.click('.extra .btn-end');
ok((await p.text('.ballboard__info')).includes('30'), 'terminou: ' + await p.text('.ballboard__info'));
const st = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(st.lastDrawn.length >= 30 && new Set(st.lastDrawn).size === st.lastDrawn.length, 'bolas únicas');
ok(st.stats.rounds === 1, 'rounds = 1');
const marks = await p.eval(`[...document.querySelectorAll('.card')].map(c=>[...c.querySelectorAll('.cell.marked')].length)`);
const expect = await p.eval(`(()=>{const s=JSON.parse(localStorage.getItem('bingo-vovo:v1'));return s.cards.map((c,i)=>s.active[i]?c.filter(n=>s.lastDrawn.includes(n)).length:0)})()`);
ok(JSON.stringify(marks) === JSON.stringify(expect) && marks[3] === 0, 'marcações só nas ligadas ' + marks);
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
ok(await p.eval(`!document.querySelector('.btn-play').disabled`), 'JOGAR volta');
await p.goto('http://localhost:8081/');
const marks2 = await p.eval(`[...document.querySelectorAll('.card')].map(c=>[...c.querySelectorAll('.cell.marked')].length)`);
ok(JSON.stringify(marks2) === JSON.stringify(marks), 'marcações voltam após reload');
await p.screenshot((process.argv[2] ?? '/tmp') + '/s03b.png');
await p.click('.btn-play'); await p.sleep(100);
ok((await p.eval(`document.querySelectorAll('.cell.marked').length`)) === 0, 'novo JOGAR limpa marcas');
// Terminar sorteio: 1 toque mostra as 30 de uma vez
await p.goto('http://localhost:8081/');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button'); // rodada anterior acertada
await p.click('.btn-play'); await p.sleep(1200);
ok((await p.text('.btn-accel')) === 'Terminar sorteio', 'botão Terminar sorteio logo no sorteio');
await p.click('.btn-accel'); await p.sleep(150);
const fin = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1')).lastDrawn.length`);
ok(fin >= 30 && (await p.eval(`!!document.querySelector('.modal') || !document.querySelector('.extra').hidden`)), '2º toque termina o sorteio: ' + fin + ' bolas');
console.log('errors', p.errors);
await p.close();
