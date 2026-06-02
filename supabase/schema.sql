-- =============================================
-- BOLÃO COPA DO MUNDO 2026 - SCHEMA COMPLETO
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

-- Empresas (clientes do bolão)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  user_limit INTEGER NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  is_admin_company BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT companies_user_limit_check
    CHECK (user_limit IN (10, 30, 50, 100) OR is_admin_company = true)
);

-- Perfis de usuários (extensão do auth.users do Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  nickname TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Times da copa
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  flag_url TEXT,
  group_name TEXT,
  confederation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jogos da copa
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  match_date TIMESTAMPTZ NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final')),
  group_name TEXT,
  venue TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Palpites de placar por jogo
CREATE TABLE match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  predicted_home INTEGER NOT NULL CHECK (predicted_home >= 0),
  predicted_away INTEGER NOT NULL CHECK (predicted_away >= 0),
  points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Palpite de campeão
CREATE TABLE champion_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  team_id UUID REFERENCES teams(id),
  points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNÇÕES
-- =============================================

-- Trigger: criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Função: verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função: calcular pontos de um jogo
CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id UUID)
RETURNS void AS $$
DECLARE
  v_home_score INTEGER;
  v_away_score INTEGER;
  v_actual_result TEXT;
  v_pred_result TEXT;
  v_points INTEGER;
  pred RECORD;
BEGIN
  SELECT home_score, away_score INTO v_home_score, v_away_score
  FROM matches WHERE id = p_match_id;

  IF v_home_score > v_away_score THEN v_actual_result := 'home';
  ELSIF v_home_score < v_away_score THEN v_actual_result := 'away';
  ELSE v_actual_result := 'draw';
  END IF;

  FOR pred IN SELECT * FROM match_predictions WHERE match_id = p_match_id LOOP
    v_points := 0;

    IF pred.predicted_home = v_home_score AND pred.predicted_away = v_away_score THEN
      v_points := 15; -- placar exato (10) + resultado certo (5) acumulados
    ELSE
      IF pred.predicted_home > pred.predicted_away THEN v_pred_result := 'home';
      ELSIF pred.predicted_home < pred.predicted_away THEN v_pred_result := 'away';
      ELSE v_pred_result := 'draw';
      END IF;

      IF v_pred_result = v_actual_result THEN
        v_points := 5;
      END IF;
    END IF;

    UPDATE match_predictions SET points = v_points, updated_at = NOW() WHERE id = pred.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: calcular pontos do campeão
CREATE OR REPLACE FUNCTION calculate_champion_points(p_champion_team_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE champion_predictions
  SET points = CASE WHEN team_id = p_champion_team_id THEN 25 ELSE 0 END,
      updated_at = NOW()
  WHERE true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEW: RANKING POR EMPRESA
-- =============================================
CREATE OR REPLACE VIEW company_rankings AS
SELECT
  p.id,
  p.company_id,
  p.nickname,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(mp.points), 0) + COALESCE(MAX(cp.points), 0) AS total_points,
  COUNT(CASE WHEN mp.points = 15 THEN 1 END) AS exact_scores,
  COUNT(CASE WHEN mp.points = 5  THEN 1 END) AS correct_results,
  CASE WHEN MAX(cp.points) = 25 THEN 1 ELSE 0 END AS champion_correct,
  COUNT(mp.id) AS total_predictions,
  RANK() OVER (
    PARTITION BY p.company_id
    ORDER BY COALESCE(SUM(mp.points), 0) + COALESCE(MAX(cp.points), 0) DESC
  ) AS company_rank
FROM profiles p
LEFT JOIN match_predictions mp ON mp.user_id = p.id
LEFT JOIN champion_predictions cp ON cp.user_id = p.id
WHERE p.is_admin = false AND p.company_id IS NOT NULL
GROUP BY p.id, p.company_id, p.nickname, p.full_name, p.avatar_url;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE champion_predictions ENABLE ROW LEVEL SECURITY;

-- COMPANIES
CREATE POLICY "Usuários leem sua própria empresa" ON companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR is_admin()
  );
