// Guarda de segurança (OWASP): a política do navegador não pode sumir nem ficar frouxa,
// e nenhum arquivo do app monta tela com texto de variável via innerHTML (texto de pessoa vira código).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const raiz = new URL('..', import.meta.url).pathname;
const indice = readFileSync(join(raiz, 'index.html'), 'utf8');

test('index.html tem política de segurança sem coringas perigosos', () => {
  const m = indice.match(/Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, 'faltou a meta Content-Security-Policy');
  const politica = m[1];
  assert.ok(!politica.includes('unsafe-eval'), 'unsafe-eval não pode');
  const script = politica.split(';').map((x) => x.trim()).find((x) => x.startsWith('script-src'));
  assert.ok(script && !script.includes('unsafe-inline') && !script.includes('*'), 'script-src frouxo: ' + script);
  assert.match(politica, /object-src 'none'/);
});

test('index.html não tem script nem evento escrito dentro da página', () => {
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(indice), 'script inline');
  assert.ok(!/\son(click|load|error)=/.test(indice), 'evento inline');
});

function arquivosJs(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivosJs(p) : p.endsWith('.js') ? [p] : [];
  });
}

test('nenhum innerHTML recebe texto de variável (${...})', () => {
  for (const arq of arquivosJs(join(raiz, 'src'))) {
    const linhas = readFileSync(arq, 'utf8').split('\n');
    linhas.forEach((l, i) => {
      if (/\.(innerHTML|outerHTML)\s*(\+?=)/.test(l) || /insertAdjacentHTML/.test(l)) {
        assert.ok(!l.includes('${'), `${arq}:${i + 1} monta HTML com variável; use textContent`);
      }
    });
  }
});
