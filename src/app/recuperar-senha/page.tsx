'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy, ArrowLeft } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço informado.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-[#FFD700]" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Bolão Copa 2026</h1>
          <p className="text-[#8B949E] mt-1">Recuperação de senha</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-white font-bold text-lg mb-2">E-mail enviado!</h2>
              <p className="text-[#8B949E] text-sm mb-6">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <Link href="/login" className="text-[#00D54B] hover:underline text-sm font-medium">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-[#8B949E] text-sm">
                Informe seu e-mail e enviaremos um link para você redefinir sua senha.
              </p>
              <div>
                <label className="label">E-mail</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
              <Link href="/login" className="flex items-center justify-center gap-1 text-[#8B949E] text-sm hover:text-white transition-colors">
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
