export type TypeOperation = 'RECETTE' | 'DEPENSE' | 'AVANCE' | 'REGULARISATION' | 'VIREMENT' | 'REMBOURSEMENT';
export type NatureFlux = 'FONCTIONNEMENT' | 'INVESTISSEMENT' | 'FINANCEMENT' | 'DETTE' | 'FISCALITE' | 'SUBVENTION' | 'TRANSFERT';
export type StatutOperation = 'PREVISION' | 'ENGAGEMENT' | 'ORDONNANCEMENT' | 'PAIEMENT';

export interface LigneFluxTresorerie {
  id: string;
  exercice_id: string;
  code_operation: string;         // Code unique de l'opération
  type_operation: TypeOperation;  // RECETTE ou DEPENSE
  nature_flux: NatureFlux;       // Classification selon la nature
  libelle: string;               // Description de l'opération
  montant_prevu: number;         // Montant budgétisé
  montant_engage: number;        // Montant engagé
  montant_ordonnance: number;    // Montant ordonnancé
  montant_paye: number;          // Montant effectivement payé
  date_operation: Date;          // Date de l'opération
  date_valeur: Date;            // Date de valeur
  statut: StatutOperation;      // État de l'opération
  imputation: string;           // Code d'imputation budgétaire
  source_financement?: string;  // Source de financement (pour les recettes)
  beneficiaire?: string;       // Bénéficiaire (pour les dépenses)
  reference_piece: string;     // Référence du document justificatif
  commentaire?: string;        // Observations éventuelles
  created_at: Date;           // Date de création
  updated_at: Date;          // Date de dernière modification
}

export interface SoldesTresorerie {
  solde_initial: number;            // Solde en début d'exercice
  total_recettes_prevues: number;   // Total des recettes prévues
  total_recettes_realisees: number; // Total des recettes encaissées
  total_depenses_prevues: number;   // Total des dépenses prévues
  total_depenses_realisees: number; // Total des dépenses payées
  solde_actuel: number;            // Solde courant
}

// Structure pour les rapports de trésorerie
export interface RapportTresorerie {
  periode: {
    debut: Date;
    fin: Date;
  };
  soldes: SoldesTresorerie;
  flux_fonctionnement: {
    recettes: LigneFluxTresorerie[];
    depenses: LigneFluxTresorerie[];
    solde: number;
  };
  flux_investissement: {
    recettes: LigneFluxTresorerie[];
    depenses: LigneFluxTresorerie[];
    solde: number;
  };
  flux_financement: {
    recettes: LigneFluxTresorerie[];
    depenses: LigneFluxTresorerie[];
    solde: number;
  };
}

// Interfaces pour les analyses de flux
export interface FluxParNature {
  nature: string;
  encaissements: number;
  decaissements: number;
}

export interface ResumeMensuel {
  mois: string;
  encaissements: number;
  decaissements: number;
  solde: number;
}

export interface PrevisionsFlux {
  montantPrevu: number;
  montantRealise: number;
  ecart: number;
  pourcentageRealisation: number;
}