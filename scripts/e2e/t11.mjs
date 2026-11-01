// Sessão 20: modo Lotto. Uso: node scripts/e2e/t11.mjs [pasta-das-capturas]
import { launch } from './cdp.mjs';
const out = process.argv[2] ?? '/tmp';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const URL = 'http://localhost:8081/';
await p.goto(URL);
await p.eval(`localStorage.setItem('bingo-vovo:v1', JSON.stringify({credits:100000,bet:5,mode:'lotto',lotto:[[4,5,6,5,6,1],[1,1,1,8,9,9],[8,3,8,7,6,3],[1,8,1,3,5,7]]}))`);
await p.goto(URL);
const noScroll = () => p.eval(`(()=>{const a=document.querySelector('#app');const c=document.querySelector('#cards');return document.documentElement.scrollHeight<=innerHeight+1 && c.scrollHeight<=c.clientHeight+1 && a.scrollHeight<=a.clientHeight+1})()`);
const fits = () => p.eval(`(()=>{const L=document.querySelector('.lotto').getBoundingClientRect();return [...document.querySelectorAll('.lcard:not([hidden]),.lballs,.ljack,.lside:not([style*=none])')].every(e=>{const r=e.getBoundingClientRect();return r.height===0||(r.bottom<=innerHeight+1&&r.right<=innerWidth+1&&r.left>=-1)}) })()`);
ok(await p.eval(`document.documentElement.dataset.mode === 'lotto' && getComputedStyle(document.querySelector('#cards-bingo')).display === 'none'`), 'abre no Lotto, Bingo escondido');
ok(await p.eval(`document.querySelectorAll('.lcard:not([hidden])').length === 4 && document.querySelectorAll('.lcard:not([hidden]) .lcol:not([hidden])').length === 24`), '4 cartelas × 6 dígitos visíveis');
ok(await p.eval(`getComputedStyle(document.querySelector('#ballboard')).display === 'none'`), 'painel de bolas do Bingo escondido');
ok(await p.eval(`[...document.querySelectorAll('.mode-btn')].map(b=>b.textContent).join()`) === 'Bingo,Faraó,Lotto', 'botões de modo');
ok((await p.text('.bet__total')) === 'Total: USD 20,00', 'total 4 × 5 → ' + await p.text('.bet__total'));
ok(await noScroll(), 'sem rolagem');
ok(await fits(), 'tudo dentro da tela');
await p.screenshot(out + '/lotto-idle.png');
// setas, IGUAIS, SORTEAR
await p.click('.lcol__arrow', 0);
ok((await p.text('.lcol__digit')) === '5', '▲ no 4 → 5');
await p.click('.lcol__arrow', 1);
ok((await p.text('.lcol__digit')) === '4', '▼ volta');
await p.click('.lcol__arrow', 1);
await p.click('.lcol__arrow', 1);
await p.click('.lcol__arrow', 1);
await p.click('.lcol__arrow', 1);
await p.click('.lcol__arrow', 1);
ok((await p.text('.lcol__digit')) === '9', '4 − 5 dá a volta → 9');
await p.click('.lcol__digit', 0);
ok((await p.text('.lcol__digit')) === '0', 'tocar no dígito: 9 → 0');
await p.click('.lact__btn', 0);
ok(await p.eval(`[...document.querySelectorAll('.lcard')[0].querySelectorAll('.lcol__digit')].every(d=>d.textContent==='0')`), 'IGUAIS: todos iguais ao primeiro');
await p.click('.lact__btn', 1);
const st1 = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1')).lotto`);
ok(st1[0].length === 9 && st1[1].slice(0, 6).join() === '1,1,1,8,9,9', 'SORTEAR só mexe na linha dela');
await p.eval(`localStorage.setItem('x','1')`);
// rodada
await p.click('.btn-play'); await p.sleep(200);
ok((await p.text('.topbar__value')).endsWith('99.980,00'), 'JOGAR desconta 20 → ' + await p.text('.topbar__value'));
ok(await p.eval(`document.querySelector('.lcol__arrow').disabled && document.querySelector('.lact__btn').disabled`), 'setas e botões travam na rodada');
await p.sleep(1700);
const mid = await p.eval(`document.querySelectorAll('.lball--in').length`);
ok(mid >= 1 && mid < 6, 'bolas chegam uma a uma: ' + mid);
await p.click('.btn-accel'); await p.sleep(300);
ok(await p.eval(`document.querySelectorAll('.lball--in').length === 6`), '6 bolas na tela');
await p.screenshot(out + '/lotto-bolas.png');
const st = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(st.lastDrawn.length === 6 && st.pendingRound === null && st.stats.rounds === 1, 'rodada acertada, 6 bolas');
const dec = st.lastDrawn.map((n) => ({ pos: Math.floor(n / 100), tier: Math.floor((n % 100) / 10), d: n % 10 }));
ok(dec.every((b, k) => b.pos === k && b.d <= 9 && b.tier <= 2) && dec.filter((b) => b.tier === 1).length <= 1 && dec.filter((b) => b.tier === 2).length <= 1, 'bolas válidas (posição, dígito, ≤1 prateada e ≤1 dourada)');
// conta: recalcula o prêmio
const SEQ = { 2: 2, 3: 3, 4: 5, 5: 25, 6: 250 }, ANY = { 2: 1, 3: 2, 4: 3, 5: 8 };
let esperado = 0;
st.lotto.slice(0, 4).forEach((card9) => {
  const card = card9.slice(0, 6);
  const h = card.map((d, k) => d === dec[k].d); let q = 0; while (q < 6 && h[q]) q++;
  const t = h.filter(Boolean).length; let base = Math.max(SEQ[q] ?? 0, ANY[t] ?? 0);
  const mult = Math.max(1, ...h.map((x, k) => (x ? dec[k].tier + 1 : 1)));
  esperado += base * mult * 5;
});
const acc = esperado; // (se 6 seguidos, o Acumulado também entra; é raríssimo)
if (st.credits >= 99980 + esperado && st.credits <= 99980 + esperado + 5 * 1100) ok(true, `conta confere: saldo ${st.credits} (prêmio ${esperado})`);
else ok(false, `conta: saldo ${st.credits} ≠ 99980 + ${esperado}`);
const hitsOnScreen = await p.eval(`document.querySelectorAll('.lcol__digit.hit').length`);
ok(hitsOnScreen === st.lotto.slice(0, 4).flatMap((c) => c.slice(0, 6)).filter((d, i) => d === dec[i % 6].d).length, 'dígitos amarelos = acertos (' + hitsOnScreen + ')');
await p.screenshot(out + '/lotto-fim.png');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
await p.sleep(1000);
await p.eval(`document.querySelector('.modal-overlay')?.remove()`);
ok(await p.eval(`!document.querySelector('.btn-play').disabled`), 'volta ao JOGAR/PRÓXIMA');
// editar um dígito apaga as bolas
await p.click('.lcol__digit', 0);
ok(await p.eval(`document.querySelectorAll('.lball--in').length === 0 && JSON.parse(localStorage.getItem('bingo-vovo:v1')).lastDrawn.length === 0`), 'editar dígito limpa as bolas');
// prêmios e contagem
await p.click('.controls__row .btn-secondary', 0);
ok((await p.text('.modal__title')) === 'Prêmios do Lotto' && (await p.eval(`document.querySelectorAll('.prize-list li').length`)) === 13, 'janela de prêmios (9 prêmios + 4 preços)');
await p.click('.modal__actions button');
await p.click('.stepper:nth-child(2) .btn-step', 0);
ok((await p.text('.bet__total')) === 'Total: USD 15,00' && await p.eval(`document.querySelectorAll('.lcard:not([hidden])').length === 3`), '3 cartelas: total 15');
// troca de modo mantém o saldo
const saldo = await p.text('.topbar__value');
await p.click('.mode-btn', 0);
ok((await p.text('.topbar__value')) === saldo && await p.eval(`document.documentElement.dataset.mode==='bingo' && getComputedStyle(document.querySelector('#cards-lotto')).display==='none'`), 'Bingo: saldo igual e Lotto escondido');
ok(await p.eval(`getComputedStyle(document.querySelector('#ballboard')).display !== 'none'`), 'painel de bolas do Bingo volta');
// ---------- avisos: prêmio pequeno some sozinho; 6 seguidos = festa "LOTTO!!!" com o Acumulado ----------
const play = async (lotto) => {
  await p.goto(URL);
  await p.eval(`localStorage.setItem('bingo-vovo:v1', ${JSON.stringify(JSON.stringify({ credits: 100000, bet: 10, mode: 'lotto', lottoCount: 1, lotto }))})`);
  await p.goto(URL);
  await p.eval(`crypto.getRandomValues = (a) => { a.fill(0); return a; }`); // sorteio "zerado": a bola k copia a casa k da 1ª cartela; prateada na casa 1, dourada na 2
  await p.click('.btn-play'); await p.sleep(150);
  await p.click('.btn-accel'); await p.sleep(300);
  return p.eval(`document.querySelector('.modal')?.className ?? null`);
};
const filler = [[9, 9, 9, 9, 9, 9], [9, 9, 9, 9, 9, 9], [9, 9, 9, 9, 9, 9], [9, 9, 9, 9, 9, 9]];
const D = (a) => [a, ...filler.slice(1)];
let m = await play(D([1, 2, 3, 4, 5, 6]));
ok(m && m.includes('modal--jackpot'), '6 seguidos: festa LOTTO!!! (' + m + ')');
ok((await p.text('.modal__title')) === 'LOTTO!!!' && (await p.text('.win__jackpot')) === 'SEQUÊNCIA DE 6!', 'título da festa');
const st6 = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
// ×250 com a dourada (×3) e o Acumulado de 100 × aposta 10; depois o Acumulado volta a 100
ok(st6.credits === 100000 - 10 + 250 * 3 * 10 + 100 * 10 && st6.lottoAcc === 100, 'pagou ×250 ×3 + Acumulado e o Acumulado voltou a 100 (saldo ' + st6.credits + ', acc ' + st6.lottoAcc + ')');
await p.screenshot(out + '/lotto-festa.png');
await p.eval(`document.querySelector('.modal-overlay')?.remove()`);
// ---------- dezenas (6 a 9) ----------
await p.goto(URL);
await p.eval(`localStorage.setItem('bingo-vovo:v1', JSON.stringify({credits:100000,bet:5,mode:'lotto',lotto:[[4,5,6,5,6,1],[1,1,1,8,9,9],[8,3,8,7,6,3],[1,8,1,3,5,7]]}))`);
await p.goto(URL);
const visibleCols = () => p.eval(`document.querySelectorAll('.lcard:not([hidden]):first-child .lcol:not([hidden]), .lcard--1 .lcol:not([hidden])').length`);
ok((await visibleCols()) === 6 && await p.eval(`!document.querySelector('.bet__size').closest('.stepper').hidden`), 'abre com 6 dezenas e seletor Dezenas');
await p.click('.stepper:nth-child(3) .btn-step', 1);
ok((await p.text('.bet__size')) === '7' && (await visibleCols()) === 7 && (await p.text('.bet__total')) === 'Total: USD 60,00', '7 dezenas: 7 casas, total 5 × 4 × 3 = 60 → ' + await p.text('.bet__total'));
await p.click('.stepper:nth-child(3) .btn-step', 1); await p.click('.stepper:nth-child(3) .btn-step', 1);
ok((await p.text('.bet__size')) === '9' && (await visibleCols()) === 9 && (await p.text('.bet__total')) === 'Total: USD 220,00', '9 dezenas: 9 casas, total 5 × 4 × 11 = 220 → ' + await p.text('.bet__total'));
ok(await p.eval(`document.querySelector('.stepper:nth-child(3) .btn-step:last-child').disabled`), 'não passa de 9');
ok(await noScroll() && await fits(), '9 dezenas: sem rolagem e tudo na tela');
await p.screenshot(out + '/lotto-9-dezenas.png');
await p.click('.btn-play'); await p.sleep(200);
ok((await p.text('.topbar__value')).endsWith('99.780,00'), 'JOGAR desconta 220 → ' + await p.text('.topbar__value'));
await p.click('.btn-accel'); await p.sleep(300);
const st9 = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(st9.lastDrawn.length === 6 && st9.lottoSize === 9, '6 bolas com 9 dezenas');
const dec9 = st9.lastDrawn.map((n) => ({ pos: Math.floor(n / 100), d: n % 10 }));
const hitsOn = await p.eval(`document.querySelectorAll('.lcard:not([hidden]) .lcol__digit.hit').length`);
const expectedCells = st9.lotto.slice(0, 4).reduce((a, card) => a + new Set(dec9.map((b) => { for (let i = b.pos; i <= b.pos + 3; i++) if (card[i] === b.d) return i; return -1; }).filter((x) => x >= 0)).size, 0);
ok(hitsOn === expectedCells, 'casas amarelas = acertos da janela (' + hitsOn + ')');
await p.sleep(4300); // o aviso fecha sozinho e a rodada volta a ficar parada
await p.click('.lcol__digit', 0);
await p.click('.stepper:nth-child(3) .btn-step', 0);
ok((await p.text('.bet__size')) === '8', 'volta para 8');
await p.goto(URL);
ok((await p.text('.bet__size')) === '8' && (await visibleCols()) === 8, 'lembra as dezenas após recarregar');
const errs = p.errors.filter((e) => !e.includes('navigator.vibrate')); // o Chrome sem janela bloqueia a vibração
ok(errs.length === 0, 'sem erros no console ' + JSON.stringify(errs));
await p.close();
