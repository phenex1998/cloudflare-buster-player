

# Botao Atualizar (Refresh) na Home

## Resumo
Implementar a funcionalidade do botao RefreshCw na HomePage para forcar a re-sincronizacao de todo o conteudo (canais, filmes, series) com o servidor Xtream Codes, invalidando o cache do React Query.

---

## Passo 1: Adicionar estado e handler na HomePage

Adicionar estado `isSyncing` para controlar a animacao do icone. Criar funcao `handleRefresh` que:

1. Seta `isSyncing = true`
2. Exibe toast "Sincronizando conteudo com o servidor..."
3. Usa `queryClient.invalidateQueries()` para invalidar todas as queries de conteudo
4. Chama `Promise.all` com re-fetch direto das APIs (categorias + streams de live, vod e series) para garantir que os dados sejam baixados imediatamente
5. No sucesso: para animacao, exibe toast "Lista atualizada com sucesso!"
6. No erro: para animacao, exibe toast "Falha ao sincronizar. Tente novamente."

## Passo 2: Invalidar queries do React Query

As query keys identificadas no projeto sao:
- `live-streams-all`, `live-streams-search`, `live-streams-epg`
- `vod-streams`, `vod-streams-search`
- `series`, `series-search`, `series-categories`, `series-detail`
- `live-categories`, `vod-categories`

Usar `queryClient.removeQueries()` para limpar o cache e `queryClient.invalidateQueries()` para forcar o refetch quando o usuario visitar essas paginas novamente.

## Passo 3: Animacao do icone

Aplicar `className="animate-spin"` condicionalmente no icone `RefreshCw` enquanto `isSyncing` for true. Desabilitar o botao durante a sincronizacao para evitar cliques duplos.

## Passo 4: Toasts de feedback

Usar o `toast` do sonner (ja importado no App.tsx) para exibir as notificacoes de progresso, sucesso e erro.

---

## Detalhes Tecnicos

### Arquivo modificado
- `src/pages/HomePage.tsx`

### Imports adicionados
- `useQueryClient` de `@tanstack/react-query`
- `xtreamApi` de `@/lib/xtream-api`
- `toast` de `sonner`

### Logica do handler

```text
const queryClient = useQueryClient();
const { credentials } = useIptv();

const handleRefresh = async () => {
  if (!credentials || isSyncing) return;
  setIsSyncing(true);
  toast('Sincronizando conteúdo com o servidor...');

  try {
    // Fetch all content in parallel
    await Promise.all([
      xtreamApi.getLiveCategories(credentials),
      xtreamApi.getLiveStreams(credentials),
      xtreamApi.getVodCategories(credentials),
      xtreamApi.getVodStreams(credentials),
      xtreamApi.getSeriesCategories(credentials),
      xtreamApi.getSeries(credentials),
    ]);

    // Clear all cached queries so pages refetch fresh data
    queryClient.removeQueries();

    toast.success('Lista atualizada com sucesso!');
  } catch {
    toast.error('Falha ao sincronizar. Tente novamente.');
  } finally {
    setIsSyncing(false);
  }
};
```

### Notas
- Nao ha dados de conteudo em localStorage (apenas credentials, favorites e history, que sao preservados)
- O `removeQueries()` limpa todo o cache do React Query, forcando refetch nas proximas visitas as paginas
- O botao fica desabilitado durante a sincronizacao para evitar requisicoes duplicadas

