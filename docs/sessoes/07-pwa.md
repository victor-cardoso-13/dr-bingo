# Sessão 07: PWA (ícone na tela inicial e funcionar offline)

## Objetivo

Deixar o app instalável como "aplicativo" no Android e no iPhone e funcionando sem internet.

## Criar / alterar

- `scripts/make_icons.py`: gera os ícones **só com a biblioteca padrão do Python** (`zlib` +
  `struct` escrevendo PNG). Não dependa de Pillow nem de ImageMagick, que não estão
  instalados.
  - Desenho: fundo azul-noite `#14213d`; uma bola amarela `#fcbf49` grande no centro; um
    círculo branco interno; e um anel laranja `#f77f00`. Sem texto.
  - Antialiasing por supersampling 4×4.
  - Saídas em `icons/`:
    - `icon-192.png`, `icon-512.png`;
    - `icon-maskable-512.png`, com a bola dentro dos 80% centrais (zona segura);
    - `apple-touch-icon.png` (180×180, sem transparência).
  - Rode com `python3 -I scripts/make_icons.py`.
- `manifest.webmanifest`:
  - `name` "Bingo da Vovó", `short_name` "Bingo";
  - `start_url` "./", `scope` "./", `display` "standalone", `orientation` "portrait";
  - `background_color` e `theme_color` `#14213d`, `lang` "pt-BR";
  - os 3 ícones, o maskable com `"purpose": "maskable"`.
- `index.html`:
  - `<link rel="manifest">` e `<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`;
  - `<meta name="apple-mobile-web-app-capable" content="yes">` e
    `<meta name="mobile-web-app-capable" content="yes">`;
  - `<meta name="apple-mobile-web-app-title" content="Bingo">`;
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`.
- `sw.js`:
  - `const CACHE = 'bingo-vovo-v1'` e a lista `ASSETS` com **todos** os arquivos do app
    (html, css, todos os `src/**/*.js`, manifest e ícones);
  - `install`: `caches.open(CACHE).addAll(ASSETS)` + `self.skipWaiting()`;
  - `activate`: apaga caches com outro nome + `clients.claim()`;
  - `fetch`: cache-first para GET da mesma origem, com fallback para a rede; para navegação
    sem cache, devolve `index.html` do cache.
  - Comentário no topo: **"Toda vez que mudar qualquer arquivo do app, aumente o número em
    CACHE (v1 → v2…) e atualize ASSETS"**.
- **Caminhos sempre relativos** (`./…`), nunca começando com `/`, porque no GitHub Pages o
  site fica em `/bingo-da-vovo/`. Vale para as entradas de `ASSETS`, os ícones do manifest,
  os `<link>` do `index.html` e o `register('./sw.js')`.
- `src/main.js`:
  - registre o service worker **só se** `'serviceWorker' in navigator`. Pelo IP da rede
    (`http://192.168…`) ele não existe, e o jogo não pode quebrar;
  - registre depois da primeira renderização;
  - em `localhost`/`127.0.0.1` **sem** `?sw=1`: não registre. Em vez disso, cancele os
    registros que existirem (`getRegistrations()` → `unregister()`) e apague os caches cujo
    nome começa com `bingo-vovo-`. Assim um teste com `?sw=1` não deixa código velho preso
    no desenvolvimento;
  - recarregue a página em `controllerchange` **só se**
    `navigator.serviceWorker.controller` já existia quando a página abriu. Isso evita
    recarregar na primeira visita. Recarregue no máximo uma vez.
- `tests/assets.test.js`:
  - lê `sw.js`, extrai `ASSETS` e confere que todo arquivo listado existe no disco;
  - confere que nenhum caminho em `ASSETS` nem no `manifest.webmanifest` começa com `/`;
  - confere que todo `.js` em `src/` está na lista (para não esquecer arquivo novo).
- `CLAUDE.md`: acrescente na seção "Como trabalhar" a regra de aumentar a versão do
  `CACHE` em `sw.js` sempre que mudar um arquivo do app.

## Não fazer nesta sessão

Publicar na internet (sessão 08) e mudanças de regra de jogo.

## Critérios de aceite

- `node --test` passa, incluindo o teste de assets.
- Em `http://localhost:8080/?sw=1`:
  - DevTools → Application → Manifest sem erros, com ícones aparecendo;
  - o Service Worker fica "activated";
  - em modo Offline (aba Network), recarregar continua abrindo o jogo.
- O Lighthouse (aba Lighthouse, categoria PWA ou "Installable") não acusa erro de
  instalação.

- Depois do teste com `?sw=1`, abrir `localhost:8080` sem o parâmetro desregistra o service
  worker (DevTools → Application → Service Workers fica vazio).
- Pelo IP da rede (`http://IP-DO-MAC:8080`), o jogo abre sem erro no console.

## Conferência manual

1. Abra `icons/icon-512.png` no Finder. O ícone ficou bonito?
2. No Chrome do computador, em `localhost:8080/?sw=1`, aparece o ícone de instalar na barra
   de endereço?
3. Ligue o modo offline no DevTools e recarregue. O jogo abre?
