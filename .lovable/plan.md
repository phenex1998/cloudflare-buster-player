
# Correcao do Player Inline -- Diagnostico Real e Solucao

## Problema Identificado

Existem **dois problemas distintos** impedindo o player inline de funcionar:

### Problema 1: Proxy Bufferiza o Stream Inteiro (Web)
A edge function `iptv-proxy` faz `await response.arrayBuffer()` -- isso tenta ler o stream **inteiro** antes de retornar. Streams de TV ao vivo sao **infinitos**, entao a requisicao fica pendente para sempre e o video nunca carrega.

### Problema 2: mpegts.js pode falhar silenciosamente (Android WebView)
No Android nativo (WebView), a URL vai direta sem proxy, mas o mpegts.js pode falhar silenciosamente sem feedback visual. Nao ha tratamento de erro visivel nem fallback.

### Sobre o modo "embedded" do plugin Capacitor
O plugin `@capgo/capacitor-video-player` documenta que o modo `embedded` funciona **apenas na Web** (browser puro). No Android/iOS nativo, apenas `fullscreen` e suportado. Tentar `embedded` no APK resultara em erro. Contudo, vamos adicionar o try/catch com alert conforme solicitado para que o erro fique visivel caso tente.

## Solucao em 3 Partes

### 1. Corrigir o Proxy para Streaming (`supabase/functions/iptv-proxy/index.ts`)

Mudar de `await response.arrayBuffer()` (bufferiza tudo) para **streaming response** que repassa os bytes conforme chegam:

```text
// ANTES (quebrado para live streams):
const body = await response.arrayBuffer();
return new Response(body, ...);

// DEPOIS (streaming):
return new Response(response.body, {
  status: response.status,
  headers: { ...corsHeaders, 'Content-Type': contentType },
});
```

Isso resolve o problema no Web -- o mpegts.js recebera os dados incrementalmente.

### 2. Refatorar InlinePlayer com as 3 Regras de Ouro (`src/components/InlinePlayer.tsx`)

**Regra 1 -- Dimensoes Explicitas:**
- Adicionar `min-height: 300px` e borda vermelha temporaria no container do video
- Garantir que o container tenha dimensoes reais antes de qualquer inicializacao

**Regra 2 -- Atraso de Seguranca:**
- Envolver a inicializacao do mpegts.js em `setTimeout` de 200ms
- Usar `useEffect` monitorando mudanca de URL

**Regra 3 -- Tratamento de Erro com Feedback Visual:**
- try/catch em toda inicializacao
- `console.error` + estado de erro visivel na UI com a mensagem real
- Em ambiente nativo, tentar Capacitor embedded mode com try/catch + alert para diagnostico
- Se falhar, fazer fallback para `<video src>` direto

**Logica de playback com fallback:**
```text
1. URL muda -> useEffect dispara
2. Limpar player anterior (destroy)
3. setTimeout 200ms para garantir container renderizado
4. Tentar mpegts.js com a URL (proxied no web, direta no nativo)
5. Se mpegts falhar -> fallback: video.src = url direto
6. Se tudo falhar -> mostrar erro na UI com mensagem real
```

**Tentativa Capacitor embedded (diagnostico):**
- No Android nativo, apos falha do mpegts.js, tentar `VideoPlayer.initPlayer({ mode: 'embedded' })` com try/catch
- O alert mostrara a mensagem de erro real do plugin (provavelmente "embedded not supported on native")
- Isso serve como diagnostico, nao como solucao permanente

### 3. Manter Fullscreen Nativo Funcionando

O botao "Expandir" continuara usando o plugin Capacitor com `mode: 'fullscreen'` no Android (ExoPlayer) -- isso funciona e nao sera alterado.

## Arquivos Modificados

1. **`supabase/functions/iptv-proxy/index.ts`** -- Mudar para streaming response (nao bufferizar)
2. **`src/components/InlinePlayer.tsx`** -- Aplicar as 3 regras de ouro + fallback chain + diagnostico

## Resultado Esperado

- **Web (preview)**: Proxy faz streaming -> mpegts.js recebe dados -> video toca inline
- **Android (APK)**: URL direta -> mpegts.js no WebView -> video toca inline
- **Fallback**: Se mpegts.js falhar, tenta `<video src>` direto
- **Diagnostico**: Erros aparecem visivelmente na UI e no console com mensagens reais
- **Borda vermelha temporaria**: Confirma visualmente que o container existe e tem dimensoes
