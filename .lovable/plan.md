

# Corrigir reprodução de canais ao vivo no Android

## Problema
Quando você clica em um canal, a página abre o **HlsPlayer** (player web) com URL `.m3u8`. No Android, esse player trava infinitamente porque o WebView não consegue reproduzir streams IPTV de forma confiável.

A função `playStream()` que usa o **ExoPlayer nativo** (via capacitor-video-player) nunca é chamada na tela de Live TV.

## Solução
Ao clicar num canal no Android, chamar diretamente o **player nativo** (ExoPlayer) com a URL `.ts`. No navegador web, manter o HlsPlayer atual como fallback.

## Mudancas

### 1. `src/pages/LiveTvPage.tsx`
- Importar `playStream` de `@/lib/native-player` e `Capacitor` de `@capacitor/core`
- Alterar `handlePlay()`:
  - Se estiver no Android/iOS (nativo): chamar `playStream(url_ts, nome)` diretamente -- abre em tela cheia nativa via ExoPlayer
  - Se estiver na web: manter o comportamento atual (abrir HlsPlayer embutido com `.m3u8`)
- Gerar a URL com extensao `.ts` para o player nativo

### 2. `src/lib/native-player.ts`
- Nenhuma mudanca necessaria, a funcao `playStream` ja esta pronta

## Resultado esperado
- No celular Android: clicar no canal abre imediatamente o ExoPlayer em tela cheia com o stream `.ts`
- No navegador web: continua funcionando com o HlsPlayer embutido

## Detalhes tecnicos

```text
Fluxo no Android:
  Click canal -> handlePlay() -> detecta nativo -> playStream(url.ts) -> ExoPlayer fullscreen

Fluxo na Web:
  Click canal -> handlePlay() -> detecta web -> setActiveStream() -> HlsPlayer(.m3u8)
```

