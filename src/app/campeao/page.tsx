'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Trophy, Lock, Check } from 'lucide-react'
import type { Team, ChampionPrediction } from '@/types'

export default function CampeaoPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<Team[]>([])
  const [prediction, setPrediction] = useState<ChampionPrediction | null>(null)
  const [selected, setSelected] = useState<string>('')
  const [locked, setLocked] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [teamsRes, predRes, quarterRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('champion_predictions').select('*, teams(*)').eq('user_id', user.id).single(),
        supabase.from('matches')
          .select('match_date')
          .eq('stage', 'quarter')
          .order('match_date', { ascending: true })
          .limit(1)
          .single(),
      ])

      setTeams((teamsRes.data || []) as Team[])

      if (predRes.data) {
        setPrediction(predRes.data as ChampionPrediction)
        setSelected(predRes.data.team_id || '')
      }

      // Lock if first quarterfinal has started
      if (quarterRes.data?.match_date) {
        setLocked(new Date(quarterRes.data.match_date) <= new Date())
      }

      setLoading(false)
    }
    load()
  }, [])

  async function savePrediction() {
    if (!selected || locked) return
    setSaving(true)
    setMessage('')

    const payload = { user_id: userId, team_id: selected, updated_at: new Date().toISOString() }
    let error

    if (prediction) {
      const res = await supabase.from('champion_predictions').update(payload).eq('id', prediction.id)
      error = res.error
    } else {
      const res = await supabase.from('champion_predictions').insert(payload)
      error = res.error
    }

    if (error) {
      setMessage('Erro ao salvar. Tente novamente.')
    } else {
      setMessage('Palpite de campeão salvo!')
      const { data } = await supabase.from('champion_predictions').select('*, teams(*)').eq('user_id', userId).single()
      if (data) setPrediction(data as ChampionPrediction)
    }
    setSaving(false)
  }

  const selectedTeam = teams.find(t => t.id === selected)

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
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="text-[#FFD700]" size={28} />
          <h1 className="text-2xl font-bold text-white">Palpite de Campeão</h1>
        </div>
        <p className="text-[#8B949E] mb-2">Vale 25 pontos se acertar!</p>

        {locked ? (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4 card w-fit">
            <Lock size={14} />
            Palpite travado — quartas de final iniciaram
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#00D54B] text-sm mb-4">
            <Check size={14} />
            Você pode alterar até as quartas de final começarem
          </div>
        )}

        {/* Current prediction */}
        {prediction && selectedTeam && (
          <div className="card mb-6 flex items-center gap-4">
            <div>
              <p className="text-[#8B949E] text-sm">Seu palpite atual</p>
              <div className="flex items-center gap-3 mt-1">
                {selectedTeam.flag_url && (
                  <img src={selectedTeam.flag_url} alt="" className="w-10 h-7 object-cover rounded" />
                )}
                <span className="text-white font-bold text-lg">{selectedTeam.name}</span>
                {prediction.points !== null && (
                  <span className={`font-bold ${prediction.points > 0 ? 'text-[#FFD700]' : 'text-[#8B949E]'}`}>
                    +{prediction.points}pts
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Team grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {teams.map(team => (
            <button
              key={team.id}
              disabled={locked}
              onClick={() => setSelected(team.id)}
              className={`card flex flex-col items-center gap-2 py-4 transition-all hover:border-[#00D54B] disabled:cursor-default ${
                selected === team.id
                  ? 'border-[#00D54B] bg-[#00D54B]/10'
                  : ''
              }`}
            >
              {team.flag_url ? (
                <img src={team.flag_url} alt={team.name} className="w-12 h-8 object-cover rounded" />
              ) : (
                <div className="w-12 h-8 bg-[#30363D] rounded flex items-center justify-center text-[#8B949E] text-xs">
                  {team.code}
                </div>
              )}
              <span className="text-white text-sm font-medium text-center leading-tight">{team.name}</span>
              {selected === team.id && (
                <div className="flex items-center gap-1 text-[#00D54B] text-xs font-bold">
                  <Check size={12} />
                  Selecionado
                </div>
              )}
            </button>
          ))}
        </div>

        {!locked && (
          <div className="flex items-center gap-4">
            <button
              onClick={savePrediction}
              disabled={saving || !selected}
              className="btn-primary flex items-center gap-2"
            >
              <Trophy size={16} />
              {saving ? 'Salvando...' : 'Salvar Palpite de Campeão'}
            </button>
            {message && (
              <span className={`text-sm ${message.includes('Erro') ? 'text-red-400' : 'text-[#00D54B]'}`}>
                {message}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
