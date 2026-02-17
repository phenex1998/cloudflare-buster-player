

## Correcoes Criticas: Navegacao e Playback Android

### Problema 1: App abrindo navegador externo

O `capacitor.config.json` atual nao tem `allowNavigation`, entao o WebView do Android expulsa qualquer URL externa (streams IPTV) para o Chrome.

**Correcao:** Adicionar `"allowNavigation": ["*"]` dentro do bloco `server` do `capacitor.config.json`.

Resultado:
```json
{
  "appId": "app.lovable.c4e021b328bd442aa81dcccc0857c716",
  "appName": "IPTV Player",
  "webDir": "dist",
  "androidScheme": "https",
  "android": {
    "allowMixedContent": true
  },
  "server": {
    "url": "https://c4e021b3-28bd-442a-a81d-cccc0857c716.lovableproject.com?forceHideBadge=true",
    "cleartext": true,
    "allowNavigation": ["*"]
  }
}
```

---

### Problema 2: Canais ao vivo (.ts) nao reproduzem

O player ja usa HLS.js, mas a logica atual tenta converter `.ts` para `.m3u8` e quando falha, tenta playback direto do `.ts` -- que o WebView Android nao suporta nativamente.

**Correcao:** Forcar **todas** as URLs de live a passarem pelo HLS.js usando MSE (Media Source Extensions), mesmo URLs `.ts` diretas. O HLS.js suporta carregar segmentos `.ts` individuais quando configurado corretamente.

Mudancas no `src/components/VideoPlayer.tsx`:
- Para URLs `/live/` com `.ts`, alimentar o HLS.js diretamente com a URL `.ts` (ele consegue processar segmentos MPEG-TS via MSE)
- Remover o fallback `tryDirectPlayback` para live streams (nao funciona no Android)
- Adicionar configuracao `xhrSetup` no HLS.js para garantir que requisicoes passem corretamente
- Manter fallback direto apenas para VOD (que ja funciona)

---

### Detalhes Tecnicos

#### 1. `capacitor.config.json`
- Adicionar `"allowNavigation": ["*"]` no bloco `server`

#### 2. `src/components/VideoPlayer.tsx`
- Para live streams: sempre usar HLS.js com a URL `.m3u8` (convertida de `.ts`)
- Se `.m3u8` falhar via HLS.js, tentar criar um manifesto HLS sintetico em memoria apontando para o `.ts` e carrega-lo via `hls.loadSource(blob:...)`
- Isso forca o HLS.js a decodificar o `.ts` via MSE, que o WebView Android suporta
- Adicionar timeout de 10s para deteccao de erro em vez de esperar indefinidamente

### Passos apos implementacao

1. `git pull`
2. `npx cap sync`
3. `npx cap run android`

