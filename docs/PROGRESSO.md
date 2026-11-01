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

## 2026-11-01 — Sessão 14: login e progresso na nuvem

- **Conta (e-mail e senha)** no mesmo Firebase de todos os jogos (`jogos-sem-anuncio`); o progresso
  fica em `jogadores/{uid}/jogos/dr-bingo`. Sem mexer nas regras do Firestore.
- **Onde fica:** primeiro botão dos Ajustes ("Entrar ou criar conta" / e-mail da conta). Janelas:
  entrar/criar/esqueci a senha, "Sua conta" (situação da nuvem e Sair) e "Qual progresso manter?"
  (só quando o aparelho e a conta já têm progresso).
- **Compartilha:** saldo, aposta, nº de cartelas e estatísticas. Fica em cada aparelho: ajustes
  (som, texto grande, velocidade), cartelas e rodada em andamento.
- **Decisões:** sem build, então o SDK vem do gstatic (versão fixa 13.1.0, Firestore "lite"), carregado
  só se há conta ou ao tocar em "Entrar"; quem joga sem conta não faz chamada de rede. Documento
  inteiro, quem mudou por último vale (`sharedAt`); envio 2 s depois da última mudança, e ao esconder
  a tela/voltar a internet. Uma gaveta no aparelho por conta (`bingo-vovo:v1:<uid>`), outra sem conta;
  `bingo-vovo:conta` lembra quem está dentro (abre com o saldo certo até sem internet). Nada é trocado
  no meio de uma rodada; entrar/sair recarrega a página.
- **Conferido com a internet de verdade** (conta de teste criada e apagada no fim, junto com o documento):
  senha errada → "E-mail ou senha incorretos."; criar conta levando o saldo do aparelho; mudança enviada
  sozinha; aparelho novo puxa da nuvem; sair → sem conta vazio; entrar de novo; janela de escolha.
- Ajustes com texto grande em iPhone baixo (390×664, 393×659) ainda rolam ≈ 50 px (já rolavam antes;
  agora menos); celular deitado rola (o jogo é só em pé).
- Testes 39/39 (novos: `mesclar.test.js` e gavetas em `state.test.js`); t02–t07 sem FAIL; `CACHE` → v8.

## 2026-11-01 — Sessão 15: tela cheia no iPhone (sem faixa lisa embaixo)

- **Problema (print do Victor na Tela de Início):** faixa lisa `#120c33` embaixo (≈ 55 pt) e topo da barra de
  status com tom diferente. Causa: degradê no `body` + `#app` com `height: 100dvh`; no iOS a altura "100%"
  fica menor que a tela.
- **Correção:** fundo em `body::before` (fixo, `inset: 0`), `#app` com `position: fixed; inset: 0`,
  `html` com a cor do fim do degradê. Conferido em 393×852 com área segura do iPhone emulada (topo 59,
  base 34): o fundo vai até as quatro bordas. Não há como reproduzir o iOS de verdade aqui: o Victor confirma no aparelho.
- Regra levada para o harness (`CLAUDE.md` da fábrica, `APRENDIZADOS.md` §9 e `_modelo/src/estilo.css`).
- Testes 39/39; t02–t07 sem FAIL; `CACHE` → v9.

## 2026-11-01 — Sessão 16: faixa embaixo continuava (iOS 26, WebKit 301108)

- A correção da sessão 15 (fundo fixo) não bastou: no iOS 26 a janela do app fica menor que a tela pela
  altura da barra de status e o WebKit não desenha conteúdo fixo ali. A faixa tinha a cor do
  `background_color` do manifesto e a altura da barra de status (≈ 62 pt no print).
- **Correção:** `@media (display-mode: standalone) { html { min-height: min(100lvh, calc(100% + env(safe-area-inset-top))); } }`
  (mesma solução testada por outros projetos). Só vale no modo app. Chrome: sem rolagem nem mudança de layout.
- **Só o aparelho confirma.** Plano B se a faixa persistir: status bar `black` (exige remover e adicionar o app de novo).
- Harness atualizado (CLAUDE.md da fábrica, APRENDIZADOS §9, `_modelo`). `CACHE` → v10; testes 39/39; t02–t07 sem FAIL.

## 2026-11-01 — Sessão 17a: visual mais parecido com o Dr. Bingo (só CSS + cabeçalho da cartela)

- Pedido do Victor (fotos do Dr. Bingo real, "Show Ball 3"): fundo preto com estrelas; topo em chapa de aço
  com o saldo num visor vermelho; **+ ADICIONAR** verde com moldura dourada; painel de bolas de aço com o
  visor verde "BOLA 5 DE 30"; cartelas brancas com borda laranja, números pretos grandes e cabeçalho
  "CARTELA: 1 · APOSTA: 1" (prêmio da cartela logo abaixo); bola marcada em azul; barra de baixo azul-marinho
  com friso dourado, aposta em visor, **JOGAR azul grande**. Resto (modais) não mudou.
- Feito como bloco "Sessão 17" no fim de `css/style.css` + `src/ui/cards.js` (rótulos do cabeçalho).
  Cor do fundo no `index.html`/manifesto: `#02030a`. Números das cartelas crescem quando sobra altura.
