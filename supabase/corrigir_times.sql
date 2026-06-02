-- =============================================
-- CORREÇÃO DOS TIMES — COPA DO MUNDO 2026
-- Remove times não classificados e adiciona os corretos
-- Execute no SQL Editor do Supabase
-- =============================================

-- PASSO 1: Remover times não classificados
-- (só funciona se não houver palpites vinculados a eles)
DELETE FROM teams WHERE name IN (
  'Itália',
  'Dinamarca',
  'Sérvia',
  'Hungria',
  'Romênia',
  'Eslováquia',
  'Honduras',
  'Jamaica',
  'Costa Rica',
  'El Salvador',
  'Nigéria',
  'Camarões'
);

-- PASSO 2: Adicionar times classificados que estavam faltando
INSERT INTO teams (name, code, flag_url, confederation, group_name) VALUES
-- UEFA
('Noruega',               'NOR', 'https://flagcdn.com/w80/no.png', 'UEFA', NULL),
('Bósnia e Herzegovina',  'BIH', 'https://flagcdn.com/w80/ba.png', 'UEFA', NULL),
('República Tcheca',      'CZE', 'https://flagcdn.com/w80/cz.png', 'UEFA', NULL),
('Suécia',                'SWE', 'https://flagcdn.com/w80/se.png', 'UEFA', NULL),
-- CONCACAF
('Haiti',                 'HAI', 'https://flagcdn.com/w80/ht.png', 'CONCACAF', NULL),
('Curaçao',               'CUW', 'https://flagcdn.com/w80/cw.png', 'CONCACAF', NULL),
-- CAF
('Tunísia',               'TUN', 'https://flagcdn.com/w80/tn.png', 'CAF', NULL),
('Cabo Verde',            'CPV', 'https://flagcdn.com/w80/cv.png', 'CAF', NULL),
('Rep. Democrática do Congo', 'COD', 'https://flagcdn.com/w80/cd.png', 'CAF', NULL),
-- AFC
('Uzbequistão',           'UZB', 'https://flagcdn.com/w80/uz.png', 'AFC', NULL);

-- PASSO 3: Verificar resultado (deve retornar 48 times)
SELECT confederation, COUNT(*) as total FROM teams GROUP BY confederation ORDER BY confederation;
SELECT COUNT(*) as total_geral FROM teams;
