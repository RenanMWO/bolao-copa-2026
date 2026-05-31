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

  const initials = profile?.nickname?.[0]?.toUpperCase() || '?'

  return (
    <>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <nav style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-7 w-auto object-contain" />
              ) : (
                <Trophy className="text-[#f5c518]" size={22} />
              )}
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px' }} className="text-white hidden sm:block">
                {company?.name || 'Bolão Copa 2026'}
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-0.5">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith(href)
                      ? 'bg-white/[0.08] text-white'
                      : 'text-[#8B949E] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Avatar + logout */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="text-[#8B949E] text-sm">{profile?.nickname}</span>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-[34px] h-[34px] rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-[34px] h-[34px] rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e] text-xs font-bold">
                  {initials}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-[#8B949E] hover:text-red-400 transition-colors p-1 ml-1"
                title="Sair"
              >
                <LogOut size={17} />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden text-[#8B949E] hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] px-4 py-3 flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-white/[0.08] text-white'
                    : 'text-[#8B949E] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-white/[0.05] transition-colors mt-1"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
