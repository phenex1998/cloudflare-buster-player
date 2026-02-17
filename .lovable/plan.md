

## Correcao: Canais ao Vivo Nao Reproduzem

### Causa Raiz

O problema principal e que as URLs dos streams de video (ex: `http://servidor/live/user/pass/123.ts`) sao carregadas **diretamente** pelo elemento `<video>` e pelo HLS.js. Diferente das chamadas de API (que passam pelo proxy), essas URLs vao direto para o servidor IPTV, que **bloqueia por CORS** no navegador/WebView.

Alem disso, o proxy atual so aceita requisicoes POST com JSON, mas o HLS.js precisa fazer requisicoes GET para buscar playlists `.m3u8` e segmentos `.ts`.

### Solucao

Criar um proxy de streaming que suporte GET e passe o conteudo com o content-type correto, e fazer o VideoPlayer rotear todas as URLs pelo proxy quando estiver em modo web.

---

### Detalhes Tecnicos

#### 1. Atualizar `supabase/functions/iptv-proxy/index.ts`

Adicionar suporte a requisicoes GET com a URL do stream como query parameter:
- `GET /iptv-proxy?url=http://servidor/live/user/pass/123.m3u8`
- Passar o `Content-Type` original da resposta (text/plain para .m3u8, video/mp2t para .ts)
- Manter o suporte POST existente para as chamadas de API

#### 2. Atualizar `src/lib/xtream-api.ts`

Adicionar funcao `proxyStreamUrl(url)` que:
- No modo nativo (Capacitor): retorna a URL original (sem CORS no WebView nativo)
- No modo web: retorna a URL do proxy GET com a URL do stream codificada como query param

Exportar essa funcao para uso no VideoPlayer e nas paginas.

#### 3. Atualizar `src/pages/LiveTvPage.tsx`

Usar `proxyStreamUrl()` ao passar a URL para o VideoPlayer, garantindo que no modo web a URL passe pelo proxy.

#### 4. Atualizar `src/components/VideoPlayer.tsx`

- Corrigir vazamento de memoria: remover event listeners (`playing`, `waiting`, `error`) no cleanup do useEffect
- Melhorar a logica de deteccao HLS para funcionar com URLs do proxy (que contem a URL original como query param)
- Adicionar mais logs de debug para facilitar diagnostico futuro

#### 5. Verificar `src/pages/MoviesPage.tsx` e `src/pages/SeriesDetailPage.tsx`

Aplicar o mesmo `proxyStreamUrl()` para VOD e series, garantindo consistencia.

### Fluxo apos correcao

```text
Usuario clica em canal
       |
       v
LiveTvPage gera URL do stream (.ts)
       |
       v
proxyStreamUrl() envolve com proxy (web) ou mantem original (nativo)
       |
       v
VideoPlayer recebe URL
       |
       v
Detecta /live/ -> tenta .m3u8 via HLS.js (pelo proxy)
       |
   Sucesso? -> Reproduz via HLS
       |
   Falha? -> Tenta .ts direto (pelo proxy)
       |
   Falha? -> Mostra erro visual
```

### Passos apos implementacao

1. Fazer `git pull` do projeto
2. Rodar `npx cap sync`
3. Rodar `npx cap run android`

