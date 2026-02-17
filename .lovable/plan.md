

# Player Split View - Estilo YouTube/IPTV Profissional

## Visao Geral

Refatorar completamente a pagina `/player` para um layout de visualizacao dividida com o video fixo no topo e conteudo rolavel (lista de canais + EPG) na parte inferior, similar ao YouTube e apps IPTV profissionais.

## Arquitetura do Layout

```text
+----------------------------------+
|  [<] Titulo do Canal             |  Header overlay (z-20)
|----------------------------------|
|                                  |
|        VIDEO PLAYER              |  height: 35vh
|        (HLS.js / HTML5)          |  bg: black, z-10
|                                  |
|  [play/pause]  [fullscreen]      |  Controles customizados
|==================================|
|                                  |
|  EPG - Programa Atual            |  overflow-y: auto
|  Proximos programas...           |  flex-grow: 1
|                                  |
|  --- Lista de Canais ---         |
|  [icon] Canal 1          [LIVE]  |
|  [icon] Canal 2          [LIVE]  |
|  [icon] Canal 3          [LIVE]  |
|  ...                             |
+----------------------------------+
```

## Mudancas Necessarias

### 1. Ampliar dados passados via navigation state

Atualizar `LiveTvPage.tsx` para enviar junto com a URL do stream, tambem o `streamId`, `categoryId`, e opcionalmente a lista de canais da mesma categoria, permitindo que o player mostre a lista de canais abaixo do video.

### 2. Reescrever `PlayerPage.tsx` com Split View

- **Container principal**: `h-screen flex flex-col overflow-hidden` (sem scroll na pagina inteira)
- **Topo (Player)**: `w-full h-[35vh] bg-black relative z-10` com a tag `<video>` usando `width: 100%; height: 100%; object-fit: contain`
- **Baixo (Conteudo)**: `flex-1 overflow-y-auto` contendo EPG e lista de canais
- **Playback**: Usar HLS.js para streams `.ts`/`.m3u8` (funciona sem CORS no WebView Android) e HTML5 nativo para VOD (`.mp4`, `.mkv`)
- **Sem fullscreen automatico**: Video inicia inline; botao de expandir manual usando `videoElement.requestFullscreen()`
- **Controles**: Play/pause, barra de progresso (para VOD), botao fullscreen
- **Trocar canal**: Clicar em outro canal na lista abaixo troca o stream no player sem navegar para outra pagina

### 3. Esconder BottomNav na rota `/player`

Atualizar `App.tsx` para nao renderizar `<BottomNav />` quando a rota ativa for `/player`.

### 4. Reutilizar componente `EpgSection`

O componente existente ja esta pronto e sera incluido na area scrollavel abaixo do video quando o tipo for `live`.

### 5. Proxy condicional para web preview

Manter o proxy via Edge Function apenas no ambiente web (preview do Lovable). No Android nativo (WebView), usar URLs diretas sem proxy, ja que o WebView nao tem restricao de CORS.

## Detalhes Tecnicos

### PlayerPage.tsx - Estrutura principal

```text
PlayerPage
  - state: { url, title, streamId?, type?, categoryId?, streams? }
  - useRef<HTMLVideoElement> para controlar o video
  - useEffect para inicializar HLS.js ou src direto
  - Container: h-screen flex flex-col overflow-hidden
    - VideoContainer: h-[35vh] w-full bg-black relative z-10
      - <video> com w-full h-full object-fit-contain
      - Overlay de controles (play/pause, fullscreen)
      - Header overlay com botao voltar e titulo
    - ContentContainer: flex-1 overflow-y-auto bg-background
      - EpgSection (se tipo === 'live')
      - ChannelList (lista de canais da mesma categoria)
```

### LiveTvPage.tsx - Dados expandidos

```text
handlePlay(stream) {
  navigate('/player', {
    state: {
      url,
      title: stream.name,
      streamId: stream.stream_id,
      type: 'live',
      categoryId: stream.category_id,
      // streams da mesma categoria para lista abaixo
    }
  });
}
```

### App.tsx - Esconder BottomNav

```text
// Dentro de AuthenticatedRoutes:
const location = useLocation();
const hideNav = location.pathname === '/player';

return (
  <>
    <Routes>...</Routes>
    {!hideNav && <BottomNav />}
  </>
);
```

### CSS do video (inline no componente)

```text
video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}
```

### HLS.js - Inicializacao

```text
// Para streams ao vivo (.ts ou .m3u8)
if (Hls.isSupported()) {
  hls = new Hls({ enableWorker: true, lowLatencyMode: true });
  hls.loadSource(url);
  hls.attachMedia(videoEl);
} else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
  videoEl.src = url; // Safari nativo
}

// Para VOD (.mp4, .mkv)
videoEl.src = url;
```

### Controles customizados

- Botao play/pause com icone toggle
- Botao fullscreen que chama `videoRef.current.requestFullscreen()` manualmente
- Barra de progresso para VOD (nao para live)
- Auto-hide dos controles apos 3 segundos de inatividade

## Resultado Esperado

- Video toca inline no topo (35vh) sem fullscreen automatico
- Abaixo do video: EPG do canal atual + lista de canais da mesma categoria
- Trocar de canal atualiza o player sem sair da pagina
- Botao de fullscreen disponivel para o usuario expandir manualmente
- Background preto no container do video evita claroes
- z-index correto impede sobreposicao entre video e lista
- BottomNav escondida durante a reproducao
