

# Corrigir configuracao Video.js v8: `hls` para `vhs`

## Problema
O Video.js v8 usa o namespace `vhs` (Video.js HTTP Streaming) em vez de `hls` para configuracao do motor de streaming. A configuracao atual usa `hls`, que e ignorada silenciosamente, fazendo o player cair no modo nativo do Android (que falha com streams HTTP/HLS).

## Alteracoes no arquivo `src/pages/PlayerPage.tsx`

### 1. Corrigir o objeto de configuracao html5 (linhas 101-108)

Substituir:
```text
html5: {
  hls: {
    overrideNative: true,
    enableLowInitialPlaylist: true,
  },
  nativeAudioTracks: false,
  nativeVideoTracks: false,
},
```

Por:
```text
html5: {
  vhs: {
    overrideNative: true,
    enableLowInitialPlaylist: true,
    useDevicePixelRatio: true,
  },
  nativeAudioTracks: false,
  nativeVideoTracks: false,
},
```

### 2. Classes CSS no elemento video (linha 90-91)

As classes `vjs-big-play-centered` e `vjs-fill` ja estao presentes no codigo atual (linha 91), entao nenhuma alteracao e necessaria neste ponto.

## Resumo

Uma unica alteracao cirurgica: trocar `hls` por `vhs` e adicionar `useDevicePixelRatio: true` na configuracao do player. As classes CSS ja estao corretas.
