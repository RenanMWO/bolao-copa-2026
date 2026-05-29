'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Plus, ArrowLeft, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Match, Team } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES = ['group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final'] as const

export default function JogosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState<string>('')
  const [message, setMessage] = useState('')
  const [expandedStage, setExpandedStage] = useState<string>('group')

  // Score editing state
  const [editScores, setEditScores] = useState<Record<string, { home: string; away: string }>>({})

  // Form
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [stage, setStage] = useState<string>('group')
  const [groupName, setGroupName] = useState('')
  const [venue, setVenue] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }

      await Promise.all([fetchMatches(), fetchTeams()])
    }
    load()
  }, [])

  async function fetchMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
      .order('match_date', { ascending: true })
    setMatches((data || []) as Match[])
    setLoading(false)
  }

  async function fetchTeams() {
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams((data || []) as Team[])
  }

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault()
    if (homeTeamId === awayTeamId) {
      setMessage('Time da casa e visitante não podem ser iguais.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('matches').insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: new Date(matchDate).toISOString(),
      stage,
      group_name: groupName || null,
      venue: venue || null,
    })
    if (error) {
      setMessage('Erro ao criar jogo.')
    } else {
      setShowForm(false)
      resetForm()
      await fetchMatches()
    }
    setSaving(false)
  }

  function resetForm() {
    setHomeTeamId('')
    setAwayTeamId('')
    setMatchDate('')
    setStage('group')
    setGroupName('')
    setVenue('')
    setMessage('')
  }

  async function saveScore(match: Match) {
    const scores = editScores[match.id]
    if (!scores || scores.home === '' || scores.away === '') return

    setSaving(true)
    const home_score = parseInt(scores.home)
    const away_score = parseInt(scores.away)

    await supabase.from('matches').update({
      home_score,
      away_score,
      status: 'finished',
    }).eq('id', match.id)

    await fetchMatches()
    setSaving(false)
  }

  async function calculatePoints(matchId: string) {
    setCalculating(matchId)
    const { error } = await supabase.rpc('calculate_match_points', { p_match_id: matchId })
    if (error) {
      setMessage(`Erro ao calcular pontos: ${error.message}`)
    } else {
      setMessage('Pontos calculados com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    }
    setCalculating('')
  }

  async function calculateChampionPoints(teamId: string) {
    const { error } = await supabase.rpc('calculate_champion_points', { p_champion_team_id: teamId })
    if (error) {
      setMessage(`Erro: ${error.message}`)
    } else {
      setMessage('Pontos de campeão calculados!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const stagesWithMatches = STAGES.filter(s => matches.some(m => m.stage === s))

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
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-[#8B949E] hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Jogos</h1>
            <p className="text-[#8B949E] text-sm">{matches.length} jogo(s) cadastrado(s)</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); resetForm() }} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Novo Jogo
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Erro') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-[#00D54B]'}`}>
            {message}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="card mb-6 border-[#00D54B]">
            <h2 className="text-white font-bold mb-4">Cadastrar Novo Jogo</h2>
            <form onSubmit={handleCreateMatch} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Time da Casa *</label>
                <select className="input" value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)} required>
                  <option value="">Selecionar time...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Time Visitante *</label>
                <select className="input" value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)} required>
                  <option value="">Selecionar time...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data e Hora *</label>
                <input type="datetime-local" className="input" value={matchDate} onChange={e => setMatchDate(e.target.value)} required />
              </div>
              <div>
                <label className="label">Fase *</label>
                <select className="input" value={stage} onChange={e => setStage(e.target.value)}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Grupo (ex: A, B...)</label>
                <input className="input" placeholder="Apenas para fase de grupos" value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>
              <div>
                <label className="label">Estádio</label>
                <input className="input" placeholder="Nome do estádio" value={venue} onChange={e => setVenue(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Cadastrar Jogo'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Matches by stage */}
        {stagesWithMatches.length === 0 && !showForm ? (
          <div className="card text-center text-[#8B949E] py-12">
            Nenhum jogo cadastrado ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {stagesWithMatches.map(stageKey => {
              const stageMatches = matches.filter(m => m.stage === stageKey)
              const isExpanded = expandedStage === stageKey
              return (
                <div key={stageKey} className="card p-0 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-[#30363D]/30 transition-colors"
                    onClick={() => setExpandedStage(isExpanded ? '' : stageKey)}
                  >
                    <span className="font-bold text-white">{STAGE_LABELS[stageKey]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8B949E] text-sm">{stageMatches.length} jogo(s)</span>
                      {isExpanded ? <ChevronUp size={16} className="text-[#8B949E]" /> : <ChevronDown size={16} className="text-[#8B949E]" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#30363D]">
                      {stageMatches.map(match => {
                        const scores = editScores[match.id] || { home: match.home_score !== null ? String(match.home_score) : '', away: match.away_score !== null ? String(match.away_score) : '' }
                        return (
                          <div key={match.id} className="p-4 border-b border-[#30363D] last:border-0">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              {/* Teams */}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {match.home_team?.flag_url && <img src={match.home_team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm" />}
                                  <span className="text-white text-sm font-medium">{match.home_team?.name}</span>
                                </div>
                                <span className="text-[#8B949E] text-xs">vs</span>
                                <div className="flex items-center gap-2">
                                  {match.away_team?.flag_url && <img src={match.away_team.flag_url} alt="" className="w-6 h-4 object-cover rounded-sm" />}
                                  <span className="text-white text-sm font-medium">{match.away_team?.name}</span>
                                </div>
                              </div>

                              {/* Date & Status */}
                              <div className="text-[#8B949E] text-xs text-right">
                                {format(parseISO(match.match_date), "dd/MM HH'h'mm", { locale: ptBR })}
                                <div className="mt-0.5">
                                  {match.status === 'finished' && <span className="text-[#8B949E]">Encerrado</span>}
                                  {match.status === 'live' && <span className="text-red-400">Ao Vivo</span>}
                                  {match.status === 'scheduled' && <span className="text-[#00D54B]">Agendado</span>}
                                </div>
                              </div>
                            </div>

                            {/* Score input & actions */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <label className="text-[#8B949E] text-xs">Placar:</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={scores.home}
                                  onChange={e => setEditScores(s => ({ ...s, [match.id]: { ...scores, home: e.target.value } }))}
                                  className="w-12 text-center text-white font-bold bg-[#0D1117] border border-[#30363D] rounded p-1.5 text-sm focus:border-[#00D54B] outline-none"
                                />
                                <span className="text-[#8B949E]">×</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={scores.away}
                                  onChange={e => setEditScores(s => ({ ...s, [match.id]: { ...scores, away: e.target.value } }))}
                                  className="w-12 text-center text-white font-bold bg-[#0D1117] border border-[#30363D] rounded p-1.5 text-sm focus:border-[#00D54B] outline-none"
                                />
                              </div>

                              <button
                                onClick={() => saveScore(match)}
                                disabled={saving || scores.home === '' || scores.away === ''}
                                className="btn-secondary text-xs py-1.5 px-3"
                              >
                                Salvar Placar
                              </button>

                              {match.status === 'finished' && (
                                <button
                                  onClick={() => calculatePoints(match.id)}
                                  disabled={calculating === match.id}
                                  className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3"
                                >
                                  <Calculator size={12} />
                                  {calculating === match.id ? 'Calculando...' : 'Calcular Pontos'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Champion points section */}
        <div className="card mt-6">
          <h3 className="text-white font-bold mb-3">Calcular Pontos do Campeão</h3>
          <p className="text-[#8B949E] text-sm mb-4">
            Após a final, selecione o time campeão para calcular os 25 pontos de quem acertou.
          </p>
          <select
            className="input mb-3"
            onChange={e => e.target.value && calculateChampionPoints(e.target.value)}
            defaultValue=""
          >
            <option value="">Selecionar campeão...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
    </>
  )
}
