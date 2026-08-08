import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { devisId } = await req.json()
    if (!devisId) return NextResponse.json({ error: 'devisId manquant' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: devis } = await supabase
      .from('devis')
      .select('*, clients(nom, email)')
      .eq('id', devisId)
      .single()

    if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
    const client = devis.clients as { nom?: string; email?: string } | null
    if (!client?.email) return NextResponse.json({ error: "Le client n'a pas d'email" }, { status: 400 })

    // Crée (ou récupère) une entrée signature pour ce devis
    const { data: existing } = await supabase
      .from('devis_signatures')
      .select('*')
      .eq('devis_id', devisId)
      .maybeSingle()

    let token = existing?.token
    if (!token) {
      const { data: created } = await supabase
        .from('devis_signatures')
        .insert({ devis_id: devisId, statut: 'en_attente' })
        .select()
        .single()
      token = created?.token
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://crm-cgsn.vercel.app'
    const lienSignature = `${siteUrl}/signature/${token}`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Propulsif <contact@propulsif.eu>',
        to: [client.email],
        subject: `Votre devis n° ${devis.numero} - Propulsif`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Bonjour ${client.nom ?? ''},</h2>
            <p>Vous trouverez ci-joint votre devis n° <strong>${devis.numero}</strong> d'un montant de <strong>${devis.total_ttc} €</strong> TTC.</p>
            <p>Pour consulter le devis et le valider, cliquez sur le lien ci-dessous :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${lienSignature}" style="background: #1e3a5f; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Consulter et signer le devis
              </a>
            </p>
            <p style="color: #64748b; font-size: 13px;">Ce lien est personnel, merci de ne pas le transférer.</p>
            <p style="margin-top: 30px;">Cordialement,<br/>Mathys Denaux — Propulsif</p>
          </div>
        `,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      return NextResponse.json({ error: `Échec envoi email: ${err}` }, { status: 500 })
    }

    await supabase.from('devis').update({ statut: 'envoyé' }).eq('id', devisId)

    return NextResponse.json({ success: true, lienSignature })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
