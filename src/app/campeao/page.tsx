'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Trophy, Lock, Clock } from 'lucide-react'
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
      setMessage('Palpite salvo com sucesso!')
      const { data } = await supabase.from('champion_predictions').select('*, teams(*)').eq('user_id', userId).single()
      if (data) setPrediction(data as ChampionPrediction)
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const selectedTeam = teams.find(t => t.id === selected)

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
        .team-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .team-card:hover:not(.locked) {
          border-color: rgba(34,197,94,0.4) !important;
          background: rgba(34,197,94,0.06) !important;
          transform: translateY(-2px);
        }
        .team-card.selected {
          border-color: #22c55e !important;
          background: rgba(34,197,94,0.1) !important;
        }
        .team-card.locked { cursor: default; }
      `}</style>

      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Trophy style={{ color: '#f5c518' }} size={26} />
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '28px' }} className="text-white">
              Palpite de Campeão
            </h1>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }} className="text-[#8B949E]">
            Vale 25 pontos se acertar o campeão da Copa!
          </p>
        </div>

        {/* Status de travamento */}
        <div className="mb-6">
          {locked ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              padding: '10px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#f87171',
            }}>
              <Lock size={14} />
              Palpite travado — quartas de final já iniciaram
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px',
              padding: '10px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#22c55e',
            }}>
              <Clock size={14} />
              Disponível até as quartas de final começarem
            </div>
          )}
        </div>

        {/* Palpite atual */}
        {prediction && selectedTeam && (
          <div className="card mb-6" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'rgba(245,197,24,0.1)',
              border: '1px solid rgba(245,197,24,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Trophy size={20} style={{ color: '#f5c518' }} />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Seu palpite atual
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                {selectedTeam.flag_url && (
                  <img src={selectedTeam.flag_url} alt="" style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px' }} />
                )}
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                  {selectedTeam.name}
                </span>
                {prediction.points !== null && (
                  <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', color: prediction.points > 0 ? '#f5c518' : '#8B949E' }}>
                    +{prediction.points}pts
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid de times */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}>
          {teams.map(team => (
            <button
              key={team.id}
              disabled={locked}
              onClick={() => !locked && setSelected(team.id)}
              className={`team-card ${selected === team.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
              style={{
                background: '#161d27',
                border: `1px solid ${selected === team.id ? '#22c55e' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '16px',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
              }}
            >
              {/* Checkmark */}
              {selected === team.id && (
                <div style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Bandeira */}
              {team.flag_url ? (
                <img
                  src={team.flag_url}
                  alt={team.name}
                  style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                />
              ) : (
                <div style={{
                  width: '48px', height: '32px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: '#8B949E',
                }}>
                  {team.code}
                </div>
              )}

              {/* Nome */}
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                color: selected === team.id ? '#fff' : '#E6EDF3',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>
                {team.name}
              </span>
            </button>
          ))}
        </div>

        {/* Botão salvar */}
        {!locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={savePrediction}
              disabled={saving || !selected}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', padding: '12px 28px' }}
            >
              <Trophy size={16} />
              {saving ? 'Salvando...' : 'Salvar Palpite de Campeão'}
            </button>
            {message && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: message.includes('Erro') ? '#f87171' : '#22c55e',
              }}>
                {message}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
