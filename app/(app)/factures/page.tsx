'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FactureForm, type FactureFormData, type MoyenPaiement } from '@/components/documents/facture-form'
import { FactureStatutBadge } from '@/components/documents/statut-badge'
import type { Client, Facture, FactureAvecLignes } from '@/lib/types'
import { Plus, Pencil, Trash2, Receipt, Download } from 'lucide-react'
import { formatEur, formatDate } from '@/lib/format'

const IBAN = 'FR76 4061 8805 0900 0408 2738'

const loadLogoBase64 = async (): Promise<string | null> => {
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const exportFacturePDF = async (facture: Facture, supabase: ReturnType<typeof createClient>, moyensPaiement: MoyenPaiement[] = ['virement'], paiementAutre = '') => {
  const jsPDF = (await import('jspdf')).default
  const { data: full } = await supabase.from('factures').select('*, factures_lignes(*), clients(*)').eq('id', facture.id).single()
  if (!full) return
  const doc = new jsPDF()
  const client = (full as { clients?: { nom?: string; email?: string; adresse?: string; telephone?: string } }).clients
  const lignes = (full as { factures_lignes?: { designation?: string; quantite?: number; prix_unitaire_ht?: number; tva?: number }[] }).factures_lignes ?? []

  // LOGO
  const logoData = await loadLogoBase64()
  if (logoData) doc.addImage(logoData, 'PNG', 14, 16, 22, 22)

  // HEADER
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
  doc.text('PROPULSIF', 40, 18)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
  doc.text('Mathys DENAUX', 40, 24)
  doc.text('76 rue des cétoines, 34090 Montpellier', 40, 29)
  doc.text('agence.propulsif@gmail.com  |  06 75 29 81 06', 40, 34)
  doc.text('SIREN : 103 651 733', 40, 39)

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
  doc.text(`FACTURE N° ${facture.numero}`, 196, 18, { align: 'right' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
  doc.text(`Date : ${formatDate(facture.date_creation)}`, 196, 25, { align: 'right' })
  doc.text(`Échéance : ${formatDate(facture.date_echeance)}`, 196, 30, { align: 'right' })

  doc.setDrawColor(220); doc.line(14, 46, 196, 46)

  // CLIENT
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(0); doc.text('CLIENT', 14, 56)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(60)
  doc.text(client?.nom ?? '—', 14, 63)
  if (client?.email) doc.text(client.email, 14, 68)
  if (client?.adresse) doc.text(client.adresse, 14, 73)
  if (client?.telephone) doc.text(client.telephone, 14, 78)

  // TABLEAU
  const tableTop = 90; const colX = [14, 90, 120, 145, 170]
  doc.setFillColor(40, 40, 40); doc.rect(14, tableTop - 6, 182, 8, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255)
  ;['Désignation', 'Qté', 'Prix HT', 'TVA %', 'Montant HT'].forEach((h, i) => doc.text(h, colX[i], tableTop - 0.5))
  doc.setFont('helvetica', 'normal'); doc.setTextColor(30)
  let y = tableTop + 6
  lignes.forEach((l, idx) => {
    if (idx % 2 === 0) { doc.setFillColor(248, 248, 248); doc.rect(14, y - 5, 182, 7, 'F') }
    const ht = (l.quantite ?? 0) * (l.prix_unitaire_ht ?? 0)
    doc.text(l.designation ?? '', colX[0], y); doc.text(String(l.quantite ?? ''), colX[1], y)
    doc.text(formatEur(l.prix_unitaire_ht ?? 0), colX[2], y); doc.text(`${l.tva ?? 0} %`, colX[3], y)
    doc.text(formatEur(ht), colX[4], y); y += 8
  })
  doc.setDrawColor(200); doc.line(14, y, 196, y); y += 8

  // TOTAUX
  ;[['Total HT', formatEur(facture.total_ht)], ['TVA', formatEur(facture.total_tva)], ['Total TTC', formatEur(facture.total_ttc)]].forEach(([label, val], i) => {
    if (i === 2) { doc.setFillColor(40, 40, 40); doc.rect(130, y - 5, 66, 8, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold') }
    else { doc.setTextColor(60); doc.setFont('helvetica', 'normal') }
    doc.setFontSize(9); doc.text(label, 132, y); doc.text(val, 194, y, { align: 'right' }); y += 9
  })

  // MOYENS DE PAIEMENT
  if (moyensPaiement.length > 0) {
    y += 6; doc.setDrawColor(220); doc.line(14, y, 196, y); y += 6
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0); doc.text('MODALITÉS DE PAIEMENT', 14, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60)
    if (moyensPaiement.includes('virement')) { doc.text(`Virement bancaire — IBAN : ${IBAN}`, 14, y); y += 5 }
    if (moyensPaiement.includes('cheque')) { doc.text("Chèque — À l'ordre de Mathys DENAUX", 14, y); y += 5 }
    if (moyensPaiement.includes('especes')) { doc.text('Espèces', 14, y); y += 5 }
    if (moyensPaiement.includes('carte')) { doc.text('Carte bancaire', 14, y); y += 5 }
    if (moyensPaiement.includes('autre') && paiementAutre) { doc.text(paiementAutre, 14, y); y += 5 }
  }

  // FOOTER
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(140)
  doc.text('Micro-entrepreneur — TVA non applicable, article 293 B du CGI', 105, 285, { align: 'center' })
  doc.save(`Facture_${facture.numero}.pdf`)
}

export default function FacturesPage() {
  const supabase = createClient()
  const [facturesList, setFacturesList] = useState<Facture[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FactureAvecLignes | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [pdfMoyens, setPdfMoyens] = useState<Record<string, { moyens: MoyenPaiement[]; autre: string }>>({})

  const fetchFactures = async () => {
    const { data } = await supabase.from('factures').select('*, clients(id, nom, email)').order('created_at', { ascending: false })
    setFacturesList((data as Facture[]) ?? [])
  }
  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('nom')
    setClients(data ?? [])
  }
  useEffect(() => { Promise.all([fetchFactures(), fetchClients()]).then(() => setLoading(false)) }, [])

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = async (facture: Facture) => {
    const { data } = await supabase.from('factures').select('*, factures_lignes(*), clients(id, nom, email)').eq('id', facture.id).single()
    if (data) {
      const sorted = { ...data, factures_lignes: (data.factures_lignes ?? []).sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre) }
      setEditing(sorted as FactureAvecLignes)
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (formData: FactureFormData) => {
    const { lignes, moyens_paiement, paiement_autre, ...factureData } = formData
    if (editing) {
      await supabase.from('factures').update({ numero: factureData.numero, client_id: factureData.client_id || null, date_creation: factureData.date_creation, date_echeance: factureData.date_echeance, statut: factureData.statut, notes: factureData.notes, total_ht: factureData.total_ht, total_tva: factureData.total_tva, total_ttc: factureData.total_ttc }).eq('id', editing.id)
      await supabase.from('factures_lignes').delete().eq('facture_id', editing.id)
      if (lignes.length > 0) await supabase.from('factures_lignes').insert(lignes.map((l, i) => ({ ...l, facture_id: editing.id, ordre: i })))
      setPdfMoyens((p) => ({ ...p, [editing.id]: { moyens: moyens_paiement, autre: paiement_autre } }))
    } else {
      const { data: newFacture } = await supabase.from('factures').insert({ numero: factureData.numero, client_id: factureData.client_id || null, date_creation: factureData.date_creation, date_echeance: factureData.date_echeance, statut: factureData.statut, notes: factureData.notes, total_ht: factureData.total_ht, total_tva: factureData.total_tva, total_ttc: factureData.total_ttc }).select().single()
      if (newFacture && lignes.length > 0) await supabase.from('factures_lignes').insert(lignes.map((l, i) => ({ ...l, facture_id: newFacture.id, ordre: i })))
      if (newFacture) setPdfMoyens((p) => ({ ...p, [newFacture.id]: { moyens: moyens_paiement, autre: paiement_autre } }))
    }
    setDialogOpen(false); setEditing(null); await fetchFactures()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('factures_lignes').delete().eq('facture_id', id)
    await supabase.from('factures').delete().eq('id', id)
    setDeleteConfirm(null); await fetchFactures()
  }

  const ActionButtons = ({ facture }: { facture: Facture }) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Exporter PDF"
        onClick={() => exportFacturePDF(facture, supabase, pdfMoyens[facture.id]?.moyens ?? ['virement'], pdfMoyens[facture.id]?.autre ?? '')}>
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(facture)}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(facture.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Factures</h1>
            <p className="text-sm text-muted-foreground">{facturesList.length} facture{facturesList.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Chargement...</div>
      ) : facturesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Receipt className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Aucune facture pour le moment</p>
          <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-2"><Plus className="w-4 h-4" /> Créer une facture</Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium">Numéro</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Émission</TableHead>
                  <TableHead className="font-medium">Échéance</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium text-right">Total TTC</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturesList.map((facture) => (
                  <TableRow key={facture.id}>
                    <TableCell className="font-medium font-mono text-sm">{facture.numero}</TableCell>
                    <TableCell>{(facture as Facture & { clients?: { nom: string } }).clients?.nom ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(facture.date_creation)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(facture.date_echeance)}</TableCell>
                    <TableCell><FactureStatutBadge statut={facture.statut} /></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatEur(facture.total_ttc)}</TableCell>
                    <TableCell><ActionButtons facture={facture} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {facturesList.map((facture) => (
              <div key={facture.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-medium text-sm">{facture.numero}</p>
                    <p className="text-sm text-muted-foreground">{(facture as Facture & { clients?: { nom: string } }).clients?.nom ?? '—'}</p>
                  </div>
                  <FactureStatutBadge statut={facture.statut} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Échéance {formatDate(facture.date_echeance)}</span>
                  <span className="font-semibold text-foreground text-sm">{formatEur(facture.total_ttc)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <ActionButtons facture={facture} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle></DialogHeader>
          <FactureForm facture={editing} clients={clients} onSubmit={handleSubmit} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer cette facture ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. La facture et ses lignes seront définitivement supprimées.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}