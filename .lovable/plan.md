

# Pivot Completo: Layout TV Box / Dashboard (Landscape Only)

## Visao Geral

Transformacao total da interface de um layout mobile vertical para um layout landscape estilo TV Box, inspirado nos apps Strimo e Viver. O app passara a ter duas telas principais: um **Dashboard Home** com cards grandes e um **Split View de 4 colunas** para navegacao e reproducao.

---

## Etapa 1 -- Configuracao Global (Landscape + Dark Theme)

### CSS Global (`src/index.css`)
- Adicionar regras para forcar `100vw x 100vh`, sem scroll na pagina principal
- Adicionar meta de orientacao landscape no `index.html`
- Criar variaveis CSS para glassmorphism (blur, transparencia, bordas luminosas)
- Adicionar classes utilitarias para os efeitos de vidro nos cards

### Capacitor (`capacitor.config.json`)
- Adicionar `"orientation": "landscape"` para travar a rotacao no Android

---

## Etapa 2 -- Nova Tela Home / Dashboard

### Novo arquivo: `src/pages/HomePage.tsx`

Layout:
```text
+-------------------------------------------------------+
|  Logo       19:51 (relogio)        [user] [sync] [power] |
|                                                         |
|   +-------------+  +-------------+  +-------------+    |
|   |   TV icon   |  |  Film icon  |  | Series icon |    |
|   |             |  |             |  |             |    |
|   | TV AO VIVO  |  |   FILMES   |  |   SERIES   |    |
|   +-------------+  +-------------+  +-------------+    |
|                                                         |
|   +-----------+  +----------+       +------------------+|
|   | Favoritos |  | Ajustes  |       | Usuario: xxx     ||
|   +-----------+  +----------+       | Validade: xx/xx  ||
|                                     +------------------+|
+-------------------------------------------------------+
```

- **Topo**: Relogio digital (atualizado a cada segundo com `useEffect`), icones de status (usuario, sync, power/logout)
- **Centro**: 3 cards grandes com glassmorphism (`backdrop-blur`, `bg-white/5`, `border border-white/10`), icones grandes (Lucide: `Tv`, `Film`, `MonitorPlay`), clicaveis com hover glow
- **Rodape**: Botoes menores para Favoritos e Ajustes; widget no canto direito mostrando username e data de expiracao (vindo do `authInfo.user_info`)

---

## Etapa 3 -- Layout Split View de 4 Colunas (TV Ao Vivo)

### Novo arquivo: `src/pages/LiveTvSplitPage.tsx`

Layout:
```text
+--+--------+-----------+---------------------------+
|  | Categ. |  Canais   |                           |
|H |        |           |                           |
|o | Tudo   | 1. Canal  |      PLAYER VIDEO         |
|m | Globo  | 2. Canal  |      (inline, fixo)       |
|e | Sport  | 3. Canal  |                           |
|  | Kids   | 4. Canal  |   [Nome do canal] [fav]   |
|TV|        |           |   [Expandir tela cheia]    |
|  |        |           |                           |
+--+--------+-----------+---------------------------+
 60px  20%      30%              50%
```

- **Coluna 1 (60px)**: Sidebar fixa com icones verticais -- Home (`House`), TV (`Tv`), Filmes (`Film`), Series (`MonitorPlay`), Busca (`Search`). Ao clicar Home volta para Dashboard. Os outros navegam para suas respectivas split views.
- **Coluna 2 (20%)**: Lista vertical de categorias com scroll interno. Mostra nome da categoria e quantidade de canais. "Tudo" no topo como default. Categoria selecionada fica destacada com borda primary.
- **Coluna 3 (30%)**: Lista de canais da categoria selecionada com scroll interno. Cada item mostra numero, icone do canal e nome. Canal selecionado fica com fundo highlighted.
- **Coluna 4 (50%)**: Area do player. Video renderizado inline usando a tag `<video>` com a URL do stream. Abaixo do video: nome do canal, botao favoritar, botao EPG. Botao "Expandir" sobreposto no canto superior direito do video para fullscreen via `requestFullscreen()`.

### Comportamento do Player inline
- Quando usuario clica em um canal na Coluna 3, o estado `activeStream` muda
- O `<video>` na Coluna 4 atualiza seu `src` imediatamente (sem mudar de pagina, sem modal)
- Para canais ao vivo, a URL usa extensao `.ts` (stream direto)
- Botao "Expandir" chama `videoRef.current.requestFullscreen()` para tela cheia nativa do navegador/WebView

---

## Etapa 4 -- Split Views para Filmes e Series

### Novo arquivo: `src/pages/MoviesSplitPage.tsx`
- Mesma estrutura de 4 colunas
- Coluna 2: Categorias de filmes
- Coluna 3: Grid ou lista de filmes (poster + nome)
- Coluna 4: Player inline ao clicar

### Novo arquivo: `src/pages/SeriesSplitPage.tsx`
- Mesma estrutura de 4 colunas
- Coluna 2: Categorias de series
- Coluna 3: Lista de series -> ao selecionar mostra temporadas/episodios
- Coluna 4: Player inline ao clicar num episodio

---

## Etapa 5 -- Atualizacao de Rotas e Remocao de Componentes Antigos

### `src/App.tsx`
- Rota `/` -> `HomePage` (Dashboard)
- Rota `/live` -> `LiveTvSplitPage`
- Rota `/movies` -> `MoviesSplitPage`
- Rota `/series` -> `SeriesSplitPage`
- Manter `/player` para fullscreen nativo no Android (Capacitor)
- Remover `BottomNav` (nao mais necessario, substituido pela sidebar de icones)

### Componentes removidos/descontinuados
- `BottomNav` -- substituido pela sidebar vertical
- `AppHeader` -- substituido pelo header do Dashboard e pela sidebar

---

## Etapa 6 -- Componente Sidebar Reutilizavel

### Novo arquivo: `src/components/IconSidebar.tsx`
- Barra vertical de 60px, fundo escuro com glassmorphism
- Icones: Home, TV, Filmes, Series, Busca (na parte inferior: Ajustes)
- Icone ativo com glow e cor primary
- Usa `useNavigate` para trocar de rota

---

## Detalhes Tecnicos

### Glassmorphism CSS
```text
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

### Relogio Digital
- `useState` + `useEffect` com `setInterval` de 1 segundo
- Formato `HH:MM` centralizado no topo

### Player Inline
- Elemento `<video>` com `autoPlay`, `controls`
- `src` atualizado via estado React
- Fullscreen via API nativa do browser (`element.requestFullscreen()`)
- No Android nativo (Capacitor), botao "Expandir" pode chamar o plugin `capacitor-video-player` para fullscreen real

### Arquivos criados
1. `src/pages/HomePage.tsx` -- Dashboard principal
2. `src/pages/LiveTvSplitPage.tsx` -- Split view TV ao vivo
3. `src/pages/MoviesSplitPage.tsx` -- Split view filmes
4. `src/pages/SeriesSplitPage.tsx` -- Split view series
5. `src/components/IconSidebar.tsx` -- Sidebar vertical de icones

### Arquivos modificados
1. `src/App.tsx` -- Novas rotas, remover BottomNav
2. `src/index.css` -- Glassmorphism, landscape, no-scroll global
3. `index.html` -- Meta viewport landscape
4. `capacitor.config.json` -- Orientacao landscape

