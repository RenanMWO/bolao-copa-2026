-- =============================================
-- MIGRAÇÃO: Atualizar view company_rankings
-- Adiciona coluna champion_correct
-- Corrige correct_results (só points = 5, não inclui placar exato)
-- =============================================

DROP VIEW IF EXISTS company_rankings;

CREATE VIEW company_rankings AS
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
