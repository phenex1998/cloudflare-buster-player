

# Foco Android: ExoPlayer via Intent (estilo XCIPTV)

## O que muda

Remover toda logica de web player (HlsPlayer), proxy e formatacao de URL. O app passa a funcionar exclusivamente como um app Android que abre streams diretamente no ExoPlayer (VLC, MX Player, Just Player, etc.) via Intent -- exatamente como o XCIPTV faz.

## Arquivos a remover

- `src/components/HlsPlayer.tsx` -- player web nao sera mais usado
- `src/components/VideoPlayer.tsx` -- player alternativo nao necessario

## Arquivos a modificar

### 1. `src/lib/native-player.ts`
Simplificar para uma unica funcao `playStream()` que:
- Monta a URL `.ts` direta (sem proxy, sem `.m3u8`)
- Abre via Intent Android com `type=video/*` para ExoPlayer/VLC/MX Player
- Fallback: `window.open(url, '_system')`

### 2. `src/lib/xtream-api.ts`
- Remover funcao `isNative()` e toda logica de proxy
- `fetchApi()` passa a fazer fetch direto (sem proxy) -- o app roda no WebView Android que nao tem CORS
- Remover referencias ao edge function proxy

### 3. `src/pages/LiveTvPage.tsx`
- Remover import do HlsPlayer
- Remover estado `activeStream` e toda logica de player inline
- `handlePlay()` simplesmente monta a URL `.ts` e chama `playStream()`
- A lista de canais ocupa a tela toda (sem area de player embutido)

### 4. `src/pages/MoviesPage.tsx`
- Sem mudancas significativas -- ja usa `playStream()` corretamente

### 5. `src/pages/SeriesDetailPage.tsx`
- Sem mudancas significativas -- ja usa `playStream()` corretamente

### 6. `supabase/functions/iptv-proxy/index.ts`
- Manter o arquivo mas ele nao sera mais chamado pelo app (pode ser removido futuramente)

## Logica do playStream (estilo XCIPTV)

O XCIPTV usa ExoPlayer internamente, mas quando apps externos precisam reproduzir, ele usa Intents Android. A logica sera:

```text
playStream(url, title):
  1. Montar Intent URI:
     intent://URL_SEM_SCHEME#Intent;scheme=http;type=video/*;S.title=TITULO;end
  
  2. Tentar window.location.href = intentUrl
  
  3. Se falhar, tentar window.open(url, '_system')
  
  4. Ultimo recurso: window.location.href = url
```

A URL do stream sera sempre `.ts` para canais ao vivo:
```text
http://host/live/username/password/stream_id.ts
```

## Fluxo final

```text
Usuario clica no canal
  -> addToHistory()
  -> getLiveStreamUrl(credentials, stream_id, 'ts')
     = "http://host/live/user/pass/123.ts"
  -> playStream(url, channelName)
     = intent://host/live/user/pass/123.ts#Intent;scheme=http;type=video/*;end
  -> Android abre seletor de apps (VLC, MX Player, Just Player, etc.)
  -> ExoPlayer reproduz o stream .ts diretamente
```

## Detalhes tecnicos

### xtream-api.ts - fetchApi simplificado

```text
// Remover toda logica de proxy
// Fetch direto -- WebView Android nao tem restricao CORS
async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

### LiveTvPage.tsx - sem player inline

```text
// Remover: import HlsPlayer
// Remover: useState activeStream
// Remover: bloco do player embutido (sticky top)
// Remover: bloco do EpgSection dentro do player

handlePlay(stream):
  addToHistory(...)
  const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts')
  playStream(url, stream.name)
```

A pagina mostra apenas a barra de busca + grid de canais, sem nenhum player embutido. Ao clicar, abre direto no player externo do Android.
