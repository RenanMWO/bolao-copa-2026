# Guia de Configuração — Bolão Copa do Mundo 2026

Siga este guia do início ao fim. São cerca de **40 minutos** no total.

---

## PASSO 1 — Instalar o Node.js (programa necessário)

1. Abra seu navegador e acesse: **nodejs.org**
2. Clique no botão verde grande "LTS" (versão estável)
3. Baixe e instale o arquivo `.msi`
4. Clique em "Next" em todas as telas do instalador
5. **Reinicie o computador** após instalar

---

## PASSO 2 — Criar conta no Supabase (banco de dados gratuito)

O Supabase é onde ficam guardados todos os dados do bolão (usuários, palpites, etc.).

1. Acesse **supabase.com** e clique em "Start your project"
2. Crie uma conta com seu e-mail ou Google
3. Clique em **"New Project"**
4. Preencha:
   - **Name:** `bolao-copa-2026`
   - **Database Password:** Crie uma senha forte e **ANOTE** ela
   - **Region:** escolha `South America (São Paulo)`
5. Clique em **"Create new project"** e aguarde (pode demorar 2 minutos)

---

## PASSO 3 — Configurar o banco de dados

1. No painel do Supabase, clique no ícone **"SQL Editor"** (parece uma folha de código) no menu esquerdo
2. Clique em **"New query"**
3. Abra o arquivo `supabase/schema.sql` que está na pasta do projeto
4. Selecione TODO o conteúdo (Ctrl+A) e copie (Ctrl+C)
5. Cole no SQL Editor do Supabase (Ctrl+V)
6. Clique em **"Run"** (botão verde)
7. Aguarde a mensagem de sucesso

---

## PASSO 4 — Criar os Buckets de Armazenamento (fotos)

Os buckets guardam as fotos de perfil e logos das empresas.

1. No Supabase, clique em **"Storage"** no menu esquerdo
2. Clique em **"New bucket"**
   - Name: `avatars`
   - Marque: **Public bucket** ✓
   - Clique em **Create bucket**
3. Clique em **"New bucket"** novamente
   - Name: `logos`
   - Marque: **Public bucket** ✓
   - Clique em **Create bucket**
4. Para cada bucket, configure as políticas:
   - Clique no bucket "avatars"
   - Clique em **"Policies"**
   - Clique em **"New Policy"** > **"For full customization"**
   - Policy name: `public access`
   - Operation: SELECT
   - Policy definition: `true`
   - Salve e repita para INSERT, UPDATE com `auth.role() = 'authenticated'`

   **Alternativa mais simples (recomendada para iniciantes):**
   - No SQL Editor, execute este comando para liberar acesso:
   ```sql
   CREATE POLICY "Avatar public select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
   CREATE POLICY "Avatar auth insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
   CREATE POLICY "Avatar auth update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
   CREATE POLICY "Logo public select" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
   CREATE POLICY "Logo auth insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
   CREATE POLICY "Logo auth update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
   ```

---

## PASSO 5 — Obter as credenciais do Supabase

1. No Supabase, clique em **"Project Settings"** (ícone de engrenagem no menu esquerdo)
2. Clique em **"API"**
3. Anote os dois valores:
   - **Project URL** (começa com `https://`)
   - **anon public** key (texto longo)

---

## PASSO 6 — Configurar o projeto local

