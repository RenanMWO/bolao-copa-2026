'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Lock, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Match, MatchPrediction } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES = ['group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final'] as const

export default function PalpitesPage() {
  const supabase = createClient()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, MatchPrediction>>({})
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [activeStage, setActiveStage] = useState<string>('group')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [matchesRes, predsRes] = await Promise.all([
        supabase.from('matches')
          .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
          .order('match_date', { ascending: true }),
        supabase.from('match_predictions')
          .select('*')
          .eq('user_id', user.id),
      ])

      const matchList = (matchesRes.data || []) as Match[]
      setMatches(matchList)

      const predMap: Record<string, MatchPrediction> = {}
      const inputMap: Record<string, { home: string; away: string }> = {}
      for (const p of predsRes.data || []) {
        predMap[p.match_id] = p as MatchPrediction
        inputMap[p.match_id] = { home: String(p.predicted_home), away: String(p.predicted_away) }
      }
      setPredictions(predMap)
      setInputs(inputMap)

      const availableStages = STAGES.filter(s => matchList.some(m => m.stage === s))
      if (availableStages.length > 0) setActiveStage(availableStages[0])

      setLoading(false)
    }
    load()
  }, [])

  function isLocked(match: Match) {
    if (match.status === 'finished' || match.status === 'live') return true
    return new Date(match.match_date) <= new Date()
  }

  function getPointsColor(points: number | null | undefined) {
    if (points === 10) return '#22c55e'
    if (points === 5) return '#f5c518'
    if (points === 0) return '#f87171'
    return '#8B949E'
  }

  async function savePrediction(match: Match) {
    const inp = inputs[match.id]
    if (!inp || inp.home === '' || inp.away === '') return

    setSaving(s => ({ ...s, [match.id]: true }))
    setMessages(m => ({ ...m, [match.id]: '' }))

    const predicted_home = parseInt(inp.home)
    const predicted_away = parseInt(inp.away)
    const existing = predictions[match.id]
    let error

    if (existing) {
      const res = await supabase
        .from('match_predictions')
        .update({ predicted_home, predicted_away, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      error = res.error
    } else {
      const res = await supabase
        .from('match_predictions')
        .insert({ user_id: userId, match_id: match.id, predicted_home, predicted_away })
      error = res.error
    }

    if (error) {
      setMessages(m => ({ ...m, [match.id]: 'Erro ao salvar.' }))
    } else {
      setSaved(s => ({ ...s, [match.id]: true }))
      setPredictions(p => ({
        ...p,
        [match.id]: { ...(p[match.id] || {}), predicted_home, predicted_away } as MatchPrediction,
      }))
      setTimeout(() => setSaved(s => ({ ...s, [match.id]: false })), 600)
    }
    setSaving(s => ({ ...s, [match.id]: false }))
  }

  const stagesWithMatches = STAGES.filter(s => matches.some(m => m.stage === s))
  const filteredMatches = matches.filter(m => m.stage === activeStage)

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
        @keyframes flashGreen {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          30%  { box-shadow: 0 0 0 6px rgba(34,197,94,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .flash-saved { animation: flashGreen 600ms ease-out; }

        .score-input::-webkit-inner-spin-button,
        .score-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .score-input { -moz-appearance: textfield; }
      `}</style>

      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '28px' }} className="text-white">
            Palpites
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }} className="text-[#8B949E] mt-1">
            Placar exato · 10pts &nbsp;·&nbsp; Resultado certo · 5pts &nbsp;·&nbsp; Trava quando o jogo começa
          </p>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {stagesWithMatches.map(stage => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                padding: '6px 16px',
                borderRadius: '100px',
                transition: 'all 0.2s',
                background: activeStage === stage ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                border: activeStage === stage ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: activeStage === stage ? '#22c55e' : '#8B949E',
                cursor: 'pointer',
              }}
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>

        {filteredMatches.length === 0 ? (
          <div className="card text-center text-[#8B949E] py-12" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Nenhum jogo nesta fase ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredMatches.map(match => {
              const locked = isLocked(match)
              const pred = predictions[match.id]
              const inp = inputs[match.id] || { home: '', away: '' }
              const hasPred = !!pred
              const isSaved = saved[match.id]

              return (
                <div
                  key={match.id}
                  className={`card ${isSaved ? 'flash-saved' : ''}`}
                  style={{ padding: '20px 24px', opacity: locked && match.status !== 'finished' ? 0.75 : 1 }}
                >
                  {/* Header do card */}
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B949E' }}>
                      {format(parseISO(match.match_date), "dd MMM · HH'h'mm", { locale: ptBR })}
                      {match.venue ? ` · ${match.venue}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Badge fase */}
                      <span style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '11px',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '100px',
                        padding: '2px 10px',
                        color: '#22c55e',
                      }}>
                        {STAGE_LABELS[match.stage]}
                      </span>
                      {match.status === 'finished' && (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '100px',
                          padding: '2px 10px',
                          color: '#8B949E',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}>Encerrado</span>
                      )}
                      {match.status === 'live' && (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          background: 'rgba(239,68,68,0.15)',
                          borderRadius: '100px',
                          padding: '2px 10px',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.3)',
                        }} className="animate-pulse">● Ao Vivo</span>
                      )}
                      {locked && match.status === 'scheduled' && <Lock size={13} className="text-[#8B949E]" />}
                    </div>
                  </div>

                  {/* Times + inputs */}
                  <div className="flex items-center gap-4">
                    {/* Time da casa */}
                    <div className="flex-1 flex flex-col items-end gap-1.5">
                      {match.home_team?.flag_url && (
                        <img src={match.home_team.flag_url} alt="" style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
                      )}
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600 }} className="text-white text-right">{match.home_team?.name}</span>
                    </div>

                    {/* Inputs de placar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        min="0" max="99"
                        disabled={locked}
                        value={inp.home}
                        onChange={e => setInputs(i => ({ ...i, [match.id]: { ...inp, home: e.target.value } }))}
                        className="score-input"
                        style={{
                          width: '52px', height: '52px',
                          textAlign: 'center',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: '24px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          opacity: locked ? 0.5 : 1,
                        }}
                        onFocus={e => { if (!locked) e.target.style.borderColor = '#22c55e' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      />
                      <span style={{ color: '#8B949E', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px' }}>×</span>
                      <input
                        type="number"
                        min="0" max="99"
                        disabled={locked}
                        value={inp.away}
                        onChange={e => setInputs(i => ({ ...i, [match.id]: { ...inp, away: e.target.value } }))}
                        className="score-input"
                        style={{
                          width: '52px', height: '52px',
                          textAlign: 'center',
                          fontFamily: "'Syne', sans-serif",
                          fontSize: '24px',
                          fontWeight: 700,
                          color: '#fff',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          opacity: locked ? 0.5 : 1,
                        }}
                        onFocus={e => { if (!locked) e.target.style.borderColor = '#22c55e' }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                      />
                    </div>

                    {/* Time visitante */}
                    <div className="flex-1 flex flex-col items-start gap-1.5">
                      {match.away_team?.flag_url && (
                        <img src={match.away_team.flag_url} alt="" style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
                      )}
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 600 }} className="text-white">{match.away_team?.name}</span>
                    </div>
                  </div>

                  {/* Resultado real + pontos */}
                  {match.status === 'finished' && match.home_score !== null && (
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#8B949E' }}>
                        Resultado real: {match.home_score} × {match.away_score}
                      </span>
                      {pred && (
                        <div className="flex items-center gap-1.5">
                          {pred.points === 10 && <CheckCircle size={13} style={{ color: '#22c55e' }} />}
                          {pred.points === 5 && <CheckCircle size={13} style={{ color: '#f5c518' }} />}
                          {pred.points === 0 && <XCircle size={13} style={{ color: '#f87171' }} />}
                          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '14px', color: getPointsColor(pred.points) }}>
                            {pred.points !== null ? `+${pred.points}pts` : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer: status do palpite + botão */}
                  {!locked && (
                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {hasPred ? (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          background: 'rgba(34,197,94,0.08)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: '100px',
                          padding: '2px 10px',
                          color: '#22c55e',
                        }}>
                          ✓ Palpite salvo
                        </span>
                      ) : (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          background: 'rgba(245,197,24,0.08)',
                          border: '1px solid rgba(245,197,24,0.2)',
                          borderRadius: '100px',
                          padding: '2px 10px',
                          color: '#f5c518',
                        }}>
                          Palpite pendente
                        </span>
                      )}
                      <button
                        onClick={() => savePrediction(match)}
                        disabled={saving[match.id] || inp.home === '' || inp.away === ''}
                        className="btn-primary"
                        style={{ fontSize: '13px', padding: '8px 18px' }}
                      >
                        {saving[match.id] ? 'Salvando...' : 'Salvar palpite'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
