

# Corrigir reprodução inline do player de vídeo

## Problema
Em dispositivos móveis (iOS e alguns Android), o vídeo pode ser forçado para fullscreen automaticamente ao iniciar a reprodução, impedindo o layout Split View de funcionar corretamente.

## Alterações em `src/pages/PlayerPage.tsx`

### 1. Adicionar `playsinline: true` nas opções do Video.js (linha 94-110)
Incluir a propriedade `playsinline: true` no objeto de configuração passado ao `videojs()`. Isso faz o Video.js adicionar automaticamente os atributos `playsinline` e `webkit-playsinline` na tag `<video>`.

```text
const player = videojs(videoEl, {
  autoplay: true,
  controls: true,
  responsive: true,
  fluid: false,
  playsinline: true,       // <-- NOVO
  liveui: !!streamState.isLive,
  sources: [...],
  html5: { ... },
});
```

### 2. Adicionar `min-height` no container de vídeo (linha 171)
Alterar o style do container para incluir `minHeight: '250px'`, garantindo que o player nunca fique invisível em telas muito pequenas.

```text
<div className="relative shrink-0" style={{ height: '35vh', minHeight: '250px', background: '#000' }}>
```

## O que NÃO precisa mudar
- `object-fit: contain` já está aplicado via CSS no container
- Não existe nenhum `requestFullscreen()` automático no código
- O container pai já usa `display: flex`
- Não há `visibility: hidden` em nenhum estado

## Resumo
Duas alterações cirúrgicas: adicionar `playsinline: true` na config do Video.js e `minHeight: '250px'` no container.
