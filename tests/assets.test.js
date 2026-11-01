import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

function listJs(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listJs(full) : full.endsWith('.js') ? [full] : [];
  });
}

test('todo arquivo de ASSETS existe', () => {
  for (const a of assets) {
    const file = a === './' ? 'index.html' : a.replace(/^\.\//, '');
    assert.ok(existsSync(join(root, file)), `faltando: ${a}`);
  }
});

test('nenhum caminho absoluto em ASSETS nem no manifest', () => {
  for (const a of assets) assert.ok(!a.startsWith('/'), a);
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const p of [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)]) {
    assert.ok(!p.startsWith('/'), p);
  }
});

test('todo .js de src/ está em ASSETS', () => {
  for (const file of listJs(join(root, 'src'))) {
    const rel = './' + file.slice(root.length);
    assert.ok(assets.includes(rel), `não está em ASSETS: ${rel}`);
  }
});
