-- =============================================
-- EXECUTE ESTE ARQUIVO NO SQL EDITOR DO SUPABASE
-- Ele corrige a restrição e adiciona o admin
-- =============================================

-- Passo 1: Corrigir a restrição da tabela companies
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_limit_check;

ALTER TABLE companies ADD CONSTRAINT companies_user_limit_check
  CHECK (user_limit IN (10, 30, 50, 100) OR is_admin_company = true);

-- Passo 2: Inserir a empresa admin
INSERT INTO companies (name, invite_code, user_limit, is_admin_company, active)
VALUES ('Admin Sistema', 'ADMIN-BOLAO-2026', 999, true, true)
ON CONFLICT (invite_code) DO NOTHING;

-- Passo 3: Verificar se funcionou (deve mostrar 1 linha)
SELECT name, invite_code, user_limit, is_admin_company
FROM companies
WHERE invite_code = 'ADMIN-BOLAO-2026';
