-- CORREÇÃO: calculate_champion_points
-- Erro "UPDATE requires a WHERE clause" — adiciona WHERE true para satisfazer o PostgREST

CREATE OR REPLACE FUNCTION calculate_champion_points(p_champion_team_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE champion_predictions
  SET points = CASE WHEN team_id = p_champion_team_id THEN 25 ELSE 0 END,
      updated_at = NOW()
  WHERE true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
