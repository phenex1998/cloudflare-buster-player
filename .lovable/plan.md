

# Correcao de Safe Area para Notch e StatusBar

## Problema
O conteudo do app esta sendo sobreposto pela barra de status e pela area do notch/camera, especialmente nos cantos superiores em dispositivos Android.

## Solucao

### 1. Habilitar viewport-fit=cover no index.html
Adicionar `viewport-fit=cover` na meta tag viewport. Isso e obrigatorio para que as variaveis CSS `env(safe-area-inset-*)` funcionem corretamente.

### 2. Aplicar padding de Safe Area no #root (index.css)
Adicionar padding dinamico ao `#root` usando `env(safe-area-inset-*)` para empurrar todo o conteudo para fora das areas perigosas (notch, status bar, navigation bar).

Regra CSS atualizada:
```text
html, body, #root {
  bg-background text-foreground;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}
```

Tambem garantir que `body` tenha `background-color: black` para que qualquer espaco extra do safe-area fique escuro (nao branco).

### 3. Ajustar o botao Voltar da MovieDetailsPage
O botao flutuante `fixed top-4 left-4` precisa respeitar a safe area. Trocar para usar `top: calc(1rem + env(safe-area-inset-top))` e `left: calc(1rem + env(safe-area-inset-left))` via classe utilitaria CSS ou inline style.

### 4. Ajustar a BottomNav
A nav inferior ja tem a classe `safe-area-pb` mas precisamos garantir que o padding bottom funcione. Adicionar uma classe utilitaria `safe-area-pb` no CSS caso nao exista.

---

## Detalhes Tecnicos

### Arquivos modificados

1. **index.html** -- Adicionar `viewport-fit=cover` na meta viewport
2. **src/index.css** -- Adicionar safe-area padding no `#root`, background preto no body, e classe utilitaria `safe-area-pb`
3. **src/pages/MovieDetailsPage.tsx** -- Ajustar posicao do botao Voltar para respeitar safe-area insets

### Impacto
A correcao e global: todas as paginas do app serao automaticamente empurradas para dentro da area segura. Paginas com elementos `fixed` (como o botao Voltar da MovieDetailsPage) precisam de ajuste individual.

