# Bingo da Vovó — regras do projeto

Jogo de **vídeo bingo original** para celular (PWA), feito para uma pessoa idosa jogar
**sem gastar dinheiro**. Os créditos são de mentira e grátis: o botão "Adicionar" coloca mais
créditos na hora, quantas vezes ela quiser.

A especificação completa do jogo está em [docs/DESIGN.md](docs/DESIGN.md). O trabalho é
dividido em sessões em [docs/sessoes/](docs/sessoes/). O registro do que já foi feito está em
[docs/PROGRESSO.md](docs/PROGRESSO.md).

## Como trabalhar numa sessão

1. Leia este arquivo, `docs/DESIGN.md`, `docs/PROGRESSO.md` e o arquivo da sessão pedida.
2. Faça **somente** o que a sessão pede. Não adiante trabalho de sessões futuras.
3. Se o DESIGN.md não responder a uma dúvida, escolha a opção mais simples, siga em frente e
   anote a decisão no PROGRESSO.md. Não invente regra de jogo nova.
4. Ao terminar:
   - rode `node --test` (todos os testes têm que passar);
   - suba o servidor (`python3 -m http.server 8080`) e confira que a página abre sem erros
     no console;
   - se mudou qualquer arquivo do app, aumente a versão de `CACHE` em `sw.js` (v1 → v2…) e
     mantenha `ASSETS` completo (o `tests/assets.test.js` confere);
   - acrescente uma entrada no `docs/PROGRESSO.md` (o que foi feito, decisões, pendências);
   - **conferência automática:** confira você mesmo os critérios de aceite da sessão
     (Chrome sem janela em `/Applications/Google Chrome.app`, scripts em Node, capturas de
     tela), sem pedir que o usuário teste passo a passo. Rode o servidor numa porta própria
     (ex.: 8081), a partir da pasta do projeto, e desligue-o no fim;
   - termine a resposta com o resultado dessa conferência e só o que ficou **sem como
     verificar sozinho** (toque real, celular, som). O usuário valida tudo ao final.

## Regras técnicas

- HTML + CSS + JavaScript puro com ES modules. **Sem build, sem bundler, sem npm install,
  sem dependências.** O `package.json` existe só para `"type": "module"` e o script de teste.
- Código (variáveis, funções, arquivos) em inglês. **Todo texto que aparece na tela é em
  português do Brasil.**
- `src/engine/` é lógica pura: **nada de DOM, `window`, `localStorage` ou `document`** ali
  dentro. Tudo nele tem teste em `tests/*.test.js` com `node:test` e `node:assert/strict`.
- Sorteio usa `crypto.getRandomValues` (via `src/engine/rng.js`). Nunca `Math.random`.
  As funções do engine recebem o gerador como parâmetro, para os testes usarem um gerador
  com semente.
- O estado salvo fica em `localStorage`, na chave `bingo-vovo:v1`, e só `src/state.js` mexe
  nela.
- Sem fontes, imagens ou sons baixados da internet. Sons são gerados com WebAudio; ícones
  são gerados por script.
- Unidades em `rem`, layout pensado para celular em pé (360–430 px de largura).

## Regras de produto (não negociáveis)

- **Nada que pareça compra.** Proibido: "R$", preços, "comprar", "pagar", "depósito",
  "saque", "loja", "oferta". Desde a sessão 11, o dinheiro (de mentira, grátis) aparece na tela como
  **"USD 1.000.000,00"** (`formatMoney` em `src/format.js`); no código continua `credits`.
- O botão **Adicionar** é sempre grátis, sempre visível e sem confirmação nem limite.
- **Nenhum link externo**, nenhum anúncio, nenhum analytics, nenhuma chamada de rede depois
  que o app carregou. O jogo funciona offline.
- **Não pesquise, abra nem copie nenhum jogo existente**, incluindo sites de bingo
  comerciais: nomes, telas, artes, sons e regras vêm só do DESIGN.md.
  **Única exceção:** na sessão 09 (polimento visual e sonoro), o dono do projeto autorizou
  expressamente se inspirar fielmente no Dr. Bingo, no Mexe Mexe e no Miaudoku (visual,
  luzes, cores, animações, sons, clima). Isso vale só
  para a aparência e o som, nunca para as regras (que seguem o DESIGN.md), e tudo continua
  sendo recriado por código (CSS/WebAudio), sem baixar arquivos.
- Acessibilidade para idosos: fonte base grande, alto contraste, botões com pelo menos
  48 px de altura, textos curtos e claros, nada piscando rápido.

## Comandos

- Testes: `node --test`
- Conferência no navegador (Chrome sem janela, cliques reais, capturas): `node scripts/e2e/t03.mjs /tmp`
  (t02 a t07; cada um sobe o próprio servidor na 8081; rode `pkill -f "http.server 8081"` e
  `pkill -f "remote-debugging-port=9333"` no fim)
- Servidor local: `python3 -m http.server 8080` e abrir `http://localhost:8080`
- No celular, pela rede de casa: `http://IP-DO-MAC:8080` (o jogo roda, mas instalar e
  usar offline só funciona depois de publicado em HTTPS; veja a sessão 08).

## Publicação

- Site: https://victor-cardoso-13.github.io/dr-bingo/ (GitHub Pages, repositório público
  `victor-cardoso-13/dr-bingo`). Cada push no `main` roda `npm test` e publica só os arquivos
  do app (`.github/workflows/publicar.yml`); teste falhando = site antigo continua.
- Mudanças: ramo novo → commit → `gh pr create` → `gh pr merge --merge --delete-branch` →
  `gh run watch` (`export PATH="$HOME/.local/bin:$PATH"`). Lembre de subir o `CACHE` do `sw.js`.
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
