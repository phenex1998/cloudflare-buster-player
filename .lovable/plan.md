

## Correções: App Nativo + Login Xtream Codes

### Problema 1: App abre no navegador em vez de rodar nativamente

**Causa:** O `capacitor.config.json` precisa incluir o bloco `server` com a URL do preview do Lovable para funcionar em modo de desenvolvimento com hot-reload. Sem isso, o app precisa ser compilado (`npm run build` + `npx cap sync`) a cada mudança. Para desenvolvimento, o correto é usar a URL do sandbox.

**Solução:** Adicionar o bloco `server` com a URL correta do sandbox no `capacitor.config.json`:

```json
{
  "appId": "app.lovable.c4e021b328bd442aa81dcccc0857c716",
  "appName": "IPTV Player",
  "webDir": "dist",
  "server": {
    "url": "https://c4e021b3-28bd-442a-a81d-cccc0857c716.lovableproject.com?forceHideBadge=true",
    "cleartext": true
  }
}
```

Isso faz o WebView do Capacitor carregar o app diretamente dentro do aplicativo nativo (sem abrir navegador externo). O WebView e um componente embutido no app, nao e o Chrome/Safari.

Para build de producao (publicar na loja), basta remover o bloco `server` e rodar `npm run build` + `npx cap sync`.

---

### Problema 2: Erro ao fazer login com credenciais Xtream Codes

**Causa:** Duas possiveis razoes:

1. **CORS bloqueado:** Quando o app roda no preview web do Lovable, o navegador bloqueia requisicoes para servidores IPTV externos por politica de CORS. No app nativo (Capacitor), isso nao acontece pois o WebView nao tem essa restricao.

2. **Tratamento de erro generico:** O codigo atual so mostra "Falha na conexao" sem detalhes, dificultando o diagnostico.

**Solucao:**

- Criar uma **edge function (backend function)** que atua como proxy para as requisicoes ao servidor Xtream. Isso resolve o CORS no preview web.
- Melhorar as mensagens de erro no login para mostrar detalhes do problema.
- Detectar se esta rodando no Capacitor (nativo) para fazer requisicoes diretas, ou usar o proxy quando estiver no navegador.

---

### Detalhes Tecnicos

#### 1. Atualizar `capacitor.config.json`
- Adicionar bloco `server` com URL do sandbox para desenvolvimento

#### 2. Criar edge function `iptv-proxy`
- Recebe os parametros (host, username, password, action)
- Faz a requisicao ao servidor IPTV no backend (sem CORS)
- Retorna a resposta ao cliente

#### 3. Atualizar `src/lib/xtream-api.ts`
- Detectar ambiente (nativo vs web) usando `window.Capacitor`
- No nativo: fazer fetch direto ao servidor IPTV
- No web: rotear pelo proxy da edge function
- Melhorar mensagens de erro com mais detalhes

#### 4. Atualizar `src/contexts/IptvContext.tsx`
- Exibir mensagens de erro mais descritivas
- Tratar diferentes tipos de falha (rede, credenciais, servidor)

### Passos apos implementacao

Depois de implementar, voce precisara:
1. Fazer `git pull` do projeto
2. Rodar `npx cap sync`
3. Rodar `npx cap run android`
