

# Correcao Definitiva: Usar mpegts.js para Streams .ts Inline

## Problema

- A extensao `.m3u8` foi forçada mas a maioria dos servidores IPTV so serve `.ts` para canais ao vivo
- HLS.js **nao consegue** reproduzir arquivos `.ts` diretos (precisa de manifesto `.m3u8`)
- Tanto o inline quanto o fullscreen quebraram

## Solucao

Substituir HLS.js por **mpegts.js** -- uma biblioteca feita especificamente para reproduzir streams MPEG2-TS (`.ts`) direto no browser via Media Source Extensions. Funciona no Chrome, WebView Android, e navegadores modernos.

## Mudancas

### 1. Instalar mpegts.js

Adicionar `mpegts.js` como dependencia do projeto (npm package: `mpegts.js`).

### 2. `src/pages/LiveTvSplitPage.tsx` -- Reverter para `.ts`

Linha 39: Mudar de `'m3u8'` de volta para `'ts'`.

### 3. `src/components/InlinePlayer.tsx` -- Reescrever com mpegts.js

Substituir toda a logica HLS.js por mpegts.js:

**Playback inline:**
- Criar instancia `mpegts.MediaPlayer` com `type: 'mpegts'` e `isLive: true`
- Carregar a URL `.ts` diretamente
- No Web: rotear pelo proxy (`iptv-proxy`) para contornar CORS
- No Android nativo: usar URL direta (sem CORS no WebView)
- Antes de trocar de canal: destruir player anterior (`player.destroy()`)

**Fullscreen:**
- Android nativo: usar `@capgo/capacitor-video-player` com `mode: 'fullscreen'` e URL `.ts` direta
- Web: usar `requestFullscreen()` no elemento video

**Fluxo ao trocar de canal:**
```text
1. Usuario clica no canal
2. URL muda -> useEffect dispara
3. Se existe player anterior -> player.destroy()
4. Cria novo mpegts.MediaPlayer({ type: 'mpegts', isLive: true })
5. player.attachMediaElement(videoElement)
6. player.load() -- video comeca a tocar
7. Video aparece inline na coluna da direita
```

## Detalhes Tecnicos

### mpegts.js -- inicializacao

```text
import mpegts from 'mpegts.js';

if (mpegts.isSupported()) {
  const player = mpegts.createPlayer({
    type: 'mpegts',
    isLive: true,
    url: proxiedOrDirectUrl,
  }, {
    enableWorker: true,
    liveBufferLatencyChasing: true,
    liveSync: true,
  });
  player.attachMediaElement(videoElement);
  player.load();
  player.play();
}
```

### Proxy (apenas Web)

```text
function getProxiedUrl(url: string): string {
  if (isAndroid()) return url;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/iptv-proxy?url=${encodeURIComponent(url)}`;
}
```

### Fullscreen nativo

```text
// Android: plugin Capacitor com URL .ts direta
VideoPlayer.initPlayer({ mode: 'fullscreen', url: cleanUrl, ... });
// Web: requestFullscreen()
videoRef.current.requestFullscreen();
```

## Arquivos Modificados

1. `package.json` -- adicionar dependencia `mpegts.js`
2. `src/pages/LiveTvSplitPage.tsx` -- reverter extensao para `'ts'` (1 linha)
3. `src/components/InlinePlayer.tsx` -- reescrever: remover HLS.js, usar mpegts.js

## Resultado Esperado

- Streams `.ts` reproduzem inline na coluna da direita (Android APK e Web)
- Trocar de canal destroi o player anterior sem sobreposicao de audio
- Botao Expandir funciona: fullscreen nativo no Android, requestFullscreen no Web
- Filmes e Series continuam funcionando (usam extensoes proprias como `.mp4`)

