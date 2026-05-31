# CONTEXT.md — Bolão Copa do Mundo 2026

Documento de referência para retomar o projeto em qualquer sessão do Claude Code.

---

## 1. Visão Geral do Projeto

**Nome:** Bolão Copa do Mundo 2026
**Propósito:** Sistema de bolão corporativo onde empresas clientes cadastram funcionários para fazerem palpites de placar dos jogos da Copa do Mundo 2026. Cada empresa é isolada (multi-tenant) e tem seu próprio ranking interno.
**URL de produção:** `https://bolao-copa-2026-six-dun.vercel.app`
**Repositório:** `https://github.com/RenanMWO/bolao-copa-2026`

### Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | ^16.2.6 |
| Linguagem | TypeScript | ^5.6.2 |
| Estilização | Tailwind CSS + CSS inline | ^3.4.13 |
| Fontes | Syne + DM Sans (Google Fonts) | — |
| Ícones | Lucide React | ^0.446.0 |
| Datas | date-fns (locale ptBR) | ^4.1.0 |
| Banco de dados | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| Storage | Supabase Storage | — |
| Deploy | Vercel (produção ativa) | — |

---

## 2. Identidade Visual Aplicada

### Fontes
- **Syne** (títulos, números, pontuação, botões) — importada via `<link>` no `layout.tsx`
- **DM Sans** (corpo, labels, inputs, textos secundários) — importada via `<link>` no `layout.tsx`
- Aplicação: `style={{ fontFamily: "'Syne', sans-serif" }}` inline nos componentes

### Paleta de Cores

| Uso | Hex | Observação |
|-----|-----|-----------|
| Fundo principal | `#0D1117` | Quase preto, mantido |
| Superfície de cards | `#161d27` | Levemente azulado, mais sofisticado |
| Borda padrão | `rgba(255,255,255,0.07)` | Muito sutil, sem definição excessiva |
| Verde primário | `#22c55e` | Substituiu o neon `#00D54B` — mais sofisticado |
| Verde hover/dark | `#16a34a` | Hover dos botões verdes |
| Amarelo acento | `#f5c518` | Pontos, troféus, destaques |
| Texto principal | `#E6EDF3` | Branco suave |
| Texto secundário | `#8B949E` | Cinza médio para labels e hints |
| Vermelho erro | `#f87171` | Mensagens de erro |

### Padrões de Borda e Forma
- **Cards:** `border-radius: 16px` (`.card` global) ou `20px` em cards maiores (Perfil)
- **Botões:** `border-radius: 100px` (pílula) — todos os `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Inputs:** `border-radius: 12px`, `background: rgba(255,255,255,0.05)`, foco com `border-color: #22c55e`
- **Badges/tags:** `border-radius: 100px` (pílula)

### Decisões de Design
- Verde neon `#00D54B` foi completamente substituído por `#22c55e` em todas as telas
- `@apply` com valores arbitrários do Tailwind não funciona — usar CSS puro nas classes globais
- Fontes carregadas via `<link>` no `layout.tsx`, não via `@import` no CSS (evita conflito com Tailwind)
- Estilo inline com `style={{}}` usado extensivamente para garantir aplicação das fontes e cores sem depender do purge do Tailwind

---

## 3. Estrutura de Arquivos

```
bolao-copa-2026/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz — carrega fontes Syne + DM Sans via <link>
│   │   ├── page.tsx                # Redireciona: logado→/dashboard, anon→/login
│   │   ├── globals.css             # Classes globais (.card, .btn-primary, .input, .label) em CSS puro
│   │   ├── login/page.tsx          # Tela de login + link "Esqueci minha senha"
│   │   ├── cadastro/page.tsx       # Cadastro em 2 etapas (código → dados)
│   │   ├── recuperar-senha/page.tsx # Envia e-mail de recuperação de senha
│   │   ├── redefinir-senha/page.tsx # Define nova senha via token do e-mail
│   │   ├── dashboard/page.tsx      # Painel principal — stats, próximos jogos, resultados, ações
│   │   ├── palpites/page.tsx       # Palpites de placar por jogo, por fase
│   │   ├── ranking/page.tsx        # Ranking da empresa com animação fadeInUp
│   │   ├── campeao/page.tsx        # Palpite de campeão — grid de 48 times
│   │   ├── perfil/page.tsx         # Editar perfil e avatar
│   │   └── admin/
│   │       ├── page.tsx            # Painel admin — visão geral
│   │       ├── empresas/page.tsx   # CRUD de empresas clientes
│   │       └── jogos/page.tsx      # CRUD de jogos + placares + botões Resetar/Excluir
│   ├── components/
│   │   └── Navbar.tsx              # Navbar responsiva redesenhada — DM Sans, altura 56px, blur
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts           # createBrowserClient (client components)
│   │       └── server.ts           # createServerClient async (server components)
│   └── types/
│       └── index.ts                # Interfaces TypeScript + STAGE_LABELS
├── supabase/
│   ├── schema.sql                  # Schema completo (tabelas, RLS, funções, seed)
│   ├── adicionar_admin.sql         # Insere empresa admin
│   ├── corrigir_rls.sql            # Fix loop infinito nas políticas RLS
│   ├── fix_admin_e_times.sql       # Fix constraint + seed de times
│   ├── liberar_leitura_publica.sql # Políticas anon para cadastro
│   └── corrigir_times.sql          # Remove times não classificados, adiciona os 48 corretos
├── proxy.ts                        # Proteção de rotas (Next.js 16)
├── .env.local                      # Credenciais Supabase (NÃO commitar)
├── .env.local.example              # Template de credenciais
├── INSTALAR E INICIAR.bat          # npm install + npm run dev
├── SÓ INICIAR.bat                  # npm run dev
└── CONTEXT.md                      # Este arquivo
```

