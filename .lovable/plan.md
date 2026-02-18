
# Pivot: Remover Player Inline e Usar Fullscreen Direto

## Resumo

Simplificar a arquitetura removendo o player inline (coluna da direita) de todas as split pages. O layout passa a ter apenas 2 areas: Sidebar de icones + Area principal com categorias e grid de cards. Ao clicar em um card, o video abre direto em tela cheia via plugin nativo (ou fallback web).

---

## Mudancas

### 1. `src/pages/LiveTvSplitPage.tsx` -- Reescrever

- Remover import e uso do `InlinePlayer`
- Layout: `IconSidebar` (60px) + area principal dividida em categorias (coluna esquerda ~220px) e grid de cards (resto)
- Categorias: mantém lista vertical atual com scroll
- Grid de canais: substituir lista vertical por CSS Grid responsivo (`grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`)
- Card de canal: fundo `#1a1a1a`, cantos arredondados (`rounded-xl`), logo centralizada grande, nome pequeno embaixo
- Ao clicar num card: chamar funcao `playFullscreen(url)` que usa `@capgo/capacitor-video-player` com `mode: 'fullscreen'`
- Fallback web: abrir `/player` via navigate (para preview no browser)

### 2. `src/pages/MoviesSplitPage.tsx` -- Reescrever

- Mesma estrutura: Sidebar + Categorias + Grid de posters
- Card de filme: poster como background, nome embaixo, rating
- Click: fullscreen direto com a URL do VOD

### 3. `src/pages/SeriesSplitPage.tsx` -- Reescrever

- Sidebar + Categorias + Grid de series
- Ao selecionar uma serie, mostrar temporadas/episodios no grid (substituindo a lista de series)
- Click em episodio: fullscreen direto

### 4. `src/components/InlinePlayer.tsx` -- Remover

- Arquivo nao sera mais usado por nenhuma pagina
- Sera deletado

### 5. `src/lib/native-player.ts` -- Adicionar funcao `playFullscreen`

Nova funcao utilitaria:
```text
export async function playFullscreen(url: string, title?: string) {
  if (isAndroid()) {
    const { VideoPlayer } = await import('@capgo/capacitor-video-player');
    await VideoPlayer.stopAllPlayers().catch(() => {});
    await VideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: url.trim(),
      playerId: 'fullscreen-player',
      componentTag: 'div',
      title: title || 'Stream',
      exitOnEnd: true,
      loopOnEnd: false,
      showControls: true,
      displayMode: 'landscape',
      chromecast: false,
    });
  } else {
    // Web fallback: navigate to /player
    return 'web-fallback';
  }
}
```

### 6. Estilo dos Cards (via Tailwind)

Cada card de canal/filme:
```text
- bg-[#1a1a1a]
- rounded-xl
- border border-white/5
- hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10
- transition-all
- aspect-square (canais) ou aspect-[2/3] (filmes/series)
- Logo/poster centralizado com padding
- Nome: text-[11px] text-center truncate
```

Grid container:
```text
grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 p-4
```

---

## Detalhes Tecnicos

### Fluxo de reproducao
```text
1. Usuario navega: Sidebar > TV ao Vivo
2. Seleciona categoria (ex: Esportes)
3. Grid mostra cards dos canais
4. Clica num card
5. playFullscreen(url) e chamado
6. No Android: ExoPlayer abre em tela cheia
7. No Web: navega para /player com a URL no state
8. Ao fechar fullscreen, volta para o grid
```

### Arquivos modificados
1. `src/pages/LiveTvSplitPage.tsx` -- reescrever (remover player, adicionar grid)
2. `src/pages/MoviesSplitPage.tsx` -- reescrever (remover player, adicionar grid)
3. `src/pages/SeriesSplitPage.tsx` -- reescrever (remover player, adicionar grid)
4. `src/lib/native-player.ts` -- adicionar `playFullscreen()`

### Arquivos removidos
1. `src/components/InlinePlayer.tsx`
