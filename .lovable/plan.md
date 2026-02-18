

# Redesenho Visual da Tela de Login (Dark Mode Premium)

## Resumo
Redesenhar completamente o visual da `LoginPage.tsx` para um estilo cinematografico premium (inspirado em Netflix/HBO Max), mantendo toda a logica de autenticacao intacta (estados, handlers, contexto).

---

## Alteracoes

### Arquivo: `src/pages/LoginPage.tsx`

**Background Cinematografico:**
- Fundo com gradiente radial escuro profundo (tons de roxo/azul/preto) usando CSS inline ou classes Tailwind
- Overlay `bg-black/60` sobre o gradiente para garantir legibilidade
- Sem imagem externa (usar gradientes CSS para evitar dependencia de assets)

**Card Central com Glassmorphism:**
- Container centralizado com `min-h-screen flex items-center justify-center`
- Card com `bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`
- Largura `max-w-md` com padding generoso (`p-8`)

**Logo no Topo do Card:**
- Icone `Tv` maior (w-12 h-12) dentro de um circulo com gradiente roxo-azul
- Titulo "IPTV Player" em branco, fonte bold, tracking tight
- Subtitulo em `text-gray-400`

**Inputs Estilizados com Icones:**
- Cada input envolto em um container relativo com icone a esquerda:
  - Host: icone `Globe` (lucide-react)
  - Usuario: icone `User` (lucide-react)
  - Senha: icone `Lock` (lucide-react)
- Estilo dos inputs: `bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 pl-11 rounded-xl`
- Foco: `focus:border-purple-500 focus:ring-purple-500/20` (borda neon roxa)

**Botao de Entrar:**
- Gradiente: `bg-gradient-to-r from-purple-600 to-blue-600`
- Largura total (`w-full`), altura `h-12`, `rounded-xl`
- Hover: `hover:from-purple-500 hover:to-blue-500`
- Active: leve scale down com `active:scale-[0.98]`
- Texto branco bold, mantendo o spinner de loading

**Mensagem de Erro:**
- Estilo: `bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl`

**Rodape:**
- Texto "Seus dados sao salvos localmente" em `text-gray-600 text-xs`

### Arquivo: `src/index.css`
- Adicionar classe utilitaria `.login-bg` com gradiente radial cinematografico usando `radial-gradient` com tons de roxo escuro e preto

---

## O que NAO muda
- Estados: `host`, `username`, `password`
- Handler: `handleSubmit` e chamada a `login()`
- Contexto: `useIptv()` com `login`, `isLoading`, `error`
- Imports do contexto e logica de formulario

## Detalhes Tecnicos

### Icones adicionados (lucide-react)
- `Globe` - campo Host
- `User` - campo Usuario
- `Lock` - campo Senha
- `Tv` e `Loader2` - mantidos

### Estrutura do input com icone
```text
<div className="relative">
  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
  <input className="pl-11 h-12 bg-white/5 ..." />
</div>
```

### Gradiente de fundo (CSS)
```text
.login-bg {
  background: radial-gradient(ellipse at top, hsla(262,60%,15%,1) 0%, hsla(225,30%,5%,1) 50%, black 100%);
}
```

### Arquivos modificados
1. `src/pages/LoginPage.tsx` - redesenho visual completo
2. `src/index.css` - classe utilitaria para background

