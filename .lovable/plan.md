
# Corrigir canais ao vivo com CapacitorVideoPlayer (ExoPlayer nativo)

## Problema

Os canais ao vivo usam `playStream()` que tenta abrir via Intent Android. Isso pode falhar silenciosamente no WebView do Capacitor, resultando em carregamento infinito sem feedback.

## Solucao

Usar o plugin `@capgo/capacitor-video-player` (ja instalado) que usa ExoPlayer internamente no Android. Para streams ao vivo, abrir em fullscreen com `loopOnEnd: true` e `exitOnEnd: false`. Adicionar timeout de 10s com fallback para player externo.

## Arquivos a modificar

### 1. `src/lib/native-player.ts` - Reescrever completamente

Importar `VideoPlayer` de `@capgo/capacitor-video-player` e criar duas funcoes:

- `playWithNativePlayer(url, title)`: Usa `VideoPlayer.initPlayer()` com:
  - `mode: 'fullscreen'`
  - `url: url`
  - `title: title`
  - `rate: 1.0`
  - `exitOnEnd: false`
  - `loopOnEnd: true`
  - `pipEnabled: true`
  - `displayMode: 'landscape'`

- `playWithExternalPlayer(url, title)`: Mantem a logica de Intent Android atual como fallback

- `playStream(url, title)`: Funcao principal que:
  1. Detecta se e stream ao vivo (URL nao termina em .mp4/.mkv/.avi)
  2. Para live: chama `playWithNativePlayer()` com timeout de 10s
  3. Se falhar ou timeout: retorna `{ fallback: true }` para a UI mostrar botao de player externo
  4. Para VOD: continua usando Intent (que ja funciona)

### 2. `src/pages/LiveTvPage.tsx` - Adicionar estado de fallback

- Adicionar estado `playerError` com `stream` e flag de fallback
- `handlePlay()`:
  1. Monta URL `.ts` (como ja faz)
  2. Chama `playWithNativePlayer(url, title)`
  3. Se falhar (catch ou timeout): seta `playerError` com o stream
- Quando `playerError` esta ativo, mostrar overlay/modal com:
  - Mensagem "Nao foi possivel reproduzir"
  - Botao "Abrir no VLC/Player Externo" que chama `playWithExternalPlayer()`
  - Botao "Tentar novamente"
  - Botao "Fechar"

### 3. `src/pages/MoviesPage.tsx` - Sem mudancas

VOD ja funciona com Intent, nao precisa mudar.

## Fluxo final

```text
Usuario clica no canal ao vivo
  -> handlePlay(stream)
  -> URL = http://host/live/user/pass/123.ts
  -> VideoPlayer.initPlayer({ mode: 'fullscreen', url, title, rate: 1.0, ... })
  -> ExoPlayer abre fullscreen no Android
  
Se falhar em 10s:
  -> Mostra overlay com botao "Abrir no VLC/Player Externo"
  -> Intent Android abre seletor de apps
```

## Detalhes tecnicos

### native-player.ts - API do plugin

```text
import { VideoPlayer } from '@capgo/capacitor-video-player';

playWithNativePlayer(url, title):
  try:
    timeout = new Promise(reject after 10s)
    player = VideoPlayer.initPlayer({
      mode: 'fullscreen',
      url: url,
      title: title,
      rate: 1.0,
      exitOnEnd: false,
      loopOnEnd: true,
      pipEnabled: true,
      showControls: true,
      displayMode: 'landscape',
    })
    await Promise.race([player, timeout])
  catch:
    throw error  // LiveTvPage trata o erro

playWithExternalPlayer(url, title):
  // Intent Android (codigo atual)
  intent://stripped#Intent;scheme=http;type=video/*;S.title=TITLE;end
```

### LiveTvPage.tsx - Estado de fallback

```text
state: {
  failedStream: { url, name } | null
}

handlePlay(stream):
  setFailedStream(null)
  url = getLiveStreamUrl(credentials, stream.stream_id, 'ts')
  addToHistory(...)
  try:
    await playWithNativePlayer(url, stream.name)
  catch:
    setFailedStream({ url, name: stream.name })

Render (quando failedStream != null):
  <div fixed overlay>
    <p>"Falha ao reproduzir {name}"</p>
    <Button "Abrir no Player Externo" onClick={playWithExternalPlayer(url, name)} />
    <Button "Tentar Novamente" onClick={handlePlay(stream)} />
    <Button "Fechar" onClick={setFailedStream(null)} />
  </div>
```
