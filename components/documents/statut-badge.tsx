import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DevisStatut, FactureStatut } from '@/lib/types'

type DevisStatutBadgeProps = { statut: DevisStatut }
type FactureStatutBadgeProps = { statut: FactureStatut }

const DEVIS_CONFIG: Record<DevisStatut, { label: string; className: string }> = {
  brouillon: { label: 'Brouillon', className: 'bg-muted text-muted-foreground border-border' },
  envoyé: { label: 'Envoyé', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  accepté: { label: 'Accepté', className: 'bg-green-50 text-green-700 border-green-200' },
  refusé: { label: 'Refusé', className: 'bg-red-50 text-red-700 border-red-200' },
}

const FACTURE_CONFIG: Record<FactureStatut, { label: string; className: string }> = {
  non_payée: { label: 'Non payée', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  payée: { label: 'Payée', className: 'bg-green-50 text-green-700 border-green-200' },
  en_retard: { label: 'En retard', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function DevisStatutBadge({ statut }: DevisStatutBadgeProps) {
  const config = DEVIS_CONFIG[statut] ?? DEVIS_CONFIG['brouillon']
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}

export function FactureStatutBadge({ statut }: FactureStatutBadgeProps) {
  const config = FACTURE_CONFIG[statut] ?? FACTURE_CONFIG['non_payée']
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
