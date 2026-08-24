'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ClientForm } from '@/components/clients/client-form'
import { FolderKanban, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { Client } from '@/lib/types'

type ClientAvecCompte = Client & { projet_count: number }

export default function ProjetsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<ClientAvecCompte[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  useEffect(() => {
    fetchData()
  }, [])

  const openEdit = (e: React.MouseEvent, client: Client) => {
    e.preventDefault()
    e.stopPropagation()
    setEditing(client)
    setDialogOpen(true)
  }

  const askDelete = (e: React.MouseEvent, clientId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteConfirm(clientId)
  }

  const handleSubmit = async (data: Partial<Client>) => {
    if (editing) {
      await supabase.from('clients').update(data).eq('id', editing.id)
    }
    setDialogOpen(false)
    setEditing(null)
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('projets').delete().eq('client_id', id)
    await supabase.from('clients').delete().eq('id', id)
    setDeleteConfirm(null)
    await fetchData()
  }

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
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{client.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.projet_count} projet{client.projet_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={(e) => openEdit(e, client)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => askDelete(e, client.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditing(null) }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le client et ses projets associés seront supprimés.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
