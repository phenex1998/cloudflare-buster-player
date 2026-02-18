
# Correcao de Cards com Fallback de Imagem e Aspect Ratio Rigido

## Problema
Quando imagens de capa falham ao carregar, os cards colapsam e se sobrepoem porque o layout depende do conteudo da imagem para manter as dimensoes.

## Solucao

Aplicar 3 correcoes em todos os cards de canais, filmes e series:

### 1. Aspect Ratio Forcado com Container Rigido
- Canais (LiveTvSplitPage): `aspect-square` ja esta presente, mas o container interno (`flex-1`) colapsa sem imagem
- Filmes (MoviesSplitPage): `aspect-[2/3]` ja esta presente, mesmo problema interno
- Series (SeriesSplitPage): `aspect-[2/3]` ja esta presente, mesmo problema interno

A correcao: o container da imagem dentro do card deve ter dimensoes fixas (`w-full` + classe de aspect ratio propria ou `h-0 pb-[...]`) em vez de `flex-1`, que colapsa quando a imagem falha.

### 2. Fallback com onError na tag img
Atualmente os cards usam renderizacao condicional (`stream_icon ? <img> : <Icon>`). O problema e que a URL pode existir mas retornar 404. A imagem carrega com erro e o espaco colapsa.

Correcao: usar state local por card para controlar fallback via `onError`:
- Sempre renderizar a `<img>` quando a URL existir
- No `onError`, esconder a imagem e mostrar o icone placeholder
- Manter `w-full h-full object-cover` na imagem e `bg-[#1a1a1a]` no container

### 3. Protecao do Grid
Os `gridComponents` do VirtuosoGrid ja usam `grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3`. Ajustar o gap para `gap-4` (16px) conforme solicitado e garantir que cada Item do grid tenha `min-h-0` para nao estourar.

---

## Detalhes Tecnicos

### Arquivos modificados

**src/pages/LiveTvSplitPage.tsx**
- Refatorar `renderChannel` para usar um componente interno com estado de fallback
- Container da imagem: `relative w-full aspect-square bg-[#1a1a1a]` (rigido, nao flex-1)
- `<img>` com `onError` que seta `imgError=true`, esconde img e mostra icone `<Radio>`
- Gap do grid: `gap-4`

**src/pages/MoviesSplitPage.tsx**
- Refatorar `renderMovie` com estado de fallback
- Container do card: manter `aspect-[2/3]` no botao externo
- Container da imagem: `relative w-full flex-1 bg-[#1a1a1a] overflow-hidden`
- `<img>` com `onError` que mostra icone `<Film>` como fallback
- Gap do grid: `gap-4`

**src/pages/SeriesSplitPage.tsx**
- Mesma abordagem para `renderSeriesCard`
- Container da imagem com `bg-[#1a1a1a]`
- `<img>` com `onError` mostrando `<MonitorPlay>` como fallback
- Gap do grid: `gap-4`

### Padrao do onError (aplicado em todos os cards)
Como cada item e renderizado pelo VirtuosoGrid via `itemContent`, o estado de fallback sera gerenciado diretamente na `<img>` usando o DOM (escondendo via `e.currentTarget.style.display = 'none'` e mostrando o sibling placeholder). Isso evita re-renders do React e e mais performatico para listas virtualizadas.

```text
<div className="relative w-full flex-1 bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
  {url ? (
    <>
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement)?.style
            .removeProperty('display');
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
        <IconComponent className="w-8 h-8 text-muted-foreground" />
      </div>
    </>
  ) : (
    <IconComponent className="w-8 h-8 text-muted-foreground" />
  )}
</div>
```

### Resumo

| Arquivo | Mudanca |
|---|---|
| src/pages/LiveTvSplitPage.tsx | onError fallback + bg rigido + gap-4 |
| src/pages/MoviesSplitPage.tsx | onError fallback + bg rigido + gap-4 |
| src/pages/SeriesSplitPage.tsx | onError fallback + bg rigido + gap-4 |
