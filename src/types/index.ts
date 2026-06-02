export interface Company {
  id: string
  name: string
  logo_url: string | null
  user_limit: number
  invite_code: string
  is_admin_company: boolean
  active: boolean
  created_at: string
}

export interface Profile {
  id: string
  company_id: string | null
  nickname: string
  full_name: string
  age: number | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
  companies?: Company
}

export interface Team {
  id: string
  name: string
  code: string
  flag_url: string | null
  group_name: string | null
  confederation: string | null
  created_at: string
}

export interface Match {
  id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  stage: 'group' | 'round32' | 'round16' | 'quarter' | 'semi' | 'third' | 'final'
  group_name: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'live' | 'finished'
  created_at: string
  home_team?: Team
  away_team?: Team
}

export interface MatchPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  points: number | null
  created_at: string
  updated_at: string
  matches?: Match
}

export interface ChampionPrediction {
  id: string
  user_id: string
  team_id: string | null
  points: number | null
  created_at: string
  updated_at: string
  teams?: Team
}

export interface RankingEntry {
  id: string
  company_id: string
  nickname: string
  full_name: string
  avatar_url: string | null
  total_points: number
  exact_scores: number
  correct_results: number
  champion_correct: number
  total_predictions: number
  company_rank: number
}

export const STAGE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  round32: 'Oitavas de Final',
  round16: 'Oitavas de Final',
  quarter: 'Quartas de Final',
  semi: 'Semifinal',
  third: '3º Lugar',
  final: 'Final',
}
