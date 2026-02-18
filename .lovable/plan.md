
# Botao Fisico Voltar do Android (Hardware Back Button)

## Problema
Ao pressionar o botao fisico de Voltar no Android, o app fecha imediatamente em vez de navegar para a tela anterior.

## Solucao
Adicionar um listener do plugin `@capacitor/app` dentro do componente `AuthenticatedRoutes`, onde temos acesso ao `useNavigate` do React Router.

### Alteracoes no `src/App.tsx`

1. Importar `App as CapApp` de `@capacitor/app` e `useNavigate`, `useLocation` de `react-router-dom`
2. Dentro de `AuthenticatedRoutes`, adicionar um `useEffect` com o listener `backButton`
3. Logica:
   - Se a rota atual for `/` (Home): chamar `CapApp.exitApp()` para fechar o app
   - Caso contrario: chamar `navigate(-1)` para voltar a tela anterior

### Codigo do listener

```text
import { App as CapApp } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';

// Dentro de AuthenticatedRoutes:
const navigate = useNavigate();
const location = useLocation();

useEffect(() => {
  const listener = CapApp.addListener('backButton', () => {
    if (location.pathname === '/') {
      CapApp.exitApp();
    } else {
      navigate(-1);
    }
  });
  return () => { listener.then(h => h.remove()); };
}, [location.pathname, navigate]);
```

### Detalhes tecnicos

- O `@capacitor/app` ja esta instalado no projeto (versao ^8.1.0)
- O listener e registrado dentro de `AuthenticatedRoutes` porque e o unico componente que esta dentro do `BrowserRouter` e tem acesso aos hooks do React Router
- O cleanup do useEffect remove o listener anterior e recria com a rota atualizada
- Na web (browser), o listener nao dispara, entao nao ha efeito colateral fora do ambiente nativo

### Arquivo modificado
- `src/App.tsx`
