# Sessão 19 — Jogo do Faraó (pirâmides)

Referência (foto do Victor, **só no computador dele, não vai para o git**: tem mão na foto): `prints/referencias/farao.jpeg`.
Não copiar arte nem nome do jogo real: recriar por CSS/WebAudio. Nome do modo na tela: **"Faraó"** (confirmar).

## Como começar (fluxo da fábrica)
1. Ler CLAUDE.md, DESIGN.md, PROGRESSO.md e este arquivo.
2. **Perguntas ao Victor com exemplos para marcar** (abaixo) → **mock HTML aberto no Safari** → "pode seguir" → motor + testes → tela → conferência → publicar.
3. Não programar a tela antes do "pode seguir".

## O que a foto mostra (o que já dá para afirmar)
- **4 pirâmides** de tijolos, cada uma com **15 números** em 5 fileiras: 1, 2, 3, 4 e 5 números (do topo para a base).
- Números maiores que 60: aparecem até **89/90**, então a bola vai de **1 a 90** neste modo (no bingo atual é 1–60).
  Cada fileira tem números em ordem crescente (ex.: topo 3; depois 5 12; 18 20 27; 31 33 43 52; 53 60 62 73 89).
- Tabela de prêmios (multiplicam a aposta): **BINGO ×1000**, **3 LADOS ×200**, **2 LADOS ×70**, **1 LADO ×3**.
  "Lado" = uma das 3 bordas do triângulo (esquerda, direita, base); bingo = a pirâmide inteira.
- Aposta mostrada: 5.000 por pirâmide (aposta total 20.000). Cenário egípcio: pedra, hieróglifos, dourado, faraó/deusa alada.
- Barra de baixo igual à do bingo (aposta, saldo, JOGAR), então dá para reaproveitar `controls`, saldo e aposta.

## O que NÃO sabemos (perguntar, não inventar)
1. Quantas bolas saem por rodada (30 como no bingo? mais, já que são 90 números)? Há bolas extras?
2. Os 3 lados contam só as bordas (esquerda, direita, base)? Os cantos contam nos dois lados vizinhos? Os números do meio contam?
3. Paga só o maior prêmio por pirâmide (como no bingo)?
4. Valores: usar os degraus de aposta atuais (1 a 1.000) e a mesma moeda "USD"; **o RTP/odds** é nosso (decidir probabilidade para o jogo não ser nem impossível nem de graça demais — a mesma regra de "não pagar demais" do bingo atual).
5. Visual do mock: fundo de tijolos escuros com hieróglifos em CSS, pirâmide com tijolos claros, bola atual como "moeda/escaravelho"? Mostrar 2 opções para marcar.
6. Quantas pirâmides: sempre 4, ou 1–4 como o bingo tem 1–8 cartelas?

## Escolha do modo (fácil)
- A tela de escolha entre **Bingo** e **Faraó** (e depois **Sequência**, ver `20-sequencia.md`) é feita junto desta sessão, porque
  é a primeira vez que existem 2 modos. Proposta: 2 botões grandes logo abaixo do topo ("Bingo" | "Faraó"); lembra o último usado.
  Saldo, aposta e conta/nuvem **compartilhados** entre os modos (mesmo `credits`).
- Cuidado com a nuvem: estado é um documento só (`sharedAt`); se o Faraó tiver estatísticas próprias, entram no mesmo documento sem quebrar `mesclar.js`.

## Regras técnicas (as do projeto)
- Motor puro em `src/engine/` (ex.: `pyramid.js`: gerar pirâmide, detectar lados, prêmio) com testes `node:test`; sorteio com `rng.js` (nunca `Math.random`).
- Tela em `src/ui/`; sem build; texto em português; "USD", sem palavras de compra; Adicionar sempre grátis.
- Aumentar `CACHE` do `sw.js` e manter `ASSETS` completo; atualizar PROGRESSO.
- Layout: coluna de celular (já limitada em `#app`), 360×740 sem rolagem, números grandes, toque (idoso primeiro).

## Aceite
Escolher Faraó em 1 toque; jogar uma rodada completa; prêmios pagos conforme a tabela; saldo compartilhado com o Bingo; testes do motor;
conferência automática (scripts e2e novos `t08`) e prints 360×740, 390×844, 440×800.
