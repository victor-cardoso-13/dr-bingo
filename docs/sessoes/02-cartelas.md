# Sessão 02: cartelas, aposta e Trocar cartelas

## Objetivo

Mostrar as 4 cartelas na grade 2×2, com números válidos. Também liga e desliga cartelas,
ajusta a aposta e troca as cartelas. Tudo fica salvo. Ainda não tem sorteio.

## Criar / alterar

- `src/engine/cards.js`: `generateCard`, `generateCards` e `markedCells`, conforme as seções
  2 e 10 do DESIGN.
- `src/state.js`:
  - se `cards` for `null` ao carregar, gere 4 cartelas e salve;
  - ações `toggleCard(i)` (respeita o mínimo de 1 ligada), `stepBet(+1|-1)` (degraus
    `[1,2,3,5,10,20,50]`) e `newCards()`;
  - exporte `BET_STEPS`.
- `src/ui/cards.js`: `renderCards(root)`.
  - Cada cartela tem um cabeçalho tocável "Cartela N" com `aria-pressed` ligado/desligado,
    a grade 3×5 de números e um rodapé com "—" (o prêmio vem na sessão 04).
  - Cada casa leva `data-index` e `data-number`, para as sessões seguintes marcarem.
  - A cartela desligada fica com opacidade 0,4.
  - Os números ficam grandes e bold: **no mínimo 1,1 rem**, nunca menos. Cada cartela tem
    cerca de 10,5 rem de largura (2 por linha em 360 px).
  - **Leitura vem antes de caber na tela:** se não couber, só a região `#cards` rola
    verticalmente. A topbar, a bola e os controles ficam fixos.
- `src/ui/controls.js`: `renderControls(root)`.
  - Linha "Aposta [−] valor [+]" e "Total: X", que é a aposta × as ligadas.
  - Botões **Prêmios** (sem ação por enquanto) e **Trocar cartelas**.
  - Botão grande **JOGAR**, sem ação por enquanto, com pelo menos 4 rem de altura.
  - JOGAR mostra "Adicione créditos" e fica desabilitado quando os créditos não cobrem o
    total. Nesse caso, o botão Adicionar da topbar ganha a classe `pulse`.
- `src/main.js`: troca os espaços reservados de cartelas e controles pelos componentes.
- `tests/cards.test.js`, usando `makeSeededRandomInt`:
  - em 1.000 cartelas geradas: 15 números, todos diferentes, cada coluna `c` dentro de
    `12c+1..12c+12` e crescente de cima para baixo;
  - `generateCards(4)` devolve 4;
  - `markedCells` marca exatamente os números que estão no `Set`.

## Não fazer nesta sessão

Sorteio, prêmios, bolas extras e sons.

## Critérios de aceite

- `node --test` passa.
- As 4 cartelas aparecem em 360×740 com números de pelo menos 1,1 rem, de preferência sem
  rolagem. Se precisar rolar, só `#cards` rola.
- Ligar e desligar respeita o mínimo de 1 ligada e o Total se atualiza.
- A aposta anda nos degraus certos e para no 1 e no 50.
- Trocar cartelas muda os números e salva. Depois de recarregar, as mesmas cartelas
  continuam.

## Verificação

```bash
node --test
python3 -m http.server 8080
```

## Conferência manual

1. As cartelas estão fáceis de ler no celular?
2. Toque em "Cartela 2" para desligar. Ela fica apagada e o Total cai?
3. Tente desligar as 4. A última não desliga?
4. Ponha a aposta em 50 com as 4 ligadas (Total 200). Funciona?
5. Toque em Trocar cartelas e recarregue. As cartelas novas continuam lá?
