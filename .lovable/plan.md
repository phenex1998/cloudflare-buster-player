
# Selecao de Servidor DNS Dinamico no Login

## Resumo
Substituir o campo de texto "Host / URL" por uma selecao visual de servidores carregados do banco de dados, com fallback para digitacao manual.

---

## Parte 1: Criar tabela `dns_servers` no banco de dados

Criar a tabela com as colunas:
- `id` (UUID, chave primaria)
- `name` (texto, ex: "Principal", "Backup")
- `url` (texto, a URL do servidor)
- `created_at` (timestamp)

A tabela tera RLS habilitado com uma politica de leitura publica (SELECT para `anon`), ja que os servidores precisam ser vistos na tela de login antes de qualquer autenticacao.

Inserir dados iniciais de exemplo para teste.

---

## Parte 2: Criar funcao `getDnsServers()` em `src/lib/dns-servers.ts`

Um arquivo simples que exporta uma funcao async que:
1. Usa o cliente Supabase existente (`@/integrations/supabase/client`)
2. Faz `SELECT * FROM dns_servers ORDER BY name`
3. Retorna o array de servidores

Nao e necessario criar um novo cliente Supabase -- o projeto ja tem `@supabase/supabase-js` instalado e o cliente configurado.

---

## Parte 3: Modificar `LoginPage.tsx`

### Novos estados:
- `dnsServers`: lista carregada do banco
- `loadingServers`: boolean de carregamento
- `manualMode`: boolean para mostrar/esconder input manual

### Comportamento ao carregar:
- `useEffect` chama `getDnsServers()` ao montar
- Se retornar 1 servidor: auto-seleciona e esconde a selecao (usuario so ve usuario/senha)
- Se retornar 2+: mostra chips/botoes horizontais para escolha

### Interface (substituindo o campo Host):
- **Secao "Servidor"** com chips glassmorphism horizontais
- Cada chip mostra o `name` do servidor (ex: "Principal", "Backup")
- Chip selecionado tem borda roxa brilhante + fundo mais claro
- Ao clicar, preenche o estado `host` com a `url` do servidor

### Fallback manual:
- Botao discreto "Configurar Manualmente" abaixo dos chips
- Ao clicar, esconde os chips e revela o input de texto antigo
- Botao "Voltar para lista" para retornar a selecao automatica

### Skeleton/loading:
- Enquanto carrega, mostra 2 chips skeleton animados

---

## Detalhes Tecnicos

### SQL da migracao:
```sql
CREATE TABLE public.dns_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dns_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.dns_servers
  FOR SELECT TO anon USING (true);

INSERT INTO public.dns_servers (name, url) VALUES
  ('Principal', 'http://servidor1.com:8080'),
  ('Backup', 'http://servidor2.com:8080');
```

### Arquivo `src/lib/dns-servers.ts`:
```typescript
import { supabase } from "@/integrations/supabase/client";

export interface DnsServer {
  id: string;
  name: string;
  url: string;
}

export async function getDnsServers(): Promise<DnsServer[]> {
  const { data, error } = await supabase
    .from('dns_servers')
    .select('id, name, url')
    .order('name');
  if (error) throw error;
  return data ?? [];
}
```

### Estrutura visual dos chips no LoginPage:
```text
Servidor
[  Principal  ] [  Backup  ]     <-- chips glassmorphism
         Configurar Manualmente   <-- link discreto
```

### Arquivos criados/modificados:
1. **Migracao SQL** -- cria tabela `dns_servers` + RLS + dados iniciais
2. **`src/lib/dns-servers.ts`** -- novo arquivo com `getDnsServers()`
3. **`src/pages/LoginPage.tsx`** -- substituir campo host por selecao dinamica
