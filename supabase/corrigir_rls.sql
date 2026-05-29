-- =============================================
-- CORREÇÃO DE RLS — Execute no SQL Editor
-- Resolve o loop infinito nas políticas
-- =============================================

-- Passo 1: Criar função auxiliar que lê profiles SEM acionar RLS
-- (SECURITY DEFINER = roda com permissão de admin, não do usuário)
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Passo 2: Remover políticas que causam loop em PROFILES
DROP POLICY IF EXISTS "Perfis visíveis para mesma empresa" ON profiles;

-- Passo 3: Nova política em PROFILES — usa a função (sem loop)
CREATE POLICY "Perfis visíveis para mesma empresa" ON profiles
  FOR SELECT USING (
    company_id = get_my_company_id()
    OR id = auth.uid()
    OR is_admin()
  );

-- Passo 4: Remover política problemática em COMPANIES
DROP POLICY IF EXISTS "Usuários leem sua própria empresa" ON companies;

-- Passo 5: Nova política em COMPANIES — usa a função (sem loop)
CREATE POLICY "Usuários leem sua própria empresa" ON companies
  FOR SELECT USING (
    id = get_my_company_id()
    OR is_admin()
  );

-- Passo 6: Verificar se as funções foram criadas
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_my_company_id', 'is_admin', 'calculate_match_points');
