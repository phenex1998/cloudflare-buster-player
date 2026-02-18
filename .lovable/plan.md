

# Otimizacao de Performance (Virtualizacao) + Botao Voltar Android TV

## Visao Geral

Duas melhorias criticas para tornar o app viavel em Android TV e listas grandes:
1. Virtualizacao de listas com `react-virtuoso` para renderizar apenas itens visiveis
2. Interceptacao do botao Voltar do Android com `@capacitor/app`

---

## 1. Virtualizacao de Listas

### Problema
As paginas LiveTvSplitPage, MoviesSplitPage e SeriesSplitPage renderizam TODOS os itens no DOM de uma vez (potencialmente milhares), causando travamento em dispositivos com pouca RAM.

### Solucao
Instalar `react-virtuoso` e refatorar os grids dessas 3 paginas para usar `VirtuosoGrid`, que renderiza apenas os itens visiveis + um buffer.

### Arquivos modificados

**Novo pacote**: `react-virtuoso`

**LiveTvSplitPage.tsx**
- Substituir o `div.grid` de canais por `VirtuosoGrid`
- Cada item usa o mesmo card atual, mas renderizado sob demanda
- Adicionar `decoding="async"` nas tags `<img>`

**MoviesSplitPage.tsx**
- Substituir o `div.grid` de filmes por `VirtuosoGrid`
- Manter o layout `aspect-[2/3]` dos cards
- Adicionar `decoding="async"` nas tags `<img>`

**SeriesSplitPage.tsx**
- Substituir o `div.grid` de series por `VirtuosoGrid`
- Manter o layout existente dos cards
- Adicionar `decoding="async"` nas tags `<img>`

### Abordagem tecnica do VirtuosoGrid
Cada pagina tera uma estrutura como:

```text
<VirtuosoGrid
  totalCount={items.length}
  overscan={200}
  listClassName="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
  itemClassName="..."
  itemContent={(index) => <CardComponent item={items[index]} />}
/>
```

O container pai (`flex-1 overflow-hidden`) servira como scroll parent. O `VirtuosoGrid` cuida automaticamente de medir e reciclar os elementos.

---

## 2. Botao Voltar do Android / Android TV

### Problema
O botao fisico "Voltar" fecha o app imediatamente em vez de navegar no historico.

### Solucao
Criar um hook `useAndroidBackButton` que usa `@capacitor/app` para interceptar o evento `backButton`.

### Novo arquivo: `src/hooks/useAndroidBackButton.ts`
- Importa `App` de `@capacitor/app`
- Registra listener `App.addListener('backButton', callback)`
- Logica:
  - Se a rota atual e `/` (Home): chama `App.exitApp()`
  - Qualquer outra rota: chama `window.history.back()` (equivale a `navigate(-1)`)
- Remove o listener no cleanup do useEffect

### Integracao: `src/App.tsx`
- Chamar o hook `useAndroidBackButton()` dentro do componente `AuthenticatedRoutes`, que ja tem acesso ao router context

### Pacote necessario
`@capacitor/app` -- ja esta disponivel como dependencia do Capacitor (nao precisa instalar separadamente, faz parte do `@capacitor/core`).

---

## Resumo de Alteracoes

| Arquivo | Tipo | Descricao |
|---|---|---|
| package.json | Dependencia | Adicionar `react-virtuoso` |
| src/pages/LiveTvSplitPage.tsx | Refatorar | Grid de canais com VirtuosoGrid |
| src/pages/MoviesSplitPage.tsx | Refatorar | Grid de filmes com VirtuosoGrid |
| src/pages/SeriesSplitPage.tsx | Refatorar | Grid de series com VirtuosoGrid |
| src/hooks/useAndroidBackButton.ts | Novo | Hook para interceptar botao Voltar |
| src/App.tsx | Editar | Integrar hook do botao Voltar |

