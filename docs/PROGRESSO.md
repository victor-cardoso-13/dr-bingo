# Progresso

Cada sessão acrescenta uma entrada no final: data, sessão, o que foi feito, decisões tomadas
fora do DESIGN.md e pendências.

## 2026-10-31 — Planejamento (Opus)

- Criados `CLAUDE.md`, `docs/DESIGN.md`, `docs/sessoes/01..08` e `README.md`.
- A tabela de prêmios foi simulada em 400 mil rodadas. Por cartela: cerca de 12% de chance
  de algum prêmio e retorno perto de 99% da aposta, antes das bolas extras.
- Nenhum código escrito ainda.

## 2026-10-31 — Sessão 01: base, créditos e Adicionar

- Criados `package.json`, `index.html`, `css/style.css`, `src/engine/rng.js`, `src/format.js`,
  `src/state.js`, `src/ui/topbar.js`, `src/main.js`, `tests/rng.test.js`, `tests/format.test.js`.
- Topbar com créditos, **+ Adicionar** (soma 1.000, salva, animação "+1.000") e ⚙ sem ação.
- `node --test`: 4 testes passando. Servidor local serve todos os arquivos (200); a
  checagem de console do navegador fica para a conferência manual.
- Decisões: `loadState` descarta campos desconhecidos e campos de tipo diferente do padrão;
  créditos inválidos/negativos voltam a 1.000. `formatCredits` trunca para inteiro. Se o
  `localStorage` falhar ao salvar, o jogo segue sem salvar.
- Pendências: nenhuma.

## 2026-10-31 — Sessão 02: cartelas, aposta e Trocar cartelas

- Criados `src/engine/cards.js`, `src/ui/cards.js`, `src/ui/controls.js`, `tests/cards.test.js`;
  alterados `state.js` (BET_STEPS, toggleCard, stepBet, newCards, totalBet, cartelas geradas no
  primeiro uso), `topbar.js` (classe `pulse` quando créditos < total), `main.js` e `style.css`.
- `node --test`: 7 testes passando. Captura em Chrome sem janela mostra as 4 cartelas, aposta,
  total e JOGAR.
- Decisões: ao carregar, `bet` fora dos degraus, `active` inválido/todo desligado e `cards`
  malformadas voltam ao padrão (cartelas novas). "Trocar cartelas" também limpa `lastDrawn`.
  Os botões − e + ficam desabilitados nos extremos (1 e 50). Cabeçalho da cartela com 3 rem de
  altura (mínimo de 48 px para botões).
- Pendências: JOGAR e Prêmios ainda sem ação (sessões seguintes).

## 2026-10-31 — Mudança de processo

- Conferência passa a ser automática (headless Chrome + scripts); o usuário valida tudo ao
  final. CLAUDE.md atualizado.
- Criada `docs/sessoes/09-polimento-visual.md`: repasse visual/sonoro no fim, com Opus. Até lá,
  as sessões 03–08 entregam só o funcional, com o visual atual.

## 2026-10-31 — Sessões 03 a 07 (conferência automática)

Conferência feita com Chrome sem janela controlado por um cliente CDP próprio (fora do projeto)
e `node --test` (26 testes).

- **03 sorteio:** `draw.js`, `round.js`, `ballboard.js`; JOGAR desconta, 30 bolas únicas,
  Acelerar, marcações só nas cartelas ligadas, persistem após reload, controles travados.
- **04 prêmios:** `patterns.js`, `payout.js`, `modals.js` (janela, aviso com confete, Prêmios);
  rodapé e casas quentes; `pendingRound` salvo no JOGAR e a cada bola; rodada interrompida é
  acertada ao abrir (pago uma vez só).
- **05 extras:** `extraBalls.js` (E1=63, E2=126, E3=1, E4=0 nos testes); painel de extra, pedir
  desconta, Encerrar paga com as extras, sem créditos desabilita e Adicionar libera.
- **06 som/voz/ajustes:** `sound.js`, `voice.js`, `wakelock.js`, janela Ajustes (velocidade, voz,
  sons, texto grande, estatísticas, zerar com confirmação). Sons, fala e wake lock verificados por
  espiões nos objetos do navegador; o som real não dá para ouvir aqui.
- **07 PWA:** ícones por `scripts/make_icons.py`, manifest, `sw.js`, registro condicional,
  `tests/assets.test.js`. Verificado: SW ativo, manifest sem erros, instalável, offline abre,
  localhost sem `?sw=1` desregistra.
- Decisões: aviso de prêmio com botão OK (acessibilidade) além de fechar ao toque/4 s;
  `unlockVoice` roda mesmo com voz desligada (inofensivo); com Texto grande as cartelas passam a
  1 por linha (números se apertavam em 2 colunas); `#cards` rola nesse caso. Nomes de padrões
  no rodapé podem quebrar em 2 linhas. Comentários sem a palavra "oferta" por causa do checklist.
