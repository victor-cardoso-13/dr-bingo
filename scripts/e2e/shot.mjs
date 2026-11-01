// Captura rápida: node scripts/e2e/shot.mjs <saida.png> [largura] [altura] [jogar]
import { launch } from './cdp.mjs';
const [out, w = '390', h = '844', play] = process.argv.slice(2);
const p = await launch({ width: +w, height: +h });
await p.goto('http://localhost:8081/');
await p.sleep(600);
if (play) { await p.click('.btn-play'); await p.sleep(+play); }
await p.screenshot(out);
console.log('errors', p.errors);
await p.close();