CREATE POLICY "Apenas admin gerencia empresas" ON companies
  FOR ALL USING (is_admin());

-- PROFILES
CREATE POLICY "Perfis visíveis para mesma empresa" ON profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    OR id = auth.uid()
    OR is_admin()
  );
CREATE POLICY "Usuário edita próprio perfil" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Usuário insere próprio perfil" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- TEAMS
CREATE POLICY "Times visíveis para todos" ON teams
  FOR SELECT USING (true);
CREATE POLICY "Admin gerencia times" ON teams
  FOR ALL USING (is_admin());

-- MATCHES
CREATE POLICY "Jogos visíveis para todos" ON matches
  FOR SELECT USING (true);
CREATE POLICY "Admin gerencia jogos" ON matches
  FOR ALL USING (is_admin());

-- MATCH_PREDICTIONS
CREATE POLICY "Usuário vê palpites da sua empresa" ON match_predictions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles WHERE company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR is_admin()
  );
CREATE POLICY "Usuário gerencia próprios palpites" ON match_predictions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuário atualiza próprios palpites" ON match_predictions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Usuário deleta próprios palpites" ON match_predictions
  FOR DELETE USING (user_id = auth.uid());

-- CHAMPION_PREDICTIONS
CREATE POLICY "Todos veem palpites de campeão da empresa" ON champion_predictions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM profiles WHERE company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR is_admin()
  );
CREATE POLICY "Usuário gerencia próprio palpite de campeão" ON champion_predictions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuário atualiza próprio palpite de campeão" ON champion_predictions
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- DADOS INICIAIS: EMPRESA ADMIN
-- =============================================
INSERT INTO companies (name, invite_code, user_limit, is_admin_company, active)
VALUES ('Admin Sistema', 'ADMIN-BOLAO-2026', 999, true, true);

