# Sessão 03: sorteio das 30 bolas

## Objetivo

O JOGAR desconta a aposta, sorteia 30 bolas com animação e marca as cartelas. Ainda não paga
prêmio: a rodada termina e volta para **idle**.

## Criar / alterar

- `src/engine/draw.js`:
  - `BALL_MAX`, `MAIN_BALLS` e `MAX_EXTRA`;
  - `shuffleBalls(randomInt)`, um Fisher–Yates sobre `[1..60]`.
- `src/round.js`, a máquina de fases (seção 4 do DESIGN):
  - estado de rodada **em memória**:
    `{ phase, sequence, drawnCount, speedOverride, snapshot: { cards, active, bet } }`;
  - **Foto da rodada:** no JOGAR, copie `cards`, `active` e `bet` para `snapshot`. Todo o
    cálculo da rodada usa só o `snapshot`, nunca o estado ao vivo: marcar, casas quentes
    (sessão 04), oferta de extras (sessão 05) e pagamento.
  - `startRound()`:
    - confere os créditos;
    - num **único** `update()`: desconta a aposta total, `stats.rounds += 1` e
      `lastDrawn = []` (esta sessão é dona do `rounds`);
    - embaralha;
    - pede para a UI limpar as marcações;
    - agenda as bolas.
  - Um timer por bola: `setTimeout` encadeado, com o intervalo da tabela de velocidades e
    lendo `settings.speed` ou o `speedOverride`.
  - A cada bola:
    - `drawnCount++`;
    - atualiza `lastDrawn` no estado;
    - avisa a UI (`onBall(n, drawnCount)`).
  - `accelerate()` põe `speedOverride = 'rapido'`.
  - Na bola 30, a fase vira `idle`. A fase `result` entra na sessão 04 e a `extra` na 05.
  - Exponha `getRoundPhase()` e `subscribeRound(fn)`, para os controles saberem quando
    desabilitar.
  - Os valores de `settings.speed` são `"lento"`, `"normal"` e `"rapido"`, sem acento no
    código.
  - Ainda não existe tela de ajustes: o padrão é "normal".
- `src/ui/ballboard.js`: `renderBallboard(root)`.
  - Bola atual grande, de cerca de 6 rem: círculo amarelo, número escuro e uma animação
    curta de entrada (escala de 0,6 para 1 em 250 ms).
  - O contador "Bola 12 de 30".
  - As últimas 5 bolas em círculos menores, a mais recente à esquerda.
  - Antes da primeira rodada: "Toque em JOGAR" no lugar da bola.
- `src/ui/cards.js`:
  - `markNumber(n)` marca, em todas as cartelas ligadas, a casa que tem `n` (classe
    `marked`, com uma transição suave);
  - `clearMarks()`;
  - ao carregar, redesenha as marcas com base em `lastDrawn`.
- `src/ui/controls.js` + `src/ui/cards.js`:
  - em **toda fase que não seja `idle`** desabilitam aposta, Trocar cartelas, toggles de
    cartela e JOGAR. Isso vale para `drawing`, para `extra` e `result` das próximas sessões
    e também enquanto o aviso de prêmio está na tela;
  - durante `drawing`, no lugar do JOGAR aparece **Acelerar**.
- `tests/draw.test.js`:
  - `shuffleBalls` devolve uma permutação de 1..60, com 60 números únicos;
  - com a mesma semente sai a mesma sequência;
  - com sementes diferentes sai uma sequência diferente.

## Não fazer nesta sessão

Prêmios, casas quentes, bolas extras, sons, voz e `pendingRound` (vem na 04).

## Critérios de aceite

- `node --test` passa.
- JOGAR desconta a aposta certa (aposta × cartelas ligadas).
- As 30 bolas saem sem repetir, no ritmo normal (cerca de 27 s), e Acelerar funciona.
- Só as cartelas ligadas são marcadas.
- Depois de recarregar ao fim da rodada, as marcações aparecem de novo.
- Durante o sorteio não dá para mudar aposta, cartelas nem tocar JOGAR de novo.

## Conferência manual

1. Toque em JOGAR. Os créditos caem pelo Total?
2. As bolas aparecem uma a uma, grandes e legíveis?
3. As casas marcam sozinhas nas cartelas ligadas?
4. Acelerar deixa o sorteio mais rápido?
5. Toque em JOGAR de novo depois de terminar. As marcações antigas somem?
