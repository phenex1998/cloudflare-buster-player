

## IPTV Player App - Plano de Implementação

### Visão Geral
Um player IPTV completo com suporte a **Xtream Codes API**, disponível como app nativo (via Capacitor) e web. O usuário entra com host, usuário e senha do servidor IPTV e tem acesso a canais ao vivo, filmes, séries e guia de programação.

---

### 1. Tela de Login IPTV
- Campos: **Host/URL do servidor**, **Usuário** e **Senha**
- Botão "Conectar" que valida as credenciais via Xtream Codes API
- Dados salvos localmente para reconexão automática
- Opção de gerenciar múltiplas conexões/servidores

### 2. Navegação Principal
- Menu inferior (mobile) com abas: **TV ao Vivo**, **Filmes**, **Séries**, **EPG**, **Favoritos**
- Design escuro (dark mode) otimizado para assistir conteúdo
- Busca global por canais, filmes e séries

### 3. TV ao Vivo
- Lista de canais organizados por **categorias** (Esportes, Notícias, Entretenimento, etc.)
- Logos dos canais quando disponíveis
- Player de vídeo integrado com suporte a formato **TS/HLS**
- Controles: play/pause, volume, tela cheia
- Informação do programa atual (EPG inline)

### 4. Filmes e Séries (VOD)
- Catálogo de filmes com poster, sinopse, ano e gênero
- Catálogo de séries com navegação por temporadas e episódios
- Filtros por categoria/gênero
- Player integrado para reprodução

### 5. EPG - Guia de Programação
- Grade de programação por canal com horários
- Visualização do programa **atual** e **próximos**
- Navegação por dia

### 6. Favoritos e Histórico
- Marcar canais, filmes e séries como favoritos
- Histórico de reprodução recente
- Dados salvos localmente no dispositivo

### 7. Configuração Nativa (Capacitor)
- Setup do Capacitor para gerar app Android e iOS
- Configuração de tela cheia e orientação landscape para o player
- Instruções para compilar e publicar nas lojas

### 8. Compatibilidade com Streams
- Uso de **HLS.js** para reprodução de streams TS/HLS no navegador
- Headers customizados (User-Agent) nas requisições para melhor compatibilidade com servidores
- No app nativo, as requisições passam pela camada nativa, evitando bloqueios de CORS/Cloudflare

