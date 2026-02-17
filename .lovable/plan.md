
# Corrigir "video URL not found" no Player Nativo

## Problema identificado

Dois problemas causam o erro:

1. **LiveTvPage usa extensao `.m3u8`** (linha 55) -- o plugin `@capgo/capacitor-video-player` tem dificuldade com URLs `.m3u8` de servidores IPTV Xtream. O correto para canais ao vivo e usar `.ts` (stream direto) que o ExoPlayer nativo reproduz sem problemas.

2. **O plugin `@capgo/capacitor-video-player` valida a URL internamente** e rejeita URLs que nao passam na validacao dele (erro "video URL not found"). Isso acontece porque o plugin espera URLs com extensoes de video conhecidas ou protocolos especificos.

## Solucao

### 1. `src/pages/LiveTvPage.tsx`
- Alterar a extensao de `'m3u8'` para `'ts'` na chamada `getLiveStreamUrl`

### 2. `src/pages/PlayerPage.tsx`
- Adicionar log da URL antes de iniciar o player para debug
- Garantir que a URL nao tenha espacos ou caracteres invalidos (trim)
- Mudar o `playerId` para `'iptvPlayer'` e `componentTag` para `'div'` (mais compativel)
- Adicionar tratamento especifico para o erro "video URL not found" com mensagem mais clara
- Garantir que URLs HTTP funcionem adicionando `subtitle: ''` e removendo opcoes que podem causar conflito

### 3. `capacitor.config.json`
- Adicionar `"allowNavigation": ["*"]` para permitir carregamento de URLs externas HTTP no WebView

## Detalhes tecnicos

### LiveTvPage - correcao da extensao
```text
// ANTES (linha 55):
const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'm3u8');

// DEPOIS:
const url = xtreamApi.getLiveStreamUrl(credentials, stream.stream_id, 'ts');
```

### PlayerPage - inicializacao robusta do plugin
```text
// Limpar URL
const cleanUrl = state.url.trim();
console.log('[Player] URL:', cleanUrl);

// initPlayer com parametros minimos e compativeis
await VideoPlayer.initPlayer({
  mode: 'fullscreen',
  url: cleanUrl,
  playerId: 'iptvPlayer',
  componentTag: 'div',
  title: state.title || 'Stream',
  exitOnEnd: true,
  loopOnEnd: false,
  showControls: true,
  displayMode: 'landscape',
  chromecast: false,
});
```

### capacitor.config.json - permitir navegacao externa
```text
{
  "appId": "...",
  "appName": "IPTV Player",
  "webDir": "dist",
  "androidScheme": "http",
  "android": {
    "allowMixedContent": true
  },
  "server": {
    "allowNavigation": ["*"],
    "cleartext": true
  }
}
```

## Resultado esperado

- Canais ao vivo: URL `.ts` direta reproduzida pelo ExoPlayer nativo em tela cheia
- Filmes (VOD): URL com extensao original (`.mp4`, `.mkv`) reproduzida pelo ExoPlayer
- Series: URL com extensao original reproduzida pelo ExoPlayer
- Sem erros de "video URL not found"
