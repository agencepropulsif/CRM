'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Receipt, Building2, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Devis', href: '/devis', icon: FileText },
  { name: 'Factures', href: '/factures', icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col bg-sidebar border-r border-sidebar-border z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-sidebar-foreground" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Propulsif</p>
            <p className="text-xs text-sidebar-foreground/50 leading-tight">Communication</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">Navigation</p>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          {user && (
            <div className="px-2 py-1.5 mb-1">
              <p className="text-xs text-sidebar-foreground/40 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== MOBILE TOPBAR ===== */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-sidebar-foreground" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-sidebar-foreground">Propulsif</span>
        </div>
      </header>

      {/* ===== MOBILE DRAWER ===== */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-sidebar shadow-2xl">
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sidebar-foreground" strokeWidth={1.8} />
                <span className="text-sm font-semibold text-sidebar-foreground">Propulsif</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav drawer */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Footer drawer */}
            <div className="px-3 py-4 border-t border-sidebar-border">
              {user && (
                <p className="px-4 mb-3 text-xs text-sidebar-foreground/40 truncate">{user.email}</p>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.8} />
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}