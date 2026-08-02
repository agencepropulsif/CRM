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
export type TypeProjet = 'logo' | 'reseaux_sociaux' | 'flyer' | 'site_web' | 'autre'
export type StatutProjet = 'en_cours' | 'terminé' | 'archivé'

export type Projet = {
  id: string
  client_id: string | null
  titre: string
  description: string | null
  type_projet: TypeProjet | null
  date_realisation: string | null
  statut: StatutProjet
  notes: string | null
  created_at: string | null
  clients?: Pick<Client, 'id' | 'nom'>
}

export type ProjetVisuel = {
  id: string
  projet_id: string | null
  url_image: string
  legende: string | null
  ordre: number
  created_at: string | null
}

export type ProjetAvecVisuels = Projet & {
  projets_visuels: ProjetVisuel[]
}
