'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Trophy } from 'lucide-react'
import type { RankingEntry } from '@/types'

const AVATAR_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#3b82f6', C: '#a855f7', D: '#f59e0b',
  E: '#ef4444', F: '#06b6d4', G: '#ec4899', H: '#84cc16',
  I: '#f97316', J: '#6366f1', K: '#14b8a6', L: '#e879f9',
  M: '#22c55e', N: '#3b82f6', O: '#a855f7', P: '#f59e0b',
  Q: '#ef4444', R: '#06b6d4', S: '#ec4899', T: '#84cc16',
  U: '#f97316', V: '#6366f1', W: '#14b8a6', X: '#e879f9',
  Y: '#22c55e', Z: '#3b82f6',
}

function getAvatarColor(nickname?: string | null) {
  const letter = nickname?.[0]?.toUpperCase() || 'A'
  return AVATAR_COLORS[letter] || '#22c55e'
}

export default function RankingPage() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [myId, setMyId] = useState<string>('')
  const [companyName, setCompanyName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, companies(name)')
        .eq('id', user.id)
        .single()

      if (!profile?.company_id) return
      setCompanyName((profile as any).companies?.name || '')

      const { data } = await supabase
        .from('company_rankings')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('company_rank', { ascending: true })

      setRanking((data || []) as RankingEntry[])
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

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rank-row { animation: fadeInUp 0.3s ease both; }
      `}</style>

      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy style={{ color: '#f5c518' }} size={26} />
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '28px' }} className="text-white leading-tight">
              Ranking
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }} className="text-[#8B949E]">
              {companyName}
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header da tabela */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 56px 52px 52px 72px',
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            {[
              { label: '#',       title: '',                   mobile: true  },
              { label: 'Participante', title: '',              mobile: true  },
              { label: 'PTS',     title: 'Pontuação total',    mobile: true  },
              { label: 'PE',      title: 'Placares exatos',    mobile: true  },
              { label: 'RC',      title: 'Resultados certos',  mobile: false },
              { label: 'CAMPEÃO', title: 'Acertou o campeão',  mobile: false },
            ].map(({ label, title, mobile }, i) => (
              <span
                key={label}
                title={title}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#8B949E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textAlign: i >= 2 ? 'center' : 'left',
                  cursor: title ? 'help' : 'default',
                }}
                className={!mobile ? 'hidden sm:block' : ''}
              >
                {label}
              </span>
            ))}
          </div>

          {ranking.length === 0 ? (
            <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-center text-[#8B949E] py-12">
              Nenhum participante ainda.
            </div>
          ) : (
            ranking.map((entry, idx) => {
              const isMe = entry.id === myId
              const isFirst = idx === 0
              const avatarColor = getAvatarColor(entry.nickname)

              return (
                <div
                  key={entry.id}
                  className="rank-row"
                  style={{
                    animationDelay: `${idx * 80}ms`,
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 56px 52px 52px 72px',
                    alignItems: 'center',
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: isFirst ? '3px solid #f5c518' : isMe ? '3px solid #22c55e' : '3px solid transparent',
                    background: isFirst
                      ? 'rgba(245,197,24,0.04)'
                      : isMe
                      ? 'rgba(34,197,94,0.05)'
                      : 'transparent',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isFirst && !isMe) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = isFirst
                      ? 'rgba(245,197,24,0.04)'
                      : isMe ? 'rgba(34,197,94,0.05)' : 'transparent'
                  }}
                >
                  {/* Posição */}
                  <div>
                    {idx === 0 && (
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>🥇</span>
                    )}
                    {idx === 1 && (
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>🥈</span>
                    )}
                    {idx === 2 && (
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px' }}>🥉</span>
                    )}
                    {idx >= 3 && (
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#8B949E' }}>
                        {entry.company_rank}
                      </span>
                    )}
                  </div>

                  {/* Participante */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                        background: `${avatarColor}18`,
                        border: `1px solid ${avatarColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700, fontSize: '14px',
                        color: avatarColor,
                      }}>
                        {entry.nickname?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: '14px', color: '#fff' }}>
                          {entry.nickname}
                        </span>
                        {isMe && (
                          <span style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '11px',
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            borderRadius: '100px',
                            padding: '1px 8px',
                            color: '#22c55e',
                          }}>você</span>
                        )}
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B949E' }}>{entry.full_name}</div>
                    </div>
                  </div>

                  {/* PTS */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: '#22c55e' }}>
                      {entry.total_points}
                    </span>
                  </div>

                  {/* PE — Placar Exato */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: '14px',
                      color: entry.exact_scores > 0 ? '#22c55e' : '#8B949E',
                    }}>
                      {entry.exact_scores}
                    </span>
                  </div>

                  {/* RC — Resultado Certo (hidden mobile) */}
                  <div style={{ textAlign: 'center' }} className="hidden sm:block">
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      fontSize: '14px',
                      color: entry.correct_results > 0 ? '#f5c518' : '#8B949E',
                    }}>
                      {entry.correct_results}
                    </span>
                  </div>

                  {/* CAMPEÃO (hidden mobile) */}
                  <div style={{ textAlign: 'center' }} className="hidden sm:block">
                    {entry.champion_correct === 1 ? (
                      <span style={{ fontSize: '18px' }} title="Acertou o campeão!">🏆</span>
                    ) : (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#8B949E' }}>—</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Legenda */}
        <div className="mt-4" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { pts: '15pts', label: 'Placar exato', color: '#22c55e' },
            { pts: '5pts',  label: 'Resultado certo', color: '#f5c518' },
            { pts: '25pts', label: 'Campeão certo', color: '#f5c518' },
          ].map(({ pts, label, color }) => (
            <div
              key={pts}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#161d27',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
                padding: '8px 14px',
              }}
            >
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13px', color }}>{pts}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B949E' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
