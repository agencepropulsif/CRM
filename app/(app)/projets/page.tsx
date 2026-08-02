'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FolderKanban, ChevronRight } from 'lucide-react'
import type { Client } from '@/lib/types'

type ClientAvecCompte = Client & { projet_count: number }

export default function ProjetsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<ClientAvecCompte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase.from('clients').select('*').order('nom')
      const { data: projetsData } = await supabase.from('projets').select('client_id')

      const counts: Record<string, number> = {}
      projetsData?.forEach((p) => {
        if (p.client_id) counts[p.client_id] = (counts[p.client_id] ?? 0) + 1
      })

      const merged = (clientsData ?? []).map((c) => ({
        ...c,
        projet_count: counts[c.id] ?? 0,
      }))

      setClients(merged)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FolderKanban className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projets</h1>
          <p className="text-sm text-muted-foreground">Réalisations par client</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FolderKanban className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Aucun client pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/projets/${client.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{client.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.projet_count} projet{client.projet_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
