

# Corrigir Player Fechando Imediatamente

## Problema

No `PlayerPage.tsx` (linhas 53-56), apos `VideoPlayer.initPlayer()` resolver, o codigo executa `navigate(-1)`. No modo `fullscreen`, o `initPlayer` so resolve quando o player nativo fecha. Porem, no modo `embedded`, a promise resolve imediatamente apos iniciar a reproducao, causando a navegacao de volta e fazendo parecer que "abre e fecha".

## Solucao

Remover o `navigate(-1)` automatico apos `initPlayer` resolver. A navegacao de volta deve ser feita apenas pelo botao de voltar manual que ja existe na interface. Tambem ajustar o `setLoading(false)` para indicar que o player iniciou com sucesso.

## Alteracoes

### `src/pages/PlayerPage.tsx`

Dentro do bloco `if (isNative)` no `useEffect`:

**Antes:**
```text
await VideoPlayer.initPlayer({ ... });

// initPlayer resolves when the native player closes
if (!cancelled) {
  navigate(-1);
}
```

**Depois:**
```text
await VideoPlayer.initPlayer({ ... });

// Em modo embedded, initPlayer resolve imediatamente
// A navegacao de volta e feita pelo botao manual
if (!cancelled) {
  setLoading(false);
}
```

Nenhuma outra alteracao. A logica de reproducao, parametros do plugin e configuracoes do Capacitor permanecem intactas.

