'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Lock, CheckCircle, XCircle, Save } from 'lucide-react'
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

      // Set active stage to first with matches
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
    if (points === 10) return 'text-[#00D54B]'
    if (points === 5) return 'text-yellow-400'
    if (points === 0) return 'text-red-400'
    return 'text-[#8B949E]'
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
      setMessages(m => ({ ...m, [match.id]: 'Salvo!' }))
      setPredictions(p => ({
        ...p,
        [match.id]: { ...(p[match.id] || {}), predicted_home, predicted_away } as MatchPrediction,
      }))
      setTimeout(() => setMessages(m => ({ ...m, [match.id]: '' })), 2000)
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D54B]"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">Palpites</h1>
        <p className="text-[#8B949E] mb-6">
          Placar exato = 10pts | Resultado certo = 5pts | Travado quando o jogo começa
        </p>

        {/* Stage tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {stagesWithMatches.map(stage => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeStage === stage
                  ? 'bg-[#00D54B] text-black'
                  : 'bg-[#30363D] text-[#8B949E] hover:text-white'
              }`}
            >
              {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>

        {filteredMatches.length === 0 ? (
          <div className="card text-center text-[#8B949E] py-12">
            Nenhum jogo nesta fase ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredMatches.map(match => {
              const locked = isLocked(match)
              const pred = predictions[match.id]
              const inp = inputs[match.id] || { home: '', away: '' }

              return (
                <div key={match.id} className={`card ${locked ? 'opacity-90' : 'hover:border-[#00D54B]'} transition-colors`}>
                  {/* Match header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#8B949E] text-xs">
                      {format(parseISO(match.match_date), "dd/MM/yyyy 'às' HH'h'mm", { locale: ptBR })}
                      {match.venue ? ` • ${match.venue}` : ''}
                    </span>
                    <div className="flex items-center gap-1">
                      {match.status === 'finished' && (
                        <span className="text-xs bg-[#30363D] text-[#8B949E] px-2 py-0.5 rounded">Encerrado</span>
                      )}
                      {match.status === 'live' && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">Ao Vivo</span>
                      )}
                      {locked && match.status === 'scheduled' && (
                        <Lock size={14} className="text-[#8B949E]" />
                      )}
                    </div>
                  </div>

                  {/* Teams and score input */}
                  <div className="flex items-center gap-3">
                    {/* Home team */}
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <span className="text-white font-semibold text-sm text-right">{match.home_team?.name}</span>
                      {match.home_team?.flag_url && (
                        <img src={match.home_team.flag_url} alt="" className="w-8 h-5 object-cover rounded-sm flex-shrink-0" />
                      )}
                    </div>

                    {/* Score inputs */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={locked}
                        value={inp.home}
                        onChange={e => setInputs(i => ({ ...i, [match.id]: { ...inp, home: e.target.value } }))}
                        className="w-12 text-center text-white font-bold text-lg bg-[#0D1117] border border-[#30363D] rounded-lg p-2 disabled:opacity-50 focus:border-[#00D54B] outline-none"
                      />
                      <span className="text-[#8B949E] font-bold">×</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={locked}
                        value={inp.away}
                        onChange={e => setInputs(i => ({ ...i, [match.id]: { ...inp, away: e.target.value } }))}
                        className="w-12 text-center text-white font-bold text-lg bg-[#0D1117] border border-[#30363D] rounded-lg p-2 disabled:opacity-50 focus:border-[#00D54B] outline-none"
                      />
                    </div>

                    {/* Away team */}
                    <div className="flex-1 flex items-center gap-2">
                      {match.away_team?.flag_url && (
                        <img src={match.away_team.flag_url} alt="" className="w-8 h-5 object-cover rounded-sm flex-shrink-0" />
                      )}
                      <span className="text-white font-semibold text-sm">{match.away_team?.name}</span>
                    </div>
                  </div>

                  {/* Result (if finished) */}
                  {match.status === 'finished' && match.home_score !== null && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[#8B949E] text-xs">
                        Resultado real: {match.home_score} × {match.away_score}
                      </span>
                      {pred && (
                        <div className="flex items-center gap-1">
                          {pred.points === 10 && <CheckCircle size={14} className="text-[#00D54B]" />}
                          {pred.points === 5 && <CheckCircle size={14} className="text-yellow-400" />}
                          {pred.points === 0 && <XCircle size={14} className="text-red-400" />}
                          <span className={`text-sm font-bold ${getPointsColor(pred.points)}`}>
                            {pred.points !== null ? `+${pred.points}pts` : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save button */}
                  {!locked && (
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[#8B949E] text-xs">
                        {pred ? 'Palpite salvo — pode alterar' : 'Sem palpite ainda'}
                      </span>
                      <div className="flex items-center gap-2">
                        {messages[match.id] && (
                          <span className={`text-xs ${messages[match.id] === 'Salvo!' ? 'text-[#00D54B]' : 'text-red-400'}`}>
                            {messages[match.id]}
                          </span>
                        )}
                        <button
                          onClick={() => savePrediction(match)}
                          disabled={saving[match.id] || inp.home === '' || inp.away === ''}
                          className="btn-primary flex items-center gap-1 py-1.5 px-3 text-sm"
                        >
                          <Save size={14} />
                          {saving[match.id] ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
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
