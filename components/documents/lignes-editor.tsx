'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LigneDocument } from '@/lib/types'
import { Plus, Trash2 } from 'lucide-react'
import { formatEur } from '@/lib/format'

const TVA_OPTIONS = [0, 5.5, 10, 20]

type LignesEditorProps = {
  lignes: LigneDocument[]
  onChange: (lignes: LigneDocument[]) => void
}

export function LignesEditor({ lignes, onChange }: LignesEditorProps) {
  const updateLigne = (index: number, field: keyof LigneDocument, value: string | number) => {
    const updated = lignes.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    )
    onChange(updated)
  }

  const addLigne = () => {
    onChange([
      ...lignes,
      { designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 20, ordre: lignes.length },
    ])
  }

  const removeLigne = (index: number) => {
    onChange(lignes.filter((_, i) => i !== index).map((l, i) => ({ ...l, ordre: i })))
  }

  const totalHT = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire, 0)
  const totalTVA = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire * (l.tva_taux / 100), 0)
  const totalTTC = totalHT + totalTVA

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_100px_90px_100px_36px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Désignation</span>
          <span>Qté</span>
          <span>Prix unit. HT</span>
          <span>TVA</span>
          <span className="text-right">Total HT</span>
          <span></span>
        </div>

        {/* Lines */}
        {lignes.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune ligne — cliquez sur &quot;Ajouter une ligne&quot;
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lignes.map((ligne, index) => {
              const lineTotal = ligne.quantite * ligne.prix_unitaire
              return (
                <div key={index} className="grid grid-cols-[1fr_80px_100px_90px_100px_36px] gap-2 px-3 py-2 items-center">
                  <Input
                    value={ligne.designation}
                    onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                    placeholder="Description de la prestation"
                    className="h-8 text-sm"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm text-right"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ligne.prix_unitaire}
                    onChange={(e) => updateLigne(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm text-right"
                  />
                  <Select
                    value={String(ligne.tva_taux)}
                    onValueChange={(v: string | null) => updateLigne(index, 'tva_taux', parseFloat(v ?? '20'))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TVA_OPTIONS.map((t) => (
                        <SelectItem key={t} value={String(t)}>{t} %</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-right text-sm font-medium tabular-nums">{formatEur(lineTotal)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLigne(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addLigne} className="gap-2">
        <Plus className="w-4 h-4" />
        Ajouter une ligne
      </Button>

      {/* Totals */}
      {lignes.length > 0 && (
        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 rounded-md border border-border p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total HT</span>
              <span className="tabular-nums font-medium text-foreground">{formatEur(totalHT)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Total TVA</span>
              <span className="tabular-nums font-medium text-foreground">{formatEur(totalTVA)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1.5">
              <span>Total TTC</span>
              <span className="tabular-nums">{formatEur(totalTTC)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
