// Mini cliente CDP (sem dependências) para conferência automática.
// Uso: node scripts/e2e/t04.mjs [pasta-das-capturas]   (cada teste sobe o próprio servidor na 8081)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 360, height = 740, port = 8081, dbg = 9333 } = {}) {
  const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: ROOT, stdio: 'ignore' });
  const dir = mkdtempSync(join(tmpdir(), 'chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${dir}`,
    `--remote-debugging-port=${dbg}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {}
    await sleep(200);
  }
  const t = targets.find((x) => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const errors = []; const logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    else if (d.method === 'Runtime.consoleAPICalled') { logs.push(`${d.params.type}: ${d.params.args.map((a) => a.value ?? a.description).join(' ')}`); if (d.params.type === 'error') errors.push('console.error: ' + d.params.args.map((a) => a.value ?? a.description).join(' ')); }
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push(`log: ${d.params.entry.text} ${d.params.entry.url || ''}`);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  const setViewport = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await setViewport(width, height);
  const page = {
    errors, logs, send, setViewport,
    async goto(url) { await send('Page.navigate', { url }); await sleep(800); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async click(sel, nth = 0) {
      const ok = await this.eval(`(()=>{const e=document.querySelectorAll(${JSON.stringify(sel)})[${nth}];if(!e)return 'no-element';if(e.disabled)return 'disabled';e.click();return 'ok'})()`);
      if (ok !== 'ok') throw new Error(`click ${sel}: ${ok}`);
      await sleep(60);
    },
    async text(sel) { return this.eval(`document.querySelector(${JSON.stringify(sel)})?.textContent ?? null`); },
    async screenshot(path) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      (await import('node:fs')).writeFileSync(path, Buffer.from(r.data, 'base64'));
    },
    sleep,
    async close() { try { ws.close(); } catch {} chrome.kill(); server.kill(); },
  };
  await sleep(400);
  return page;
}
