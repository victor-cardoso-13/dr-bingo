# Bingo da Vovó: especificação do jogo

> **Sessão 10 (pedido do dono):** na tela, a moeda se chama **dólares** ("1 dólar", "126 dólares");
> onde este documento diz "créditos", a tela mostra "dólares". O prêmio de cada cartela fica no
> cabeçalho, embaixo do nome. O Acelerar, depois do 1º toque, vira **Terminar sorteio**, que
> mostra de uma vez as bolas que faltam das 30.
>
> **Sessão 11 (pedido do dono):** dinheiro no formato **USD 1.234,00** ("Saldo" no topo).
> Aposta por cartela nos degraus `[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]`; Adicionar soma
> **10.000**. A jogadora escolhe de **1 a 8 cartelas** (padrão 4; `cardCount` no estado; as 8
> ficam guardadas e as que não aparecem ficam com `active = false`). Com mais de 4, só a área
> das cartelas rola. O painel de cima mostra as **10 bolas anteriores** em 2 fileiras de 5.

Esta é a fonte da verdade para regras, números e telas. Se algo não estiver aqui, escolha o
mais simples e registre no `docs/PROGRESSO.md`.

---

## 1. Visão geral

- Vídeo bingo de **uma pessoa só**, contra a máquina.
- **4 cartelas** de 3 linhas × 5 colunas (15 números).
- Bolas numeradas de **1 a 60**. Cada rodada sorteia **30 bolas**, e depois podem vir até
  **10 bolas extras** opcionais.
- Cada cartela paga **só o maior prêmio** que formou, multiplicado pela aposta.
- Os créditos são grátis. O botão **Adicionar** soma **1.000** créditos a cada toque.

---

## 2. Cartelas

### Formato

Cada cartela tem 15 casas. O índice de uma casa é `i = linha * 5 + coluna`:

```
          col0 col1 col2 col3 col4
linha 0:    0    1    2    3    4
linha 1:    5    6    7    8    9
linha 2:   10   11   12   13   14
```

A cartela é guardada como `number[15]` nessa ordem.

### Geração

- A coluna `c` (de 0 a 4) usa os números de `12*c + 1` até `12*c + 12`:
  - col0: 1–12
  - col1: 13–24
  - col2: 25–36
  - col3: 37–48
  - col4: 49–60
- Em cada coluna são sorteados **3 números diferentes** e ordenados do menor para o maior,
  de cima para baixo.
- Cartelas diferentes podem repetir números entre si.
- As cartelas ficam as mesmas de uma rodada para a outra. Só mudam quando a jogadora toca em
  **Trocar cartelas**, que é grátis e só funciona fora de rodada.

### Cartelas ligadas e desligadas

- Cada cartela pode ser ligada ou desligada tocando no cabeçalho dela ("Cartela 1"... "Cartela 4").
- Pelo menos **1** cartela fica sempre ligada. Tocar na última ligada não faz nada.
- Uma cartela desligada aparece apagada (opacidade 0,4), não paga e não entra no custo das
  bolas extras.
- Padrão: as 4 ligadas.

---

## 3. Aposta e créditos

- Aposta **por cartela**, nos degraus `[1, 2, 3, 5, 10, 20, 50]`. Padrão: 1.
- Os botões **−** e **+** andam um degrau por vez, sem dar a volta no fim da lista.
- **Aposta total** = aposta × número de cartelas ligadas. Aparece embaixo: "Total: 4".
- Créditos iniciais: **1.000**.
- **Adicionar** soma **1.000** créditos na hora, sem confirmação e sem limite. Quando os
  créditos não cobrem a aposta total, o botão pulsa devagar (animação de 2 s) e o JOGAR
  mostra "Adicione créditos".
- Créditos aparecem no formato pt-BR com ponto de milhar: `1.000`, `12.345`.
- Os créditos nunca ficam negativos.

---

## 4. Rodada

### Fases

```
idle ──JOGAR──▶ drawing ──30 bolas──▶ extra? ──▶ result ──▶ idle
                                       │  ▲
                                       └──┘ (pede outra bola extra)
```

