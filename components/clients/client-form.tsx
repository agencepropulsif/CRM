'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Client } from '@/lib/types'

type ClientFormProps = {
  client?: Client | null
  onSubmit: (data: Partial<Client>) => Promise<void>
  onCancel: () => void
}

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: client?.nom ?? '',
    email: client?.email ?? '',
    telephone: client?.telephone ?? '',
    adresse: client?.adresse ?? '',
    ville: client?.ville ?? '',
    code_postal: client?.code_postal ?? '',
    siret: client?.siret ?? '',
    notes: client?.notes ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(form)
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="nom">Nom / Raison sociale *</Label>
          <Input id="nom" value={form.nom} onChange={set('nom')} required placeholder="Nom de l'entreprise ou du contact" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="contact@example.com" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input id="telephone" value={form.telephone} onChange={set('telephone')} placeholder="01 23 45 67 89" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" value={form.adresse} onChange={set('adresse')} placeholder="12 rue de la Paix" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ville">Ville</Label>
          <Input id="ville" value={form.ville} onChange={set('ville')} placeholder="Paris" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="code_postal">Code postal</Label>
          <Input id="code_postal" value={form.code_postal} onChange={set('code_postal')} placeholder="75001" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="siret">SIRET</Label>
          <Input id="siret" value={form.siret} onChange={set('siret')} placeholder="123 456 789 00010" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={form.notes} onChange={set('notes')} rows={3} placeholder="Informations complémentaires..." />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : client ? 'Modifier' : 'Créer le client'}
        </Button>
      </div>
    </form>
  )
}
