

# Adicionar Autoplay ao Player Nativo

## Problema
O player nativo abre corretamente em tela cheia, mas inicia pausado -- o usuario precisa tocar manualmente para iniciar a reproducao.

## Solucao

### Arquivo: `src/lib/native-player.ts`

Duas mudancas na funcao `playFullscreen`:

1. **Adicionar `autoplay: true`** no objeto de configuracao do `initPlayer` (linha 29-40)
2. **Failsafe**: Chamar `VideoPlayer.play({ playerId: 'fullscreen-player' })` logo apos o `initPlayer`, caso a propriedade `autoplay` seja ignorada por alguma versao do plugin

### Codigo resultante (trecho relevante):

```text
const { VideoPlayer } = await import('@capgo/capacitor-video-player');
await VideoPlayer.stopAllPlayers().catch(() => {});
await VideoPlayer.initPlayer({
  mode: 'fullscreen',
  url: url.trim(),
  playerId: 'fullscreen-player',
  componentTag: 'div',
  title: title || 'Stream',
  exitOnEnd: true,
  loopOnEnd: false,
  showControls: true,
  displayMode: 'landscape',
  chromecast: false,
  autoplay: true,          // <-- NOVO
});

// Failsafe: forca play caso autoplay nao funcione
try {
  await VideoPlayer.play({ playerId: 'fullscreen-player' });
} catch (e) {
  console.log('[playFullscreen] Play fallback:', e);
}
```

## Arquivos modificados
1. `src/lib/native-player.ts` -- adicionar `autoplay: true` + chamada explicita de `play()`

## Resultado esperado
Ao clicar num canal, o video abre em tela cheia e comeca a reproduzir imediatamente sem interacao do usuario.
