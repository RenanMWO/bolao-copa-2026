'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Building2, Calendar, Users, Trophy, ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [stats, setStats] = useState({ companies: 0, users: 0, matches: 0, finishedMatches: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      const [companiesRes, usersRes, matchesRes, finishedRes] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_admin_company', false),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', false),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
        supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
      ])

      setStats({
        companies: companiesRes.count || 0,
        users: usersRes.count || 0,
        matches: matchesRes.count || 0,
        finishedMatches: finishedRes.count || 0,
      })
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
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="text-[#00D54B]" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-[#8B949E] text-sm">Gerencie empresas, jogos e palpites</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[#00D54B]">{stats.companies}</div>
            <div className="text-[#8B949E] text-sm mt-1">Empresas</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-white">{stats.users}</div>
            <div className="text-[#8B949E] text-sm mt-1">Participantes</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-white">{stats.matches}</div>
            <div className="text-[#8B949E] text-sm mt-1">Jogos</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[#FFD700]">{stats.finishedMatches}</div>
            <div className="text-[#8B949E] text-sm mt-1">Encerrados</div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/admin/empresas" className="card hover:border-[#00D54B] transition-colors flex items-start gap-4 p-6">
            <Building2 className="text-[#00D54B] flex-shrink-0" size={32} />
            <div>
              <h2 className="text-white font-bold text-lg">Gerenciar Empresas</h2>
              <p className="text-[#8B949E] text-sm mt-1">
                Criar empresas clientes, definir limite de usuários, fazer upload de logo e obter o código de convite.
              </p>
            </div>
          </Link>

          <Link href="/admin/jogos" className="card hover:border-[#00D54B] transition-colors flex items-start gap-4 p-6">
            <Calendar className="text-[#FFD700] flex-shrink-0" size={32} />
            <div>
              <h2 className="text-white font-bold text-lg">Gerenciar Jogos</h2>
              <p className="text-[#8B949E] text-sm mt-1">
                Cadastrar jogos da copa, inserir resultados finais e calcular pontos dos participantes.
              </p>
            </div>
          </Link>
        </div>

        {/* Instructions */}
        <div className="card mt-6">
          <h3 className="text-white font-bold mb-3">Como usar</h3>
          <ol className="text-[#8B949E] text-sm flex flex-col gap-2 list-decimal list-inside">
            <li>Crie uma <strong className="text-white">empresa</strong> para cada cliente que comprou acesso</li>
            <li>Defina o limite de usuários (10, 30, 50 ou 100)</li>
            <li>Copie o <strong className="text-white">código de convite</strong> e envie para os participantes</li>
            <li>Os participantes se cadastram usando o código</li>
            <li>Quando jogos terminarem, entre em <strong className="text-white">Gerenciar Jogos</strong>, insira o placar e clique em "Calcular Pontos"</li>
          </ol>
        </div>
      </div>
    </>
  )
}
