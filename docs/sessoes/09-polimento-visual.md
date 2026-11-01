# Sessão 09: polimento visual e sonoro (final, com Opus)

## Objetivo

Deixar o jogo muito mais bonito e animado, com cara de vídeo bingo de cassino: cores vivas,
brilho, luzes, animações suaves e sons mais ricos. **A funcionalidade das sessões 01–08 e as
regras do DESIGN.md não mudam.**

## Permissão expressa do dono do projeto

Nesta sessão pode-se pesquisar e se inspirar fielmente no **Dr. Bingo**, no **Mexe Mexe** e no
**Miaudoku** (cores, luzes, bolas, animações, sons, clima geral), apesar da regra geral do
CLAUDE.md, que registra essa exceção. Vale só para aparência e som: as regras do jogo continuam
as do DESIGN.md, e tudo é recriado em CSS/WebAudio, sem baixar imagens, fontes ou áudios.

## Estado atual (sessões 01–07 prontas e conferidas)

- Visual hoje: o básico do DESIGN.md (fundo azul-noite chapado, cartelas cremes, botões simples).
- Arquivos de UI: `css/style.css`, `src/ui/{topbar,ballboard,cards,controls,modals,sound}.js`.
  Lógica da rodada em `src/round.js` (não mexer na lógica; só ligar efeitos).
- Testes: `node --test` (26). Conferência no navegador: `scripts/e2e/t02..t07.mjs`.

## O que fazer

1. Pesquisar as três referências e anotar no PROGRESSO.md o que será aproveitado (só aparência
   e som, nada de regra).
2. **Visual:** fundo com gradiente e brilho; topbar e botões com relevo e brilho; cartelas com
   moldura e profundidade; bolas 3D (reflexo, sombra) com animação de saída do globo e rolagem
   até a posição; marcação de casa com efeito (carimbo/brilho); casas quentes mais chamativas
   (sem piscar rápido); luzes decorativas lentas na moldura; painel de bola extra e botão de
   Adicionar mais "de cassino"; aviso de prêmio com confete maior, número grande animado e
   brilho; janelas Prêmios e Ajustes no mesmo estilo.
3. **Som (WebAudio, sem arquivos):** timbres mais ricos (bola com ataque e eco curtos, "tic"
   de marcação, arpejo de vitória mais festivo e escalonado por tamanho do prêmio, clique de
   botão, som de bola extra). Volume moderado, sem estalos, respeitando `settings.sound`.
4. **Texto grande:** revisar o layout com Texto grande ligado em 360×740 (hoje as cartelas
   ficam 1 por linha e `#cards` rola); melhorar sem diminuir os números.
5. Revisar espaços: o ideal é as 4 cartelas e os controles aparecerem em 360×740 sem rolagem
   com texto normal; se não couber, só `#cards` rola.

## Regras que continuam valendo

- Nada piscando rápido (no máximo 1 ciclo por segundo, e só em itens pequenos); respeitar
  `prefers-reduced-motion` (desligar confete e pulsos, trocar por cor estática).
- Contraste de texto ≥ 4,5:1; números das cartelas ≥ 1,1 rem em bold; botões ≥ 48 px;
  JOGAR ≥ 4 rem; textos na tela em português do Brasil.
- Nada que pareça compra (sem "R$", "comprar", "pagar", "loja"…); Adicionar sempre visível e
  grátis; nenhum link externo, nenhuma chamada de rede; tudo offline.
- `src/engine/` não muda. Sorteio continua em `crypto.getRandomValues`.
- Só `src/state.js` mexe no `localStorage`. Unidades em `rem`. Sem dependências, sem build.
- Se criar/alterar arquivos do app: aumentar `CACHE` em `sw.js` (v1 → v2) e manter `ASSETS`
  completo (`tests/assets.test.js` confere).

## Critérios de aceite (confira você mesmo, de forma automática)

- `node --test` passa e todos os `scripts/e2e/t02..t07.mjs` continuam sem `FAIL` (ajuste um
  teste só se o seletor visual mudou, sem enfraquecer a verificação).
- Capturas de tela em 360×740 e 430×900, no estado inicial, durante o sorteio, na fase de
  extra e no aviso de prêmio, com Texto grande desligado e ligado. Olhe cada uma e corrija o que
  estiver cortado, ilegível ou feio.
- Checklist de termos proibidos e de links externos do `docs/sessoes/08-publicar-e-instalar.md`
  limpo.
- Anotar no PROGRESSO.md o que mudou. No fim, dizer só o que não dá para verificar sozinho
  (som real, toque no celular, impressão geral do visual).
