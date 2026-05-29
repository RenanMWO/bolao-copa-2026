'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Medal, Trophy } from 'lucide-react'
import type { RankingEntry } from '@/types'

export default function RankingPage() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [myId, setMyId] = useState<string>('')
  const [companyId, setCompanyId] = useState<string>('')
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
      setCompanyId(profile.company_id)
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

  const medalColors = ['text-[#FFD700]', 'text-[#C0C0C0]', 'text-[#CD7F32]']

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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-[#FFD700]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Ranking</h1>
            <p className="text-[#8B949E] text-sm">{companyName}</p>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0D1117] border-b border-[#30363D]">
                <th className="text-left text-[#8B949E] text-xs font-medium px-4 py-3">#</th>
                <th className="text-left text-[#8B949E] text-xs font-medium px-4 py-3">Participante</th>
                <th className="text-right text-[#8B949E] text-xs font-medium px-4 py-3">Pts</th>
                <th className="text-right text-[#8B949E] text-xs font-medium px-4 py-3 hidden sm:table-cell">Exatos</th>
                <th className="text-right text-[#8B949E] text-xs font-medium px-4 py-3 hidden sm:table-cell">Resultados</th>
                <th className="text-right text-[#8B949E] text-xs font-medium px-4 py-3 hidden sm:table-cell">Palpites</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry, idx) => {
                const isMe = entry.id === myId
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#30363D] last:border-0 transition-colors ${
                      isMe ? 'bg-[#00D54B]/10' : 'hover:bg-[#30363D]/30'
                    }`}
                  >
                    <td className="px-4 py-3 w-12">
                      {idx < 3 ? (
                        <Medal size={18} className={medalColors[idx]} />
                      ) : (
                        <span className="text-[#8B949E] text-sm">{entry.company_rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-[#30363D]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#30363D] flex items-center justify-center text-[#8B949E] text-xs font-bold">
                            {entry.nickname?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium text-sm flex items-center gap-1">
                            {entry.nickname}
                            {isMe && <span className="text-[#00D54B] text-xs">(você)</span>}
                          </div>
                          <div className="text-[#8B949E] text-xs">{entry.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#FFD700] font-bold">{entry.total_points}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm hidden sm:table-cell">
                      {entry.exact_scores}
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm hidden sm:table-cell">
                      {entry.correct_results}
                    </td>
                    <td className="px-4 py-3 text-right text-[#8B949E] text-sm hidden sm:table-cell">
                      {entry.total_predictions}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {ranking.length === 0 && (
            <div className="text-center text-[#8B949E] py-12">
              Nenhum participante ainda.
            </div>
          )}
        </div>

        <div className="mt-4 card">
          <p className="text-[#8B949E] text-xs text-center">
            <span className="text-[#00D54B] font-medium">10 pts</span> = Placar exato &nbsp;|&nbsp;
            <span className="text-yellow-400 font-medium">5 pts</span> = Resultado certo &nbsp;|&nbsp;
            <span className="text-[#FFD700] font-medium">25 pts</span> = Campeão certo
          </p>
        </div>
      </div>
    </>
  )
}
