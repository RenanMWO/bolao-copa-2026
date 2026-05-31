'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trophy } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="text-[#FFD700]" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white">Bolão Copa 2026</h1>
          <p className="text-[#8B949E] mt-1">Entre na sua conta para jogar</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <div className="text-center">
              <Link href="/recuperar-senha" className="text-[#8B949E] text-sm hover:text-[#00D54B] transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          </form>
          <p className="text-center text-[#8B949E] text-sm mt-4">
            Não tem conta?{' '}
            <Link href="/cadastro" className="text-[#00D54B] hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
