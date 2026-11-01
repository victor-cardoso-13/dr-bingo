# Sessão 05: bolas extras

## Objetivo

Depois da bola 30, oferecer até 10 bolas extras, com o custo calculado pela fórmula da
seção 6 do DESIGN.

## Criar / alterar

- `src/engine/extraBalls.js`:
  - `extraBallOffer({ cards, active, bet, drawnSet })` devolve
    `{ cost, totalGain, hotNumbers }`, com o custo exato do DESIGN: `ceil`, mínimo 1 e 0
    quando não há ganho;
  - `restantes = BALL_MAX - drawnSet.size`;
  - para cada cartela ligada, olhe só as casas de `improvingCells`. O ganho dessa casa é
    `(multiplicador com ela marcada − atual) × bet`. Some os ganhos por número e coloque o
    número em `hotNumbers`.
- `src/round.js`:
  - a oferta é sempre calculada com o `snapshot` da rodada (`cards`, `active`, `bet`),
    nunca com o estado ao vivo;
  - os toggles de cartela, a aposta e Trocar cartelas continuam desabilitados na fase
    `extra` (regra da sessão 03);
  - depois da bola 30, a fase vira `extra` se `cost > 0`; se não, vai para `result`;
  - `requestExtra()`: se houver créditos, faz num **único** `update()` o desconto do custo
    e o `pendingRound.drawnCount += 1`. Depois sorteia `sequence[30 + extrasUsadas]`, marca
    e recalcula a oferta;
  - `endExtras()` vai para `result`;
  - depois da 10ª extra, ou com `cost` 0, vai para `result` automaticamente;
  - o `pendingRound` já cobre as extras, porque o acerto usa `max(30, drawnCount)`.
- `src/ui/controls.js`, na fase `extra`, troca os controles por um painel com:
  - o título "Bola extra: **X** créditos";
  - o contador "Extra N de 10";
  - o botão grande **Pedir bola extra**. Ele vira "Créditos insuficientes", desabilitado,
    quando não há créditos, e aí o Adicionar pulsa;
  - o botão **Encerrar**.
- Ao adicionar créditos durante a fase `extra`, o painel reavalia e libera o botão.
- `src/ui/ballboard.js`: na fase extra, o contador mostra "Extra N de 10".
- `tests/extraBalls.test.js`: os exemplos **E1, E2, E3 e E4** da seção 6 do DESIGN, com
  `cost`, `totalGain` e `hotNumbers` exatos.

## Não fazer nesta sessão

Sons, voz, ajustes e PWA.

## Critérios de aceite

- `node --test` passa, incluindo E1 = 63, E2 = 126, E3 = 1 e E4 = 0.
- Na tela, a oferta aparece só quando alguma cartela ligada está a 1 bola de melhorar.
- Pedir desconta o custo, a bola sai, marca e a oferta é recalculada.
- Encerrar paga, e paga com as extras incluídas.
- Sem créditos, o botão fica desabilitado. Depois de Adicionar, volta a funcionar.

## Conferência manual

1. Depois das 30 bolas, aparece "Bola extra: X créditos" quando falta pouco?
2. O preço sobe quando falta 1 para um prêmio grande?
3. Peça algumas extras e toque em Encerrar. O prêmio considera as extras?
4. Gaste até zerar, peça extra e toque em Adicionar. O botão volta a funcionar?
