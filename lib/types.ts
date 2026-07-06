export type Client = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  siret: string | null
  notes: string | null
  created_at: string | null
}

export type DevisStatut = 'brouillon' | 'envoyé' | 'accepté' | 'refusé'
export type FactureStatut = 'non_payée' | 'payée' | 'en_retard'

export type LigneDocument = {
  id?: string
  designation: string
  quantite: number
  prix_unitaire: number
  tva_taux: number
  ordre: number
}

export type Devis = {
  id: string
  numero: string
  client_id: string | null
  date_creation: string | null
  date_validite: string | null
  statut: DevisStatut
  total_ht: number
  total_tva: number
  total_ttc: number
  notes: string | null
  created_at: string | null
  clients?: Pick<Client, 'id' | 'nom' | 'email'>
}

export type DevisAvecLignes = Devis & {
  devis_lignes: LigneDocument[]
}

export type Facture = {
  id: string
  numero: string
  client_id: string | null
  devis_id: string | null
  date_creation: string | null
  date_echeance: string | null
  statut: FactureStatut
  total_ht: number
  total_tva: number
  total_ttc: number
  notes: string | null
  created_at: string | null
  clients?: Pick<Client, 'id' | 'nom' | 'email'>
}

export type FactureAvecLignes = Facture & {
  factures_lignes: LigneDocument[]
}
