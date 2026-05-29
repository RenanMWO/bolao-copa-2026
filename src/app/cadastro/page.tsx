'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy, Upload } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [inviteCode, setInviteCode] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [isAdminCompany, setIsAdminCompany] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function validateInviteCode() {
    setError('')
    setLoading(true)
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, user_limit, is_admin_company, active')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (error || !data) {
      setError('Código de convite inválido. Verifique com seu responsável.')
      setLoading(false)
      return
    }
    if (!data.active) {
      setError('Este bolão está desativado.')
      setLoading(false)
      return
    }

    // Check user limit
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', data.id)

    if (!data.is_admin_company && count !== null && count >= data.user_limit) {
      setError(`Este bolão já atingiu o limite de ${data.user_limit} participantes.`)
      setLoading(false)
      return
    }

    setCompanyId(data.id)
    setIsAdminCompany(data.is_admin_company)
    setStep(2)
    setLoading(false)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!nickname.trim() || !fullName.trim() || !age) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Erro ao criar conta. Tente novamente.')
      setLoading(false)
      return
    }

    let avatarUrl = null
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const filePath = `${authData.user.id}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = urlData.publicUrl
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        company_id: companyId,
        nickname: nickname.trim(),
        full_name: fullName.trim(),
        age: parseInt(age),
        avatar_url: avatarUrl,
        is_admin: isAdminCompany,
      })

    if (profileError) {
      setError('Erro ao salvar perfil. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-[#FFD700]" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Criar Conta</h1>
          <p className="text-[#8B949E] mt-1">
            {step === 1 ? 'Informe o código do seu bolão' : 'Preencha seus dados'}
          </p>
        </div>

        <div className="card">
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Código de Convite</label>
                <input
                  type="text"
                  className="input uppercase tracking-widest"
                  placeholder="EX: EMPRESA-2026"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                />
                <p className="text-[#8B949E] text-xs mt-1">
                  Código fornecido pela sua empresa
                </p>
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                className="btn-primary w-full"
                onClick={validateInviteCode}
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
              <p className="text-center text-[#8B949E] text-sm">
                Já tem conta?{' '}
                <Link href="/login" className="text-[#00D54B] hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-[#30363D] flex items-center justify-center overflow-hidden border-2 border-[#00D54B]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={24} className="text-[#8B949E]" />
                  )}
                </div>
                <label className="cursor-pointer text-[#00D54B] text-sm hover:underline">
                  Escolher foto (opcional)
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div>
                <label className="label">Apelido *</label>
                <input className="input" placeholder="Como quer ser chamado" value={nickname} onChange={e => setNickname(e.target.value)} required />
              </div>
              <div>
                <label className="label">Nome Completo *</label>
                <input className="input" placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Idade *</label>
                <input type="number" className="input" placeholder="Sua idade" value={age} onChange={e => setAge(e.target.value)} min="1" max="120" required />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input type="email" className="input" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Senha *</label>
                <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div>
                <label className="label">Confirmar Senha *</label>
                <input type="password" className="input" placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Criando conta...' : 'Criar Conta e Jogar!'}
              </button>
              <button type="button" className="text-[#8B949E] text-sm text-center hover:underline" onClick={() => setStep(1)}>
                Voltar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