1. Abra a pasta `bolao-copa-2026` no seu computador
2. Procure o arquivo `.env.local.example`
3. Faça uma **cópia** deste arquivo e renomeie a cópia para `.env.local`
4. Abra o arquivo `.env.local` com o Bloco de Notas
5. Preencha com os valores do Passo 5:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO_REAL.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_real_aqui
   ```
6. Salve o arquivo

---

## PASSO 7 — Instalar as dependências e rodar o projeto

1. Clique com o botão direito na pasta `bolao-copa-2026`
2. Selecione **"Abrir no Terminal"** (ou PowerShell)
3. Digite e pressione Enter:
   ```
   npm install
   ```
   Aguarde (pode demorar 2-3 minutos na primeira vez)
4. Após terminar, digite:
   ```
   npm run dev
   ```
5. Abra o navegador e acesse: **http://localhost:3000**
6. O site estará funcionando! 🎉

---

## PASSO 8 — Criar sua conta de administrador

1. Com o site aberto em http://localhost:3000, clique em **"Criar conta"**
2. No campo "Código de Convite", digite exatamente:
   ```
   ADMIN-BOLAO-2026
   ```
3. Preencha seus dados e clique em "Criar Conta"
4. Você terá acesso automático ao painel de administrador!
5. No menu superior, clique em **"Admin"** para gerenciar tudo

---

## PASSO 9 — Publicar na internet (deploy no Vercel)

Para que outras pessoas possam acessar o bolão.

### 9.1 — Criar conta no GitHub (necessário para o Vercel)

1. Acesse **github.com** e crie uma conta gratuita
2. Clique em **"+"** > **"New repository"**
3. Nome: `bolao-copa-2026`
4. Clique em **"Create repository"**
5. Copie a URL do repositório (ex: `https://github.com/SEU_USUARIO/bolao-copa-2026.git`)

### 9.2 — Enviar o projeto para o GitHub

No terminal da pasta do projeto, execute:
```
git init
git add .
git commit -m "Bolao Copa 2026"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/bolao-copa-2026.git
git push -u origin main
```

### 9.3 — Deploy no Vercel

1. Acesse **vercel.com** e crie uma conta com seu GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `bolao-copa-2026`
4. Clique em **"Deploy"**
5. Após o deploy, vá em **"Settings"** > **"Environment Variables"**
6. Adicione as duas variáveis:
   - `NEXT_PUBLIC_SUPABASE_URL` → sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → sua chave anon
7. Clique em **"Redeploy"**
8. Seu site estará disponível em: `https://bolao-copa-2026.vercel.app` (ou similar)

---

## PASSO 10 — Usar o sistema como administrador

### Criar um bolão para uma empresa:

1. Acesse seu site e faça login com sua conta admin
2. Clique em **"Admin"** no menu
3. Clique em **"Gerenciar Empresas"**
4. Clique em **"Nova Empresa"**
5. Preencha:
   - Nome da empresa
   - Limite de usuários (10, 30, 50 ou 100)
   - Logo da empresa (opcional)
6. Clique em **"Criar Empresa"**
7. Aparecerá um **código de convite** (ex: `EMPRESAABC-X9F2`)
8. Copie e envie esse código para os funcionários da empresa

### Registrar os jogos da Copa:

1. Clique em **"Gerenciar Jogos"**
2. Clique em **"Novo Jogo"**
3. Selecione os dois times, data/hora, fase e estádio
4. Clique em **"Cadastrar Jogo"**

### Inserir resultados:

1. Clique em **"Gerenciar Jogos"**
2. Encontre o jogo encerrado
3. Insira o placar (ex: 2 × 1)
4. Clique em **"Salvar Placar"**
5. Clique em **"Calcular Pontos"** — isso distribui os pontos para todos automaticamente!

### Calcular pontos do campeão (após a final):

1. No final da página de Jogos, selecione o time campeão
2. O sistema distribui 25 pontos para quem acertou

---

## Pontuação

| Acerto | Pontos |
|--------|--------|
| Placar exato (ex: 2×1 e foi 2×1) | **10 pontos** |
| Resultado certo (ex: vitória do Brasil) | **5 pontos** |
| Campeão correto | **25 pontos** |

---

## Perguntas Frequentes

**P: O código de convite pode ser reutilizado?**
R: Sim! Todos os funcionários da empresa usam o mesmo código para se cadastrar.

**P: Posso ter o mesmo e-mail em empresas diferentes?**
R: Não. Cada e-mail só pode ter uma conta.

**P: Os funcionários de uma empresa veem o ranking da outra?**
R: Não. Cada empresa só vê seu próprio ranking.

**P: O palpite de campeão pode ser alterado?**
R: Sim, até o primeiro jogo das quartas de final começar.

**P: O que acontece se eu não fizer palpite em um jogo?**
R: Não ganha pontos naquele jogo. Zero pontos.

---

## Suporte

Se precisar de ajuda, o Claude Code pode te auxiliar com qualquer problema técnico.