-- =============================================
-- DADOS INICIAIS: 48 TIMES DA COPA 2026
-- =============================================
INSERT INTO teams (name, code, flag_url, confederation, group_name) VALUES
-- CONMEBOL
('Brasil', 'BRA', 'https://flagcdn.com/w80/br.png', 'CONMEBOL', 'G'),
('Argentina', 'ARG', 'https://flagcdn.com/w80/ar.png', 'CONMEBOL', 'G'),
('Colômbia', 'COL', 'https://flagcdn.com/w80/co.png', 'CONMEBOL', 'H'),
('Uruguai', 'URU', 'https://flagcdn.com/w80/uy.png', 'CONMEBOL', 'H'),
('Equador', 'ECU', 'https://flagcdn.com/w80/ec.png', 'CONMEBOL', 'E'),
('Paraguai', 'PAR', 'https://flagcdn.com/w80/py.png', 'CONMEBOL', 'E'),
-- CONCACAF (incluindo anfitriões)
('Estados Unidos', 'USA', 'https://flagcdn.com/w80/us.png', 'CONCACAF', 'A'),
('Canadá', 'CAN', 'https://flagcdn.com/w80/ca.png', 'CONCACAF', 'A'),
('México', 'MEX', 'https://flagcdn.com/w80/mx.png', 'CONCACAF', 'B'),
('Panamá', 'PAN', 'https://flagcdn.com/w80/pa.png', 'CONCACAF', 'B'),
('Honduras', 'HON', 'https://flagcdn.com/w80/hn.png', 'CONCACAF', 'C'),
('Jamaica', 'JAM', 'https://flagcdn.com/w80/jm.png', 'CONCACAF', 'C'),
('Costa Rica', 'CRC', 'https://flagcdn.com/w80/cr.png', 'CONCACAF', 'D'),
('El Salvador', 'SLV', 'https://flagcdn.com/w80/sv.png', 'CONCACAF', 'D'),
-- UEFA
('França', 'FRA', 'https://flagcdn.com/w80/fr.png', 'UEFA', 'I'),
('Alemanha', 'GER', 'https://flagcdn.com/w80/de.png', 'UEFA', 'I'),
('Espanha', 'ESP', 'https://flagcdn.com/w80/es.png', 'UEFA', 'J'),
('Portugal', 'POR', 'https://flagcdn.com/w80/pt.png', 'UEFA', 'J'),
('Inglaterra', 'ENG', 'https://flagcdn.com/w80/gb-eng.png', 'UEFA', 'F'),
('Holanda', 'NED', 'https://flagcdn.com/w80/nl.png', 'UEFA', 'F'),
('Bélgica', 'BEL', 'https://flagcdn.com/w80/be.png', 'UEFA', 'K'),
('Croácia', 'CRO', 'https://flagcdn.com/w80/hr.png', 'UEFA', 'K'),
('Itália', 'ITA', 'https://flagcdn.com/w80/it.png', 'UEFA', 'L'),
('Suíça', 'SUI', 'https://flagcdn.com/w80/ch.png', 'UEFA', 'L'),
('Dinamarca', 'DEN', 'https://flagcdn.com/w80/dk.png', 'UEFA', 'F'),
('Áustria', 'AUT', 'https://flagcdn.com/w80/at.png', 'UEFA', 'I'),
('Escócia', 'SCO', 'https://flagcdn.com/w80/gb-sct.png', 'UEFA', 'J'),
('Sérvia', 'SRB', 'https://flagcdn.com/w80/rs.png', 'UEFA', 'K'),
('Hungria', 'HUN', 'https://flagcdn.com/w80/hu.png', 'UEFA', 'L'),
('Turquia', 'TUR', 'https://flagcdn.com/w80/tr.png', 'UEFA', 'E'),
('Romênia', 'ROU', 'https://flagcdn.com/w80/ro.png', 'UEFA', 'G'),
('Eslováquia', 'SVK', 'https://flagcdn.com/w80/sk.png', 'UEFA', 'H'),
-- CAF
('Marrocos', 'MAR', 'https://flagcdn.com/w80/ma.png', 'CAF', 'A'),
('Senegal', 'SEN', 'https://flagcdn.com/w80/sn.png', 'CAF', 'B'),
('Egito', 'EGY', 'https://flagcdn.com/w80/eg.png', 'CAF', 'C'),
('Nigéria', 'NGA', 'https://flagcdn.com/w80/ng.png', 'CAF', 'D'),
('Camarões', 'CMR', 'https://flagcdn.com/w80/cm.png', 'CAF', 'E'),
('África do Sul', 'RSA', 'https://flagcdn.com/w80/za.png', 'CAF', 'F'),
('Costa do Marfim', 'CIV', 'https://flagcdn.com/w80/ci.png', 'CAF', 'G'),
('Argélia', 'ALG', 'https://flagcdn.com/w80/dz.png', 'CAF', 'H'),
('Gana', 'GHA', 'https://flagcdn.com/w80/gh.png', 'CAF', 'I'),
-- AFC
('Japão', 'JPN', 'https://flagcdn.com/w80/jp.png', 'AFC', 'J'),
('Coreia do Sul', 'KOR', 'https://flagcdn.com/w80/kr.png', 'AFC', 'K'),
('Arábia Saudita', 'KSA', 'https://flagcdn.com/w80/sa.png', 'AFC', 'L'),
('Austrália', 'AUS', 'https://flagcdn.com/w80/au.png', 'AFC', 'A'),
('Irã', 'IRN', 'https://flagcdn.com/w80/ir.png', 'AFC', 'B'),
('Catar', 'QAT', 'https://flagcdn.com/w80/qa.png', 'AFC', 'C'),
('Jordânia', 'JOR', 'https://flagcdn.com/w80/jo.png', 'AFC', 'D'),
('Iraque', 'IRQ', 'https://flagcdn.com/w80/iq.png', 'AFC', 'E'),
-- OFC
('Nova Zelândia', 'NZL', 'https://flagcdn.com/w80/nz.png', 'OFC', 'F');

-- =============================================
-- STORAGE BUCKETS (criar manualmente no Supabase)
-- Vá em Storage > New Bucket:
-- 1. Bucket: "avatars" (público)
-- 2. Bucket: "logos" (público)
-- =============================================
