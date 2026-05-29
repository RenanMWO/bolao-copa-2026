# CONTEXT.md — Bolão Copa do Mundo 2026

Documento de referência para retomar o projeto em qualquer sessão do Claude Code.

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | ^16.2.6 |
| Linguagem | TypeScript | ^5.6.2 |
| Estilização | Tailwind CSS | ^3.4.13 |
| Ícones | Lucide React | ^0.446.0 |
| Datas | date-fns (locale ptBR) | ^4.1.0 |
| Banco de dados | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| Storage | Supabase Storage | — |
| Deploy | Vercel (pendente) | — |

---

## Estrutura de Pastas

```
bolao-copa-2026/
├── src/
│   ├── app/                        # Páginas (Next.js App Router)
│   │   ├── layout.tsx              # Layout raiz (metadados globais)
│   │   ├── page.tsx                # Redireciona: logado→/dashboard, anon→/login
│   │   ├── globals.css             # Estilos globais + classes utilitárias (.card, .btn-primary, .input)
│   │   ├── login/page.tsx          # Tela de login
│   │   ├── cadastro/page.tsx       # Cadastro em 2 etapas (código → dados)
│   │   ├── dashboard/page.tsx      # Painel principal do usuário
│   │   ├── palpites/page.tsx       # Palpites de placar por jogo
│   │   ├── ranking/page.tsx        # Ranking da empresa
│   │   ├── campeao/page.tsx        # Palpite de campeão
│   │   ├── perfil/page.tsx         # Editar perfil e avatar
│   │   └── admin/
│   │       ├── page.tsx            # Painel admin (overview)
│   │       ├── empresas/page.tsx   # CRUD de empresas clientes
│   │       └── jogos/page.tsx      # CRUD de jogos + inserção de placares
│   ├── components/
│   │   └── Navbar.tsx              # Navegação responsiva (desktop + mobile)
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # createBrowserClient (uso em client components)
│   │       └── server.ts           # createServerClient async (uso em server components)
│   └── types/
│       └── index.ts                # Interfaces TypeScript + STAGE_LABELS
├── supabase/
│   ├── schema.sql                  # Schema completo (tabelas, RLS, funções, seed)
│   ├── adicionar_admin.sql         # Fix: inserir empresa admin
│   ├── corrigir_rls.sql            # Fix: resolver loop infinito nas políticas RLS
│   ├── fix_admin_e_times.sql       # Fix: constraint + seed de times
│   └── liberar_leitura_publica.sql # Fix: políticas anon para cadastro
├── proxy.ts                        # Proteção de rotas (Next.js 16 — era middleware.ts)
├── .env.local                      # Credenciais Supabase (NÃO commitar)
├── .env.local.example              # Template de credenciais
├── INSTALAR E INICIAR.bat          # npm install + npm run dev (primeira vez)
├── SÓ INICIAR.bat                  # npm run dev (uso diário)
├── SETUP - LEIA AQUI.txt           # Guia de configuração em PT-BR
└── CONTEXT.md                      # Este arquivo
```

---

## Banco de Dados — Tabelas

### `companies`
Empresas clientes do bolão. Cada uma tem um `invite_code` único.

| Campo | Tipo | Observação |
|-------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome da empresa |
| logo_url | TEXT | URL no Supabase Storage (bucket: logos) |
| user_limit | INTEGER | CHECK: 10, 30, 50, 100 ou empresa admin (999) |
| invite_code | TEXT UNIQUE | Gerado automaticamente no admin |
| is_admin_company | BOOLEAN | true = empresa do Renan (admin do sistema) |
| active | BOOLEAN | false = bloqueia novos cadastros |

### `profiles`
Extensão de `auth.users`. Criado automaticamente via trigger ao fazer signUp.

| Campo | Tipo | Observação |
|-------|------|-----------|
| id | UUID | FK → auth.users |
| company_id | UUID | FK → companies |
| nickname | TEXT | Apelido exibido no ranking |
| full_name | TEXT | Nome completo |
| age | INTEGER | Idade |
| avatar_url | TEXT | URL no Supabase Storage (bucket: avatars) |
| is_admin | BOOLEAN | true = acesso ao /admin |

### `teams`
48 seleções da Copa. Seed incluído no schema.sql.

### `matches`
Jogos cadastrados pelo admin. `status`: scheduled → live → finished.

`stage`: group | round32 | round16 | quarter | semi | third | final

### `match_predictions`
Palpites de placar por usuário por jogo. UNIQUE(user_id, match_id).

`points`: null (não calculado) | 0 | 5 (resultado) | 10 (placar exato)

### `champion_predictions`
Um palpite de campeão por usuário. UNIQUE(user_id).

`points`: null | 0 | 25 (acertou)

---

## Funções PostgreSQL (Supabase)

| Função | Descrição |
|--------|-----------|
| `handle_new_user()` | Trigger: cria `profiles(id)` vazio ao fazer signUp |
| `is_admin()` | SECURITY DEFINER: retorna true se auth.uid() tem is_admin=true |
| `get_my_company_id()` | SECURITY DEFINER: retorna company_id do usuário logado (evita loop RLS) |
| `calculate_match_points(p_match_id)` | Calcula e salva pontos de todos os palpites de um jogo |
| `calculate_champion_points(p_champion_team_id)` | Distribui 25pts a quem acertou o campeão |

### View: `company_rankings`
Ranking calculado em tempo real por empresa, com RANK() OVER PARTITION BY company_id.

---

## Decisões de Arquitetura

### Multi-tenant por invite_code
Cada empresa tem um código de convite gerado na criação. Não há subdomínio por empresa — todos acessam o mesmo site. O isolamento é feito via `company_id` no perfil e nas políticas RLS.

