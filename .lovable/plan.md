

# Corrigir reprodução de canais no Android e remover proxy nativo

## Diagnóstico

O problema tem duas causas:

1. **O plugin `capacitor-video-player` esta falhando silenciosamente.** Ele depende de configuracao nativa especifica e sincronizacao perfeita (`npx cap sync`). Se o plugin nao estiver registrado corretamente no lado nativo, `initPlayer` falha e o catch apenas mostra um toast -- sem nenhum player abrindo.

2. **O app ja usa conexao direta no Android para chamadas de API** (a funcao `fetchApi` em `xtream-api.ts` detecta nativo e faz fetch direto). Porem, para reproducao de video, o plugin `capacitor-video-player` adiciona uma camada de complexidade desnecessaria.

## Sobre remover o proxy no Android

O proxy (edge function `iptv-proxy`) so e necessario na **web** por causa de CORS. No Android nativo:
- Nao existe CORS no WebView/ExoPlayer
- A conexao direta do celular ao servidor IPTV e mais rapida (menos latencia, sem intermediario)
- O `fetchApi` ja faz isso para chamadas de API -- esta correto
- Para streams de video, a URL `.ts` pode ser aberta diretamente pelo player nativo sem nenhum proxy

**Conclusao: remover o proxy para o Android e a abordagem correta e ja esta parcialmente implementada. So falta o player funcionar.**

## Solucao proposta

### 1. Substituir `capacitor-video-player` por Intent nativo (`src/lib/native-player.ts`)

Em vez de depender do plugin `capacitor-video-player` (que esta causando problemas), usar o **sistema de Intents do Android** para abrir o stream `.ts` diretamente em um player externo instalado no celular (VLC, MX Player, ou o player padrao do sistema).

Isso sera feito com o plugin `@capacitor/app-launcher` ou simplesmente usando `window.open(url, '_system')` que o Capacitor automaticamente traduz para um Intent `ACTION_VIEW` no Android.

Nova implementacao de `native-player.ts`:
- Remover import do `@capgo/capacitor-video-player`
- Usar `window.open(url, '_system')` como metodo principal -- abre no player de video padrao do Android
- Adicionar fallback para abrir no navegador do sistema

### 2. Manter HlsPlayer como fallback web (`src/pages/LiveTvPage.tsx`)

- Sem mudancas no fluxo: Android usa player externo, Web usa HlsPlayer embutido
- A logica condicional `Capacitor.isNativePlatform()` ja esta correta

### 3. Limpar dependencias

- Remover `@capgo/capacitor-video-player` do `build.rollupOptions.external` em `vite.config.ts` (nao sera mais necessario)
- O import do plugin nao existira mais no codigo

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/native-player.ts` | Remover `capacitor-video-player`, usar `window.open(url, '_system')` para abrir no player nativo do Android |
| `vite.config.ts` | Remover `@capgo/capacitor-video-player` do `rollupOptions.external` |

## Resultado esperado

- Clicar em um canal no Android abre imediatamente o player de video instalado no celular (VLC, MX Player, player padrao) com o stream `.ts` direto
- Sem proxy, sem intermediario -- conexao direta do celular ao servidor IPTV
- Na web, continua funcionando com HlsPlayer embutido via proxy (necessario por causa de CORS)

## Detalhes tecnicos

```text
Android (nativo):
  Click canal -> handlePlay() -> playStream(http://host/live/user/pass/id.ts)
    -> window.open(url, '_system')
    -> Android Intent ACTION_VIEW
    -> Player externo (VLC/MX Player/padrao) reproduz o .ts direto

Web (navegador):
  Click canal -> handlePlay() -> setActiveStream()
    -> HlsPlayer com .m3u8 via proxy (CORS)
```

