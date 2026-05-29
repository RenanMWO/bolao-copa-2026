'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Trophy, Star, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Match, RankingEntry } from '@/types'
import { STAGE_LABELS } from '@/types'

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [ranking, setRanking] = useState<RankingEntry | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentResults, setRecentResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, rankingRes, matchesRes, predictionsRes] = await Promise.all([
        supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single(),
        supabase.from('company_rankings').select('*').eq('id', user.id).single(),
        supabase.from('matches')
          .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
          .gte('match_date', new Date().toISOString())
          .eq('status', 'scheduled')
          .order('match_date', { ascending: true })
          .limit(3),
        supabase.from('match_predictions')
          .select('*, matches(*, home_team:home_team_id(*), away_team:away_team_id(*))')
          .eq('user_id', user.id)
          .not('points', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(3),
      ])

      setProfile(profileRes.data)
      setRanking(rankingRes.data as RankingEntry)
      setUpcomingMatches((matchesRes.data || []) as Match[])
      setRecentResults(predictionsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D54B]"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Olá, {profile?.nickname}! 👋
          </h1>
          <p className="text-[#8B949E] mt-1">
            Copa do Mundo 2026 — {profile?.companies?.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[#FFD700]">
              {ranking?.total_points ?? 0}
            </div>
            <div className="text-[#8B949E] text-sm mt-1">Pontos</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[#00D54B]">
              #{ranking?.company_rank ?? '—'}
            </div>
            <div className="text-[#8B949E] text-sm mt-1">Posição</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-white">
              {ranking?.exact_scores ?? 0}
            </div>
            <div className="text-[#8B949E] text-sm mt-1">Placares Exatos</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-white">
              {ranking?.total_predictions ?? 0}
            </div>
            <div className="text-[#8B949E] text-sm mt-1">Palpites</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Próximos jogos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-[#00D54B]" />
                Próximos Jogos
              </h2>
              <Link href="/palpites" className="text-[#00D54B] text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {upcomingMatches.length === 0 ? (
              <div className="card text-center text-[#8B949E] py-8">
                Nenhum jogo agendado.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingMatches.map(match => (
                  <Link key={match.id} href="/palpites" className="card hover:border-[#00D54B] transition-colors block">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="flex items-center gap-2 justify-center">
                          {match.home_team?.flag_url && (
                            <img src={match.home_team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm" />
                          )}
                          <span className="text-white font-medium text-sm">{match.home_team?.name}</span>
                        </div>
                      </div>
                      <div className="text-[#8B949E] text-xs mx-3 text-center">
                        <div className="font-bold text-white">VS</div>
                        <div>{format(parseISO(match.match_date), 'dd/MM', { locale: ptBR })}</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-white font-medium text-sm">{match.away_team?.name}</span>
                          {match.away_team?.flag_url && (
                            <img src={match.away_team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-[#8B949E] text-xs mt-2">
                      {STAGE_LABELS[match.stage]} • {format(parseISO(match.match_date), "HH'h'mm", { locale: ptBR })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resultados recentes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Star size={18} className="text-[#FFD700]" />
                Resultados Recentes
              </h2>
              <Link href="/palpites" className="text-[#00D54B] text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {recentResults.length === 0 ? (
              <div className="card text-center text-[#8B949E] py-8">
                Nenhum resultado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentResults.map((pred: any) => (
                  <div key={pred.id} className="card">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">
                        {pred.matches?.home_team?.name} x {pred.matches?.away_team?.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {pred.points === 10 && <CheckCircle size={14} className="text-[#00D54B]" />}
                        {pred.points === 5 && <CheckCircle size={14} className="text-yellow-400" />}
                        {pred.points === 0 && <XCircle size={14} className="text-red-400" />}
                        <span className={`font-bold text-sm ${pred.points > 0 ? 'text-[#00D54B]' : 'text-[#8B949E]'}`}>
                          +{pred.points}pts
                        </span>
                      </div>
                    </div>
                    <div className="text-[#8B949E] text-xs mt-1">
                      Palpite: {pred.predicted_home} x {pred.predicted_away} |
                      Real: {pred.matches?.home_score} x {pred.matches?.away_score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <Link href="/palpites" className="card hover:border-[#00D54B] transition-colors text-center py-6">
            <Star className="mx-auto text-[#FFD700] mb-2" size={32} />
            <span className="text-white font-medium">Fazer Palpites</span>
          </Link>
          <Link href="/ranking" className="card hover:border-[#00D54B] transition-colors text-center py-6">
            <BarChart3 className="mx-auto text-[#00D54B] mb-2" size={32} />
            <span className="text-white font-medium">Ver Ranking</span>
          </Link>
          <Link href="/campeao" className="card hover:border-[#00D54B] transition-colors text-center py-6 col-span-2 md:col-span-1">
            <Trophy className="mx-auto text-[#FFD700] mb-2" size={32} />
            <span className="text-white font-medium">Campeão</span>
          </Link>
        </div>
      </div>
    </>
  )
}
