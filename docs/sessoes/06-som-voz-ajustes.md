# Sessão 06: sons, voz, tela acesa, ajustes e acessibilidade

## Objetivo

Deixar o jogo gostoso e confortável para a vovó, com sons, voz falando os números, a tela
sem apagar no meio da rodada, a janela de **Ajustes** e o texto grande.

## Criar / alterar

- `src/ui/sound.js`:
  - `unlockAudio()` cria ou retoma o `AudioContext`; chame no primeiro `pointerdown` da
    página;
  - `playBall()`, `playMark()`, `playWin()` e `playClick()`, todos com
    `OscillatorNode` + `GainNode` e envelope curto (sem estalos: rampa de ganho até 0);
  - respeitam `settings.sound`;
  - volume moderado, com ganho máximo de cerca de 0,2.
- `src/ui/voice.js`:
  - `speakNumber(n)` usa `speechSynthesis` com uma voz cujo `lang` começa com `pt` (de
    preferência `pt-BR`);
  - as vozes podem carregar depois: escute `voiceschanged`;
  - sem voz pt, não fala;
  - chama `cancel()` antes de cada fala;
  - não fala se `settings.voice` estiver desligado ou se a velocidade efetiva for
    `"rapido"`;
  - `rate` 0,9;
  - `unlockVoice()`: o Safari do iPhone só fala a partir de um timer se a fala já tiver sido
    iniciada uma vez dentro de um toque. No handler do JOGAR, chame
    `speechSynthesis.speak(new SpeechSynthesisUtterance(''))` uma vez, antes de agendar as
    bolas.
- `src/ui/wakelock.js`: `keepAwake()` e `release()`, com `navigator.wakeLock` quando existir
  e ignorando erros. Quando a página volta a ficar visível no meio de uma rodada, peça de
  novo.
- `src/round.js`, ligando os sons e a voz:
  - `playBall` + `speakNumber` a cada bola;
  - `playMark` quando a bola marcou alguma cartela ligada;
  - `playWin` quando o total é maior que 0;
  - `keepAwake` no JOGAR e `release` no result.
- `src/ui/modals.js`: `openSettings()`, com o conteúdo da seção 7 do DESIGN.
  - Cada opção é um grupo de botões grandes, sem `<select>` pequeno. Exemplos:
    `[Lento] [Normal] [Rápido]` e `[Ligado] [Desligado]`.
  - Zerar estatísticas tem confirmação Sim/Não.
- `src/ui/topbar.js`: o ⚙ abre `openSettings()`.
- `src/state.js` + `src/main.js`: `settings.bigText` liga a classe `big-text` no `<html>` na
  hora e ao carregar.
- Revisão de acessibilidade em todos os componentes:
  - `aria-label` nos botões só com ícone;
  - `aria-live="polite"` no contador de bolas e nos créditos;
  - foco visível (`:focus-visible` com contorno de 3 px);
  - `prefers-reduced-motion` desliga o confete e os pulsos (troca por mudança de cor
    estática).
- Confira com "Texto grande" ligado em 360×740. Vale a regra da sessão 02: se não couber,
  só `#cards` rola, sem diminuir os números.

## Não fazer nesta sessão

PWA, manifest, ícones, service worker e publicação.

## Critérios de aceite

- `node --test` continua passando.
- No primeiro toque, os sons funcionam (inclusive no Safari do iPhone).
- Os números são falados em português quando há voz pt e não são falados no rápido.
- Desligar Sons/Voz funciona na hora e fica salvo.
- Texto grande aumenta tudo e fica salvo.
- A tela não apaga durante a rodada, em navegadores com Wake Lock.

## Conferência manual

1. Jogue uma rodada com o volume do celular ligado. Ouve os sons e os números falados?
2. Em Ajustes, troque a velocidade para Lento. Ficou mais devagar?
3. Ligue o Texto grande. Ficou mais fácil de ler e ainda cabe na tela?
4. Desligue a Voz e jogue. Fica em silêncio, mas com sons?
5. Zerar estatísticas pede confirmação?
