import { launch } from './cdp.mjs';
const p = await launch();
const ok = (c, m) => console.log(c ? 'OK  ' : 'FAIL', m);
const U = 'http://localhost:8081/';
await p.goto(U + '?sw=1'); await p.sleep(2000);
const sw = await p.eval(`navigator.serviceWorker.getRegistration().then(r=>r&&r.active&&r.active.state)`);
ok(sw === 'activated', 'service worker: ' + sw);
const cached = await p.eval(`caches.keys().then(async k=>k.length? (await (await caches.open(k[0])).keys()).length : 0)`);
ok(cached >= 25, 'arquivos em cache: ' + cached);
const man = await p.send('Page.getAppManifest');
ok(!man.errors.length && man.data.includes('Bingo da Vovó'), 'manifest sem erros ' + JSON.stringify(man.errors));
const inst = await p.send('Page.getInstallabilityErrors');
ok(inst.installabilityErrors.length === 0, 'instalável: ' + JSON.stringify(inst.installabilityErrors));
const icons = await p.eval(`Promise.all(['icon-192','icon-512','icon-maskable-512','apple-touch-icon'].map(n=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth);i.onerror=()=>r(0);i.src='icons/'+n+'.png'})))`);
ok(JSON.stringify(icons) === '[192,512,512,180]', 'ícones carregam ' + icons);
// offline
await p.send('Network.enable');
await p.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await p.goto(U + '?sw=1'); await p.sleep(800);
ok((await p.text('.topbar__value')) !== null && (await p.eval(`document.querySelectorAll('.card:not([hidden])').length`)) === 4, 'offline: o jogo abre');
await p.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
// sem ?sw=1 desregistra
await p.goto(U); await p.sleep(1500);
const regs = await p.eval(`navigator.serviceWorker.getRegistrations().then(r=>r.length)`);
const names = await p.eval(`caches.keys().then(k=>k.length)`);
ok(regs === 0 && names === 0, `localhost sem ?sw=1 desregistra (regs ${regs}, caches ${names})`);
console.log('errors', p.errors);
await p.close();
