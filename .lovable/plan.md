
# Corrigir player inline: proxy CORS e limpeza do video tag

## Problema
O player HLS funciona em fullscreen mas falha em modo inline (tela preta sem audio/video). A causa raiz sao duas:
1. A URL do stream e carregada diretamente sem passar pelo proxy `iptv-proxy`, causando bloqueios CORS no browser/WebView
2. O atributo `crossOrigin="anonymous"` (ja removido) e `webkit-playsinline` desnecessario no video tag

## Alteracoes em `src/pages/PlayerPage.tsx`

### 1. Rotear stream pelo proxy (linha 84)

**Antes:**
```text
const url = streamState.url;
```

**Depois:**
```text
const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iptv-proxy`;
const url = `${PROXY_BASE}?url=${encodeURIComponent(streamState.url)}`;
```

Usa a variavel de ambiente `VITE_SUPABASE_URL` que ja existe no `.env` do projeto, apontando para a Edge Function `iptv-proxy` ja deployada. Isso elimina problemas de CORS e Mixed Content tanto no browser quanto no WebView do Capacitor.

### 2. Limpar atributos do video tag (linha 181)

**Antes:**
```html
<video ref={videoRef} className="w-full h-full object-contain" playsInline muted controls />
```

**Depois:**
```html
<video ref={videoRef} className="w-full h-full object-contain" playsInline muted autoPlay controls />
```

Adiciona `autoPlay` de volta (estava no codigo original mas foi perdido). Mantem `playsInline` e `muted` (necessarios para autoplay em mobile). Remove qualquer `webkit-playsinline` ou `crossOrigin` residual.

### 3. Remover setAttribute de webkit-playsinline no initPlayer (linha 80)

A linha `video.setAttribute('webkit-playsinline', '');` sera removida pois nao e necessaria -- o atributo `playsInline` do React ja cobre ambos os casos.

## Nenhuma outra alteracao
- Nao modifica layout, CSS, hooks, estados, listeners ou logica HLS
- Nao modifica nenhum outro arquivo
- Nao modifica nenhuma outra funcao
