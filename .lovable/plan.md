
# Reescrever PlayerPage.tsx para usar hls.js inline (sem fullscreen nativo)

## Contexto

O arquivo atual (`PlayerPage.tsx`) usa o plugin nativo `@capgo/capacitor-video-player` que forca fullscreen no Android e causa tela preta quando desativado. O usuario quer um player inline usando exclusivamente `hls.js` via proxy, sem nenhum fallback nativo.

## O que sera feito

Reescrever **apenas** `src/pages/PlayerPage.tsx`:

1. **Remover** toda logica do plugin `@capgo/capacitor-video-player` (imports, `initPlayer`, `stopAllPlayers`)
2. **Remover** import do `Capacitor`
3. **Adicionar** import de `hls.js` e `useCallback`/`useRef`
4. **Adicionar** refs: `videoRef` (HTMLVideoElement) e `hlsRef` (Hls instance)
5. **Criar funcao `initPlayer`** que:
   - Destroi instancia anterior do hls.js
   - Reseta o elemento `<video>` completamente
   - Constroi URL via proxy usando `VITE_SUPABASE_URL` + `/functions/v1/iptv-proxy?url=...`
   - Cria instancia Hls com configuracao robusta (timeouts, retries, buffer)
   - Usa exclusivamente `hls.attachMedia()` + `hls.loadSource()` -- zero fallback nativo
   - Trata erros fatais (NETWORK_ERROR -> retry, MEDIA_ERROR -> recover)
6. **Substituir elemento `<video>`** com atributos inline: `playsInline`, `controls`, `muted`, `autoPlay`, `controlsList="nofullscreen nodownload noremoteplayback"`, `disablePictureInPicture`
7. **Manter** layout, CSS, navegacao, header com botao voltar, estados de loading/error e botoes "Tentar novamente"/"Voltar" exatamente como estao

## Detalhes tecnicos

### Proxy URL
Sera construida dinamicamente a partir de `VITE_SUPABASE_URL`:
```text
const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const streamUrl = `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
```

### Configuracao hls.js
```text
new Hls({
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90,
  maxBufferLength: 60,
  maxMaxBufferLength: 120,
  startLevel: -1,
  capLevelToPlayerSize: true,
  manifestLoadingTimeOut: 20000,
  manifestLoadingMaxRetry: 6,
  levelLoadingTimeOut: 20000,
  levelLoadingMaxRetry: 6,
  fragLoadingTimeOut: 20000,
  fragLoadingMaxRetry: 6,
})
```

### Elemento video
```text
<video
  ref={videoRef}
  className="w-full h-full object-contain bg-black"
  autoPlay muted controls playsInline
  disablePictureInPicture
  controlsList="nofullscreen nodownload noremoteplayback"
/>
```

### Garantias
- Nenhum `video.src = ...` em nenhum lugar do arquivo
- Nenhum `canPlayType` ou fallback nativo
- Player nunca abre fullscreen automaticamente
- Funciona no Android WebView, Capacitor e preview web

## Arquivos modificados
- `src/pages/PlayerPage.tsx` -- unico arquivo alterado

## Nenhuma outra alteracao
- Sem mudancas em CSS, layout, navegacao, logica de canais ou proxy
