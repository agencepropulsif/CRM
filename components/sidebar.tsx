'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Receipt, Building2, LogOut } from 'lucide-react'
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
    <aside className="fixed inset-y-0 left-0 w-56 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-sidebar-foreground" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Propulsif</p>
          <p className="text-xs text-sidebar-foreground/50 leading-tight">Communication</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-xs font-medium text-sidebar-foreground/40 uppercase tracking-wider">
          Navigation
        </p>
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

      {/* User + Logout */}
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
  )
}