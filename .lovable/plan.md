

# Corrigir Player Inline no Layout Split View (3 Colunas)

## Problemas Identificados

1. **`LiveTvSplitPage.tsx` linha 39**: Ainda usa extensao `'m3u8'` ao gerar a URL -- deveria ser `'ts'`
2. **`InlinePlayer.tsx`**: Usa `<video>` HTML5 puro que nao consegue reproduzir streams `.ts` (MPEG-TS) sem um demuxer como HLS.js
3. **Nenhuma integracao com Capacitor VideoPlayer no modo embedded**: O `InlinePlayer` nao usa o plugin nativo quando rodando no Android

## Solucao

### 1. `src/pages/LiveTvSplitPage.tsx`
- Linha 39: Mudar `'m3u8'` para `'ts'`

### 2. `src/components/InlinePlayer.tsx` -- Reescrever com suporte nativo embedded

O componente sera atualizado para:
- Detectar se esta rodando em plataforma nativa (Capacitor) ou web
- **Nativo (Android)**: Usar `@capgo/capacitor-video-player` com `mode: 'embedded'` e `componentTag` apontando para o ID do container div
- **Web**: Manter o `<video>` HTML5 como fallback (preview apenas)
- Antes de iniciar um novo stream, chamar `stopAllPlayers()` para limpar o player anterior
- Adicionar `console.log` da URL para debug
- Container div com `id="embedded-player-container"` e dimensoes `w-full h-full`
- Botao "Expandir" que no nativo chama `initPlayer` com `mode: 'fullscreen'`, e no web chama `requestFullscreen()`

Fluxo ao trocar de canal:
```text
1. Usuario clica no canal (Coluna 3)
2. activeStream muda -> useEffect dispara
3. stopAllPlayers() limpa player anterior
4. URL gerada com extensao .ts
5. initPlayer({ mode: 'embedded', url, componentTag: 'embedded-player-container' })
6. Video aparece na Coluna 4 imediatamente
```

### 3. Nenhuma mudanca necessaria em `MoviesSplitPage` e `SeriesSplitPage`
- Esses ja usam a extensao correta (vem de `container_extension` do VOD/Series)
- O `InlinePlayer` atualizado automaticamente beneficia essas paginas tambem

## Detalhes Tecnicos

### InlinePlayer -- logica principal

```text
// Detectar plataforma
const isNative = Capacitor.isNativePlatform();

// useEffect quando URL muda:
useEffect(() => {
  if (!url) return;
  
  const cleanUrl = url.trim();
  console.log('[InlinePlayer] URL:', cleanUrl);

  if (isNative) {
    // Importar dinamicamente o plugin
    import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
      // Parar player anterior
      VideoPlayer.stopAllPlayers().catch(() => {});
      
      // Iniciar novo player embedded
      VideoPlayer.initPlayer({
        mode: 'embedded',
        url: cleanUrl,
        playerId: 'embeddedPlayer',
        componentTag: 'embedded-player-container',
        title: title || 'Stream',
        exitOnEnd: false,
        loopOnEnd: false,
        showControls: true,
        displayMode: 'landscape',
        chromecast: false,
      });
    });
  } else {
    // Web fallback com <video> HTML5
    video.src = cleanUrl;
    video.load();
    video.play();
  }

  // Cleanup
  return () => {
    if (isNative) {
      import('@capgo/capacitor-video-player').then(({ VideoPlayer }) => {
        VideoPlayer.stopAllPlayers().catch(() => {});
      });
    }
  };
}, [url]);
```

### Container div (dentro do JSX)
```text
<div id="embedded-player-container" className="w-full h-full" style={{ minHeight: '100%' }}>
  {/* No web, renderiza <video>. No nativo, o plugin injeta o player aqui */}
</div>
```

### Botao Expandir (fullscreen)
```text
// No nativo: abre fullscreen via plugin
// No web: usa requestFullscreen() do elemento video
handleFullscreen = () => {
  if (isNative) {
    VideoPlayer.initPlayer({ mode: 'fullscreen', url: currentUrl, ... });
  } else {
    videoRef.current?.requestFullscreen();
  }
};
```

## Arquivos Modificados
1. `src/pages/LiveTvSplitPage.tsx` -- corrigir extensao `.ts` (1 linha)
2. `src/components/InlinePlayer.tsx` -- reescrever com suporte nativo embedded + cleanup

## Resultado Esperado
- Ao clicar num canal na lista, o video aparece imediatamente na coluna da direita (sem mudar de pagina)
- Trocar de canal limpa o player anterior e inicia o novo sem sobreposicao de audio
- Botao "Expandir" permite tela cheia
- No preview web, mostra o elemento `<video>` como fallback