1. **idle**: a jogadora ajusta a aposta, liga e desliga cartelas, troca cartelas.
2. Toque em **JOGAR**:
   - desconta a aposta total;
   - embaralha as 60 bolas (Fisher–Yates com o RNG do engine). As 30 primeiras são o
     sorteio principal e as seguintes ficam reservadas para as extras;
   - `stats.rounds += 1`.
3. **drawing**: mostra uma bola por vez, no ritmo da velocidade escolhida:

   | Velocidade | Tempo por bola |
   |------------|----------------|
   | lento      | 1600 ms        |
   | normal     | 900 ms         |
   | rápido     | 350 ms         |

   - A casa com o número é marcada **automaticamente** em todas as cartelas ligadas.
   - Durante o sorteio aparece o botão **Acelerar**, que muda só esta rodada para "rápido".
4. Depois da bola 30 vem a decisão das extras (seção 6). Se não houver oferta, a rodada
   vai direto para **result**.
5. **result** (acerto de contas):
   - cada cartela ligada paga o seu maior prêmio × aposta;
   - o total é somado aos créditos;
   - `stats.biggestWin = max(stats.biggestWin, total)`;
   - aparece um aviso: "Você ganhou **X** créditos!", ou "Não foi dessa vez" se for 0;
   - o aviso some ao tocar nele ou depois de 4 s; aí a fase volta a **idle**, com as
     marcações ainda visíveis até o próximo JOGAR.

### Rodada interrompida

- Ao começar uma rodada, salve `pendingRound = { sequence, cards, active, bet, drawnCount }`
  e atualize `drawnCount` a cada bola.
- Se o app abrir e houver `pendingRound`, a rodada é acertada na hora. Contam como
  sorteadas as `max(30, drawnCount)` primeiras bolas da sequência. Paga o prêmio, limpa
  `pendingRound` e mostra: "Sua rodada anterior foi concluída: você ganhou X créditos."
- Assim, fechar o app no meio nunca faz perder um prêmio.

---

## 5. Prêmios

Cada padrão é uma lista de máscaras (listas de índices). O padrão está formado quando
**todas as casas de pelo menos uma máscara** estão marcadas. A cartela paga só o padrão de
**maior multiplicador**.

| Padrão        | Multiplicador | Máscaras (índices)                              |
|---------------|---------------|-------------------------------------------------|
| Cartela Cheia | 2000          | `[0..14]`                                       |
| Moldura       | 500           | `[0,1,2,3,4,5,9,10,11,12,13,14]`                |
| Duas Linhas   | 120           | `[0..9]`, `[0..4,10..14]`, `[5..14]`            |
| Letra U       | 70            | `[0,4,5,9,10,11,12,13,14]`                      |
| Xis           | 30            | `[0,4,6,7,8,10,14]`                             |
| Letra T       | 25            | `[0,1,2,3,4,7,12]`                              |
| Linha         | 5             | `[0..4]`, `[5..9]`, `[10..14]`                  |
| Cantos        | 3             | `[0,4,10,14]`                                   |

Desenhos (■ = precisa estar marcada). Use estes desenhos na tela de prêmios:

```
Cartela Cheia   Moldura         Duas Linhas (qualquer par)   Letra U
■ ■ ■ ■ ■       ■ ■ ■ ■ ■       ■ ■ ■ ■ ■                    ■ · · · ■
■ ■ ■ ■ ■       ■ · · · ■       ■ ■ ■ ■ ■                    ■ · · · ■
■ ■ ■ ■ ■       ■ ■ ■ ■ ■       · · · · ·                    ■ ■ ■ ■ ■

Xis             Letra T         Linha (qualquer)             Cantos
■ · · · ■       ■ ■ ■ ■ ■       ■ ■ ■ ■ ■                    ■ · · · ■
· ■ ■ ■ ·       · · ■ · ·       · · · · ·                    · · · · ·
■ · · · ■       · · ■ · ·       · · · · ·                    ■ · · · ■
```

