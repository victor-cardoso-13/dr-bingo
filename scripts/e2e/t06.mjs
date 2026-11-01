import { launch } from './cdp.mjs';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const U = 'http://localhost:8081/';
await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__spy = { osc: 0, spoken: [], cancel: 0, wake: 0, rel: 0 };
  const AC = window.AudioContext;
  const co = AC.prototype.createOscillator;
  AC.prototype.createOscillator = function () { window.__spy.osc++; return co.call(this); };
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  Object.defineProperty(window, 'speechSynthesis', { value: {
    getVoices: () => [{ lang: 'pt-BR', name: 'fake' }, { lang: 'en-US' }],
    addEventListener() {}, cancel() { window.__spy.cancel++; },
    speak(u) { window.__spy.spoken.push(u.text); } } });
  Object.defineProperty(navigator, 'wakeLock', { value: { request: async () => { window.__spy.wake++; return { release() { window.__spy.rel++; }, addEventListener() {} }; } } });
` });
await p.goto(U);
await p.eval(`(()=>{const s=JSON.parse(localStorage.getItem('bingo-vovo:v1')||'{}');s.settings={speed:'normal',voice:true,sound:true,bigText:false};s.credits=5000;s.stats={rounds:7,biggestWin:300};localStorage.setItem('bingo-vovo:v1',JSON.stringify(s))})()`);
await p.goto(U);
await p.eval(`document.dispatchEvent(new Event('pointerdown'))`);
// ajustes
await p.click('.btn-settings');
ok((await p.text('.modal__title')) === 'Ajustes', 'ajustes abre');
ok(await p.eval(`!document.querySelector('.modal').textContent.includes('Voz')`), 'sem opção Voz');
ok((await p.text('.opt__stats')).includes('Rodadas jogadas: 7') && (await p.text('.opt__stats')).includes('Maior prêmio: USD 300,00'), 'estatísticas');
const fs0 = await p.eval(`getComputedStyle(document.documentElement).fontSize`);
await p.eval(`[...document.querySelectorAll('.opt')][2].querySelectorAll('button')[0].click()`);
ok((await p.eval(`getComputedStyle(document.documentElement).fontSize`)) === '21px' && fs0 === '18px', 'texto grande 18→21 px');
await p.screenshot((process.argv[2] ?? '/tmp') + '/s06settings.png');
await p.click('.opt__reset');
ok((await p.text('.opt__label:last-of-type')) !== null && await p.eval(`document.body.textContent.includes('Tem certeza?')`), 'zerar pede confirmação');
await p.eval(`[...document.querySelectorAll('.opt__row button')].find(b=>b.textContent==='Não').click()`);
ok((await p.text('.opt__stats')).includes('Rodadas jogadas: 7'), 'Não mantém');
await p.click('.opt__reset');
await p.eval(`[...document.querySelectorAll('.opt__row button')].find(b=>b.textContent==='Sim').click()`);
ok((await p.text('.opt__stats')).includes('Rodadas jogadas: 0'), 'Sim zera');
await p.click('.modal__actions button');
await p.goto(U);
ok((await p.eval(`document.documentElement.classList.contains('big-text')`)), 'texto grande salvo após reload');
// 360x740 com texto grande
console.log('scroll', await p.eval(`[document.documentElement.scrollWidth, document.documentElement.scrollHeight, innerHeight, document.getElementById('cards').scrollHeight, document.getElementById('cards').clientHeight]`));
await p.screenshot((process.argv[2] ?? '/tmp') + '/s06big.png');
await p.eval(`document.dispatchEvent(new Event('pointerdown'))`);
await p.click('.btn-play');
await p.sleep(2200);
const sp = await p.eval(`window.__spy`); sp.spoken = sp.spoken.filter(Boolean);
ok(sp.spoken.length === 0, 'voz removida: não fala números');
ok(sp.osc >= 2, 'osciladores criados: ' + sp.osc);
ok(sp.wake === 1, 'wake lock pedido');
await p.click('.btn-accel');
const before = (await p.eval(`window.__spy.spoken.length`));
await p.sleep(1500);
ok((await p.eval(`window.__spy.spoken.length`)) === before, 'rápido: não fala');
for (let i = 0; i < 60 && !(await p.eval(`!!document.querySelector('.extra:not([hidden])') || !!document.querySelector('.modal')`)); i++) await p.sleep(300);
if (await p.eval(`!!document.querySelector('.extra:not([hidden])')`)) await p.click('.extra .btn-end');
await p.sleep(300);
ok((await p.eval(`window.__spy.rel`)) >= 1, 'wake lock liberado no resultado');
await p.click('.modal__actions button');
// sons desligados
await p.eval(`(()=>{const s=JSON.parse(localStorage.getItem('bingo-vovo:v1'));s.settings.sound=false;s.settings.voice=false;localStorage.setItem('bingo-vovo:v1',JSON.stringify(s))})()`);
await p.goto(U);
await p.eval(`document.dispatchEvent(new Event('pointerdown'))`);
await p.click('.btn-play'); await p.sleep(1500);
const sp2 = await p.eval(`window.__spy`);
sp2.spoken = sp2.spoken.filter(Boolean);
ok(sp2.osc === 0 && sp2.spoken.length === 0, 'sons e voz desligados: silêncio');
console.log('errors', p.errors);
await p.close();
