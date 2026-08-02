'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Projet, TypeProjet } from '@/lib/types'

const typeOptions: { value: TypeProjet; label: string }[] = [
  { value: 'logo', label: 'Logo' },
  { value: 'reseaux_sociaux', label: 'Réseaux sociaux' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'site_web', label: 'Site web' },
  { value: 'autre', label: 'Autre' },
]

export function ProjetForm({
  clientId,
  projet,
  onSubmit,
  onCancel,
}: {
  clientId: string
  projet: Projet | null
  onSubmit: (data: Partial<Projet>, files: File[]) => Promise<void>
  onCancel: () => void
}) {
  const [titre, setTitre] = useState(projet?.titre ?? '')
  const [description, setDescription] = useState(projet?.description ?? '')
  const [typeProjet, setTypeProjet] = useState<TypeProjet>(projet?.type_projet ?? 'autre')
  const [dateRealisation, setDateRealisation] = useState(projet?.date_realisation ?? '')
  const [notes, setNotes] = useState(projet?.notes ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(
      {
        client_id: clientId,
        titre,
        description: description || null,
        type_projet: typeProjet,
        date_realisation: dateRealisation || null,
        notes: notes || null,
      },
      files
    )
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="titre">Titre</Label>
        <Input id="titre" value={titre} onChange={(e) => setTitre(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type de projet</Label>
          <Select value={typeProjet} onValueChange={(v) => setTypeProjet(v as TypeProjet)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date de réalisation</Label>
          <Input id="date" type="date" value={dateRealisation} onChange={(e) => setDateRealisation(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Visuels</Label>
        <Input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement...' : projet ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
