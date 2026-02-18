

# Correcao: Series deve abrir tela de detalhes com sinopse

## Problema
No `SeriesSplitPage`, ao clicar em uma serie, o componente usa estado local (`setSelectedSeries`) para mostrar os episodios diretamente no painel direito -- sem backdrop, sinopse, elenco ou capa. A rota `/series/:id` com o `SeriesDetailPage` completo nunca e acessada.

## Solucao
Modificar o `SeriesSplitPage` para que ao clicar em uma serie, navegue para `/series/:id` usando `react-router-dom`, abrindo o `SeriesDetailPage` que ja possui:
- Backdrop com gradiente
- Poster/capa
- Sinopse (plot), elenco (cast), genero
- Seletor de temporadas
- Lista formatada de episodios (S01E01)

## Alteracoes

### Arquivo: `src/pages/SeriesSplitPage.tsx`

1. Remover o estado local `selectedSeries` e `selectedSeason`
2. Remover a query `seriesDetail` (nao mais necessaria)
3. Remover toda a secao de detalhes inline (episodios, temporadas dentro do split)
4. No `onClick` do `SeriesCard`, trocar de `setSelectedSeries(s)` para `navigate('/series/' + s.series_id)`
5. Remover imports nao utilizados (`Play`, `ArrowLeft`, `playFullscreen`, etc.)

O resultado: o `SeriesSplitPage` fica apenas como grid de series (categorias + cards), e ao clicar navega para a tela completa de detalhes.

### Nenhuma alteracao necessaria em:
- `SeriesDetailPage.tsx` -- ja esta pronto com layout landscape
- `App.tsx` -- rota `/series/:id` ja esta registrada

