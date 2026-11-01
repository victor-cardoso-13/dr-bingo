# Sessão 01: base do projeto, créditos e botão Adicionar

## Objetivo

Criar o esqueleto do app. Uma página que abre no celular e mostra a barra de cima com os
créditos e o botão **+ Adicionar**, que funciona e fica salvo. As outras áreas da tela
aparecem só como espaços reservados.

## Criar

- `package.json`: só `{ "name": "bingo-da-vovo", "private": true, "type": "module", "scripts": { "test": "node --test" } }`.
- `index.html`:
  - `lang="pt-BR"`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`;
  - `<meta name="theme-color" content="#14213d">`, título "Bingo da Vovó";
  - carrega `css/style.css` e `<script type="module" src="src/main.js">`;
  - estrutura semântica com 4 regiões vazias, com id: `#topbar`, `#ballboard`, `#cards`,
    `#controls`;
  - um `#modal-root` para as janelas futuras.
- `css/style.css`:
  - variáveis CSS com as cores da seção 7 do DESIGN;
  - `html { font-size: 112.5% }` (18 px) e a classe `html.big-text { font-size: 131.25% }`;
  - layout em coluna com altura `100dvh`, sem rolagem;
  - `padding` com `env(safe-area-inset-*)`;
  - estilo base de botões: `min-height: 3rem`, cantos arredondados, `:active` com leve
    afundamento e `:disabled` com opacidade 0,5;
  - nada de `hover` como única indicação.
- `src/engine/rng.js`: `cryptoRandomInt(max)` e `makeSeededRandomInt(seed)`, conforme o
  DESIGN.
  - Rejeição para não ter viés: gere um `Uint32` e descarte valores
    `>= Math.floor(2**32 / max) * max`.
  - Use `globalThis.crypto`, que existe no Node 26 e no navegador.
- `src/format.js`: `formatCredits(n)` → `n.toLocaleString('pt-BR')` (inteiros).
- `src/state.js`:
  - `STORAGE_KEY = 'bingo-vovo:v1'`, `defaultState()` (seção 9 do DESIGN, com
    `cards: null` por enquanto);
  - `loadState()`, que junta com os padrões e trata JSON corrompido;
  - `getState()`;
  - `update(mutator)`, que aplica, salva e avisa os inscritos;
  - `subscribe(fn)`, que retorna uma função para cancelar;
  - `addCredits(amount = 1000)`.
- `src/ui/topbar.js`:
  - `renderTopbar(root)` monta "Créditos" + valor, **+ Adicionar** e o botão ⚙ (por
    enquanto só com `aria-label="Ajustes"`, sem ação);
  - o valor se atualiza pelo `subscribe`;
  - ao adicionar, mostra uma animação "+1.000" subindo e sumindo (CSS, 1 s).
- `src/main.js`: carrega o estado, desenha a topbar e coloca textos de espaço reservado
  ("Bolas", "Cartelas", "Controles") nas outras regiões.
- `tests/rng.test.js`:
  - `cryptoRandomInt` fica em [0, max) em 10 mil chamadas, com max 1, 7 e 60;
  - com 60 mil chamadas de `cryptoRandomInt(6)`, cada valor sai entre 9.000 e 11.000 vezes;
  - `makeSeededRandomInt(42)` repete a mesma sequência quando é criado de novo.
- `tests/format.test.js`: `1000 → "1.000"`, `12345 → "12.345"`, `0 → "0"`.

## Não fazer nesta sessão

Cartelas, sorteio, prêmios, sons, service worker, manifest e ícones. Nenhuma dependência npm.

## Critérios de aceite

- `node --test` passa.
- A página abre em `http://localhost:8080` sem erros no console.
- O toque em **+ Adicionar** soma 1.000. Depois de recarregar a página, o valor continua.
- Apagar a chave no DevTools → Application → Local Storage volta para 1.000.
- Numa tela de 360×740 (modo celular do DevTools) não aparece barra de rolagem.

## Verificação

```bash
node --test
python3 -m http.server 8080
```

## Conferência manual (para o usuário)

1. Abra `http://localhost:8080` no computador. Aparece "Créditos 1.000"?
2. Toque em **+ Adicionar** 3 vezes. Ficou 4.000, com a animação "+1.000"?
3. Recarregue a página. Continua 4.000?
4. No celular, na mesma rede Wi-Fi, abra `http://IP-DO-MAC:8080`. Para achar o IP: Ajustes
   do Sistema → Wi-Fi → Detalhes. Os botões estão grandes e fáceis de tocar?
