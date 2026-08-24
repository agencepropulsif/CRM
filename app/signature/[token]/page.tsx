'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { formatEur, formatDate } from '@/lib/format'
import { CheckCircle2, FileText } from 'lucide-react'

export default function SignaturePage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [devis, setDevis] = useState<any>(null)
  const [signature, setSignature] = useState<any>(null)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: sig } = await supabase
        .from('devis_signatures')
        .select('*')
        .eq('token', token)
        .maybeSingle()

      if (!sig) { setLoading(false); return }
      setSignature(sig)

      const { data: devisData } = await supabase
        .from('devis')
        .select('*, devis_lignes(*), clients(nom, email, adresse)')
        .eq('id', sig.devis_id)
        .single()

      setDevis(devisData)
      setLoading(false)
    }
    load()
  }, [token])

  const handleSign = async () => {
    setSigning(true)
    const res = await fetch('/api/devis/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) {
      setSignature((p: any) => ({ ...p, statut: 'signé' }))
    } else {
      alert("Une erreur est survenue, réessayez.")
    }
    setSigning(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>
  }

  if (!devis || !signature) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Ce lien de signature n&apos;est plus valide.</p>
          <p className="text-xs text-muted-foreground/60 break-all">Token reçu : {token || '(vide)'}</p>
          <p className="text-xs text-muted-foreground/60">Signature trouvée : {signature ? 'oui' : 'non'}</p>
          <p className="text-xs text-muted-foreground/60">Devis trouvé : {devis ? 'oui' : 'non'}</p>
        </div>
      </div>
    )
  }

  const client = devis.clients

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">PROPULSIF</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Devis n° {devis.numero}</h1>
            <p className="text-sm text-slate-500">Date : {formatDate(devis.date_creation)} · Validité : {formatDate(devis.date_validite)}</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-400 uppercase mb-1">Client</p>
            <p className="text-sm text-slate-800">{client?.nom}</p>
            {client?.email && <p className="text-sm text-slate-500">{client.email}</p>}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="pb-2">Désignation</th>
                  <th className="pb-2 text-right">Qté</th>
                  <th className="pb-2 text-right">Prix HT</th>
                  <th className="pb-2 text-right">Montant HT</th>
                </tr>
              </thead>
              <tbody>
                {(devis.devis_lignes ?? []).map((l: any) => (
                  <tr key={l.id} className="border-t border-slate-50">
                    <td className="py-2 text-slate-800">{l.designation}</td>
                    <td className="py-2 text-right text-slate-600">{l.quantite}</td>
                    <td className="py-2 text-right text-slate-600">{formatEur(l.prix_unitaire)}</td>
                    <td className="py-2 text-right text-slate-800">{formatEur(l.quantite * l.prix_unitaire)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500"><span>Total HT</span><span>{formatEur(devis.total_ht)}</span></div>
              <div className="flex justify-between text-slate-500"><span>TVA</span><span>{formatEur(devis.total_tva)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200"><span>Total TTC</span><span>{formatEur(devis.total_ttc)}</span></div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            {signature.statut === 'signé' ? (
              <div className="flex items-center gap-2 justify-center bg-green-50 text-green-700 rounded-lg py-4 px-4">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Devis accepté — merci !</span>
              </div>
            ) : (
              <Button onClick={handleSign} disabled={signing} className="w-full" size="lg">
                {signing ? 'Validation...' : "J'accepte ce devis"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
