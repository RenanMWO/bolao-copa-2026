'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Trophy, Star, BarChart3, Clock, CheckCircle, XCircle, Target, Hash } from 'lucide-react'
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22c55e]"></div>
        </div>
      </>
    )
  }

  const statsCards = [
    {
      icon: Target,
      value: ranking?.total_points ?? 0,
      label: 'Pontos',
      color: '#f5c518',
      highlight: false,
    },
    {
      icon: Hash,
      value: `${ranking?.company_rank ?? '—'}º`,
      label: 'Posição',
      color: '#22c55e',
      highlight: true,
    },
    {
      icon: CheckCircle,
      value: ranking?.exact_scores ?? 0,
      label: 'Placares Exatos',
      color: '#E6EDF3',
      highlight: false,
    },
    {
      icon: Star,
      value: ranking?.total_predictions ?? 0,
      label: 'Palpites',
      color: '#E6EDF3',
      highlight: false,
    },
  ]

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '28px' }} className="text-white leading-tight">
            Olá, {profile?.nickname}
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }} className="text-[#8B949E] mt-1">
            Copa do Mundo 2026 · {profile?.companies?.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map(({ icon: Icon, value, label, color, highlight }) => (
            <div
              key={label}
              className="card text-center relative overflow-hidden"
              style={highlight ? { borderColor: '#f5c518', borderWidth: '1px' } : {}}
            >
              <Icon
                size={14}
                style={{ color }}
                className="absolute top-3 left-3 opacity-60"
              />
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '36px',
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}
                className="mt-2"
              >
                {value}
              </div>
              <div
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '0.05em' }}
                className="text-[#8B949E] uppercase mt-2"
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Próximos jogos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.04em' }}
                className="text-[#8B949E] uppercase flex items-center gap-2"
              >
                <Clock size={14} className="text-[#22c55e]" />
                Próximos Jogos
              </h2>
              <Link href="/palpites" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }} className="text-[#22c55e] hover:underline">
                Ver todos →
              </Link>
            </div>
            {upcomingMatches.length === 0 ? (
              <div className="card text-center text-[#8B949E] py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Nenhum jogo agendado.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingMatches.map(match => (
                  <Link key={match.id} href="/palpites" className="card block transition-all duration-200 hover:border-[#22c55e]/40" style={{ padding: '16px' }}>
                    {/* Data badge */}
                    <div className="flex items-center justify-center mb-3">
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          background: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: '100px',
                          padding: '2px 10px',
                          color: '#22c55e',
                        }}
                      >
                        {format(parseISO(match.match_date), "dd MMM · HH'h'mm", { locale: ptBR })}
                      </span>
                    </div>
                    {/* Times */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        {match.home_team?.flag_url && (
                          <img src={match.home_team.flag_url} alt="" className="w-8 h-5 object-cover rounded-sm shadow" />
                        )}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600 }} className="text-white text-center">{match.home_team?.name}</span>
                      </div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '11px' }} className="text-[#8B949E]">VS</span>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        {match.away_team?.flag_url && (
                          <img src={match.away_team.flag_url} alt="" className="w-8 h-5 object-cover rounded-sm shadow" />
                        )}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600 }} className="text-white text-center">{match.away_team?.name}</span>
                      </div>
                    </div>
                    <div className="text-center mt-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B949E' }}>
                      {STAGE_LABELS[match.stage]}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resultados recentes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', letterSpacing: '0.04em' }}
                className="text-[#8B949E] uppercase flex items-center gap-2"
              >
                <Star size={14} className="text-[#f5c518]" />
                Resultados Recentes
              </h2>
              <Link href="/palpites" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }} className="text-[#22c55e] hover:underline">
                Ver todos →
              </Link>
            </div>
            {recentResults.length === 0 ? (
              <div className="card text-center text-[#8B949E] py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Nenhum resultado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentResults.map((pred: any) => (
                  <div key={pred.id} className="card" style={{ padding: '14px 16px' }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500 }} className="text-white">
                        {pred.matches?.home_team?.name} × {pred.matches?.away_team?.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {pred.points === 15 && <CheckCircle size={13} className="text-[#22c55e]" />}
                        {pred.points === 5 && <CheckCircle size={13} className="text-[#f5c518]" />}
                        {pred.points === 0 && <XCircle size={13} className="text-red-400" />}
                        <span
                          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', color: pred.points > 0 ? '#22c55e' : '#8B949E' }}
                        >
                          +{pred.points}pts
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B949E', marginTop: '4px' }}>
                      Palpite: {pred.predicted_home} × {pred.predicted_away} · Real: {pred.matches?.home_score} × {pred.matches?.away_score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          {[
            { href: '/palpites', icon: Star, label: 'Fazer Palpites', sub: 'Registre seus palpites', iconColor: '#f5c518' },
            { href: '/ranking', icon: BarChart3, label: 'Ver Ranking', sub: 'Veja sua posição', iconColor: '#22c55e' },
            { href: '/campeao', icon: Trophy, label: 'Campeão', sub: 'Escolha o vencedor', iconColor: '#f5c518', colSpan: true },
          ].map(({ href, icon: Icon, label, sub, iconColor, colSpan }) => (
            <Link
              key={href}
              href={href}
              className={`card flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-[#22c55e]/40 hover:-translate-y-0.5 ${colSpan ? 'col-span-2 md:col-span-1' : ''}`}
              style={{ padding: '28px 16px', minHeight: '80px' }}
            >
              <Icon size={28} style={{ color: iconColor, marginBottom: '8px' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px' }} className="text-white">{label}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B949E', marginTop: '2px' }}>{sub}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