### Admin identificado por empresa especial
A empresa `ADMIN-BOLAO-2026` tem `is_admin_company = true`. Quem se cadastra com esse código recebe `is_admin = true` no perfil. Não há tabela separada de admins.

### RLS com funções SECURITY DEFINER
As políticas RLS originalmente causavam loop infinito (profiles consultava companies, que consultava profiles). Resolvido criando `get_my_company_id()` como SECURITY DEFINER, que lê profiles bypassando RLS e quebrando a recursão.

### proxy.ts (antes middleware.ts)
Next.js 16 deprecou `middleware.ts` em favor de `proxy.ts` com export `proxy` (não mais `middleware`). Cuida de:
- Redirecionar usuários não autenticados para /login
- Redirecionar usuários autenticados que tentam acessar /login ou /cadastro para /dashboard
- Atualizar cookies de sessão do Supabase em cada request

### Travamento automático de palpites
Feito no frontend: `new Date(match.match_date) <= new Date()` desabilita os inputs. Não há validação server-side no momento.

### Palpite de campeão
Aberto até as quartas de final. A lógica é: busca o jogo de quartas com menor `match_date`. Se `match_date <= now`, trava o palpite.

### Pontuação
- Placar exato: 10 pts
- Resultado correto (vencedor/empate): 5 pts
- Campeão correto: 25 pts
- Calculado via `supabase.rpc()` chamado manualmente pelo admin após inserir o placar

---

## O que já foi implementado

- [x] Autenticação (login, cadastro, logout, proteção de rotas)
- [x] Cadastro em 2 etapas: validação de código → formulário com avatar
- [x] Painel admin: visão geral com totais
- [x] Admin — Empresas: criar empresa, definir limite, upload de logo, gerar invite_code, ativar/desativar, barra de progresso de vagas
- [x] Admin — Jogos: cadastrar jogos, inserir placares, calcular pontos, calcular campeão
- [x] Palpites: por fase (tabs), travamento automático, exibição de resultado e pontos
- [x] Ranking: tabela por empresa, medalhas top 3, destaque do usuário logado
- [x] Palpite de campeão: grid de 48 times com bandeiras, travamento nas quartas
- [x] Perfil: editar dados e avatar
- [x] Navbar responsiva: desktop + hamburger mobile, logo da empresa, link Admin condicional
- [x] Seed de 48 times com bandeiras (flagcdn.com)
- [x] Empresa admin pré-cadastrada (ADMIN-BOLAO-2026)
- [x] View `company_rankings` com RANK()
- [x] Arquivos .bat para iniciar sem terminal

---

## O que está pendente

- [ ] **Deploy no Vercel** (aguardando finalização local)
- [ ] **Confirmação de e-mail desativada** no Supabase Auth (necessário para cadastro funcionar)
- [ ] **Buckets de storage** criados e com políticas (avatars, logos)
- [ ] **Seed dos jogos da Copa** (admin precisa cadastrar os 104 jogos)
- [ ] Página de administração de times (editar grupos, flags incorretas)
- [ ] Validação server-side do travamento de palpites (hoje só no frontend)
- [ ] Notificação ao usuário quando pontos são calculados
- [ ] Página pública de resultado (sem login) — opcional

---

## Convenções de Código

### Componentes
- Todos os componentes de página são `'use client'` (interativos)
- Único componente server: `src/app/page.tsx` (redirect simples)
- Supabase client em páginas: `const supabase = createClient()` no topo do componente

### Classes CSS (Tailwind)
Classes reutilizáveis definidas em `globals.css`:
```css
.card      → bg-[#161B22] border border-[#30363D] rounded-xl p-4
.btn-primary  → bg-[#00D54B] text-black font-bold ...
.btn-secondary → bg-[#30363D] text-white ...
.btn-danger   → bg-red-600 text-white ...
.input     → bg-[#0D1117] border border-[#30363D] text-white rounded-lg p-3 w-full
.label     → text-[#8B949E] text-sm font-medium mb-1 block
```

### Paleta de cores
```
Fundo:        #0D1117  (quase preto)
Card:         #161B22  (cinza escuro)
Borda:        #30363D
Verde:        #00D54B  (ações principais, destaque)
Dourado:      #FFD700  (pontos, troféus)
Texto:        #E6EDF3
Texto suave:  #8B949E
```

### Tipagem
Todas as entidades do banco têm interface em `src/types/index.ts`.
Joins do Supabase são tipados com `as NomeDoTipo` após o fetch.

### Variáveis de ambiente
Apenas duas variáveis necessárias (ambas públicas, seguro no frontend):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Credenciais e Acessos (não commitar)

- **Supabase projeto:** `wvxjnqyzihjjsplljtjo`
- **URL:** `https://wvxjnqyzihjjsplljtjo.supabase.co`
- **Código admin:** `ADMIN-BOLAO-2026`
- **Porta local:** `http://localhost:3000`

---

## Problemas Já Resolvidos (histórico)

| Problema | Causa | Solução |
|----------|-------|---------|
| `middleware` → `proxy` | Next.js 16 deprecou middleware | Renomear arquivo e função |
| `cookies()` síncrono | Next.js 15+ tornou async | `await cookies()` em server.ts |
| Constraint `user_limit` | CHECK não aceitava 999 (admin) | CONSTRAINT no nível da tabela com `OR is_admin_company = true` |
| 500 em `/companies` | Loop infinito no RLS | Função `get_my_company_id()` SECURITY DEFINER |
| URL errada no `.env.local` | Usuário copiou URL com `/rest/v1/` | Remover o sufixo, usar só a base |
| `npm` bloqueado no PowerShell | Política de execução do Windows | Arquivo `.bat` usando `cmd` |
| "Código inválido" sem motivo | Supabase sem policy para anon | `CREATE POLICY ... TO anon USING (active = true)` |