Resultado da simulação (400 mil cartelas, 30 bolas): cerca de 12% das cartelas ganham
algo e o retorno médio é de 99% da aposta, antes das extras. Não mude os multiplicadores.

### Durante a rodada

- Cada cartela mostra no rodapé o prêmio atual: "Linha · 5", ou o valor já multiplicado
  pela aposta, como "Linha · 10 créditos". Use o valor multiplicado. Sem prêmio, mostra "—".
- As casas **quentes** ganham uma borda amarela pulsando devagar (1,5 s). Quente é a casa
  não marcada que, sozinha, aumentaria o prêmio daquela cartela (veja `improvingCells`).

---

## 6. Bolas extras

- Depois da bola 30, calcule a oferta.
- Para cada número `n` ainda não sorteado e cada cartela ligada:

  ```
  ganho(cartela, n) = (multiplicador com n marcado − multiplicador atual) × aposta
  ```

  O ganho é 0 se `n` não está na cartela ou se não melhora nada.
- Some todos os ganhos:

  ```
  ganhoTotal = Σ_n Σ_cartelas ganho(cartela, n)
  restantes  = 60 − bolas já sorteadas
  custo      = ganhoTotal > 0 ? max(1, ceil(ganhoTotal / restantes)) : 0
  ```

- **custo = 0** quer dizer que não há oferta, e a rodada vai para **result**.
- **custo > 0**: aparece o painel "Bola extra: **X** créditos" com dois botões:
  - **Pedir bola extra**: desconta X, sorteia a próxima bola da sequência, marca e calcula
    a oferta de novo.
  - **Encerrar**: vai para **result**.
  - Se os créditos não cobrem X, o botão vira "Créditos insuficientes" (desabilitado) e o
    Adicionar pulsa. Adicionar créditos deixa pedir de novo.
- Máximo de **10** extras por rodada. Na 10ª, vai para **result**.
- O contador mostra "Extra 3 de 10".

### Exemplos para os testes (copie exatamente)

```
Cartela A = [ 1,13,25,37,49,  2,14,26,38,50,  3,15,27,39,51]
Cartela B = [ 4,16,28,40,52,  5,17,29,41,53,  6,18,30,42,54]
Sorteadas (30) = 1,13,25,37,49,2,14,26,38,50,3,15,27,39,   (A menos o 51: 14 bolas)
                 4,52,6,                                   (cantos de B menos o 54)
                 7,8,9,10,11,12,19,20,21,22,23,24,31       (13 que não estão em A nem B)
restantes = 30
```

- **A sozinha**: prêmio atual Duas Linhas (120). Também tem Letra T e Linha, mas paga só o
  maior.
- **E1**, só A ligada, aposta 1:
  - casas quentes de A: só o índice 14 (número 51);
  - ganhoTotal = 2000 − 120 = 1880;
  - custo = ceil(1880 / 30) = ceil(62,67) = **63**.
- **E2**, A e B ligadas, aposta 2:
  - ganho(A, 51) = 1880 × 2 = 3760;
  - ganho(B, 54) = 3 × 2 = 6 (Cantos);
  - ganhoTotal = 3766;
  - custo = ceil(3766 / 30) = ceil(125,53) = **126**;
  - números quentes = {51, 54}.
- **E3**, só B ligada, aposta 1: ganhoTotal = 3, custo = max(1, ceil(0,1)) = **1**.
- **E4**: uma cartela sem nenhuma casa marcada nunca melhora com uma bola só (o menor padrão
  tem 4 casas), então o custo é **0**.
- **Acerto de E2**, se a extra 51 sair: A paga 2000 × 2 = 4000 e B paga 0, total **4000**.
  Se sair a 54: A paga 120 × 2 = 240 e B paga 3 × 2 = 6, total **246**.

---

## 7. Telas (celular em pé)

Tudo numa tela só, de preferência sem rolagem num celular de 360×740. **Leitura vem
primeiro:** os números das cartelas têm no mínimo 1,1 rem, em bold. Se não couber, só a
região das cartelas rola. Janelas sobrepostas são usadas só para Prêmios, Ajustes e avisos.