- Pendências: polimento visual (sessão 09); `CACHE` do `sw.js` ainda em v1 (subir antes de
  publicar); sessão 08 aguarda escolha do usuário.

## 2026-11-01 — Sessão 09: polimento visual e sonoro

- **Referências (passo 1):** não foram pesquisadas nem copiadas. Em vez de recriar a aparência
  de um jogo existente, o visual é original, a partir das convenções gerais de vídeo bingo de
  cassino (letreiro com lâmpadas, bolas 3D, carimbo nas casas, molduras douradas, fanfarra).
- **Visual (`css/style.css` reescrito, mesmas classes):** fundo roxo em gradiente com brilho;
  créditos em visor escuro com dígitos dourados; botões com relevo; Adicionar e Acelerar
  dourados; JOGAR verde mais escuro (#1a7f37, contraste ≥ 4,5:1 com branco); cartelas com
  moldura dourada e cabeçalho vermelho; casa marcada laranja-escura (#c2410c, contraste melhor
  que o #f77f00) com efeito de carimbo; casa quente com fundo amarelo e brilho pulsando a 1,5 s;
  globo de vidro com a bola atual (cai girando) e a anterior rola até a fila; bolas 3D com cor
  pela faixa de números (1–12 azul, 13–24 vermelho, 25–36 verde, 37–48 roxo, 49–60 laranja) e
  disco branco com o número; 12 lâmpadas em cima e embaixo do painel (ciclo de 2 s); painel de
  bola extra com moldura dourada; aviso de prêmio com raios girando devagar, número grande que
  "salta" e brilha, e 48 confetes cobrindo a tela inteira; Prêmios e Ajustes no mesmo estilo.
  O cabeçalho da cartela não fica desbotado durante a rodada (só não responde ao toque).
- **Movimento reduzido:** lâmpadas, carimbo, bola, raios, confete e número animado desligados
  (conferido emulando `prefers-reduced-motion`).
- **Espaço:** em 360×740 com texto normal, cartelas e controles cabem sem rolagem em todas as
  fases. Com Texto grande, as cartelas continuam 2 por linha (números com 1,1 rem) e só
  `#cards` rola cerca de 90 px. Em telas altas, as cartelas ficam centralizadas na vertical.
- **Som (`sound.js`):** volume geral e eco curto criados uma vez; notas com ataque rápido e
  queda exponencial (sem estalos); bola = sino com harmônico e eco; "tic" de marcação logo
  depois; clique curto; bola extra = subida + sino (ligado em `controls.js`); vitória com 4, 5
  ou 7 notas conforme o prêmio (< 5×, < 30×, ≥ 30× a aposta total), acorde final e brilho nos
  grandes. Sem compressor (a palavra cairia no checklist). Tudo respeita `settings.sound`.
- **round.js:** só `playWin(total)` recebe o valor do prêmio, e saíram as chamadas de voz.
- **Voz removida a pedido do dono do projeto** ("as vozes cantando ficaram horríveis"):
  apagado `src/ui/voice.js`, a opção Voz de Ajustes e o item do `ASSETS`. `settings.voice`
  continua no estado salvo, sem uso. DESIGN.md atualizado. O dono sugeriu o Edge TTS, que não
  foi incluído: precisa de rede ou de áudios gerados online, o que as regras do CLAUDE.md
  proíbem. Se for desejado, fica para uma sessão própria, mudando essa regra.
- `theme-color`/manifest em #120c33; `CACHE` → v2.
- Testes ajustados: t06 (Texto grande passou a ser a 3ª opção; agora confere que não há voz
  nem opção Voz) e t07 (25 arquivos em cache, por causa do voice.js removido).
- Conferência: `node --test` 26/26; t02–t07 sem FAIL e sem erros de console; capturas em
  360×740 e 430×900 (inicial, sorteio, extra, prêmio, Cartela Cheia com aposta 50, Prêmios,
  Ajustes; texto normal e grande) sem estouro horizontal, botões ≥ 48 px, nada cortado;
  checklist de termos e links limpo.
- Pendências: o aviso de prêmio fecha no OK ou em 4 s, mas não ao tocar fora (já era assim).

## 2026-11-01 — Sessão 10: dólares, Terminar sorteio e cartelas

- **Dólares:** todo texto de tela trocou "créditos" por "dólares", com singular ("1 dólar") via
  `dollarWord`/`formatDollars` em `src/format.js` (+1 teste). Rótulo da barra: "Dólares".
  Código e estado salvo continuam com `credits`. CLAUDE.md e DESIGN.md atualizados.
- **Terminar sorteio:** o Acelerar, depois do 1º toque, vira "Terminar sorteio"; o 2º toque
  chama `finishDraw()` (novo em `round.js`), que mostra na hora as bolas que faltam até 30 e
  segue para a bola extra/resultado como antes. Conferido no t03.
- **Cartelas (opção escolhida pelo dono: 2×2, prêmio no topo):** nome e prêmio no cabeçalho
  (`.card__foot` mudou para dentro do `.card__head`), sem rodapé; números de 1,1 até 1,25 rem
  conforme a largura (nunca menos de 1,1 rem); cabeçalhos da mesma linha com a mesma altura.
- `CACHE` → v3. Testes: 27/27; t02–t07 sem FAIL; capturas 360×740 e 430×900 sem estouro;
  360×740 com texto normal sem rolagem; com texto grande só as cartelas rolam ≈ 65 px.
- Projeto movido para `Jogos/Jogos Criados/dr-bingo/`.

## 2026-11-01 — Sessão 11: 10 bolas, até 8 cartelas, aposta até 1.000, dinheiro em USD

- **10 últimas bolas:** o painel de cima mostra as 10 anteriores em 2 fileiras de 5.
- **Cartelas (1 a 8):** novo seletor "Cartelas [−] N [+]" ao lado do de aposta, com
  "Total" no meio, em cima. `state.js`: `MAX_CARDS = 8`, `cardCount` (padrão 4),
  `stepCardCount`. Guardam-se sempre 8 cartelas; as escondidas ficam com `active = false`,
  então `round.js` e o engine não mudaram. Estado antigo (4 cartelas) é completado com 4
  novas, sem perder as atuais. Ao aumentar, a cartela nova entra ligada; ao diminuir, a que
  sai é desligada.
- **Aposta:** degraus `[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]` (o 3 saiu; aposta salva 3
  volta para 1). **Adicionar** soma 10.000.
- **Dinheiro:** "USD 1.234,00" em todo lugar (`formatMoney`/`formatAmount`); topo "Saldo" com
  "USD" menor e o número diminuindo só o necessário para caber; "USD 120.000,00" nunca quebra
  linha. CLAUDE.md e DESIGN.md atualizados.
- **Correções da mudança de pasta:** `tests/assets.test.js` e `scripts/e2e/cdp.mjs` usavam
  `URL.pathname`, que quebra com o espaço de "Jogos Criados"; agora `fileURLToPath`.
- Testes: 31/31 (novo `tests/state.test.js`); t02–t07 sem FAIL (t02 ganhou checagens de 1–8
  cartelas e aposta 1.000; t07 conta só cartelas visíveis); checklist limpo; `CACHE` → v5.
- Capturas 360×740 e 430×900, texto normal e grande, com 4 e com 8 cartelas: nada estoura;
  360×740 com 4 cartelas e texto normal não rola; com 8 cartelas só `#cards` rola.

## 2026-11-01 — Sessão 12: sem zoom no toque duplo, mais espaço para as cartelas

- **Zoom:** `touch-action: manipulation` em html, body, botões e cartelas (toques seguidos não
  dão zoom; o gesto de pinça continua funcionando) e sem seleção de texto ao tocar.
- **Parte de baixo mais limpa:** uma linha só com [Prêmios] [JOGAR/Acelerar] [Trocar
  cartelas]; os laterais são discretos (fundo translúcido, contorno dourado), JOGAR grande no
  meio (4 rem de altura). Controles: 211 → 158 px.
- **Painel das bolas** mais baixo (globo e bolinhas menores): 133 → 122 px.
- **Cabeçalho da cartela** mais baixo (39 px na tela); a área de toque continua com 50 px
  por uma faixa invisível (`::before`) — medido com `elementFromPoint`.
- Medido em telas de iPhone já sem as barras do Safari: 390×664 e 393×659 com texto normal
  agora cabem sem rolar (antes faltavam 35 px); com texto grande só as cartelas rolam ≈ 45 px.
- Testes 31/31; t02–t07 sem FAIL; checklist limpo; `CACHE` → v6.

## 2026-11-01 — Sessão 13: janela de prêmios sem rolagem + publicação

- **Janela "Prêmios"** agora cabe sempre na tela, sem rolagem: os 8 desenhinhos encolhem
  conforme a altura (`--pc` em `css/style.css`) e, em tela baixa e deitada (≤ 480 px de
  altura), a lista vira 2 colunas de 4. Medido em 360×740, 390×664, 393×659, 430×900, 440×800,
  390×844, 320×568, 956×360, 820×1180 e 1180×820, com texto normal e grande: sem rolagem.
- **Publicação (sessão 08):** decidido seguir o harness da fábrica (GitHub Pages, repositório
  público `victor-cardoso-13/dr-bingo`) **sem migrar para Vite**: o jogo continua HTML/JS puro.
  `.github/workflows/publicar.yml` roda `npm test` e publica só `index.html`, `manifest`,
  `sw.js`, `css/`, `src/` e `icons/`. Site: https://victor-cardoso-13.github.io/dr-bingo/
- Testes 31/31; t02–t07 sem FAIL; `CACHE` → v7.