---

## 4. Telas Existentes

### `/login` — Login
**Arquivo:** `src/app/login/page.tsx`
**Função:** Autenticação com e-mail e senha. Link para cadastro e link "Esqueci minha senha".
**Visual:** Não foi redesenhado nesta sessão (mantém layout original).

### `/cadastro` — Cadastro
**Arquivo:** `src/app/cadastro/page.tsx`
**Função:** Cadastro em 2 etapas: validação do código de convite → formulário com nickname, nome, idade e avatar.
**Visual:** Não foi redesenhado nesta sessão.

### `/recuperar-senha` — Recuperação de Senha *(novo)*
**Arquivo:** `src/app/recuperar-senha/page.tsx`
**Função:** Usuário informa e-mail e recebe link de redefinição via SMTP (Gmail configurado).

### `/redefinir-senha` — Redefinição de Senha *(novo)*
**Arquivo:** `src/app/redefinir-senha/page.tsx`
**Função:** Usuário define nova senha após clicar no link do e-mail. Aguarda evento `PASSWORD_RECOVERY` do Supabase.

### `/dashboard` — Dashboard ✅ Redesenhado
**Arquivo:** `src/app/dashboard/page.tsx`
**Função:** Painel principal com stats do usuário, próximos jogos e resultados recentes.
**Melhorias visuais:**
- Título Syne 28px, subtítulo DM Sans muted com `·`
- Cards de stats com número Syne 36px, ícone Lucide no canto, label uppercase
- Card "Posição" destacado com borda dourada `#f5c518`
- Próximos jogos com badge de data/hora verde, bandeiras maiores, VS discreto
- Botões de ação com ícone + título + subtítulo descritivo

### `/palpites` — Palpites ✅ Redesenhado
**Arquivo:** `src/app/palpites/page.tsx`
**Função:** Lista de jogos por fase com inputs de placar para o usuário palpitar.
**Melhorias visuais:**
- Tabs de fase em pílula verde sutil
- Card com padding 24px
- Inputs de placar 52×52px, Syne 24px bold, borda verde no foco, setas removidas
- Bandeiras 36px com sombra
- Badge "Palpite pendente" amarelo / "Palpite salvo" verde
- Botão pílula no canto inferior direito
- Animação flash verde no card ao salvar (600ms)

### `/ranking` — Ranking ✅ Redesenhado
**Arquivo:** `src/app/ranking/page.tsx`
**Função:** Tabela de ranking dos participantes da mesma empresa.
**Melhorias visuais:**
- Header DM Sans 11px uppercase letter-spacing
- Cada linha com `fadeInUp` e delay de 80ms por linha
- Avatar 36px com cor gerada pela inicial do nickname
- 1º lugar com borda esquerda dourada + fundo sutil
- Badge "você" verde pílula
- Pontuação Syne bold 16px verde
- Legenda em cards individuais

### `/campeao` — Campeão ✅ Redesenhado
**Arquivo:** `src/app/campeao/page.tsx`
**Função:** Grid de 48 times para o usuário escolher o campeão da Copa.
**Melhorias visuais:**
- Grid `auto-fill minmax(130px)` responsivo
- Bandeiras 48px com sombra
- Card selecionado com borda verde + checkmark em círculo verde
- Hover com elevação suave
- Badge de status com ícone relógio/cadeado
- Card do palpite atual com ícone de troféu dourado

