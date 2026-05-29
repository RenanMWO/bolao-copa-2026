'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Plus, Copy, Check, Building2, ArrowLeft, Upload, Trash2, Users } from 'lucide-react'
import type { Company } from '@/types'

const LIMITS = [10, 30, 50, 100] as const

export default function EmpresasPage() {
  const supabase = createClient()
  const router = useRouter()
  const [companies, setCompanies] = useState<(Company & { user_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string>('')

  // Form state
  const [name, setName] = useState('')
  const [userLimit, setUserLimit] = useState<number>(30)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) { router.push('/dashboard'); return }
      await fetchCompanies()
    }
    load()
  }, [])

  async function fetchCompanies() {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('is_admin_company', false)
      .order('created_at', { ascending: false })

    if (data) {
      const withCounts = await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', c.id)
          return { ...c, user_count: count || 0 }
        })
      )
      setCompanies(withCounts)
    }
    setLoading(false)
  }

  function generateCode(companyName: string) {
    const clean = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${clean}-${rand}`
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const inviteCode = generateCode(name)

    let logoUrl = null
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop()
      const filePath = `${inviteCode}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath)
        logoUrl = urlData.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('companies').insert({
      name: name.trim(),
      user_limit: userLimit,
      invite_code: inviteCode,
      logo_url: logoUrl,
      active: true,
    })

    if (insertError) {
      setError('Erro ao criar empresa. Tente novamente.')
    } else {
      setShowForm(false)
      resetForm()
      await fetchCompanies()
    }
    setSaving(false)
  }

  function resetForm() {
    setName('')
    setUserLimit(30)
    setLogoFile(null)
    setLogoPreview('')
    setError('')
  }

  async function toggleActive(company: Company) {
    await supabase.from('companies').update({ active: !company.active }).eq('id', company.id)
    await fetchCompanies()
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(''), 2000)
  }

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
            <h1 className="text-2xl font-bold text-white">Empresas</h1>
            <p className="text-[#8B949E] text-sm">{companies.length} empresa(s) cadastrada(s)</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); resetForm() }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Empresa
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="card mb-6 border-[#00D54B]">
            <h2 className="text-white font-bold mb-4">Criar Nova Empresa</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Logo upload */}
                <div className="flex flex-col items-center gap-2 sm:w-32">
                  <div className="w-24 h-24 bg-[#0D1117] border border-[#30363D] rounded-xl flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Building2 size={32} className="text-[#30363D]" />
                    )}
                  </div>
                  <label className="cursor-pointer text-[#00D54B] text-xs hover:underline flex items-center gap-1">
                    <Upload size={12} />
                    Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <label className="label">Nome da Empresa *</label>
                    <input className="input" placeholder="Ex: Empresa ABC" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Limite de Usuários *</label>
                    <div className="flex gap-2">
                      {LIMITS.map(limit => (
                        <button
                          key={limit}
                          type="button"
                          onClick={() => setUserLimit(limit)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            userLimit === limit
                              ? 'bg-[#00D54B] text-black'
                              : 'bg-[#30363D] text-[#8B949E] hover:text-white'
                          }`}
                        >
                          {limit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
                  {saving ? 'Criando...' : 'Criar Empresa'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Companies list */}
        {companies.length === 0 ? (
          <div className="card text-center text-[#8B949E] py-12">
            Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {companies.map(company => (
              <div key={company.id} className={`card ${!company.active ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 bg-[#0D1117] border border-[#30363D] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building2 size={24} className="text-[#30363D]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-bold">{company.name}</h3>
                      {!company.active && (
                        <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">Desativado</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[#8B949E] text-sm">
                      <Users size={14} />
                      <span>{(company as any).user_count} / {company.user_limit} participantes</span>
                    </div>
                    {/* Invite code */}
                    <div className="flex items-center gap-2 mt-2">
                      <code className="bg-[#0D1117] border border-[#30363D] px-3 py-1 rounded text-[#00D54B] text-sm font-mono tracking-wider">
                        {company.invite_code}
                      </code>
                      <button
                        onClick={() => copyCode(company.invite_code)}
                        className="text-[#8B949E] hover:text-[#00D54B] transition-colors p-1"
                        title="Copiar código"
                      >
                        {copied === company.invite_code ? <Check size={16} className="text-[#00D54B]" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleActive(company)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                        company.active
                          ? 'bg-[#30363D] text-[#8B949E] hover:text-white'
                          : 'bg-[#00D54B]/20 text-[#00D54B] hover:bg-[#00D54B]/30'
                      }`}
                    >
                      {company.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-[#30363D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00D54B] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (((company as any).user_count || 0) / company.user_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
