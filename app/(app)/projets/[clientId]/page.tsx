'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ProjetForm } from '@/components/projets/projet-form'
import type { Client, ProjetAvecVisuels, Projet } from '@/lib/types'
import { Plus, Pencil, Trash2, ArrowLeft, ImageIcon } from 'lucide-react'

export default function ClientProjetsPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string

  const [client, setClient] = useState<Client | null>(null)
  const [projets, setProjets] = useState<ProjetAvecVisuels[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Projet | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single()
    setClient(clientData)

    const { data: projetsData } = await supabase
      .from('projets')
      .select('*, projets_visuels(*)')
      .eq('client_id', clientId)
      .order('date_realisation', { ascending: false })

    setProjets(projetsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (projet: Projet) => {
    setEditing(projet)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: Partial<Projet>, files: File[]) => {
    let projetId = editing?.id

    if (editing) {
      await supabase.from('projets').update(data).eq('id', editing.id)
    } else {
      const { data: inserted } = await supabase.from('projets').insert(data).select().single()
      projetId = inserted?.id
    }

    if (projetId && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = `${projetId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('projets-visuels').upload(path, file)
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('projets-visuels').getPublicUrl(path)
          await supabase.from('projets_visuels').insert({
            projet_id: projetId,
            url_image: urlData.publicUrl,
            ordre: i,
          })
        }
      }
    }

    setDialogOpen(false)
    setEditing(null)
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('projets').delete().eq('id', id)
    setDeleteConfirm(null)
    await fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/projets')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{client?.nom ?? '...'}</h1>
            <p className="text-sm text-muted-foreground">{projets.length} projet{projets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau projet
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Chargement...
        </div>
      ) : projets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 bg-card border border-border rounded-lg">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Aucun projet pour ce client</p>
          <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-2">
            <Plus className="w-4 h-4" /> Ajouter un projet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projets.map((projet) => (
            <div key={projet.id} className="bg-card border border-border rounded-lg overflow-hidden group">
              {projet.projets_visuels?.[0] && (
                <img
                  src={projet.projets_visuels[0].url_image}
                  alt={projet.titre}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-foreground">{projet.titre}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(projet)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(projet.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{projet.type_projet?.replace('_', ' ')}</p>
                {projet.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{projet.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le projet' : 'Nouveau projet'}</DialogTitle>
          </DialogHeader>
          <ProjetForm
            clientId={clientId}
            projet={editing}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditing(null) }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer ce projet ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
