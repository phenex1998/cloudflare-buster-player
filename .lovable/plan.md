

# Refatoracao Rigida dos Cards com Skeleton Loading

## Problema Raiz
Os cards usam `flex-1` no container da imagem dentro de um botao com `aspect-ratio`. Quando a imagem falha, o `flex-1` colapsa para altura 0, quebrando o layout inteiro. O aspect-ratio no botao externo nao protege o container interno.

## Solucao: Container de Imagem com Aspect Ratio Rigido

A estrategia e mover o aspect-ratio para o container da imagem (nao no botao pai) e remover `flex-1`, garantindo que o bloco de imagem mantenha suas dimensoes independente do conteudo.

---

## Alteracoes por Arquivo

### 1. LiveTvSplitPage.tsx (Canais - aspect 16/9)

**Grid**: Mudar minmax de `140px` para `160px` (canais horizontais precisam de mais largura).

**Card (renderChannel)**:
- Botao externo: remover `aspect-square`, usar apenas `flex flex-col overflow-hidden rounded-xl`
- Container da imagem: trocar `flex-1` por `w-full aspect-video bg-[#1e1e1e]` (aspect-video = 16/9)
- Imagem: manter `object-contain`, adicionar `transition-opacity duration-300`
- Skeleton loading: mudar de `aspect-square` para `aspect-video`

**Resultado**: Retangulo horizontal cinza fixo de 16:9, imagem aparece por cima com fade.

### 2. MoviesSplitPage.tsx (Filmes - aspect 2/3)

**Card (renderMovie)**:
- Botao externo: remover `aspect-[2/3]`, usar apenas `flex flex-col overflow-hidden rounded-xl`
- Container da imagem: trocar `flex-1` por `w-full aspect-[2/3] bg-[#1e1e1e]`
- Imagem: manter `object-cover`, adicionar `transition-opacity duration-300`

**Resultado**: Retangulo vertical cinza fixo de 2:3, imagem aparece por cima com fade.

### 3. SeriesSplitPage.tsx (Series - aspect 2/3)

**Card (renderSeriesCard)**:
- Mesma abordagem dos filmes: aspect-ratio no container da imagem, nao no botao
- Container da imagem: `w-full aspect-[2/3] bg-[#1e1e1e]`
- Imagem: `object-cover`, `transition-opacity duration-300`

---

## Padrao CSS do Card (aplicado em todos)

```text
<button className="bg-card rounded-xl border ... overflow-hidden">
  <!-- Container rigido: NUNCA colapsa -->
  <div className="relative w-full aspect-[2/3] bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
    {url ? (
      <>
        <img
          src={url}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => { e.currentTarget.style.display = 'none'; ... }}
        />
        <div style={{ display: 'none' }}>  <!-- fallback icon -->
          <Icon />
        </div>
      </>
    ) : (
      <Icon />  <!-- sem URL -->
    )}
  </div>
  <!-- Texto abaixo -->
  <div className="p-2">
    <p>Nome</p>
  </div>
</button>
```

Diferenca chave: a `<img>` agora usa `absolute inset-0` para flutuar dentro do container rigido, em vez de ser o elemento que define o tamanho. O container define seu tamanho via `aspect-[2/3]` ou `aspect-video` independentemente.

## Grid com align-items: start

Adicionar `items-start` nos gridComponents List de todas as 3 paginas para evitar que cards com textos de tamanhos diferentes estiqueem verticalmente.

## Resumo

| Arquivo | Mudanca principal |
|---|---|
| LiveTvSplitPage.tsx | aspect-video no container de imagem, grid 160px, items-start |
| MoviesSplitPage.tsx | aspect-[2/3] no container de imagem, img absolute, items-start |
| SeriesSplitPage.tsx | aspect-[2/3] no container de imagem, img absolute, items-start |

