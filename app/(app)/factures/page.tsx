'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FactureForm, type FactureFormData } from '@/components/documents/facture-form'
import { Receipt, ChevronRight, Plus } from 'lucide-react'
import type { Client } from '@/lib/types'

type ClientAvecStats = Client & { facture_count: number; total_ttc: number }

export default function FacturesClientsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [clients, setClients] = useState<ClientAvecStats[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

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
    setAllClients(clientsData ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (formData: FactureFormData) => {
    const { lignes, moyens_paiement, paiement_autre, ...factureData } = formData
    const { data: newFacture } = await supabase.from('factures').insert({
      numero: factureData.numero, client_id: factureData.client_id || null,
      date_creation: factureData.date_creation, date_echeance: factureData.date_echeance,
      statut: factureData.statut, notes: factureData.notes,
      total_ht: factureData.total_ht, total_tva: factureData.total_tva, total_ttc: factureData.total_ttc,
    }).select().single()
    if (newFacture && lignes.length > 0) {
      await supabase.from('factures_lignes').insert(lignes.map((l, i) => ({ ...l, facture_id: newFacture.id, ordre: i })))
    }
    setDialogOpen(false)
    if (newFacture?.client_id) router.push(`/factures/${newFacture.client_id}`)
    else await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Factures</h1>
            <p className="text-sm text-muted-foreground">Par client</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
          <FactureForm clients={allClients} onSubmit={handleCreate} onCancel={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
