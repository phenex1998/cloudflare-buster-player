

# Player Inline (sem tela cheia forcada)

## Problema
O plugin `@capgo/capacitor-video-player` forca o player nativo em tela cheia, tirando o usuario da interface do app. O usuario quer que o video abra normalmente dentro da mesma tela, sem fullscreen.

## Solucao

Substituir o plugin nativo por um player HTML5 `<video>` inline, posicionado no topo da pagina `/player`, com controles nativos do browser. Para streams `.m3u8` (HLS), usar a biblioteca `hls.js` que ja esta instalada no projeto.

### 1. `src/pages/PlayerPage.tsx` - Reescrever completamente

- Remover toda logica do `@capgo/capacitor-video-player`
- Usar elemento `<video>` HTML5 com atributo `playsInline` (evita fullscreen automatico no iOS/Android)
- Player ocupa ~35-40vh no topo da tela, com titulo e botao voltar
- Para URLs `.m3u8`: usar `hls.js` para carregar o stream no elemento `<video>`
- Para URLs diretas (`.mp4`, `.ts`, `.mkv`): atribuir `video.src` diretamente
- Mostrar spinner enquanto carrega, mensagem de erro se falhar
- Controles nativos do `<video>` (play/pause, volume, seek, fullscreen manual)

### 2. `src/pages/LiveTvPage.tsx` - Voltar extensao para `.m3u8`

- Alterar de `'ts'` para `'m3u8'` na chamada `getLiveStreamUrl`, pois o `hls.js` precisa do manifesto HLS para funcionar corretamente

## Layout do player

```text
+----------------------------------+
| [<- Voltar]  Nome do Canal       |
+----------------------------------+
|                                  |
|         VIDEO (35vh)             |
|      controles nativos           |
|                                  |
+----------------------------------+
|  (espaco livre abaixo)           |
+----------------------------------+
```

## Detalhes tecnicos

- `playsInline` + `webkit-playsinline` impedem fullscreen automatico
- `hls.js` faz o parsing do manifesto `.m3u8` e alimenta o `<video>` via MSE (Media Source Extensions)
- Fallback: se o browser suporta HLS nativamente (Safari), usa `video.src` direto
- Cleanup: destroi instancia do `hls.js` no unmount do componente
- Tratamento de erros do `hls.js` com recovery automatico para `MEDIA_ERROR`

