'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, FileText, Receipt, TrendingUp } from 'lucide-react'
import { formatEur } from '@/lib/format'

type Stats = {
  totalClients: number
  devisEnAttente: number
  facturesNonPayees: number
  caduMois: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    devisEnAttente: 0,
    facturesNonPayees: 0,
    caduMois: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [
        { count: totalClients },
        { count: devisEnAttente },
        { count: facturesNonPayees },
        { data: facturesMois },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('devis').select('*', { count: 'exact', head: true }).in('statut', ['brouillon', 'envoyé']),
        supabase.from('factures').select('*', { count: 'exact', head: true }).eq('statut', 'non_payee'),
        supabase.from('factures').select('total_ttc').eq('statut', 'payee').gte('date_creation', firstDay).lte('date_creation', lastDay),
      ])

      const caduMois = (facturesMois ?? []).reduce((acc, f) => acc + (f.total_ttc ?? 0), 0)

      setStats({
        totalClients: totalClients ?? 0,
        devisEnAttente: devisEnAttente ?? 0,
        facturesNonPayees: facturesNonPayees ?? 0,
        caduMois,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      format: 'number',
    },
    {
      label: 'Devis en attente',
      value: stats.devisEnAttente,
      icon: FileText,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      format: 'number',
    },
    {
      label: 'Factures non payées',
      value: stats.facturesNonPayees,
      icon: Receipt,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      format: 'number',
    },
    {
      label: 'CA du mois',
      value: stats.caduMois,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      format: 'currency',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">Bienvenue sur votre CRM Propulsif</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={1.8} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <span className="text-muted-foreground text-lg">—</span>
                ) : card.format === 'currency' ? (
                  formatEur(card.value as number)
                ) : (
                  card.value
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium text-foreground mb-1">Résumé</h2>
          <p className="text-xs text-muted-foreground mb-4">Vue d'ensemble de votre activité</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Devis brouillon / envoyé</span>
              <span className="font-medium">{stats.devisEnAttente}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Factures à encaisser</span>
              <span className="font-medium text-red-400">{stats.facturesNonPayees}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CA encaissé ce mois</span>
              <span className="font-medium text-green-400">{formatEur(stats.caduMois)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total clients</span>
              <span className="font-medium">{stats.totalClients}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">Propulsif</h2>
            <p className="text-xs text-muted-foreground">Mathys DENAUX — SIREN 103 651 733</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground mt-4">
            <p>76 rue des cétoines, 34090 Montpellier</p>
            <p>agence.propulsif@gmail.com</p>
            <p>06 75 29 81 06</p>
            <p className="mt-2 italic">Micro-entrepreneur — TVA non applicable, art. 293B CGI</p>
          </div>
        </div>
      </div>
    </div>
  )
}