### `/perfil` — Perfil ✅ Redesenhado
**Arquivo:** `src/app/perfil/page.tsx`
**Função:** Editar nickname, nome completo, idade e avatar.
**Melhorias visuais:**
- Avatar com borda `3px solid #22c55e` + glow verde `box-shadow`
- Inicial do nickname em Syne 32px quando sem foto
- Card com padding 32px, border-radius 20px
- Labels DM Sans 11px uppercase letter-spacing
- Inputs com fundo sutil e border-radius 12px
- Botão pílula largura total, Syne 15px, sem ícone

### `/admin` — Admin Overview
**Arquivo:** `src/app/admin/page.tsx`
**Função:** Visão geral com totais do sistema.
**Visual:** Não redesenhado.

### `/admin/empresas` — Empresas
**Arquivo:** `src/app/admin/empresas/page.tsx`
**Função:** CRUD de empresas clientes com upload de logo e geração de invite_code.
**Visual:** Não redesenhado.

### `/admin/jogos` — Jogos *(melhorias funcionais)*
**Arquivo:** `src/app/admin/jogos/page.tsx`
**Função:** Cadastrar jogos, inserir placares, calcular pontos.
**Funcionalidades adicionadas:**
- Botão **Resetar** (jogos encerrados): apaga placar, zera pontos dos palpites, volta para agendado
- Botão **Excluir** (jogos agendados): remove o jogo e seus palpites com confirmação

---

## 5. Banco de Dados

### Tabelas

#### `companies`
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nome da empresa |
| logo_url | TEXT | Supabase Storage bucket: logos |
| user_limit | INTEGER | CHECK: 10, 30, 50, 100 ou admin (999) |
| invite_code | TEXT UNIQUE | Código de convite |
| is_admin_company | BOOLEAN | true = empresa do Renan |
| active | BOOLEAN | false = bloqueia cadastros |

#### `profiles`
| Campo | Tipo | Observação |
|-------|------|-----------|
| id | UUID | FK → auth.users |
| company_id | UUID | FK → companies |
| nickname | TEXT | Apelido exibido |
| full_name | TEXT | Nome completo |
| age | INTEGER | Idade |
| avatar_url | TEXT | Supabase Storage bucket: avatars |
| is_admin | BOOLEAN | true = acesso ao /admin |

#### `teams`
48 seleções da Copa do Mundo 2026. Seed com bandeiras via flagcdn.com.

#### `matches`
Jogos cadastrados pelo admin.
- `stage`: group | round32 | round16 | quarter | semi | third | final
- `status`: scheduled | live | finished

#### `match_predictions`
Palpites de placar. UNIQUE(user_id, match_id).
- `points`: null | 0 | 5 (resultado) | 10 (placar exato)

#### `champion_predictions`
Um palpite de campeão por usuário. UNIQUE(user_id).
- `points`: null | 0 | 25 (acertou)

### Funções PostgreSQL

| Função | Descrição |
|--------|-----------|
| `handle_new_user()` | Trigger: cria profile vazio ao fazer signUp |
| `is_admin()` | SECURITY DEFINER: verifica se usuário é admin |
| `get_my_company_id()` | SECURITY DEFINER: retorna company_id sem loop RLS |
| `calculate_match_points(p_match_id)` | Calcula pontos de todos os palpites de um jogo |
| `calculate_champion_points(p_champion_team_id)` | Distribui 25pts a quem acertou o campeão |

### View: `company_rankings`
Ranking calculado em tempo real com RANK() OVER PARTITION BY company_id.

---

## 6. O que Já Está Funcionando

- [x] Autenticação completa (login, cadastro, logout, proteção de rotas)
- [x] Cadastro em 2 etapas com validação de código de convite
- [x] Recuperação de senha via e-mail (SMTP Gmail configurado)
- [x] Painel admin: visão geral, empresas (CRUD), jogos (CRUD + placares)
- [x] Botões Resetar e Excluir nos jogos do admin
- [x] Palpites de placar por fase com travamento automático
- [x] Ranking por empresa com view `company_rankings`
- [x] Palpite de campeão com travamento nas quartas de final
- [x] Perfil: editar dados e avatar
- [x] Navbar responsiva (desktop + hamburger mobile)
- [x] 48 times corretos da Copa 2026 com bandeiras
- [x] Empresa admin pré-cadastrada (ADMIN-BOLAO-2026)
- [x] Deploy no Vercel (produção ativa)
- [x] SMTP externo via Gmail configurado no Supabase
- [x] Buckets de storage criados (avatars, logos) com políticas públicas
- [x] Jogos da fase de grupos cadastrados
- [x] Redesign visual completo: Navbar, Dashboard, Palpites, Ranking, Campeão, Perfil