- **Não publicado:** aguarda o "ok" do Victor nos prints (regra de mudança visual). `CACHE` → v11; testes 39/39; t02–t07 sem FAIL.
- Não entrou (fora do pedido): ícones de prêmios entre as cartelas, MAX, missões, torneio, tela deitada.
- Os 2 modos novos (Pirâmides e Sequência) ficaram para a sessão 17 (`docs/sessoes/20-sequencia.md`).

## 2026-11-01 — Sessão 17b: duplo toque sem zoom (iPad)

- Aconteceu zoom no duplo toque no iPad apesar do `touch-action` em `html/body/button`. Agora: `touch-action: manipulation`
  em tudo, `touchend` rápido (< 500 ms) com `preventDefault` (clicando o botão à mão para não perder o 2º toque do "+")
  e `dblclick` cancelado (`travarZoomDoDuploToque` em `main.js`). O pinçar para ampliar continua livre. `CACHE` → v12.
- Só o iPad confirma.

## 2026-11-01 — Sessão 18: pistas com todas as bolas sorteadas

- O painel de cima mostra **todas** as bolas: 4 pistas de aço com 10 lugares (3 pistas para as 30 do sorteio,
  a 4ª, dourada, para as até 10 extras). Cada bola nova rola da esquerda até o seu lugar (`ball-run`); lugares
  vazios aparecem como encaixes escuros. Globo e visor verde "BOLA 10 DE 30" ficam em cima; as luzes da moldura e
  a fileira de 10 anteriores saíram. Código em `src/ui/ballboard.js` e bloco "Sessão 18" do CSS.
- Para as 4 cartelas continuarem cabendo sem rolar, o globo ficou menor e a altura dos números das cartelas se
  ajusta à altura da tela (`clamp` no `.cell`). Conferido em 360×740, 390×844, 440×800 (sem rolagem).
- `CACHE` → v13; testes 39/39.
- **18b (pedido: "muito grande"):** pistas viraram **2 de 15** bolas (mais compridas e baixas); a pista dourada das extras
  só aparece quando sai a 1ª extra. Números das cartelas aproveitam a altura que sobrou. `CACHE` → v14. Testes 39/39.
- **18c (pedido: "horrível no PC"):** em tela larga o painel esticava. Agora `#app` tem `max-width: min(100%, 100dvh × 0,62)`,
  centralizado (coluna de celular; o fundo continua na tela toda); número das bolas das pistas acompanha a largura (`cqi`).
  Celular em pé não muda. `CACHE` → v15; testes 39/39.

## 2026-11-01 — Sessão 19: modo Faraó (pirâmides) + escolha de modo

- **Perguntas respondidas pelo Victor (com fotos das regras do jogo de referência, só no computador dele):** 33 bolas por
  rodada, bola de 1 a 90, até 10 bolas extras (as fotos diziam 9; o Victor pediu 10), **a 5ª extra sai de graça** (só no Faraó),
  1 a 4 pirâmides (padrão 4). Visual aprovado: opção A (pedra escura, tijolo claro que vira **ouro** quando a bola sai; lado
  completo brilha; o azul foi trocado).
- **Regras:** pirâmide de 15 números (fileiras 1–5), as 4 usam números diferentes entre si, cada uma ordenada. "Lado" = esquerda,
  direita ou base (cantos valem nos dois lados). 1 lado ×3, 2 lados ×70, 3 lados ×200, Bingo ×1000; só o maior prêmio por pirâmide.
  Bola extra só é oferecida quando uma bola leva a 2 lados ou mais / Bingo; custo = ganho ÷ bolas restantes (como no Bingo); a 5ª é
  grátis. Não fiz o "Acumulado" da foto (depende de outros jogadores).
- **Retorno (simulação, 4 pirâmides, 60 mil rodadas):** com 33 bolas o jogador recebe só ≈ **10%** do que aposta (≈ 6% sem as
  extras). Com 40 bolas ≈ 38%, com 45 ≈ 76%, com 50 ≈ 107%. **Decisão: ficou 33** (como na foto); mudar é só
  `PYRAMID_MAIN_BALLS` em `src/engine/pyramids.js` (e as pistas de bolas em `LANES` de `ui/ballboard.js`). Pendência: o Victor decide.
- **Código:** `src/engine/pyramids.js` (motor + 9 testes em `tests/pyramids.test.js`), `shuffleRange` em `draw.js`; `round.js` virou
  dos dois modos (`GAMES`); `state.js` ganhou `mode`, `pyramids`, `pyramidActive`, `pyramidCount` (**ficam em cada aparelho, não vão
  para a nuvem**; saldo, aposta e estatísticas continuam os mesmos nos dois modos); telas `ui/modes.js` (botões Bingo | Faraó, só
  trocam com a rodada parada; lembram o último), `ui/pyramids.js`, painel de bolas com pistas por modo, janela "Prêmios do Faraó".