Durante uma rodada, todo cálculo usa a "foto" (snapshot) tirada no JOGAR: cartelas,
cartelas ligadas e aposta. Fora da fase `idle`, nada disso pode ser mudado.

```
┌──────────────────────────────────────┐
│ Créditos 12.345   [ + Adicionar ] [⚙] │  barra de cima
├──────────────────────────────────────┤
│        ( 23 )       Bola 12 de 30     │  bola atual grande (≈ 6 rem)
│   [41] [7] [56] [19] [33]             │  últimas 5 bolas
├──────────────────────────────────────┤
│ ┌Cartela 1───┐   ┌Cartela 2───┐       │
│ │ 3 14 26 .. │   │ ..         │       │  4 cartelas em grade 2×2
│ │ ..         │   │            │       │
│ │ Linha · 5  │   │ —          │       │  rodapé = prêmio atual
│ └────────────┘   └────────────┘       │
│ ┌Cartela 3───┐   ┌Cartela 4───┐       │
│ └────────────┘   └────────────┘       │
├──────────────────────────────────────┤
│ Aposta [−]  2  [+]   Total: 8         │
│ [Prêmios]  [Trocar cartelas]          │
│ [            JOGAR             ]      │  botão grande, ≥ 64 px
└──────────────────────────────────────┘
```

- **Durante o sorteio:** JOGAR, Trocar cartelas e os botões de aposta ficam desabilitados.
  No lugar do JOGAR aparece **Acelerar**.
- **Na fase extra:** o painel de bola extra fica no lugar dos controles de baixo.
- **Prêmios** (janela): os 8 desenhos em mini-grade, o nome e quanto pagam com a aposta
  atual ("Linha: 10 créditos"). Botão **Fechar** grande.
- **Ajustes** (janela):
  - Velocidade: Lento / Normal / Rápido;
  - Sons: liga/desliga;
  - Texto grande: liga/desliga;
  - Estatísticas: "Rodadas jogadas", "Maior prêmio";
  - botão **Zerar estatísticas**, com confirmação "Tem certeza?" Sim/Não;
  - **Fechar**.
- **Aviso de prêmio:** no centro, com fundo escurecido. Número grande, uma animação de
  confete em CSS e o som de vitória.
- **Texto grande:** fonte base 1,3125 rem (21 px) em vez de 1,125 rem (18 px). Tudo é em
  `rem`, então o layout inteiro cresce junto.

### Visual (próprio, sem copiar nenhum jogo)

| Elemento             | Cor                                                    |
|----------------------|--------------------------------------------------------|
| Fundo                | azul-noite `#14213d`                                   |
| Cartelas             | creme `#fff8e7`, números `#14213d`, fonte bold         |
| Casa marcada         | laranja `#f77f00`, número branco                       |
| Casa quente          | borda `#fcbf49` de 3 px pulsando                       |
| Bola atual           | círculo `#fcbf49` com anel branco, número `#14213d`    |
| JOGAR                | verde `#2a9d8f`, texto branco                          |
| Adicionar            | amarelo `#fcbf49`, texto `#14213d`                     |
| Botões desabilitados | opacidade 0,5                                          |

- Fonte: `system-ui` (nada baixado).
- Contraste de texto de pelo menos 4,5:1.

---

## 8. Som e tela

- **Sons** são gerados com WebAudio, sem arquivos:
  - bola nova: um "plim" curto;
  - casa marcada: um "tic" suave;
  - vitória: um arpejo de 4 notas;
  - toque em botão: um clique bem curto.
- O `AudioContext` só é criado ou retomado depois do primeiro toque, por causa do iPhone.
- **Voz:** removida a pedido do dono do projeto (sessão 09). O jogo não fala os números.
  O campo `settings.voice` continua no estado salvo, mas não é usado.
- **Tela acesa:** durante a rodada, pede `navigator.wakeLock.request('screen')` se existir e
  solta no fim. Se falhar, ignora.

---

## 9. Estado salvo (`localStorage["bingo-vovo:v1"]`)

