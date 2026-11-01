# Sessão 08: publicar em HTTPS e instalar no celular da vovó

## Objetivo

Colocar o jogo num endereço **HTTPS**, porque instalar e usar offline só funciona assim, e
escrever o passo a passo de instalação no celular.

## ⚠️ Pare e pergunte antes de publicar

Publicar deixa o jogo acessível na internet. **Não publique nada sem o usuário escolher a
opção e confirmar.** Comece assim:

1. Rode `node --test` e confira o checklist final abaixo.
2. Verifique o que existe na máquina: `gh --version && gh auth status`,
   `npx --no-install netlify --version` e `firebase --version`. Não instale nada sem
   perguntar.
3. Apresente as opções e **pergunte qual usar**:
   - **GitHub Pages** (recomendado se o `gh` estiver logado): grátis, endereço tipo
     `usuario.github.io/bingo-da-vovo`. Em conta grátis, o repositório precisa ser
     **público**. O código não tem nada pessoal, mas confirme com o usuário.
   - **Netlify**: grátis, precisa de conta. Dá para arrastar a pasta em app.netlify.com/drop
     e depois "reivindicar" o site na conta, senão ele expira.
   - **Firebase Hosting**: grátis, precisa de conta Google e do `firebase` CLI.
4. Antes de publicar:
   - aumente a versão do `CACHE` em `sw.js`;
   - confira que a lista de publicação tem só os arquivos do app: `index.html`,
     `manifest.webmanifest`, `sw.js`, `css/`, `src/` e `icons/`;
   - deixe de fora `docs/`, `tests/`, `scripts/`, `CLAUDE.md` e `package.json`, a não ser
     que o host exija o repositório inteiro (GitHub Pages publica o repo; tudo bem, é
     inofensivo).
5. Publique só depois do "pode publicar" do usuário. Abra a URL e confira que carrega em
   HTTPS sem erros.

## Escrever no README.md a seção "Como instalar no celular da vovó"

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

## Checklist final, antes de publicar

- [ ] `node --test` passa.
- [ ] Nenhum texto com "R$", "comprar", "pagar", "depósito", "saque", "loja" ou "oferta".
      Confira com `grep -rniE 'R\$|compr|pagar|dep[oó]sito|saque|loja|oferta' index.html src css`.
- [ ] Nenhum link externo: `grep -rnE 'https?://' index.html src css sw.js manifest.webmanifest`
      não pode achar URLs de fora.
- [ ] O jogo completo funciona: créditos, Adicionar, cartelas, sorteio, prêmios, extras,
      sons, voz e ajustes.
- [ ] Offline funciona depois da primeira visita.

## Conferência manual (no celular dela)

1. O ícone "Bingo" aparece na tela inicial e abre em tela cheia, sem barra do navegador?
2. Ative o modo avião e abra pelo ícone. O jogo funciona?
3. Ela consegue sozinha: tocar Adicionar, mudar a aposta, jogar e pedir bola extra?
4. O som e a voz estão num volume bom?