- Os botões de modo tomaram uma linha; o número das cartelas do Bingo ficou um pouco menor (mesmo assim sem rolagem).
- Testes 48/48; `scripts/e2e/t08.mjs` (Faraó: rodada completa, 10 extras com a 5ª grátis, saldo compartilhado, sem rolagem em 360×740,
  390×844, 440×800); t02–t07 sem FAIL; `CACHE` → v16. **Não publicado** (aguarda o ok do Victor).

- **19b (pedido: "Não foi dessa vez"):** rodada sem prêmio não abre mais janela; volta direto ao início e o botão **JOGAR** passa a
  dizer **PRÓXIMA** (enquanto há bolas na tela; volta a "JOGAR" ao trocar de modo ou de cartelas/pirâmides). Com prêmio, a janela
  "Parabéns!" continua. Vale para Bingo e Faraó. `round.js` (`settle`), `ui/controls.js`; t03/t04/t06/t08 ajustados. `CACHE` → v17.

- **19c (pedidos do Victor):** (1) **Acelerar saiu da tela**: o botão do sorteio agora é **Terminar sorteio** (1 toque mostra todas as
  bolas); a velocidade continua só nos Ajustes. Fluxo: JOGAR → Terminar sorteio → bola extra ou PRÓXIMA RODADA. (2) Bola extra com os
  2 botões lado a lado. (3) **Faraó com 45 bolas** (a avó não ganhava nada com 33): retorno ≈ 76% comprando todas as extras (≈ 50% sem
  elas). 3 pistas de bolas + a das extras (`LANES` em `ui/ballboard.js`). Constante `PYRAMID_MAIN_BALLS`. `CACHE` → v21.

- **19d (pedido do Victor): avisos de prêmio por tamanho, nos 2 jogos.** Os **3 maiores prêmios** (Bingo: Cartela Cheia, Moldura, Duas Linhas;
  Faraó: Bingo, 3 lados, 2 lados) mantêm o aviso "Parabéns!" (OK ou 4 s). Qualquer prêmio menor mostra o valor só **0,8 s** e some sozinho (sem botão,
  sem confete, 2 sinos). **Festa (`jackpot`):** cartela/pirâmide 100% preenchida **sem comprar bola extra** → janela "BINGO!!!" com "CARTELA CHEIA!"/
  "PIRÂMIDE CHEIA!", 150 confetes, raios, brilho dourado pulsando devagar (sem piscar rápido), fanfarra de ~5 s em volume máximo
  (`playJackpot`), vibração (Android; o iPhone não vibra), fica até o OK (ou 15 s). Cartela cheia *com* bola extra comprada vale como prêmio grande normal.
  Código: `winTier` em `round.js`, `showWin` em `ui/modals.js`, `ui/sound.js`. Teste novo: `scripts/e2e/t09.mjs`. `CACHE` → v22.
  Só o aparelho confirma som alto e vibração.

- **19e (pedido do Victor): música de fundo.** Gerada por código (WebAudio, sem arquivo), bem baixinha (notas com ganho ≈ 0,03). Duas músicas animadas:
  Bingo (tom maior alegre) e Faraó (escala "egípcia"); troca sozinha ao mudar de modo. Só começa depois do 1º toque (regra do iPhone), para
  quando a tela esconde, e some em **Ajustes → Música de fundo → Desligado** (guardado por aparelho em `settings.music`; "Sons: Desligado"
  também silencia a música). Código: bloco "Música de fundo" de `ui/sound.js` (`syncMusic`, `initMusic`). Teste: `scripts/e2e/t10.mjs`. `CACHE` → v23.
  Só o aparelho confirma se está baixa o bastante e se agrada: o volume está em `gain: 0.032` (melodia) e `0.05` (baixo) em `scheduleMusic`.

- **19f (pedido: a vovó joga no iPad deitado):** em tela deitada larga (`orientation: landscape` e largura ≥ 900 px) o jogo usa a largura:
  **Bingo com as 4 cartelas lado a lado** (números maiores) e **Faraó com as 4 pirâmides lado a lado**; painel de bolas e botões de modo
  centralizados (40 rem), coluna até 1,5 × a altura. Em pé e no celular nada mudou. O tamanho do número das pirâmides agora acompanha a altura da casa
  (acaba com número encavalado). Bloco "Sessão 19f" no fim do CSS. 8 cartelas deitado ainda rolam um pouco (como já rolavam). `CACHE` → v26.

- **19g (pedido: "o zoom ainda está ativo"):** zoom desligado de vez, também a **pinça** (antes só o duplo toque): `viewport` com
  `maximum-scale=1, user-scalable=no`, `touch-action: pan-x pan-y` em tudo, e `gesturestart/gesturechange/gestureend` + `touchmove` com 2 dedos
  cancelados em `main.js`. Só o iPad confirma (o Chrome não reproduz o zoom do Safari). Plano B se ainda ampliar: pedir print/vídeo. `CACHE` → v27.

- **19h (pedido: enquadrar as 8 cartelas no iPad deitado):** a altura da casa vem da altura que sobra (`cqh` no `#cards-bingo`), então 1 a 8 cartelas
  cabem sem rolagem em 1180×820, 1194×834, 1024×768 e 1366×1024; painel de bolas mais estreito (32 rem) para sobrar altura. `CACHE` → v28.
