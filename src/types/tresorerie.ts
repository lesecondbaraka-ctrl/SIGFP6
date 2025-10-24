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

// Types pour les prévisions de trésorerie
export type StatutPrevision = 'brouillon' | 'en_revue' | 'approuve' | 'rejete';
export type TypePrevision = 'recette' | 'depense';

export interface CompteTresorerie {
  id: string;
  banque: string;
  numero_compte: string;
  intitule: string;
  devise: 'CDF' | 'USD' | 'EUR';
  solde_actuel: number;
  solde_aujourdhui: number;
  solde_previsonnel: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReleveBancaire {
  id: string;
  compte_id: string;
  date: string;
  libelle: string;
  montant: number;
  sens: 'credit' | 'debit';
  reference: string;
  statut: 'a_rapprocher' | 'rapproche' | 'ecart';
  ecriture_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RapprochementBancaire {
  id: string;
  compte_id: string;
  date_debut: string;
  date_fin: string;
  solde_comptable: number;
  solde_bancaire: number;
  ecart: number;
  statut: 'brouillon' | 'valide' | 'cloture';
  commentaire?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LigneRapprochement {
  id: string;
  rapprochement_id: string;
  ecriture_id?: string;
  ligne_releve_id?: string;
  montant: number;
  libelle: string;
  date_operation: string;
  statut: 'a_rapprocher' | 'rapproche' | 'ecart';
  commentaire?: string;
  created_at: string;
  updated_at: string;
}

export interface TauxChange {
  id: string;
  date: string;
  devise_source: string;
  devise_cible: string;
  taux: number;
  source: 'banque_centrale' | 'marche' | 'manuel';
  created_at: string;
  updated_at: string;
}

export interface WorkflowAction {
  id: string;
  entite_type: 'prevision' | 'rapprochement' | 'flux';
  entite_id: string;
  action: 'soumettre' | 'approuver' | 'rejeter' | 'valider' | 'annuler';
  statut_avant: string;
  statut_apres: string;
  commentaire?: string;
  utilisateur_id: string;
  created_at: string;
}

export interface KpiTresorerie {
  solde_courant: number;
  solde_courant_usd: number;
  solde_moyen_30j: number;
  jours_autonomie: number;
  ratio_liquidite: number;
  tresorerie_nette: number;
  date_calcul: string;
}

export interface DashboardTresorerie {
  kpis: KpiTresorerie;
  soldes_par_compte: Array<{
    compte_id: string;
    intitule: string;
    solde: number;
    devise: string;
    solde_equivalence_cdf: number;
  }>;
  flux_mensuels: Array<{
    mois: string;
    encaissements: number;
    decaissements: number;
    solde: number;
  }>;
  previsions_vs_realise: Array<{
    mois: string;
    prevu: number;
    realise: number;
    ecart: number;
  }>;
}

export interface PrevisionTresorerie {
  id: string;
  exercice_id: string;
  mois: number;                    // 1-12
  annee: number;
  montant: number;
  type: TypePrevision;             // recette ou depense
  categorie: string;               // Catégorie de la prévision
  statut: StatutPrevision;
  commentaire?: string;
  motif_rejet?: string;
  version: number;
  date_creation: string;
  date_modification: string;
  date_approbation?: string;
  created_by?: string;
  approved_by?: string;
  // Champs pour le support multi-devises
  montant_devise?: number;
  code_devise?: string;
  taux_change?: number;
  montant_equivalence_cdf?: number;
  createur_id: string;
  modificateur_id: string;
  approbateur_id?: string;
}

export interface MonthlyForecast {
  id?: string;
  monthNumber: number;
  month: string;
  recettesCDF: number;
  depensesCDF: number;
  recettesUSD: number;
  depensesUSD: number;
  soldeCDF: number;
  soldeUSD: number;
  exchangeRate: number;
  statut?: StatutPrevision;
  commentaire?: string;
  version?: number;
  date_modification?: string;
  modificateur?: string;
}

export interface AuditPrevision {
  id: string;
  prevision_id: string;
  type_operation: 'creation' | 'modification' | 'approbation' | 'rejet';
  date_operation: string;
  utilisateur_id: string;
  anciennes_valeurs?: Partial<PrevisionTresorerie>;
  nouvelles_valeurs?: Partial<PrevisionTresorerie>;
  commentaire?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface WorkflowResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: ValidationError[];
}