'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DevisForm, type DevisFormData } from '@/components/documents/devis-form'
import { DevisStatutBadge } from '@/components/documents/statut-badge'
import type { Client, Devis, DevisAvecLignes } from '@/lib/types'
import { Plus, Pencil, Trash2, FileText, Download, ArrowRightLeft } from 'lucide-react'
import { formatEur, formatDate } from '@/lib/format'

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

const exportDevisPDF = async (devis: Devis, supabase: ReturnType<typeof createClient>) => {
  const jsPDF = (await import('jspdf')).default
  const { data: full } = await supabase.from('devis').select('*, devis_lignes(*), clients(*)').eq('id', devis.id).single()
  if (!full) return
  const doc = new jsPDF()
  const client = (full as { clients?: { nom?: string; email?: string; adresse?: string; telephone?: string } }).clients
  const lignes = (full as { devis_lignes?: { designation?: string; quantite?: number; prix_unitaire_ht?: number; tva?: number }[] }).devis_lignes ?? []

  // LOGO
  const logoData = await loadLogoBase64()
  if (logoData) doc.addImage(logoData, 'PNG', 14, 10, 22, 22)

  // HEADER
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
  doc.text('PROPULSIF', 40, 18)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
  doc.text('Mathys DENAUX', 40, 24)
  doc.text('76 rue des cétoines, 34090 Montpellier', 40, 29)
  doc.text('agence.propulsif@gmail.com  |  06 75 29 81 06', 40, 34)
  doc.text('SIREN : 103 651 733', 40, 39)

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(0)
  doc.text(`DEVIS N° ${devis.numero}`, 196, 18, { align: 'right' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
  doc.text(`Date : ${formatDate(devis.date_creation)}`, 196, 25, { align: 'right' })
  doc.text(`Validité : ${formatDate(devis.date_validite)}`, 196, 30, { align: 'right' })

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
  ;[['Total HT', formatEur(devis.total_ht)], ['TVA', formatEur(devis.total_tva)], ['Total TTC', formatEur(devis.total_ttc)]].forEach(([label, val], i) => {
    if (i === 2) { doc.setFillColor(40, 40, 40); doc.rect(130, y - 5, 66, 8, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold') }
    else { doc.setTextColor(60); doc.setFont('helvetica', 'normal') }
    doc.setFontSize(9); doc.text(label, 132, y); doc.text(val, 194, y, { align: 'right' }); y += 9
  })

  // FOOTER
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(140)
  doc.text('Micro-entrepreneur — TVA non applicable, article 293 B du CGI', 105, 285, { align: 'center' })
  doc.save(`Devis_${devis.numero}.pdf`)
}

const convertirEnFacture = async (devis: Devis, supabase: ReturnType<typeof createClient>, onSuccess: () => void) => {
  const { data: full } = await supabase.from('devis').select('*, devis_lignes(*)').eq('id', devis.id).single()
  if (!full) return
  const { count } = await supabase.from('factures').select('*', { count: 'exact', head: true })
  const annee = new Date().getFullYear()
  const numero = `${annee}-${String((count ?? 0) + 1).padStart(3, '0')}`
  const dateEcheance = new Date(); dateEcheance.setDate(dateEcheance.getDate() + 30)
  const { data: newFacture } = await supabase.from('factures').insert({
    numero, client_id: full.client_id,
    date_creation: new Date().toISOString().split('T')[0],
    date_echeance: dateEcheance.toISOString().split('T')[0],
    statut: 'non_payee', notes: full.notes,
    total_ht: full.total_ht, total_tva: full.total_tva, total_ttc: full.total_ttc,
  }).select().single()
  if (newFacture && full.devis_lignes?.length > 0) {
    await supabase.from('factures_lignes').insert(
      full.devis_lignes.map((l: { designation: string; quantite: number; prix_unitaire_ht: number; tva: number }, i: number) => ({
        facture_id: newFacture.id, designation: l.designation, quantite: l.quantite,
        prix_unitaire_ht: l.prix_unitaire_ht, tva: l.tva, ordre: i,
      }))
    )
  }
  await supabase.from('devis').update({ statut: 'accepte' }).eq('id', devis.id)
  alert(`✅ Facture ${numero} créée ! Rendez-vous dans l'onglet Factures.`)
  onSuccess()
}

export default function DevisPage() {
  const supabase = createClient()
  const [devisList, setDevisList] = useState<Devis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DevisAvecLignes | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchDevis = async () => {
    const { data } = await supabase.from('devis').select('*, clients(id, nom, email)').order('created_at', { ascending: false })
    setDevisList((data as Devis[]) ?? [])
  }
  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('*').order('nom')
    setClients(data ?? [])
  }
  useEffect(() => { Promise.all([fetchDevis(), fetchClients()]).then(() => setLoading(false)) }, [])

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = async (devis: Devis) => {
    const { data } = await supabase.from('devis').select('*, devis_lignes(*), clients(id, nom, email)').eq('id', devis.id).single()
    if (data) {
      const sorted = { ...data, devis_lignes: (data.devis_lignes ?? []).sort((a: { ordre: number }, b: { ordre: number }) => a.ordre - b.ordre) }
      setEditing(sorted as DevisAvecLignes)
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (formData: DevisFormData) => {
    const { lignes, ...devisData } = formData
    if (editing) {
      await supabase.from('devis').update({ numero: devisData.numero, client_id: devisData.client_id || null, date_creation: devisData.date_creation, date_validite: devisData.date_validite, statut: devisData.statut, notes: devisData.notes, total_ht: devisData.total_ht, total_tva: devisData.total_tva, total_ttc: devisData.total_ttc }).eq('id', editing.id)
      await supabase.from('devis_lignes').delete().eq('devis_id', editing.id)
      if (lignes.length > 0) await supabase.from('devis_lignes').insert(lignes.map((l, i) => ({ ...l, devis_id: editing.id, ordre: i })))
    } else {
      const { data: newDevis } = await supabase.from('devis').insert({ numero: devisData.numero, client_id: devisData.client_id || null, date_creation: devisData.date_creation, date_validite: devisData.date_validite, statut: devisData.statut, notes: devisData.notes, total_ht: devisData.total_ht, total_tva: devisData.total_tva, total_ttc: devisData.total_ttc }).select().single()
      if (newDevis && lignes.length > 0) await supabase.from('devis_lignes').insert(lignes.map((l, i) => ({ ...l, devis_id: newDevis.id, ordre: i })))
    }
    setDialogOpen(false); setEditing(null); await fetchDevis()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('devis_lignes').delete().eq('devis_id', id)
    await supabase.from('devis').delete().eq('id', id)
    setDeleteConfirm(null); await fetchDevis()
  }

  const ActionButtons = ({ devis }: { devis: Devis }) => (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" title="Convertir en facture" onClick={() => convertirEnFacture(devis, supabase, fetchDevis)}>
        <ArrowRightLeft className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" title="Exporter PDF" onClick={() => exportDevisPDF(devis, supabase)}>
        <Download className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(devis)}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(devis.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Devis</h1>
            <p className="text-sm text-muted-foreground">{devisList.length} devis</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau devis
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Chargement...</div>
      ) : devisList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <FileText className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Aucun devis pour le moment</p>
          <Button variant="outline" size="sm" onClick={openCreate} className="mt-2 gap-2"><Plus className="w-4 h-4" /> Créer un devis</Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-medium">Numéro</TableHead>
                  <TableHead className="font-medium">Client</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Validité</TableHead>
                  <TableHead className="font-medium">Statut</TableHead>
                  <TableHead className="font-medium text-right">Total TTC</TableHead>
                  <TableHead className="w-36"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devisList.map((devis) => (
                  <TableRow key={devis.id}>
                    <TableCell className="font-medium font-mono text-sm">{devis.numero}</TableCell>
                    <TableCell>{(devis as Devis & { clients?: { nom: string } }).clients?.nom ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(devis.date_creation)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(devis.date_validite)}</TableCell>
                    <TableCell><DevisStatutBadge statut={devis.statut} /></TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatEur(devis.total_ttc)}</TableCell>
                    <TableCell><ActionButtons devis={devis} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {devisList.map((devis) => (
              <div key={devis.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-medium text-sm">{devis.numero}</p>
                    <p className="text-sm text-muted-foreground">{(devis as Devis & { clients?: { nom: string } }).clients?.nom ?? '—'}</p>
                  </div>
                  <DevisStatutBadge statut={devis.statut} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Créé le {formatDate(devis.date_creation)}</span>
                  <span className="font-semibold text-foreground text-sm">{formatEur(devis.total_ttc)}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <ActionButtons devis={devis} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null) }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Modifier le devis' : 'Nouveau devis'}</DialogTitle></DialogHeader>
          <DevisForm devis={editing} clients={clients} onSubmit={handleSubmit} onCancel={() => { setDialogOpen(false); setEditing(null) }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer ce devis ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Le devis et ses lignes seront définitivement supprimés.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}