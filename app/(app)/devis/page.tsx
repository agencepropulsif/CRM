'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FileText, ChevronRight } from 'lucide-react'
import type { Client } from '@/lib/types'

type ClientAvecStats = Client & { devis_count: number; total_ttc: number }

export default function DevisClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<ClientAvecStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase.from('clients').select('*').order('nom')
      const { data: devisData } = await supabase.from('devis').select('client_id, total_ttc')

      const stats: Record<string, { count: number; total: number }> = {}
      devisData?.forEach((d) => {
        if (d.client_id) {
          if (!stats[d.client_id]) stats[d.client_id] = { count: 0, total: 0 }
          stats[d.client_id].count += 1
          stats[d.client_id].total += d.total_ttc ?? 0
        }
      })

      const merged = (clientsData ?? [])
        .map((c) => ({ ...c, devis_count: stats[c.id]?.count ?? 0, total_ttc: stats[c.id]?.total ?? 0 }))
        .filter((c) => c.devis_count > 0)
        .sort((a, b) => a.nom.localeCompare(b.nom))

      setClients(merged)
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Devis</h1>
          <p className="text-sm text-muted-foreground">Par client</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Aucun devis pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/devis/${client.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{client.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.devis_count} devis · {client.total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
