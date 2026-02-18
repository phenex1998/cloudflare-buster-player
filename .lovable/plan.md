

# Criar MovieDetailsPage com Integracao TMDB

## Resumo

Criar uma pagina de detalhes de filme estilo Netflix/IMDb que exibe metadados completos vindos do TMDB antes de iniciar a reproducao. O grid de filmes passa a navegar para a pagina de detalhes em vez de tocar direto.

---

## Passo 1: Configurar a API Key do TMDB

Armazenar a chave TMDB como secret no backend para uso seguro em uma edge function.

## Passo 2: Criar Edge Function `tmdb-proxy`

Uma funcao backend que recebe o nome do filme e busca no TMDB:
- Endpoint: `POST /tmdb-proxy` com `{ query: "nome do filme" }`
- Chama `https://api.themoviedb.org/3/search/movie` com a API key
- Retorna: titulo, sinopse, backdrop, poster, elenco, diretor, duracao, ano, nota

## Passo 3: Adicionar `getVodInfo` no `xtream-api.ts`

Adicionar metodo para buscar info detalhada do VOD via Xtream (`get_vod_info`), que retorna dados como `container_extension`, `duration`, etc. Isso complementa os dados do TMDB.

Interface `VodInfo`:
```text
{
  info: {
    tmdb_id?: string;
    name: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    duration: string;
    releasedate: string;
    rating: string;
    backdrop_path: string[];
    movie_image: string;
    container_extension: string;
    youtube_trailer: string;
  };
  movie_data: { ... };
}
```

## Passo 4: Criar `src/pages/MovieDetailsPage.tsx`

Nova pagina com layout cinematografico:

**Background Hero:**
- Imagem backdrop do TMDB (ou do Xtream) cobrindo toda a tela
- Overlay gradiente escuro: `bg-gradient-to-r from-black/90 via-black/70 to-transparent`
- Fallback: poster borrado se nao houver backdrop

**Botao Voltar:**
- Flutuante no canto superior esquerdo com `z-50`
- Icone `ArrowLeft` com fundo semi-transparente

**Layout em Duas Colunas (flex):**

Coluna Esquerda:
- Poster vertical com `h-[300px]`, `rounded-xl`, `shadow-2xl`

Coluna Direita:
- Titulo: `text-3xl font-bold text-white`
- Info Row: Badges com Rating, Ano, Duracao, Formato (container_extension)
- Botao "Assistir Agora": Grande, verde (`bg-green-600`), icone Play, chama `playFullscreen()`
- Botao "Favoritos": Coracao toggle usando `useIptv().toggleFavorite`
- Botao "Trailer": Abre link do YouTube se disponivel
- Sinopse: Texto `text-[#cccccc]` com limite de 4 linhas e toggle "Ler mais"
- Elenco/Direcao: Linha simples abaixo da sinopse

**Dados:** Primeiro tenta carregar do TMDB via edge function. Dados do Xtream (`get_vod_info`) servem como fallback e complemento (container_extension, stream URL).

## Passo 5: Atualizar `MoviesSplitPage.tsx`

Mudar o `onClick` dos cards de filme:
- De: `handlePlay(movie)` (toca direto)
- Para: `navigate('/movie/' + movie.stream_id, { state: movie })` (abre detalhes)

## Passo 6: Registrar Rota no `App.tsx`

Adicionar:
```text
<Route path="/movie/:id" element={<MovieDetailsPage />} />
```

---

## Detalhes Tecnicos

### Fluxo de dados

```text
1. Usuario clica no poster no grid
2. Navega para /movie/:id com dados basicos no state
3. MovieDetailsPage carrega:
   a. Dados Xtream via get_vod_info (container_extension, stream URL)
   b. Dados TMDB via edge function tmdb-proxy (sinopse, elenco, backdrop HD)
4. Exibe pagina completa
5. Usuario clica "Assistir Agora"
6. playFullscreen() abre player nativo em tela cheia
```

### Arquivos criados
1. `supabase/functions/tmdb-proxy/index.ts` -- edge function para buscar no TMDB
2. `src/pages/MovieDetailsPage.tsx` -- pagina de detalhes

### Arquivos modificados
1. `src/lib/xtream-api.ts` -- adicionar `getVodInfo()` e interface `VodInfo`
2. `src/pages/MoviesSplitPage.tsx` -- mudar click para navegar em vez de tocar
3. `src/App.tsx` -- adicionar rota `/movie/:id`

### Secret necessario
- `TMDB_API_KEY` -- chave de API do TMDB (sera solicitada ao usuario)

