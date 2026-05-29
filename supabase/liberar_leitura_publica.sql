-- =============================================
-- EXECUTE NO SQL EDITOR DO SUPABASE
-- Libera leitura pública para o cadastro funcionar
-- =============================================

-- Permite que visitantes (não logados) leiam empresas
-- para validar o código de convite no cadastro
CREATE POLICY "Visitantes verificam código de convite" ON companies
  FOR SELECT TO anon
  USING (active = true);

-- Permite que visitantes contem usuários por empresa
-- para verificar o limite no cadastro
CREATE POLICY "Visitantes contam usuários da empresa" ON profiles
  FOR SELECT TO anon
  USING (true);

-- Verificar se as políticas foram criadas
SELECT policyname, tablename, roles
FROM pg_policies
WHERE tablename IN ('companies', 'profiles')
ORDER BY tablename, policyname;
