

# Corrigir reprodução de canais ao vivo no Android

## Causa raiz identificada

O problema **NAO e o player em si** -- e que `Capacitor.isNativePlatform()` retorna `false` quando o app carrega de uma URL remota (preview do Lovable via `server.url`). Isso e um bug documentado do Capacitor. Como resultado, o codigo SEMPRE cai no caminho web (HlsPlayer com .m3u8), que trava no WebView do Android por problemas de CORS e mixed content.

```text
Fluxo atual (BUGADO):
  Click canal -> Capacitor.isNativePlatform() = FALSE (bug!)
    -> cai no else -> setActiveStream() -> HlsPlayer(.m3u8)
    -> WebView tenta carregar .m3u8 -> CORS/mixed content -> loading infinito
```

## Solucao

### 1. Substituir deteccao de plataforma

Trocar `Capacitor.isNativePlatform()` por deteccao via **User Agent** do navegador, que funciona independentemente de como o app foi carregado:

```text
// Em vez de:
Capacitor.isNativePlatform()  // retorna false no WebView remoto

// Usar:
/android/i.test(navigator.userAgent)  // sempre funciona
```

### 2. Usar Intent URI para abrir player externo (VLC/MX Player)

Em vez de `window.open(url, '_system')` (que pode ser interceptado pelo WebView), usar o esquema `intent://` do Android que garante a abertura do player externo:

```text
intent://HOST/live/user/pass/id.ts#Intent;scheme=http;type=video/*;end
```

Isso abre o seletor de apps do Android mostrando VLC, MX Player, ou o player padrao do sistema para reproduzir o stream `.ts` diretamente, sem proxy, sem dependencia.

### 3. Fallback com link clicavel

Se o intent nao funcionar (alguns WebViews bloqueiam), criar um link `<a>` com a URL direta do stream `.ts` que o usuario pode tocar para abrir no player externo.

## Arquivos a modificar

### `src/lib/native-player.ts`
- Criar funcao `isAndroid()` baseada em `navigator.userAgent`
- Implementar `playStream()` com Intent URI como metodo principal
- Fallback para `window.open(url, '_system')` e depois `window.location.href`

### `src/pages/LiveTvPage.tsx`
- Substituir `Capacitor.isNativePlatform()` pela nova funcao `isAndroid()` do `native-player.ts`
- Remover import do `Capacitor` (nao mais necessario nesta pagina)
- No Android: sempre chamar `playStream()` com URL `.ts` direta (sem proxy)
- Na web: manter HlsPlayer com `.m3u8`

## Resultado esperado

```text
Fluxo corrigido no Android:
  Click canal -> isAndroid() = TRUE (via userAgent)
    -> playStream(http://host/live/user/pass/id.ts)
    -> intent://host/live/user/pass/id.ts#Intent;scheme=http;type=video/*;end
    -> Android app chooser -> VLC/MX Player reproduz .ts direto
    -> Sem proxy, sem dependencia, conexao direta do celular

Fluxo na Web (sem mudanca):
  Click canal -> isAndroid() = FALSE
    -> setActiveStream() -> HlsPlayer(.m3u8) via proxy
```

## Detalhes tecnicos

A funcao `playStream` tera esta logica:

```text
1. Detectar Android via navigator.userAgent
2. Se Android:
   a. Tentar abrir via intent:// URI (abre VLC/MX Player/player do sistema)
   b. Se falhar, tentar window.open(url, '_system')
   c. Se falhar, redirecionar via window.location.href
3. Se iOS: window.open(url, '_blank') (iOS lida nativamente com video)
4. Se Web: window.open(url, '_blank')
```

O Intent URI segue o padrao documentado pelo VLC (videolan.org):
- scheme: http
- type: video/*
- data: URL completa do stream .ts

