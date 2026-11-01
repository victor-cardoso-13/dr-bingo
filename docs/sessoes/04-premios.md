# Sessão 04: prêmios, casas quentes, pagamento e rodada interrompida

## Objetivo

Calcular e pagar os prêmios. Mostrar no rodapé de cada cartela o prêmio atual e destacar as
casas quentes. Também entram o aviso de vitória, a janela **Prêmios** e o acerto de rodada
interrompida.

## Criar / alterar

- `src/engine/patterns.js`:
  - `PATTERNS`, exatamente a tabela da seção 5 do DESIGN, com os ids da seção 10 e ordem do
    maior para o menor multiplicador;
  - `bestPattern(marked)`;
  - `improvingCells(card, drawnSet)`: para cada casa não marcada, testa se marcá-la sozinha
    gera um `bestPattern` de multiplicador maior que o atual.
- `src/engine/payout.js`:
  - `cardPrize(card, drawnSet, bet)` devolve `{ pattern, win }`, com `win = multiplier × bet`
    ou 0;
  - `settleRound({ cards, active, bet, drawnSet })`, em que cartelas desligadas dão `null`
    em `perCard`.
- `src/round.js`:
  - fase `result` depois da bola 30: chama `settleRound` com o `snapshot` da rodada (nunca
    com o estado ao vivo) e mostra o aviso. A fase só volta para `idle` quando o aviso
    fecha;
  - **não** mexa em `stats.rounds`: a sessão 03 já cuida dele no JOGAR. Aqui só entra
    `stats.biggestWin`;
  - `pendingRound` (seção 4 do DESIGN) é a versão salva do `snapshot` +
    `sequence` + `drawnCount`;
  - **atualizações juntas**, para nunca pagar duas vezes nem perder a aposta ao recarregar:
    - no JOGAR, um **único** `update()` desconta a aposta, sobe o `rounds` e salva
      `pendingRound` (junte com o `update` da sessão 03);
    - a cada bola, `update()` do `pendingRound.drawnCount` e do `lastDrawn`;
    - no acerto, um **único** `update()` soma o prêmio, atualiza `biggestWin` e põe
      `pendingRound = null`;
  - na inicialização, se houver `pendingRound`, acerta com os dados dele e mostra o aviso
    de rodada anterior.
- `src/ui/cards.js`:
  - rodapé de cada cartela: "Nome · X créditos", ou "—" quando não há prêmio, atualizado a
    cada bola;
  - classe `hot` nas casas de `improvingCells`, também atualizada a cada bola;
  - cartelas desligadas não mostram nem rodapé nem casas quentes.
- `src/ui/modals.js`:
  - `openModal({ title, body, actions })`, uma janela genérica acessível com
    `role="dialog"`, foco no primeiro botão e fechamento por botão grande;
  - `showWin(total)`: o aviso de prêmio da seção 7 do DESIGN, com confete em CSS (só
    `transform`/`opacity`), fechando ao toque ou depois de 4 s;
  - `openPrizeTable()`: os 8 desenhos em mini-grade 3×5 e o valor com a aposta atual.
- `src/ui/controls.js`: o botão **Prêmios** abre `openPrizeTable()`.
- `tests/patterns.test.js`:
  - cada padrão é detectado com exatamente a sua máscara marcada;
  - com a cartela toda marcada, `bestPattern` é `full`;
  - nada marcado dá `null`;
  - só os cantos dão `corners`; uma linha inteira dá `line`;
  - linhas 0 e 2 dão `twoLines`;
  - o exemplo "A sozinha" da seção 6 dá `twoLines`, e `improvingCells` dá `[14]`.
- `tests/payout.test.js`:
  - os acertos de E2 da seção 6 (4000 e 246);
  - uma cartela desligada aparece como `null` e não soma.

## Não fazer nesta sessão

Bolas extras (sessão 05), sons, voz e ajustes.

## Critérios de aceite

- `node --test` passa e a tabela `PATTERNS` bate com o DESIGN.
- Ganhar uma Linha com aposta 2 soma 10 créditos e mostra o aviso.
- Fechar a aba no meio do sorteio e abrir de novo: a rodada é acertada e o aviso de rodada
  anterior aparece.
- A janela Prêmios mostra os 8 desenhos com os valores da aposta atual.

## Conferência manual

1. Jogue algumas rodadas. Quando forma uma Linha ou os Cantos, o rodapé da cartela mostra?
2. As casas que faltam para um prêmio maior ficam com a borda amarela pulsando?
3. O aviso "Você ganhou X créditos!" aparece e os créditos sobem?
4. Abra Prêmios. Os desenhos estão claros?
5. Feche o navegador no meio do sorteio e abra de novo. Aparece "Sua rodada anterior foi
   concluída"?