```js
{
  version: 1,
  credits: 1000,
  bet: 1,
  active: [true, true, true, true],
  cards: [[...15], [...15], [...15], [...15]],   // gerado no primeiro uso
  lastDrawn: [],                                 // bolas da última rodada, para redesenhar as marcações
  settings: { speed: "normal", voice: true, sound: true, bigText: false },
  stats: { rounds: 0, biggestWin: 0 },
  pendingRound: null                             // ver seção 4
}
```

- Ao carregar, junte o que estiver salvo com os padrões (campos que faltam recebem o valor
  padrão).
- Se o JSON estiver corrompido, comece do padrão.

---

## 10. Arquivos

```
index.html
manifest.webmanifest        (sessão 07)
sw.js                       (sessão 07)
icons/                      (sessão 07, gerados por scripts/make_icons.py)
package.json                { "type": "module", "scripts": { "test": "node --test" } }
css/style.css
src/main.js                 inicia tudo e liga as peças
src/state.js                load/save/update/subscribe do estado
src/format.js               formatCredits
src/round.js                máquina de fases da rodada (usa o engine e chama a UI)
src/engine/rng.js           cryptoRandomInt, makeSeededRandomInt
src/engine/cards.js         generateCard, generateCards, markedCells
src/engine/draw.js          shuffleBalls, MAIN_BALLS, MAX_EXTRA, BALL_MAX
src/engine/patterns.js      PATTERNS, bestPattern, improvingCells
src/engine/payout.js        cardPrize, settleRound
src/engine/extraBalls.js    extraBallOffer
src/ui/topbar.js
src/ui/ballboard.js
src/ui/cards.js
src/ui/controls.js
src/ui/modals.js            Prêmios, Ajustes, avisos
src/ui/sound.js
src/ui/wakelock.js
tests/*.test.js
scripts/make_icons.py       (sessão 07)
```

### APIs do engine (assinaturas fixas)

```js
// rng.js
cryptoRandomInt(max)            // inteiro em [0, max), crypto.getRandomValues + rejeição
makeSeededRandomInt(seed)       // retorna (max) => inteiro em [0, max), determinístico (mulberry32)

// cards.js
generateCard(randomInt = cryptoRandomInt)          // number[15]
generateCards(count = 4, randomInt = cryptoRandomInt)
markedCells(card, drawnSet)                        // boolean[15]

// draw.js
BALL_MAX = 60; MAIN_BALLS = 30; MAX_EXTRA = 10
shuffleBalls(randomInt = cryptoRandomInt)          // permutação de 1..60

// patterns.js
PATTERNS   // [{ id, name, multiplier, masks }] do maior para o menor multiplicador
bestPattern(marked)                                // padrão de maior multiplicador ou null
improvingCells(card, drawnSet)                     // índices das casas quentes

// payout.js
cardPrize(card, drawnSet, bet)                     // { pattern, win }
settleRound({ cards, active, bet, drawnSet })      // { perCard: [{ pattern, win }|null], total }

// extraBalls.js
extraBallOffer({ cards, active, bet, drawnSet })   // { cost, totalGain, hotNumbers: Set<number> }
```

Ids dos padrões: `full`, `frame`, `twoLines`, `letterU`, `cross`, `letterT`, `line`,
`corners`.


## Modo Faraó (sessão 19)

Segundo modo, escolhido pelos botões "Bingo | Faraó" no topo (só com a rodada parada). Mesmo saldo, aposta e botão Adicionar.
- 1 a 4 pirâmides (padrão 4) de 15 números em 5 fileiras (1 a 5). Bolas de 1 a 90; os números das pirâmides são todos diferentes e ordenados.
- **45 bolas** por rodada + até **10 extras**; a **5ª extra é grátis**. A extra só é oferecida quando uma bola leva a 2 lados ou mais / Bingo.
- Prêmios (× aposta, só o maior por pirâmide): 1 lado ×3, 2 lados ×70, 3 lados ×200, Bingo ×1000. Lados: esquerda, direita e base.
- Retorno ≈ 76% com 45 bolas, comprando todas as extras (≈ 50% sem elas; ver PROGRESSO, sessão 19). Código: `src/engine/pyramids.js`.
