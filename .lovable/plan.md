
# Login Visual + Correcao da Tela de Series

## Parte 1: Login - Centralizar e trocar logo/nome

### Mudancas em `src/pages/LoginPage.tsx`
- Substituir o icone `Tv` pelo logo do app (imagem enviada pelo usuario)
- Trocar o titulo de "IPTV Player" para "BestApp"
- Centralizar melhor a coluna direita (formulario) usando `justify-center items-center`
- Manter toda a logica de autenticacao intacta

### Novo asset
- Copiar a imagem enviada para `src/assets/logo.png`
- Importar como modulo ES6 no LoginPage: `import logo from '@/assets/logo.png'`
- Substituir o div com icone Tv por `<img src={logo} className="w-20 h-20 rounded-2xl" />`

## Parte 2: Correcao da Tela de Series (SeriesDetailPage)

### Problema identificado
A `SeriesDetailPage` usa `min-h-screen` e `pb-20` -- layout vertical estilo mobile. Porem o app roda em landscape com `h-screen overflow-hidden` no `#root`. Isso faz com que o conteudo fique cortado e inacessivel, pois nao ha scroll disponivel.

A `MovieDetailsPage` funciona corretamente porque usa `w-full h-full overflow-y-auto` (se adapta ao container).

### Solucao
Reescrever o layout do `SeriesDetailPage` para funcionar no modo landscape (igual ao MovieDetailsPage):

1. Container principal: `relative w-full h-full overflow-y-auto bg-background` (em vez de `min-h-screen`)
2. Backdrop como fundo absoluto com gradientes
3. Conteudo em layout horizontal (flex-row) para aproveitar a largura da tela landscape:
   - Lado esquerdo: cover/poster da serie
   - Lado direito: titulo, sinopse, elenco, seletor de temporadas e lista de episodios
4. Botao de voltar fixo no canto superior esquerdo (igual ao MovieDetailsPage)
5. Lista de episodios dentro de um container scrollavel

### Arquivos modificados
1. `src/assets/logo.png` -- novo arquivo (copia do upload)
2. `src/pages/LoginPage.tsx` -- logo, nome, centralizacao
3. `src/pages/SeriesDetailPage.tsx` -- layout landscape compativel

### Detalhes tecnicos do SeriesDetailPage

O layout sera adaptado seguindo o padrao do MovieDetailsPage:

```text
<div className="relative w-full h-full overflow-y-auto bg-background">
  <!-- Backdrop absoluto com gradientes -->
  <!-- Botao voltar fixo -->
  <!-- Conteudo: flex-row com poster + metadata + temporadas + episodios -->
</div>
```

A estrutura hierarquica (temporadas > episodios) sera mantida, mas organizada horizontalmente para caber na viewport landscape. O seletor de temporadas ficara como pills horizontais e os episodios em uma lista compacta abaixo.
