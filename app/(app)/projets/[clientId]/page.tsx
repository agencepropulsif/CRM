'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProjetForm } from '@/components/projets/projet-form'
import type { Client, ProjetAvecVisuels, Projet } from '@/lib/types'
import { Plus, Pencil, Trash2, ArrowLeft, ImageIcon, X, Grid3x3, List, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'titre' | 'date_realisation' | 'type_projet'
type SortDir = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

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

  // Lightbox : on stocke la liste d'images du projet ouvert + l'index affiché
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const [sortKey, setSortKey] = useState<SortKey>('date_realisation')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const fetchData = async () => {
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single()
    setClient(clientData)

    const { data: projetsData } = await supabase
      .from('projets')
      .select('*, projets_visuels(*)')
      .eq('client_id', clientId)

    setProjets(projetsData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  const sortedProjets = useMemo(() => {
    const copy = [...projets]
    copy.sort((a, b) => {
      let valA: string = ''
      let valB: string = ''
      if (sortKey === 'titre') {
        valA = a.titre?.toLowerCase() ?? ''
        valB = b.titre?.toLowerCase() ?? ''
      } else if (sortKey === 'type_projet') {
        valA = a.type_projet ?? ''
        valB = b.type_projet ?? ''
      } else {
        valA = a.date_realisation ?? ''
        valB = b.date_realisation ?? ''
      }
      const cmp = valA.localeCompare(valB)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [projets, sortKey, sortDir])

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

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

  const openLightbox = (urls: string[], startIndex: number) => {
    setLightboxImages(urls)
    setLightboxIndex(startIndex)
  }

  const closeLightbox = () => {
    setLightboxImages(null)
    setLightboxIndex(0)
  }

  const nextImage = () => {
    if (!lightboxImages) return
    setLightboxIndex((i) => (i + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    if (!lightboxImages) return
    setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)
  }

  return (
    <div className="space-y-4">
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

      {/* ===== BARRE D'OUTILS FINDER ===== */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Trier par</span>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="titre">Nom</SelectItem>
              <SelectItem value="date_realisation">Date</SelectItem>
              <SelectItem value="type_projet">Type</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSortDir}>
            <ArrowUpDown className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 rounded-md p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Chargement...
        </div>
      ) : sortedProjets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 bg-card border border-border rounded-lg">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Aucun projet pour ce client</p>
          <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-2">
            <Plus className="w-4 h-4" /> Ajouter un projet
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ===== VUE GRILLE ===== */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sortedProjets.map((projet) => {
            const visuels = projet.projets_visuels ?? []
            const urls = visuels.map((v) => v.url_image)
            return (
              <div key={projet.id} className="bg-card border border-border rounded-lg overflow-hidden group">
                {visuels.length > 0 ? (
                  <button
                    onClick={() => openLightbox(urls, 0)}
                    className="relative w-full aspect-square block"
                  >
                    <img
                      src={visuels[0].url_image}
                      alt={projet.titre}
                      className="w-full h-full object-cover"
                    />
                    {visuels.length > 1 && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                        +{visuels.length - 1}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-muted/30">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-2 space-y-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium text-foreground truncate">{projet.titre}</p>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(projet)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirm(projet.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground capitalize truncate">{projet.type_projet?.replace('_', ' ')}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ===== VUE LISTE (façon Finder) ===== */
        <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
          <div className="flex items-center px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
            <div className="w-12" />
            <div className="flex-1">Nom</div>
            <div className="w-32">Type</div>
            <div className="w-28">Date</div>
            <div className="w-16" />
          </div>
          {sortedProjets.map((projet) => {
            const visuels = projet.projets_visuels ?? []
            const urls = visuels.map((v) => v.url_image)
            return (
              <div key={projet.id} className="flex items-center px-4 py-2 hover:bg-muted/30 group transition-colors">
                <div className="w-12">
                  {visuels.length > 0 ? (
                    <button onClick={() => openLightbox(urls, 0)} className="relative block">
                      <img
                        src={visuels[0].url_image}
                        alt={projet.titre}
                        className="w-8 h-8 rounded object-cover"
                      />
                      {visuels.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-black/70 text-white text-[9px] font-medium px-1 rounded-full">
                          +{visuels.length - 1}
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm font-medium text-foreground truncate">{projet.titre}</div>
                <div className="w-32 text-xs text-muted-foreground capitalize truncate">{projet.type_projet?.replace('_', ' ')}</div>
                <div className="w-28 text-xs text-muted-foreground">{projet.date_realisation ?? '—'}</div>
                <div className="w-16 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            )
          })}
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

      {/* Lightbox plein écran avec navigation entre plusieurs images */}
      {lightboxImages && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>

          {lightboxImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); prevImage() }}
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          <img
            src={lightboxImages[lightboxIndex]}
            alt="Aperçu"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              onClick={(e) => { e.stopPropagation(); nextImage() }}
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
