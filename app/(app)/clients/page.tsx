'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ClientForm } from '@/components/clients/client-form'
import type { Client } from '@/lib/types'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('nom')
    setClients(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditing(client)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: Partial<Client>) => {
    if (editing) {
      await supabase.from('clients').update(data).eq('id', editing.id)
    } else {
      await supabase.from('clients').insert(data)
    }
    setDialogOpen(false)
    setEditing(null)
    await fetchClients()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id)
    setDeleteConfirm(null)
    await fetchClients()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau client
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Users className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Aucun client pour le moment</p>
            <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-2">
              <Plus className="w-4 h-4" /> Ajouter un client
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-medium">Nom</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Téléphone</TableHead>
                <TableHead className="font-medium">Ville</TableHead>
                <TableHead className="font-medium">SIRET</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="group">
                  <TableCell className="font-medium">{client.nom}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{client.telephone ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.ville && client.code_postal
                      ? `${client.code_postal} ${client.ville}`
                      : client.ville ?? client.code_postal ?? '—'}
                  </TableCell>
                  <TableCell>
                    {client.siret ? (
                      <Badge variant="secondary" className="font-mono text-xs">{client.siret}</Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openEdit(client)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirm(client.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditing(null) }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible. Le client et ses données associées seront supprimés.
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
