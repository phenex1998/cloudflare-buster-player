
# Adicionar Debug Visivel e Botao de Teste ao PlayerPage

## Resumo

Atualizar o `src/pages/PlayerPage.tsx` para incluir um painel de debug visivel na tela (sem depender do console), um botao "Forcar Reproducao", um botao de teste com HLS publico, e um timeout de 10 segundos. Isso vai ajudar a diagnosticar por que o spinner nao para no WebView Android.

## Mudancas no arquivo `src/pages/PlayerPage.tsx`

### 1. Adicionar estado para armazenar a URL resolvida

Novo state `resolvedUrl` para exibir no painel de debug:

```typescript
const [resolvedUrl, setResolvedUrl] = useState<string>('');
```

### 2. Atualizar o useEffect

- Guardar a URL resolvida no state para exibicao no debug panel
- Aumentar timeout para 10 segundos
- Mensagem de erro atualizada para mencionar "Forcar Reproducao"

### 3. Substituir o overlay de loading atual

Trocar o spinner simples (Loader2) pelo painel de debug completo com:
- Spinner animado CSS
- Texto "Carregando stream..."
- Painel de debug mostrando: Plataforma, URL (truncada), ReadyState, NetworkState
- Botao verde "FORCAR REPRODUCAO" que chama `video.play()` com alert em caso de erro

### 4. Adicionar botao "Testar HLS Publico" no header

Botao azul temporario ao lado do titulo que carrega `https://test-streams.mux.dev/x264/1080p.m3u8` diretamente no video element, permitindo testar se o problema e da URL ou do WebView.

### 5. Atualizar handlers do video

- Adicionar `onLoadStart` handler
- Manter todos os handlers existentes (`onLoadedData`, `onLoadedMetadata`, `onCanPlay`, `onPlaying`, `onWaiting`, `onError`, `onStalled`)

## Detalhes tecnicos

### Estrutura final do componente

```text
PlayerPage
  |-- States: error, loading, resolvedUrl, videoRef
  |-- useEffect([state.url])
  |     |-- setResolvedUrl(url)
  |     |-- video.src = url
  |     |-- video.load() + video.play()
  |     |-- setTimeout(10s) -> force stop loading
  |
  |-- Container 35vh
        |-- Header overlay
        |     |-- Botao voltar
        |     |-- Titulo
        |     |-- Botao "Testar HLS Publico" (azul, temporario)
        |
        |-- <video> com todos os handlers
        |
        |-- Loading overlay (z-50, quando loading=true)
        |     |-- Spinner CSS
        |     |-- "Carregando stream..."
        |     |-- Debug panel (plataforma, URL, readyState, networkState)
        |     |-- Botao "FORCAR REPRODUCAO" (verde)
        |
        |-- Error overlay (quando error != null)
```

### O que esse debug vai revelar

- **ReadyState 0**: video nao recebeu nada (URL invalida ou CORS)
- **ReadyState 1**: metadata recebida mas sem dados
- **ReadyState 2+**: dados chegando, problema e no autoplay
- **NetworkState 3**: erro de rede (URL inacessivel)
- Botao "Testar HLS Publico" isola se o problema e do WebView ou da URL do IPTV
- Botao "Forcar Reproducao" testa se o problema e restricao de autoplay