---

## 7. O que Está Pendente

### Alta prioridade
1. **Cadastrar jogos das fases eliminatórias** — oitavas, quartas, semis, final (feito conforme classificados forem definidos)
2. **Redesign das telas de Login e Cadastro** — ainda com visual antigo (verde neon, sem Syne/DM Sans)
3. **Redesign das telas Admin** — /admin, /admin/empresas, /admin/jogos

### Média prioridade
4. **Validação server-side do travamento de palpites** — hoje só no frontend
5. **URL de redefinição de senha** — confirmar que `Site URL` no Supabase aponta para o domínio Vercel correto (não localhost)
6. **Página de times no admin** — editar grupos e flags incorretas

### Baixa prioridade
7. **Notificação ao usuário** quando pontos são calculados
8. **Página pública de resultado** (sem login) — opcional

---

## 8. Decisões Técnicas Importantes

### Multi-tenant por invite_code
Cada empresa tem um código de convite único. Isolamento via `company_id` no perfil e nas políticas RLS. Não há subdomínio por empresa.

### Admin identificado por empresa especial
Empresa `ADMIN-BOLAO-2026` com `is_admin_company = true`. Quem se cadastra com esse código recebe `is_admin = true` no perfil.

### RLS sem loop infinito
Políticas RLS originalmente causavam loop (profiles → companies → profiles). Resolvido com função `get_my_company_id()` como SECURITY DEFINER.

### proxy.ts (não middleware.ts)
Next.js 16 usa `proxy.ts` com export `proxy`. Cuida de redirecionamentos de autenticação e atualização de cookies de sessão.

### CSS: evitar @apply com valores arbitrários
Tailwind não suporta `@apply bg-[#161d27]`. As classes globais em `globals.css` usam CSS puro. Estilos específicos por componente usam `style={{}}` inline.

### Fontes via `<link>` no layout.tsx
Google Fonts importadas via tag `<link>` no `layout.tsx` — não via `@import` no CSS (conflito com Tailwind/PostCSS).

### Pontuação calculada manualmente pelo admin
Após inserir o placar, o admin clica em "Calcular Pontos" que chama `supabase.rpc('calculate_match_points', ...)`. Não é automático.

### Travamento de palpites no frontend
`new Date(match.match_date) <= new Date()` desabilita inputs. Sem validação server-side por enquanto.

### Convenções de código
- Todos os componentes de página são `'use client'`
- Supabase client: `const supabase = createClient()` no topo
- Joins tipados com `as NomeDoTipo` após o fetch
- Variáveis de ambiente: apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 9. Como Iniciar a Próxima Sessão

Cole exatamente este texto no início da próxima conversa:

---

> Leia o CONTEXT.md na raiz do projeto e retomamos de onde paramos sem precisar reexplicar nada.

---

### Credenciais e Acessos (não commitar)

- **Supabase projeto:** `wvxjnqyzihjjsplljtjo`
- **URL Supabase:** `https://wvxjnqyzihjjsplljtjo.supabase.co`
- **Código admin:** `ADMIN-BOLAO-2026`
- **URL produção:** `https://bolao-copa-2026-six-dun.vercel.app`
- **Porta local:** `http://localhost:3000`

### Problemas Já Resolvidos

| Problema | Causa | Solução |
|----------|-------|---------|
| `middleware` → `proxy` | Next.js 16 deprecou middleware | Renomear arquivo e função |
| `cookies()` síncrono | Next.js 15+ tornou async | `await cookies()` em server.ts |
| Constraint `user_limit` | CHECK não aceitava 999 | CONSTRAINT com `OR is_admin_company = true` |
| 500 em `/companies` | Loop infinito no RLS | Função `get_my_company_id()` SECURITY DEFINER |
| URL errada no `.env.local` | Copiou URL com `/rest/v1/` | Remover sufixo, usar só a base |
| `npm` bloqueado no PowerShell | Política de execução do Windows | Arquivo `.bat` usando `cmd` |
| "Código inválido" sem motivo | Supabase sem policy para anon | `CREATE POLICY ... TO anon USING (active = true)` |
| CSS não aplicava no Vercel | `@apply` com valores arbitrários | Reescrever globals.css em CSS puro |
| Link de redefinição apontava para localhost | Site URL do Supabase errado | Configurar URL correta em Auth → URL Configuration |
| Itália e outros times errados | Seed desatualizado | SQL `corrigir_times.sql` removeu 12 e adicionou 10 times |
