# Bingo da Vovó

Vídeo bingo original para celular, com **créditos grátis e infinitos**: o botão
"+ Adicionar" coloca 1.000 créditos a cada toque. Não tem dinheiro de verdade, compras,
anúncios nem links. Funciona offline e é instalado como ícone na tela do celular (PWA).

- Regras e telas: [docs/DESIGN.md](docs/DESIGN.md)
- Regras para o Claude: [CLAUDE.md](CLAUDE.md)
- Andamento: [docs/PROGRESSO.md](docs/PROGRESSO.md)

## Como construir, sessão por sessão (com Sonnet)

São 9 sessões, nesta ordem (a 09 é o polimento visual e sonoro, no final, com Opus). Cada uma termina com o jogo funcionando e com uma lista de
coisas para você testar.

| # | Sessão | Arquivo |
|---|--------|---------|
| 01 | Base, créditos e botão Adicionar | [docs/sessoes/01-base.md](docs/sessoes/01-base.md) |
| 02 | Cartelas, aposta e Trocar cartelas | [docs/sessoes/02-cartelas.md](docs/sessoes/02-cartelas.md) |
| 03 | Sorteio das 30 bolas | [docs/sessoes/03-sorteio.md](docs/sessoes/03-sorteio.md) |
| 04 | Prêmios e pagamento | [docs/sessoes/04-premios.md](docs/sessoes/04-premios.md) |
| 05 | Bolas extras | [docs/sessoes/05-bolas-extras.md](docs/sessoes/05-bolas-extras.md) |
| 06 | Sons, voz e ajustes | [docs/sessoes/06-som-voz-ajustes.md](docs/sessoes/06-som-voz-ajustes.md) |
| 07 | PWA: ícone e offline | [docs/sessoes/07-pwa.md](docs/sessoes/07-pwa.md) |
| 08 | Publicar e instalar no celular | [docs/sessoes/08-publicar-e-instalar.md](docs/sessoes/08-publicar-e-instalar.md) |
| 09 | Polimento visual e sonoro | [docs/sessoes/09-polimento-visual.md](docs/sessoes/09-polimento-visual.md) |

Para cada sessão:

1. Abra uma **conversa nova** no Claude Code, nesta pasta.
2. Digite `/model sonnet`.
3. Cole o pedido abaixo, trocando o número e o nome do arquivo:

   ```
   Leia CLAUDE.md, docs/DESIGN.md, docs/PROGRESSO.md e docs/sessoes/01-base.md.
   Execute somente essa sessão e, no final, me passe a conferência manual.
   ```

4. Faça a **conferência manual** que ele passar. Se algo estiver errado, peça a correção na
   mesma conversa. Só passe para a próxima sessão quando estiver tudo certo.

## Testar no computador

```bash
node --test                  # testes automáticos
python3 -m http.server 8080  # depois abra http://localhost:8080
```

No celular, pela mesma rede Wi-Fi, abra `http://IP-DO-MAC:8080`. O jogo roda, mas instalar
como ícone e usar offline só funciona depois de publicado em HTTPS (sessão 08).

## Como instalar no celular da vovó

Primeiro o jogo precisa estar publicado num endereço **HTTPS** (veja a sessão 08).

**Android (Chrome)**

1. Abra o endereço no Chrome.
2. Toque nos ⋮ (três pontinhos) → **Instalar app**, ou **Adicionar à tela inicial**.
3. Confirme. O ícone "Bingo" aparece na tela inicial.

**iPhone (precisa ser o Safari)**

1. Abra o endereço no **Safari**.
2. Toque no botão **Compartilhar** (quadrado com seta para cima).
3. Role e toque em **Adicionar à Tela de Início** → **Adicionar**.

**Dicas**

- Ela deve abrir **sempre pelo ícone**, não pelo navegador. No iPhone, sites abertos no
  Safari podem perder os dados salvos; pelo ícone, isso não acontece.
- Para ela não cair no jogo pago de novo: tire o ícone e o atalho do site antigo da tela
  inicial e ponha o "Bingo" no mesmo lugar. Vale também tirar o cartão salvo do navegador e
  das lojas de aplicativos.
- **Atualizar o jogo depois:** mude o código, aumente o `CACHE` em `sw.js` e publique de
  novo. No celular, basta abrir o app com internet uma vez: ele se atualiza sozinho e
  recarrega.
