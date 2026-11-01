// Gera os ícones (logo A: bola vermelha com aro dourado, "B" e raios) a partir de um SVG, usando o Chrome sem janela.
// Uso: node scripts/make_icons.mjs   (substitui o antigo make_icons.py)
import { launch } from './e2e/cdp.mjs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const art = `
<g stroke="#ffffff14" stroke-width="26"><path d="M256 256 L0 0M256 256 L512 0M256 256 L0 512M256 256 L512 512M256 256 L256 0M256 256 L0 256M256 256 L512 256M256 256 L256 512"/></g>
<circle cx="256" cy="262" r="196" fill="#0006"/>
<circle cx="256" cy="250" r="190" fill="url(#ring)"/>
<circle cx="256" cy="250" r="168" fill="url(#ball)"/>
<ellipse cx="200" cy="165" rx="70" ry="38" fill="#fff" opacity=".35" transform="rotate(-28 200 165)"/>
<circle cx="256" cy="262" r="92" fill="#fffdf2" stroke="#ffc928" stroke-width="8"/>
<text x="256" y="298" text-anchor="middle" font-family="Arial Rounded MT Bold,Arial,sans-serif" font-weight="900" font-size="120" fill="#c4121f">B</text>
<g fill="#ffe27a"><path d="M96 96l8 20 20 8-20 8-8 20-8-20-20-8 20-8z"/><path d="M430 120l6 15 15 6-15 6-6 15-6-15-15-6 15-6z"/><path d="M440 400l8 20 20 8-20 8-8 20-8-20-20-8 20-8z"/></g>`;
const svg = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><defs>
<radialGradient id="bg" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2a4b8d"/><stop offset="1" stop-color="#0b1330"/></radialGradient>
<radialGradient id="ball" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".45" stop-color="#e3202d"/><stop offset="1" stop-color="#7a0612"/></radialGradient>
<linearGradient id="ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a6"/><stop offset=".5" stop-color="#ffc928"/><stop offset="1" stop-color="#b87708"/></linearGradient></defs>
<rect width="512" height="512" fill="url(#bg)"/><g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${art}</g></svg>`;

const out = join(fileURLToPath(new URL('..', import.meta.url)), 'icons');
const p = await launch({ width: 512, height: 512 });
for (const [name, size, scale] of [['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['icon-maskable-512.png', 512, 0.8], ['apple-touch-icon.png', 180, 1]]) {
  await p.send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await p.send('Page.navigate', { url: 'data:text/html,' + encodeURIComponent(`<body style="margin:0;overflow:hidden">${svg(scale)}</body>`) });
  await p.sleep(500);
  await p.screenshot(join(out, name));
  console.log(name);
}
await p.close();
