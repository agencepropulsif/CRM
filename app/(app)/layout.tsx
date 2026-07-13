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
      {/* Desktop: ml-56 pour la sidebar | Mobile: pt-14 pour la topbar */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}