'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Receipt, ChevronRight } from 'lucide-react'
import type { Client } from '@/lib/types'

type ClientAvecStats = Client & { facture_count: number; total_ttc: number }

export default function FacturesClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<ClientAvecStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase.from('clients').select('*').order('nom')
      const { data: facturesData } = await supabase.from('factures').select('client_id, total_ttc')

      const stats: Record<string, { count: number; total: number }> = {}
      facturesData?.forEach((f) => {
        if (f.client_id) {
          if (!stats[f.client_id]) stats[f.client_id] = { count: 0, total: 0 }
          stats[f.client_id].count += 1
          stats[f.client_id].total += f.total_ttc ?? 0
        }
      })

      const merged = (clientsData ?? [])
        .map((c) => ({ ...c, facture_count: stats[c.id]?.count ?? 0, total_ttc: stats[c.id]?.total ?? 0 }))
        .filter((c) => c.facture_count > 0)
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
          <Receipt className="w-5 h-5 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Factures</h1>
          <p className="text-sm text-muted-foreground">Par client</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Receipt className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Aucune facture pour le moment</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/factures/${client.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{client.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.facture_count} facture{client.facture_count !== 1 ? 's' : ''} · {client.total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
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
