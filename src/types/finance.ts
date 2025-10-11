// Exercice comptable
export interface ExerciceComptable {
  id: string;
  annee: number;
  date_cloture: string;
  devise: string;
  statut: 'brouillon' | 'valide' | 'archivé';
  created_at: string;
}

// Bilan Actif
export interface BilanActif {
  id: string;
  exercice_id: string;
  ref: string;
  categorie:
    | 'immobilisation_incorporelle'
    | 'immobilisation_corporelle'
    | 'immobilisation_financiere'
    | 'circulant'
    | 'tresorerie'
    | 'conversion';
  libelle: string;
  brut: number;
  amortissement: number;
  net: number;
  ordre: number;
  created_at: string;
}

// Bilan Passif
export interface BilanPassif {
  id: string;
  exercice_id: string;
  ref: string;
  categorie:
    | 'capitaux_propres'
    | 'dettes_financieres'
    | 'passifs_circulants'
    | 'tresorerie_passif'
    | 'conversion';
  libelle: string;
  montant: number;
  ordre: number;
  created_at: string;
}

// Compte de Résultat
export interface CompteResultat {
  id: string;
  exercice_id: string;
  ref: string;
  libelle: string;
  type: 'produit' | 'charge' | 'variation' | 'résultat';
  montant: number;
  ordre: number;
  created_at: string;
}

// Flux de Trésorerie
export interface FluxTresorerie {
  id: string;
  exercice_id: string;
  ref: string;
  categorie: 'exploitation' | 'investissement' | 'financement' | 'variation';
  nature: string;
  libelle: string;
  sens: 'encaissement' | 'decaissement';
  montant: number;
  montant_prevu?: number;
  date: string;
  ordre: number;
  created_at: string;
}

// Ratios Financiers
export interface RatioFinancier {
  id: string;
  exercice_id: string;
  categorie: 'liquidité' | 'rentabilité' | 'endettement' | 'activité';
  libelle: string;
  valeur: number;
  commentaire?: string;
  created_at: string;
}

// Notes Annexes
export interface NoteAnnexe {
  id: string;
  exercice_id: string;
  numero: number;
  titre: string;
  contenu: string;
  created_at: string;
}
