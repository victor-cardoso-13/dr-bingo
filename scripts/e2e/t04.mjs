import { launch } from './cdp.mjs';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const U = 'http://localhost:8081/';
await p.goto(U);
// 1) recuperação com prêmio conhecido (Linha, aposta 2 → 10)
await p.eval(`(()=>{
  const card=[1,13,25,37,49,2,14,26,38,50,3,15,27,39,51];
  const row=card.slice(0,5);
  const fill=Array.from({length:60},(_,i)=>i+1).filter(n=>!card.includes(n));
  const seq=[...row,...fill];
  const s=JSON.parse(localStorage.getItem('bingo-vovo:v1'));
  s.cards=[card,card,card,card]; s.active=[true,false,false,false]; s.bet=2; s.credits=500;
  s.pendingRound={sequence:seq,cards:s.cards,active:s.active,bet:2,drawnCount:5};
  localStorage.setItem('bingo-vovo:v1',JSON.stringify(s));})()`);
await p.goto(U);
ok((await p.text('.modal__body')).includes('Sua rodada anterior foi concluída: você ganhou USD 10,00.'), 'recuperação: ' + await p.text('.modal__body'));
ok((await p.text('.topbar__value')) === 'USD 510,00', 'créditos 510');
ok(await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1')).pendingRound===null`), 'pendingRound limpo');
ok((await p.eval(`document.querySelectorAll('.btn-play')[0].disabled`)), 'JOGAR desabilitado com aviso aberto');
await p.screenshot((process.argv[2] ?? '/tmp') + '/s04win.png');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
ok(await p.eval(`!document.querySelector('.modal')`) && await p.eval(`!document.querySelector('.btn-play').disabled`), 'fecha e volta a idle');
ok((await p.text('.card__foot')) === 'Linha · USD 10,00', 'rodapé: ' + await p.text('.card__foot'));
ok(await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1')).stats.biggestWin`) === 10, 'biggestWin 10');
await p.click('.btn-secondary', 0);
ok((await p.text('.prize-list li:nth-child(7)')) === 'Linha: USD 10,00', 'tabela de prêmios: ' + await p.text('.prize-list li:nth-child(7)'));
ok((await p.eval(`document.querySelectorAll('.prize-list li').length`)) === 8, '8 desenhos');
await p.screenshot((process.argv[2] ?? '/tmp') + '/s04prizes.png');
if (await p.eval(`!!document.querySelector('.modal__actions button')`)) await p.click('.modal__actions button');
// 2) rodada completa
await p.eval(`(()=>{const s=JSON.parse(localStorage.getItem('bingo-vovo:v1'));s.settings.speed='rapido';s.credits=1000;s.active=[true,true,true,true];s.bet=1;localStorage.setItem('bingo-vovo:v1',JSON.stringify(s))})()`);
await p.goto(U);
await p.click('.btn-play');
for (let i = 0; i < 60 && !(await p.eval(`!!document.querySelector('.modal') || JSON.parse(localStorage.getItem('bingo-vovo:v1')).pendingRound === null`)); i++) {
  if (await p.eval(`!document.querySelector('.extra').hidden`)) await p.click('.extra .btn-end');
  await p.sleep(400);
}
const msg = await p.text('.win__text');
const st = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
console.log('aviso:', msg); // sem prêmio não há janela (sessão 19b)
ok(msg !== null || !(await p.eval(`!!document.querySelector('.modal')`)), 'sem janela quando perde');
ok(st.pendingRound === null && st.lastDrawn.length >= 30, 'pendingRound null');
const hotWhile = await p.eval(`document.querySelectorAll('.cell.hot').length`);
console.log('créditos', st.credits, 'hot no aviso', hotWhile);
await p.screenshot((process.argv[2] ?? '/tmp') + '/s04round.png');
await p.sleep(4300);
ok(await p.eval(`!document.querySelector('.modal')`), 'aviso fecha sozinho em 4 s');
ok(await p.eval(`document.querySelector('.btn-play').textContent === 'PRÓXIMA RODADA'`), 'botão vira PRÓXIMA RODADA');
// 3) fechar no meio do sorteio
await p.eval(`(()=>{const s=JSON.parse(localStorage.getItem('bingo-vovo:v1'));s.settings.speed='normal';s.credits=1000;localStorage.setItem('bingo-vovo:v1',JSON.stringify(s))})()`);
await p.goto(U);
await p.click('.btn-play');
await p.sleep(2500);
const mid = await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1'))`);
ok(mid.pendingRound && mid.credits === 996, 'pendingRound salvo e aposta descontada (' + mid.credits + ')');
const expected = await p.eval(`(async()=>{const m=await import('/src/engine/payout.js');const pr=JSON.parse(localStorage.getItem('bingo-vovo:v1')).pendingRound;return m.settleRound({cards:pr.cards,active:pr.active,bet:pr.bet,drawnSet:new Set(pr.sequence.slice(0,30))}).total})()`);
await p.goto(U);
ok((await p.text('.modal__body')).startsWith('Sua rodada anterior foi concluída'), 'aviso de rodada anterior');
ok((await p.eval(`JSON.parse(localStorage.getItem('bingo-vovo:v1')).credits`)) === 996 + expected, 'pago uma vez só: ' + (996 + expected));
console.log('errors', p.errors);
await p.close();
