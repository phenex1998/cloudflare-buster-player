
## Correções: Canais ao Vivo e Navegador Externo

### Problema 1: Canais ao vivo não abrem

**Causa raiz:** A função `getLiveStreamUrl` ainda usa `.ts` como formato padrão (linha 214 do arquivo xtream-api.ts). A correção anterior para mudar para `.m3u8` não foi aplicada. O formato `.ts` não é suportado nativamente pelo WebView/navegador.

**Correções:**

1. **Alterar `getLiveStreamUrl`** para usar `.m3u8` como extensão padrão em vez de `.ts`
2. **Melhorar o VideoPlayer** com:
   - Tratamento de erros do HLS (reconexão automática em caso de falha)
   - Suporte a URLs sem extensão `.m3u8` (tratar todas as URLs de live como HLS)
   - Estado visual de loading/erro para o usuário saber o que está acontecendo

### Problema 2: Links abrindo no navegador externo

**Causa raiz:** O WebView do Capacitor precisa de configurações adicionais para evitar que links HTTP externos (como as URLs dos streams IPTV) sejam interceptados pelo sistema e abertos no Chrome/navegador padrão.

**Correções no `capacitor.config.json`:**
- Adicionar `"androidScheme": "https"` para que o WebView use HTTPS como esquema padrão
- Adicionar `"allowMixedContent": true` no bloco `android` para permitir conteúdo HTTP dentro do HTTPS (necessário para servidores IPTV que usam HTTP)

---

### Detalhes Tecnicos

#### 1. `src/lib/xtream-api.ts`
- Mudar `getLiveStreamUrl` de `ext = 'ts'` para `ext = 'm3u8'`

#### 2. `src/components/VideoPlayer.tsx`
- Adicionar tratamento de erros HLS com reconexão automática (`Hls.Events.ERROR`)
- Tratar URLs de live (sem extensão .m3u8) forçando uso do HLS.js
- Adicionar estado de loading e erro visual
- Adicionar fallback: se HLS falhar, tentar carregar direto no elemento video

#### 3. `capacitor.config.json`
- Adicionar `"androidScheme": "https"`
- Adicionar bloco `"android"` com `"allowMixedContent": true`

Resultado final do capacitor.config.json:
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
    "cleartext": true
  }
}
```

### Passos após implementação

1. Fazer `git pull` do projeto
2. Rodar `npx cap sync`
3. Rodar `npx cap run android`
