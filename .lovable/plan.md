

# Corrigir Player Inline -- Usar HLS.js para Embedded, Plugin Nativo Apenas para Fullscreen

## Causa Raiz

O plugin `@capgo/capacitor-video-player` documenta que o modo `embedded` funciona **apenas na Web**. No Android/iOS nativo, apenas o modo `fullscreen` e suportado. Por isso o player sempre abre em tela cheia no APK.

## Solucao

Usar **HLS.js** (ja instalado no projeto) com o elemento `<video>` HTML5 para reproduzir streams `.ts` inline na coluna da direita, em TODAS as plataformas. O plugin nativo Capacitor sera usado apenas quando o usuario clicar no botao "Expandir" para tela cheia.

## Mudancas

### `src/components/InlinePlayer.tsx` -- Reescrever logica de playback

**Playback inline (coluna da direita):**
- Sempre usar `<video>` HTML5 + HLS.js para reproduzir streams
- HLS.js faz o demux de streams `.ts` e `.m3u8` que o `<video>` nao consegue sozinho
- Funciona no WebView do Android (que e basicamente Chrome) e no browser
- Ao trocar de canal: destruir instancia anterior do HLS.js (`hls.destroy()`) antes de criar nova

**Botao "Expandir" (fullscreen):**
- No Android nativo: chamar o plugin `@capgo/capacitor-video-player` com `mode: 'fullscreen'` (unico modo que funciona no nativo)
- No Web: usar `videoRef.current.requestFullscreen()`

**Fluxo detalhado:**
```text
1. Usuario clica no canal
2. URL muda -> useEffect dispara
3. Se existe instancia HLS anterior -> hls.destroy()
4. Cria nova instancia: new Hls()
5. hls.loadSource(url)
6. hls.attachMedia(videoElement)
7. No evento MANIFEST_PARSED -> video.play()
8. Se HLS nao suportado mas video nativo suporta -> video.src = url (fallback iOS Safari)
9. Video aparece inline na coluna da direita
```

**Botao Expandir:**
```text
- Se isAndroid() -> VideoPlayer.initPlayer({ mode: 'fullscreen', url })
- Senao -> videoRef.current.requestFullscreen()
```

### Nenhuma mudanca em outros arquivos
- `LiveTvSplitPage.tsx`, `MoviesSplitPage.tsx`, `SeriesSplitPage.tsx` permanecem iguais
- A correcao e inteiramente no componente `InlinePlayer`

## Resultado Esperado
- Video toca inline na coluna da direita no APK Android (via WebView + HLS.js)
- Trocar de canal destroi o player anterior e inicia novo sem sobreposicao de audio
- Botao "Expandir" abre tela cheia nativa no Android via plugin Capacitor
- No browser web, tudo funciona igual via HLS.js + requestFullscreen

