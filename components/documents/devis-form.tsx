'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LignesEditor } from '@/components/documents/lignes-editor'
import { Separator } from '@/components/ui/separator'
import type { Client, DevisAvecLignes, LigneDocument } from '@/lib/types'
import { today, addDays } from '@/lib/format'

type DevisFormProps = {
  devis?: DevisAvecLignes | null
  clients: Client[]
  onSubmit: (data: DevisFormData) => Promise<void>
  onCancel: () => void
}

export type DevisFormData = {
  numero: string
  client_id: string
  date_creation: string
  date_validite: string
  statut: string
  notes: string
  total_ht: number
  total_tva: number
  total_ttc: number
  lignes: LigneDocument[]
}

const genererNumero = async (): Promise<string> => {
  const supabase = createClient()
  const annee = new Date().getFullYear()
  const { count } = await supabase
    .from('devis')
    .select('*', { count: 'exact', head: true })
  const num = String((count ?? 0) + 1).padStart(3, '0')
  return `${annee}-${num}`
}

export function DevisForm({ devis, clients, onSubmit, onCancel }: DevisFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{
    numero: string
    client_id: string
    date_creation: string
    date_validite: string
    statut: string
    notes: string
  }>({
    numero: devis?.numero ?? '',
    client_id: devis?.client_id ?? '',
    date_creation: devis?.date_creation ?? today(),
    date_validite: devis?.date_validite ?? addDays(today(), 30),
    statut: devis?.statut ?? 'brouillon',
    notes: devis?.notes ?? '',
  })
  const [lignes, setLignes] = useState<LigneDocument[]>(
    devis?.devis_lignes ?? []
  )

  // Génère le numéro automatiquement uniquement pour un nouveau devis
  useEffect(() => {
    if (!devis) {
      genererNumero().then((numero) => {
        setForm((p) => ({ ...p, numero }))
      })
    }
  }, [devis])

  const totalHT = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire, 0)
  const totalTVA = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire * (l.tva_taux / 100), 0)
  const totalTTC = totalHT + totalTVA

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...form,
        total_ht: totalHT,
        total_tva: totalTVA,
        total_ttc: totalTTC,
        lignes,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="numero">Numéro de devis *</Label>
          <Input id="numero" value={form.numero} onChange={set('numero')} required placeholder="2026-001" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="client">Client *</Label>
          <Select
            value={form.client_id}
            onValueChange={(v: string | null) => setForm((p) => ({ ...p, client_id: v ?? '' }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date_creation">Date de création</Label>
          <Input id="date_creation" type="date" value={form.date_creation} onChange={set('date_creation')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date_validite">Date de validité</Label>
          <Input id="date_validite" type="date" value={form.date_validite} onChange={set('date_validite')} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="statut">Statut</Label>
          <Select value={form.statut} onValueChange={(v: string | null) => setForm((p) => ({ ...p, statut: v ?? p.statut }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brouillon">Brouillon</SelectItem>
              <SelectItem value="envoyé">Envoyé</SelectItem>
              <SelectItem value="accepté">Accepté</SelectItem>
              <SelectItem value="refusé">Refusé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Lignes du devis</Label>
        <LignesEditor lignes={lignes} onChange={setLignes} />
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Conditions de paiement, remarques..." />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : devis ? 'Modifier le devis' : 'Créer le devis'}
        </Button>
      </div>
    </form>
  )
}