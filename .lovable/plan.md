

# Infinite Scroll com Paginacao no Cliente

## Resumo
Implementar um sistema de carregamento progressivo (infinite scroll) em todas as listas de canais, filmes e series, renderizando 40 itens por vez e carregando mais conforme o usuario rola. Extrair os cards em componentes memoizados para evitar re-renders desnecessarios.

---

## Passo 1: Criar hook `useInfiniteScroll`

Criar `src/hooks/use-infinite-scroll.ts` com a logica reutilizavel:
- Estado `limit` iniciando em 40
- Ref para o elemento sentinela
- `IntersectionObserver` que incrementa `limit` em +40 quando a sentinela aparece
- Retorna `{ limit, sentinelRef, hasMore }` onde `hasMore = limit < totalItems`
- Reset do `limit` para 40 quando `totalItems` mudar (troca de categoria)

## Passo 2: Criar componentes memoizados dos cards

Criar `src/components/ChannelCard.tsx`:
- Extrair o JSX do card de canal das paginas `LiveTvSplitPage` e `LiveTvPage`
- Envolver com `React.memo`
- Adicionar `loading="lazy"` e `decoding="async"` nas imagens

Criar `src/components/MovieCard.tsx`:
- Extrair o JSX do card de filme de `MoviesSplitPage` e `MoviesPage`
- Envolver com `React.memo`
- Adicionar `loading="lazy"` e `decoding="async"` nas imagens

Criar `src/components/SeriesCard.tsx`:
- Extrair o JSX do card de serie de `SeriesSplitPage` e `SeriesPage`
- Envolver com `React.memo`
- Adicionar `loading="lazy"` e `decoding="async"` nas imagens

## Passo 3: Aplicar infinite scroll nas paginas

Paginas afetadas (6 no total):
1. `LiveTvSplitPage.tsx` -- grid de canais com `filteredStreams.slice(0, limit)`
2. `LiveTvPage.tsx` -- cada secao de categoria com limite individual ou limite global
3. `MoviesSplitPage.tsx` -- grid de filmes com `movies.slice(0, limit)`
4. `MoviesPage.tsx` -- grid de filmes com `movies.slice(0, limit)`
5. `SeriesSplitPage.tsx` -- grid de series com `seriesList.slice(0, limit)`
6. `SeriesPage.tsx` -- grid de series com `series.slice(0, limit)`

Em cada pagina:
- Importar `useInfiniteScroll`
- Renderizar `items.slice(0, limit)` no grid
- Adicionar elemento sentinela (div com spinner) apos o grid
- Adicionar `style={{ contentVisibility: 'auto' }}` no container do grid

## Passo 4: Elemento sentinela

Abaixo do grid, renderizar:
```text
{hasMore && (
  <div ref={sentinelRef} className="flex justify-center py-6">
    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>
)}
```

---

## Detalhes Tecnicos

### Hook `useInfiniteScroll`
```text
function useInfiniteScroll(totalItems: number, pageSize = 40) {
  const [limit, setLimit] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset ao trocar categoria
  useEffect(() => { setLimit(pageSize); }, [totalItems, pageSize]);

  // Observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit(prev => Math.min(prev + pageSize, totalItems));
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [totalItems, pageSize]);

  return { limit, sentinelRef, hasMore: limit < totalItems };
}
```

### CSS Containment
Adicionar inline style `contentVisibility: 'auto'` nos containers de grid para que o browser pule a renderizacao dos itens fora da viewport.

### Lazy Loading
Todas as tags `<img>` dos cards terao `loading="lazy"` e `decoding="async"`.

### Arquivos criados
1. `src/hooks/use-infinite-scroll.ts`
2. `src/components/ChannelCard.tsx`
3. `src/components/MovieCard.tsx`
4. `src/components/SeriesCard.tsx`

### Arquivos modificados
1. `src/pages/LiveTvSplitPage.tsx`
2. `src/pages/LiveTvPage.tsx`
3. `src/pages/MoviesSplitPage.tsx`
4. `src/pages/MoviesPage.tsx`
5. `src/pages/SeriesSplitPage.tsx`
6. `src/pages/SeriesPage.tsx`

### Impacto no layout
Nenhum. O grid permanece identico (mesmas colunas, gaps, tamanhos). A unica diferenca visivel e que a barra de rolagem cresce conforme mais itens sao carregados, e um pequeno spinner aparece brevemente ao final da lista.

