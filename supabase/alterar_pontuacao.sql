-- =============================================
-- MIGRAÇÃO: Novo sistema de pontuação
-- Placar exato = 15pts (10 + 5 acumulados)
-- Resultado certo = 5pts
-- Errou tudo = 0pts
-- Campeão = 25pts (sem alteração)
-- =============================================

-- 1. Atualizar a função de cálculo de pontos
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

-- 2. Atualizar a view de ranking (exact_scores agora detecta 15pts)
CREATE OR REPLACE VIEW company_rankings AS
SELECT
  p.id,
  p.company_id,
  p.nickname,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(mp.points), 0) + COALESCE(MAX(cp.points), 0) AS total_points,
  COUNT(CASE WHEN mp.points = 15 THEN 1 END) AS exact_scores,
  COUNT(CASE WHEN mp.points >= 5 THEN 1 END) AS correct_results,
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

-- 3. Recalcular pontos de jogos já finalizados (se houver)
-- Execute linha a linha para cada match_id já calculado:
-- SELECT calculate_match_points('<match_id_aqui>');
--
-- Ou recalcule todos de uma vez:
-- SELECT calculate_match_points(id) FROM matches WHERE status = 'finished';
