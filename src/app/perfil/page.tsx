'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { User, Upload } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setNickname(data.nickname || '')
        setFullName(data.full_name || '')
        setAge(data.age ? String(data.age) : '')
        setAvatarUrl(data.avatar_url || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let newAvatarUrl = avatarUrl
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const filePath = `${userId}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        newAvatarUrl = urlData.publicUrl
        setAvatarUrl(newAvatarUrl)
      }
    }

    const { error } = await supabase.from('profiles').update({
      nickname: nickname.trim(),
      full_name: fullName.trim(),
      age: age ? parseInt(age) : null,
      avatar_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    if (error) {
      setMessage('Erro ao salvar. Tente novamente.')
    } else {
      setMessage('Perfil atualizado com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const preview = avatarPreview || avatarUrl
  const initial = nickname?.[0]?.toUpperCase() || '?'

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
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '28px' }} className="text-white">
            Meu Perfil
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }} className="text-[#8B949E] mt-1">
            Edite suas informações e foto de perfil
          </p>
        </div>

        {/* Card do formulário */}
        <div style={{
          background: '#161d27',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '32px',
        }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #22c55e',
                  boxShadow: '0 0 0 6px rgba(34,197,94,0.12)',
                  background: 'rgba(34,197,94,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {preview ? (
                    <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '32px', color: '#22c55e' }}>
                      {initial}
                    </span>
                  )}
                </div>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                color: '#22c55e',
                cursor: 'pointer',
              }}
                className="hover:underline"
              >
                <Upload size={14} />
                Alterar foto
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>

            {/* Apelido */}
            <div>
              <label style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: '#8B949E',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: '6px',
              }}>
                Apelido
              </label>
              <input
                className="input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Como você quer ser chamado"
                required
              />
            </div>

            {/* Nome completo */}
            <div>
              <label style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: '#8B949E',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: '6px',
              }}>
                Nome Completo
              </label>
              <input
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Idade */}
            <div>
              <label style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: '#8B949E',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                display: 'block',
                marginBottom: '6px',
              }}>
                Idade
              </label>
              <input
                type="number"
                className="input"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Sua idade"
                min="1"
                max="120"
              />
            </div>

            {/* Mensagem */}
            {message && (
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                textAlign: 'center',
                padding: '10px',
                borderRadius: '10px',
                background: message.includes('Erro') ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${message.includes('Erro') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                color: message.includes('Erro') ? '#f87171' : '#22c55e',
              }}>
                {message}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                fontFamily: "'Syne', sans-serif",
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
