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
import type { Client, FactureAvecLignes, LigneDocument } from '@/lib/types'
import { today, addDays } from '@/lib/format'

type FactureFormProps = {
  facture?: FactureAvecLignes | null
  clients: Client[]
  onSubmit: (data: FactureFormData) => Promise<void>
  onCancel: () => void
}

export type FactureFormData = {
  numero: string
  client_id: string
  date_creation: string
  date_echeance: string
  statut: string
  notes: string
  total_ht: number
  total_tva: number
  total_ttc: number
  lignes: LigneDocument[]
  moyens_paiement: MoyenPaiement[]
  paiement_autre: string
}

export type MoyenPaiement = 'virement' | 'cheque' | 'especes' | 'carte' | 'autre'

const IBAN = 'FR76 4061 8805 0900 0408 2738'

const genererNumero = async (): Promise<string> => {
  const supabase = createClient()
  const annee = new Date().getFullYear()
  const { count } = await supabase
    .from('factures')
    .select('*', { count: 'exact', head: true })
  const num = String((count ?? 0) + 1).padStart(3, '0')
  return `${annee}-${num}`
}

export function FactureForm({ facture, clients, onSubmit, onCancel }: FactureFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{
    numero: string
    client_id: string
    date_creation: string
    date_echeance: string
    statut: string
    notes: string
  }>({
    numero: facture?.numero ?? '',
    client_id: facture?.client_id ?? '',
    date_creation: facture?.date_creation ?? today(),
    date_echeance: facture?.date_echeance ?? addDays(today(), 30),
    statut: facture?.statut ?? 'non_payée',
    notes: facture?.notes ?? '',
  })
  const [lignes, setLignes] = useState<LigneDocument[]>(
    facture?.factures_lignes ?? []
  )
  const [moyensPaiement, setMoyensPaiement] = useState<MoyenPaiement[]>(['virement'])
  const [paiementAutre, setPaiementAutre] = useState('')

  useEffect(() => {
    if (!facture) {
      genererNumero().then((numero) => {
        setForm((p) => ({ ...p, numero }))
      })
    }
  }, [facture])

  const toggleMoyen = (moyen: MoyenPaiement) => {
    setMoyensPaiement((prev) =>
      prev.includes(moyen) ? prev.filter((m) => m !== moyen) : [...prev, moyen]
    )
  }

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
        moyens_paiement: moyensPaiement,
        paiement_autre: paiementAutre,
      })
    } finally {
      setLoading(false)
    }
  }

  const moyensOptions: { id: MoyenPaiement; label: string; detail?: string }[] = [
    { id: 'virement', label: 'Virement bancaire', detail: `IBAN : ${IBAN}` },
    { id: 'cheque', label: 'Chèque', detail: 'À l\'ordre de Mathys DENAUX' },
    { id: 'especes', label: 'Espèces' },
    { id: 'carte', label: 'Carte bancaire' },
    { id: 'autre', label: 'Autre' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="numero">Numéro de facture *</Label>
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
          <Label htmlFor="date_creation">Date d&apos;émission</Label>
          <Input id="date_creation" type="date" value={form.date_creation} onChange={set('date_creation')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date_echeance">Date d&apos;échéance</Label>
          <Input id="date_echeance" type="date" value={form.date_echeance} onChange={set('date_echeance')} />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="statut">Statut</Label>
          <Select value={form.statut} onValueChange={(v: string | null) => setForm((p) => ({ ...p, statut: v ?? p.statut }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non_payée">Non payée</SelectItem>
              <SelectItem value="payée">Payée</SelectItem>
              <SelectItem value="en_retard">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Lignes de la facture</Label>
        <LignesEditor lignes={lignes} onChange={setLignes} />
      </div>

      <Separator />

      {/* MOYENS DE PAIEMENT */}
      <div className="space-y-3">
        <Label>Moyens de paiement</Label>
        <div className="space-y-2">
          {moyensOptions.map((moyen) => (
            <div key={moyen.id}>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={moyensPaiement.includes(moyen.id)}
                  onChange={() => toggleMoyen(moyen.id)}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">{moyen.label}</span>
                  {moyen.detail && moyensPaiement.includes(moyen.id) && (
                    <p className="text-xs text-muted-foreground mt-0.5">{moyen.detail}</p>
                  )}
                </div>
              </label>
              {moyen.id === 'autre' && moyensPaiement.includes('autre') && (
                <Input
                  className="mt-2 ml-7"
                  placeholder="Précisez le moyen de paiement..."
                  value={paiementAutre}
                  onChange={(e) => setPaiementAutre(e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={form.notes} onChange={set('notes')} rows={2} placeholder="Remarques, informations complémentaires..." />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : facture ? 'Modifier la facture' : 'Créer la facture'}
        </Button>
      </div>
    </form>
  )
}