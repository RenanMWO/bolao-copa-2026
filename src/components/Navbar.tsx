'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trophy, LayoutDashboard, Star, BarChart3, Medal, User, LogOut, Menu, X, ShieldCheck } from 'lucide-react'
import type { Profile, Company } from '@/types'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      if (prof) {
        setProfile(prof as Profile)
        setCompany((prof as any).companies as Company)
      }
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/palpites', label: 'Palpites', icon: Star },
    { href: '/ranking', label: 'Ranking', icon: BarChart3 },
    { href: '/campeao', label: 'Campeão', icon: Medal },
    { href: '/perfil', label: 'Perfil', icon: User },
  ]

  if (profile?.is_admin) {
    links.push({ href: '/admin', label: 'Admin', icon: ShieldCheck })
  }

  return (
    <nav className="bg-[#161B22] border-b border-[#30363D] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 w-auto object-contain" />
            ) : (
              <Trophy className="text-[#FFD700]" size={28} />
            )}
            <span className="font-bold text-white hidden sm:block">
              {company?.name || 'Bolão Copa 2026'}
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-[#00D54B] text-black'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#30363D]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="hidden md:flex items-center gap-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-[#30363D]" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#30363D] flex items-center justify-center text-[#8B949E] text-xs font-bold">
                {profile?.nickname?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span className="text-[#8B949E] text-sm">{profile?.nickname}</span>
            <button onClick={handleLogout} className="text-[#8B949E] hover:text-red-400 transition-colors p-1" title="Sair">
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-[#8B949E] hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#30363D] px-4 py-3 flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-[#00D54B] text-black'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#30363D]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-[#30363D] transition-colors mt-2"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </nav>
  )
}
