import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* Desktop: marge gauche pour la sidebar. Mobile: padding top (topbar) + bottom (bottomnav) */}
      <main className="flex-1 md:ml-56 pt-14 pb-20 md:pt-0 md:pb-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}