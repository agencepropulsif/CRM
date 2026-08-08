import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnue'

    const { data: signature } = await supabase
      .from('devis_signatures')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (!signature) return NextResponse.json({ error: 'Signature introuvable' }, { status: 404 })

    await supabase
      .from('devis_signatures')
      .update({ statut: 'signé', signe_le: new Date().toISOString(), ip_signature: ip })
      .eq('token', token)

    await supabase.from('devis').update({ statut: 'accepté' }).eq('id', signature.devis_id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
