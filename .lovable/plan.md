

# Trocar HLS.js por Player Nativo do video HTML5

## Resumo

Remover completamente o HLS.js e usar o elemento `<video>` nativo do navegador para reproduzir streams. No preview web, a URL passa pelo proxy (iptv-proxy) para resolver CORS. No APK nativo, usa URL direta (zero latencia).

## Mudancas

### 1. `src/pages/PlayerPage.tsx` - Reescrita do player

**Remover:**
- `import Hls from 'hls.js'`
- Toda logica de `new Hls()`, `hls.loadSource`, `hls.attachMedia`, `hls.on`, `hlsRef`
- Referencia `Hls.isSupported()`, `Hls.Events`, `Hls.ErrorTypes`

**Manter/Ajustar:**
- Import do Capacitor (ja existe)
- `PROXY_BASE` e `resolveUrl` (ja existem e funcionam corretamente)
- `videoRef`, `loading`, `error` states
- Header overlay com botao voltar e titulo
- Container 35vh

**Novo useEffect simplificado:**
- Pega `state.url`, faz trim
- Chama `resolveUrl()` (proxy no web, direto no nativo)
- Seta `video.src` diretamente
- Chama `video.load()` e `video.play()`
- Cleanup: `video.pause()` e limpa `video.src`

**Video element atualizado:**
- Adiciona `onError` handler com log
- Adiciona `onLoadedMetadata` para setar loading=false
- Mantem `playsInline`, `muted`, `autoPlay`, `controls`, `crossOrigin="anonymous"`

### 2. `capacitor.config.json`
- Adicionar `"allowsInlineMediaPlayback": true` no bloco `ios`

### 3. Remover dependencia `hls.js`
- Desinstalar o pacote hls.js do projeto

## Detalhes tecnicos

### Fluxo simplificado do PlayerPage

```text
PlayerPage
  |-- useEffect([state.url])
  |     |-- streamUrl = state.url.trim()
  |     |-- resolveUrl(streamUrl)
  |     |       |-- SE nativo: retorna URL direta
  |     |       |-- SE web: retorna proxy URL
  |     |-- video.src = resolvedUrl
  |     |-- video.load()
  |     |-- video.play().catch(...)
  |     |-- cleanup: video.pause(), video.src = ''
  |
  |-- Container 35vh inline
        |-- Header overlay (voltar + titulo)
        |-- Loading spinner
        |-- <video> nativo com controls
        |-- Error overlay
```

### Por que funciona sem HLS.js

- **No APK (Android/iOS)**: O WebView nativo suporta HLS nativamente via ExoPlayer/AVPlayer, entao `<video src="...m3u8">` funciona direto
- **No Safari (iOS web)**: Safari suporta HLS nativamente no elemento `<video>`
- **No Chrome web (preview)**: O proxy converte a resposta e adiciona headers CORS; Chrome consegue reproduzir o stream via proxy

### Nota importante
O `PROXY_BASE` continuara usando `VITE_SUPABASE_URL` que ja existe no `.env`, nao precisa de variavel nova. A funcao `resolveUrl` ja existente faz exatamente o que e necessario.

