'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { User, Upload, Save } from 'lucide-react'

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
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-[#00D54B]" size={28} />
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-[#30363D] flex items-center justify-center overflow-hidden border-2 border-[#00D54B]">
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-[#8B949E]" />
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 text-[#00D54B] text-sm hover:underline">
                <Upload size={14} />
                Alterar foto
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div>
              <label className="label">Apelido</label>
              <input
                className="input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Nome Completo</label>
              <input
                className="input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Idade</label>
              <input
                type="number"
                className="input"
                value={age}
                onChange={e => setAge(e.target.value)}
                min="1"
                max="120"
              />
            </div>

            {message && (
              <p className={`text-sm text-center ${message.includes('Erro') ? 'text-red-400' : 'text-[#00D54B]'}`}>
                {message}
              </p>
            )}

            <button type="submit" className="btn-primary flex items-center justify-center gap-2" disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
