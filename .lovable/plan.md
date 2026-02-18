

# Otimizacao da Secao de Series (Grid + Detalhes)

## Resumo
Melhorar a experiencia de Series em duas frentes: (1) garantir que o grid de series use o mesmo padrao visual do MovieCard com aspect-ratio rigido e skeleton loading, e (2) redesenhar a tela de detalhes com backdrop, sinopse, elenco, seletor de temporadas e cards de episodios formatados (S01E01).

---

## Passo 1: Atualizar o SeriesCard

O `SeriesCard` ja esta memoizado e com aspect-ratio 2/3, mas falta o tratamento `onError` nas imagens (igual ao padrao do projeto). Adicionar `onError` para ocultar imagens quebradas.

**Arquivo:** `src/components/SeriesCard.tsx`

## Passo 2: Redesenhar o SeriesDetailPage

Reescrever `src/pages/SeriesDetailPage.tsx` com o layout solicitado:

**Header com Backdrop:**
- Usar `detail.info.backdrop_path[0]` ou `detail.info.cover` como imagem de fundo
- Aplicar gradiente escuro (`bg-gradient-to-t from-background to-transparent`) sobre a imagem
- Exibir titulo, sinopse (plot), elenco (cast) e genero sobre o gradiente

**Seletor de Temporadas:**
- Barra horizontal scrollavel com botoes pill para cada temporada
- Usar o array `detail.seasons` para gerar as abas
- Estado `selectedSeason` controla qual temporada esta ativa

**Lista de Episodios:**
- Lista vertical de cards de episodio
- Cada card mostra: numero formatado (S01E01), titulo, duracao e thumbnail (se houver)
- Ao clicar no episodio, abre o player nativo via `playFullscreen()` com fallback para `/player`

**Card de Episodio (formato):**
- Numero: `S${String(ep.season).padStart(2,'0')}E${String(ep.episode_num).padStart(2,'0')}`
- Titulo do episodio
- Duracao (se disponivel)
- Icone de Play
- Sinopse curta do episodio (se disponivel em `ep.info.plot`)

## Passo 3: Adicionar rota /series/:id no App.tsx

Atualmente so existe a rota `/series` (SeriesSplitPage). Adicionar:
- `<Route path="/series/:id" element={<SeriesDetailPage />} />`
- Importar `SeriesDetailPage` no App.tsx

Isso permite que tanto o `SeriesPage` (mobile) quanto o `SeriesSplitPage` possam navegar para a tela de detalhes.

## Passo 4: Usar playFullscreen no SeriesDetailPage

Substituir a navegacao direta para `/player` pela logica padrao do projeto:
1. Chamar `playFullscreen(url, title)`
2. Se retornar `'web-fallback'`, navegar para `/player` com state

---

## Detalhes Tecnicos

### Dados disponiveis da API (SeriesDetail)
- `info.name` - titulo
- `info.plot` - sinopse
- `info.cast` - elenco
- `info.genre` - genero
- `info.cover` - capa
- `info.backdrop_path[]` - imagens de fundo
- `seasons[]` - lista de temporadas com `season_number`, `name`, `cover`
- `episodes[season_number][]` - episodios com `id`, `episode_num`, `title`, `container_extension`, `season`, `info.duration`, `info.plot`

### URL de stream do episodio
```text
xtreamApi.getSeriesStreamUrl(credentials, ep.id, ep.container_extension)
```
A extensao vem da API (`container_extension`), podendo ser `.mkv`, `.mp4`, etc.

### Arquivos modificados
1. `src/components/SeriesCard.tsx` - adicionar onError na img
2. `src/pages/SeriesDetailPage.tsx` - redesenho completo
3. `src/App.tsx` - adicionar rota `/series/:id`

### Impacto
- O grid de series permanece identico em layout
- A tela de detalhes ganha visual rico com backdrop e informacoes completas
- O player so abre ao clicar em um episodio especifico, nunca ao abrir a serie

