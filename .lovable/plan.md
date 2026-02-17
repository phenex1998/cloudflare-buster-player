

# Player Hibrido: Nativo Fullscreen + Inline Web com Proxy

## Resumo

Reescrever o `PlayerPage.tsx` para suportar dois modos de reprodução:
- **Android nativo**: continua usando `capacitor-video-player` em fullscreen (sem CORS)
- **Web/Preview (inline)**: usa `hls.js` com a Edge Function `iptv-proxy` para contornar CORS, exibindo o video em um container de 35vh

Tambem sera necessario alterar o `LiveTvPage.tsx` para enviar URLs `.m3u8` (necessario para o HLS.js parsear o manifesto no modo web).

## Mudancas

### 1. `src/pages/LiveTvPage.tsx`
- Mudar a extensao de volta para `'m3u8'` na chamada `getLiveStreamUrl` (linha 55)
- O HLS.js precisa do manifesto `.m3u8` para funcionar; no Android nativo o ExoPlayer tambem aceita `.m3u8` sem problemas

### 2. `src/pages/PlayerPage.tsx` (reescrita completa)
- Adicionar constante `PROXY_BASE` usando `VITE_SUPABASE_URL` (ja disponivel no `.env`) para construir a URL do proxy: `${VITE_SUPABASE_URL}/functions/v1/iptv-proxy`
- Adicionar funcao helper `proxyUrl(url)` que encapsula a URL original via `?url=encodeURIComponent(url)`
- **Modo nativo** (Capacitor): manter logica atual com `VideoPlayer.initPlayer` fullscreen, passando a URL direta (sem proxy)
- **Modo web**: usar `hls.js` com `xhrSetup` para rotear todas as requisicoes (manifesto + segmentos `.ts`) pelo proxy
- Container de video inline: `35vh`, `min-h-[220px]`, com controles HTML5, `playsInline`, `crossOrigin="anonymous"`
- Error handler detalhado do HLS com log de `data.type`, `data.details`
- Recovery automatico para `NETWORK_ERROR` e `MEDIA_ERROR`
- Cleanup do HLS no unmount

### 3. Nenhuma variavel de ambiente extra necessaria
- O projeto ja tem `VITE_SUPABASE_URL` configurado automaticamente, entao a URL do proxy sera construida como `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`

## Detalhes tecnicos

### Estrutura do PlayerPage

```text
PlayerPage
  |-- detecta plataforma (Capacitor.isNativePlatform)
  |
  |-- SE nativo:
  |     |-- VideoPlayer.initPlayer({ mode: 'fullscreen', url: directUrl })
  |     |-- navigate(-1) ao fechar
  |
  |-- SE web:
        |-- useRef<HTMLVideoElement>
        |-- Hls.isSupported() ? hls.loadSource(proxyUrl(url)) : video.src = proxyUrl(url)
        |-- hls.config.xhrSetup intercepta segmentos pelo proxy
        |-- container 35vh com header overlay + controles nativos
        |-- error recovery (startLoad / recoverMediaError)
```

### Proxy URL helper
```text
const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const proxyUrl = (url: string) => `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
```

### HLS.js xhrSetup para proxy de segmentos
```text
const hls = new Hls({
  xhrSetup: (xhr, url) => {
    const proxied = proxyUrl(url);
    xhr.open('GET', proxied, true);
  }
});
```

Isso garante que tanto o manifesto quanto cada segmento `.ts` passem pelo proxy, evitando CORS.

