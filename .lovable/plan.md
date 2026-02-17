

# Correcao Definitiva do Player Inline

## Causa Raiz Identificada

O HLS.js **nao consegue reproduzir arquivos `.ts` diretos**. Ele precisa de um arquivo `.m3u8` (playlist HLS) que contenha o manifesto dos segmentos de video. A URL atual gera algo como `/live/user/pass/12345.ts` -- um stream MPEG-TS bruto que o HLS.js nao sabe interpretar.

A API Xtream Codes suporta ambas as extensoes:
- `.ts` -- stream MPEG-TS direto (funciona apenas com players nativos como ExoPlayer)
- `.m3u8` -- playlist HLS (funciona com HLS.js no browser/WebView)

Alem disso, no ambiente de preview Web (Lovable), o navegador bloqueia requisicoes diretas ao servidor IPTV por CORS. A edge function de proxy (`iptv-proxy`) ja existe mas nao esta sendo usada pelo player.

## Solucao

### 1. `src/pages/LiveTvSplitPage.tsx` -- Mudar extensao para `.m3u8`

Alterar a linha que gera a URL do stream:
- **Antes**: `xtreamApi.getLiveStreamUrl(credentials, activeStream.stream_id, 'ts')`
- **Depois**: `xtreamApi.getLiveStreamUrl(credentials, activeStream.stream_id, 'm3u8')`

Isso faz com que a API Xtream retorne uma playlist HLS que o HLS.js consegue consumir.

### 2. `src/components/InlinePlayer.tsx` -- Adicionar suporte ao proxy para Web

O componente precisa detectar o ambiente e rotear a URL adequadamente:

**Em ambiente Web (preview Lovable/browser)**:
- Rotear a URL do stream atraves da edge function `iptv-proxy` para contornar CORS
- URL proxy: `https://<supabase-url>/functions/v1/iptv-proxy?url=<stream-url-encoded>`
- Configurar HLS.js com `xhrSetup` customizado para que **todas** as sub-requisicoes (segmentos `.ts`, sub-playlists) tambem passem pelo proxy

**Em ambiente nativo (Android WebView)**:
- Usar URL direta sem proxy (WebView nao tem restricoes de CORS)

**Logica HLS.js atualizada**:
```text
1. URL chega como prop
2. Detectar ambiente (nativo vs web)
3. Se web: envolver URL no proxy
4. Criar instancia HLS com xhrSetup customizado (para proxy das sub-requisicoes)
5. hls.loadSource(url)
6. hls.attachMedia(video)
7. MANIFEST_PARSED -> video.play()
8. Fallback em caso de erro fatal: tentar src direto
```

**xhrSetup para proxy** (apenas no Web):
- Intercepta cada requisicao XHR do HLS.js
- Reescreve a URL para passar pelo proxy
- Garante que segmentos `.ts` carregados pelo player tambem nao sejam bloqueados por CORS

### 3. Botao Expandir (fullscreen nativo)

Manter logica atual:
- Android nativo: usar plugin Capacitor com `mode: 'fullscreen'` e URL `.ts` (ExoPlayer prefere `.ts`)
- Web: usar `requestFullscreen()` no elemento video

### 4. Filmes e Series (`MoviesSplitPage`, `SeriesSplitPage`)

Aplicar a mesma logica de proxy no `InlinePlayer` -- como o componente e compartilhado, a correcao beneficia automaticamente todas as paginas de split view. Nao e necessario mudar extensao nesses casos pois filmes/series ja usam suas extensoes originais (`.mp4`, `.mkv`, etc.).

## Arquivos Modificados

1. **`src/pages/LiveTvSplitPage.tsx`** -- Mudar `'ts'` para `'m3u8'` na geracao da URL (1 linha)
2. **`src/components/InlinePlayer.tsx`** -- Adicionar deteccao de ambiente + proxy para Web + xhrSetup no HLS.js

## Resultado Esperado

- **Android (APK)**: HLS.js carrega o `.m3u8` direto do servidor IPTV no WebView, video toca inline na coluna da direita
- **Web (preview Lovable)**: HLS.js carrega o `.m3u8` via proxy, contornando CORS, video toca inline
- Trocar de canal destroi a instancia HLS anterior e cria nova sem sobreposicao
- Botao Expandir funciona com fullscreen nativo no Android

## Detalhes Tecnicos

### Proxy URL helper
```text
function getProxiedUrl(url: string, isNative: boolean): string {
  if (isNative) return url; // WebView nao tem CORS
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/iptv-proxy?url=${encodeURIComponent(url)}`;
}
```

### HLS.js xhrSetup (para proxy no Web)
```text
new Hls({
  enableWorker: true,
  lowLatencyMode: true,
  xhrSetup: (xhr, url) => {
    if (!isNative) {
      const proxied = getProxiedUrl(url, false);
      xhr.open('GET', proxied, true);
    }
  }
})
```

Isso garante que tanto o manifesto `.m3u8` quanto os segmentos `.ts` referenciados dentro dele passem pelo proxy.

