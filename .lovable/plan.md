

# Corrigir reproducao de canais ao vivo (Web + Android)

## Problema

Quando o usuario clica em um canal, nada acontece e nenhum erro aparece. Isso tem duas causas:

**Na Web/Preview:** O HlsPlayer recebe uma URL direta do servidor IPTV (ex: `http://servidor/live/user/pass/123.m3u8`). O hls.js tenta buscar essa URL via XHR, mas como o app roda em HTTPS e o servidor IPTV e HTTP, o navegador bloqueia por "mixed content" e CORS. Resultado: loading infinito.

**No Android:** O intent:// pode ser bloqueado silenciosamente pelo WebView, e nao ha fallback visivel para o usuario.

## Solucao

### 1. Atualizar o proxy para suportar GET (streaming)

O proxy atual so aceita POST. Para que o hls.js possa buscar manifestos e segmentos de video atraves dele, precisa aceitar GET com a URL como parametro de query:

```
GET /functions/v1/iptv-proxy?url=http://host/live/user/pass/123.m3u8
```

Tambem precisa retornar o Content-Type correto do servidor original (nao forcar `application/json`).

### 2. Rotear o HlsPlayer pelo proxy na web

Usar a opcao `xhrSetup` do hls.js para interceptar TODAS as requisicoes (manifesto .m3u8 + segmentos .ts) e redirecioná-las pelo proxy. Isso resolve CORS e mixed content de uma vez:

```
hls.js quer buscar: http://host/live/user/pass/123.m3u8
xhrSetup intercepta e troca para: https://proxy/iptv-proxy?url=http%3A%2F%2Fhost%2F...
Proxy busca o conteudo e retorna ao hls.js
```

### 3. Melhorar o fluxo Android com dupla opcao

No Android, ao clicar no canal:
- Tentar abrir no player externo via intent (VLC/MX Player)  
- Mostrar tambem o HlsPlayer inline como alternativa (com URL direta, que funciona no WebView com allowMixedContent)
- Botao visivel "Abrir em player externo" caso o intent falhe silenciosamente

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/iptv-proxy/index.ts` | Adicionar suporte GET com `?url=` e retornar Content-Type original |
| `src/components/HlsPlayer.tsx` | Adicionar logica de proxy no `xhrSetup` do hls.js para rotear todas as requisicoes pela edge function quando na web |
| `src/pages/LiveTvPage.tsx` | No Android: mostrar player inline + botao de player externo. Na web: passar flag para HlsPlayer usar proxy |
| `src/lib/xtream-api.ts` | Atualizar `isNative()` para usar userAgent (consistente com native-player.ts) |

## Detalhes tecnicos

### Proxy (edge function) - suporte GET

```text
GET ?url=encoded_url  ->  fetch(url) -> retorna body com Content-Type original
POST {url}            ->  funciona como antes (retrocompativel)
```

O proxy passa o Content-Type original do servidor IPTV em vez de forcar `application/json`. Isso e necessario porque:
- .m3u8 retorna `application/vnd.apple.mpegurl` ou `text/plain`
- .ts retorna `video/mp2t`

### HlsPlayer - proxy via xhrSetup

```text
Na web (nao-nativo):
  hls.js config.xhrSetup = (xhr, url) => {
    proxyUrl = PROXY_BASE + "?url=" + encodeURIComponent(url)
    xhr.open("GET", proxyUrl, true)
    xhr.setRequestHeader("apikey", ANON_KEY)
  }

No Android (nativo):
  Sem proxy - URLs diretas funcionam no WebView
```

### LiveTvPage - fluxo Android melhorado

```text
Android:
  Click canal ->
    1. Abre HlsPlayer inline com URL .m3u8 direta (sem proxy)
    2. Mostra botao "Abrir em VLC/MX Player" que dispara playStream()
    3. Se HlsPlayer falhar, mostra erro com botao para player externo

Web:
  Click canal ->
    1. Abre HlsPlayer inline com URL .m3u8 (proxy via xhrSetup)
    2. Botao "Player Externo" disponivel nos controles
```

### isNative() em xtream-api.ts

Trocar `(window as any).Capacitor` por deteccao via userAgent para consistencia:
```text
isNative() = isAndroid() || isIOS()  // via navigator.userAgent
```

## Resultado esperado

- **Na web**: canais carregam e reproduzem via HlsPlayer, com todas as requisicoes passando pelo proxy (sem CORS, sem mixed content)
- **No Android**: canais reproduzem inline no HlsPlayer (URL direta funciona no WebView) com opcao de abrir em player externo
- **Sem erros silenciosos**: qualquer falha mostra mensagem com opcao de retry ou player externo

