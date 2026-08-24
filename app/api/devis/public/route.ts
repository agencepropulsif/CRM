import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: signature } = await supabase
    .from('devis_signatures')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!signature) return NextResponse.json({ error: 'Signature introuvable' }, { status: 404 })

  const { data: devis } = await supabase
    .from('devis')
    .select('*, devis_lignes(*), clients(nom, email, adresse)')
    .eq('id', signature.devis_id)
    .single()

  if (!devis) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })

  return NextResponse.json({ devis, signature })
}
