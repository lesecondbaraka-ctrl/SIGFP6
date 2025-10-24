/**
 * Types pour le système comptable complet
 * Conforme aux normes de comptabilité publique
 */

// ============================================================================
// PLAN COMPTABLE
// ============================================================================

export type ClasseCompte = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type NatureCompte = 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' | 'SPECIAL';
export type TypeCompte = 'GENERAL' | 'AUXILIAIRE' | 'ANALYTIQUE';

export interface CompteComptable {
  id: string;
  numero: string;              // Ex: 101, 211, 6011
  libelle: string;             // Ex: "Capital", "Immobilisations corporelles"
  classe: ClasseCompte;        // Classe 1 à 9
  nature: NatureCompte;        // ACTIF, PASSIF, CHARGE, PRODUIT
  type: TypeCompte;            // GENERAL, AUXILIAIRE, ANALYTIQUE
  compte_parent?: string;      // Numéro du compte parent
  est_lettrable: boolean;      // Peut-on lettrer ce compte ?
  est_actif: boolean;          // Compte actif ou archivé
  solde_debiteur: number;      // Solde débiteur
  solde_crediteur: number;     // Solde créditeur
  exercice_id: string;         // Exercice comptable
  created_at: string;
  updated_at: string;
}

export interface PlanComptable {
  id: string;
  code: string;                // Code du plan (ex: SYSCOHADA, PCG)
  libelle: string;
  description: string;
  version: string;
  date_application: string;
  est_actif: boolean;
  comptes: CompteComptable[];
  created_at: string;
}

// ============================================================================
// ÉCRITURES COMPTABLES
// ============================================================================

export type TypeEcriture = 'OUVERTURE' | 'OPERATION' | 'REGULARISATION' | 'CLOTURE' | 'A_NOUVEAU';
export type StatutEcriture = 'BROUILLON' | 'VALIDEE' | 'COMPTABILISEE' | 'CLOTUREE' | 'ANNULEE';
export type SensEcriture = 'DEBIT' | 'CREDIT';

export interface LigneEcriture {
  id: string;
  ecriture_id: string;
  numero_ligne: number;
  compte_numero: string;       // Numéro du compte
  compte_libelle: string;      // Libellé du compte
  libelle: string;             // Libellé de la ligne
  sens: SensEcriture;          // DEBIT ou CREDIT
  montant: number;             // Montant de la ligne
  devise: string;              // Devise (XAF, USD, EUR)
  taux_change?: number;        // Taux de change si devise étrangère
  montant_devise_base?: number; // Montant en devise de base
  piece_justificative?: string; // Référence de la pièce
  lettrage?: string;           // Code de lettrage
  date_lettrage?: string;      // Date du lettrage
  analytique?: {               // Imputation analytique
    centre_cout?: string;
    projet?: string;
    activite?: string;
  };
  created_at: string;
}

export interface EcritureComptable {
  id: string;
  numero: string;              // Numéro unique de l'écriture
  journal_code: string;        // Code du journal
  journal_libelle: string;     // Libellé du journal
  type: TypeEcriture;          // Type d'écriture
  date_ecriture: string;       // Date de l'écriture
  date_piece: string;          // Date de la pièce justificative
  periode: string;             // Période comptable (YYYY-MM)
  exercice_id: string;         // Exercice comptable
  libelle: string;             // Libellé général de l'écriture
  reference_piece: string;     // Référence de la pièce justificative
  montant_total: number;       // Montant total (débit = crédit)
  lignes: LigneEcriture[];     // Lignes de l'écriture
  statut: StatutEcriture;      // Statut de l'écriture
  validee_par?: string;        // ID de l'utilisateur validateur
  date_validation?: string;    // Date de validation
  comptabilisee_par?: string;  // ID de l'utilisateur comptabilisateur
  date_comptabilisation?: string; // Date de comptabilisation
  commentaire?: string;        // Commentaire
  est_equilibree: boolean;     // Débit = Crédit ?
  created_by: string;          // ID du créateur
  created_at: string;
  updated_at: string;
}

// Type helper pour la création d'écriture (sans lignes car passées séparément)
export type EcritureComptableInput = Omit<EcritureComptable, 'id' | 'numero' | 'lignes' | 'est_equilibree' | 'created_at' | 'updated_at'>;

// ============================================================================
// JOURNAUX COMPTABLES
// ============================================================================

export type TypeJournal = 'ACHAT' | 'VENTE' | 'BANQUE' | 'CAISSE' | 'OD' | 'AN';

export interface JournalComptable {
  id: string;
  code: string;                // Code du journal (ex: AC, VE, BQ, CA, OD)
  libelle: string;             // Ex: "Journal des achats"
  type: TypeJournal;           // Type de journal
  compte_contrepartie?: string; // Compte de contrepartie par défaut
  est_actif: boolean;          // Journal actif ou archivé
  exercice_id: string;         // Exercice comptable
  numero_dernier: number;      // Dernier numéro d'écriture utilisé
  created_at: string;
}

// ============================================================================
// GRAND LIVRE ET BALANCE
// ============================================================================

export interface LigneGrandLivre {
  date: string;
  numero_ecriture: string;
  journal_code: string;
  libelle: string;
  piece_reference: string;
  debit: number;
  credit: number;
  solde: number;
  lettrage?: string;
}

export interface GrandLivre {
  compte_numero: string;
  compte_libelle: string;
  solde_initial: number;
  total_debit: number;
  total_credit: number;
  solde_final: number;
  lignes: LigneGrandLivre[];
}

export interface LigneBalance {
  compte_numero: string;
  compte_libelle: string;
  solde_initial_debit: number;
  solde_initial_credit: number;
  mouvement_debit: number;
  mouvement_credit: number;
  solde_final_debit: number;
  solde_final_credit: number;
}

export interface Balance {
  exercice_id: string;
  date_debut: string;
  date_fin: string;
  lignes: LigneBalance[];
  totaux: {
    solde_initial_debit: number;
    solde_initial_credit: number;
    mouvement_debit: number;
    mouvement_credit: number;
    solde_final_debit: number;
    solde_final_credit: number;
  };
}

// ============================================================================
// LETTRAGE ET RAPPROCHEMENT
// ============================================================================

export interface Lettrage {
  id: string;
  code: string;                // Code de lettrage (ex: AA, AB, AC)
  compte_numero: string;
  date_lettrage: string;
  montant_total: number;
  lignes_lettrees: string[];   // IDs des lignes lettrées
  utilisateur_id: string;
  created_at: string;
}

export interface RapprochementBancaire {
  id: string;
  compte_banque: string;
  date_rapprochement: string;
  solde_banque: number;
  solde_comptable: number;
  ecart: number;
  lignes_non_rapprochees: {
    comptables: LigneEcriture[];
    bancaires: any[];
  };
  statut: 'EN_COURS' | 'VALIDE' | 'REJETE';
  created_at: string;
}

// ============================================================================
// BUDGET ET ENGAGEMENT
// ============================================================================

export interface LigneBudgetaire {
  id: string;
  exercice_id: string;
  compte_numero: string;
  compte_libelle: string;
  centre_cout?: string;
  montant_initial: number;
  montant_revise: number;
  montant_engage: number;
  montant_realise: number;
  disponible: number;
  taux_execution: number;
  created_at: string;
  updated_at: string;
}

export interface Engagement {
  id: string;
  numero: string;
  exercice_id: string;
  date_engagement: string;
  objet: string;
  beneficiaire: string;
  montant: number;
  compte_imputation: string;
  ligne_budgetaire_id: string;
  statut: 'PREVISIONNEL' | 'ENGAGE' | 'LIQUIDE' | 'ORDONNANCE' | 'PAYE' | 'ANNULE';
  reference_marche?: string;
  date_echeance?: string;
  pieces_jointes?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ÉTATS FINANCIERS
// ============================================================================

export interface BilanComptable {
  exercice_id: string;
  date_arrete: string;
  actif: {
    immobilisations: {
      incorporelles: number;
      corporelles: number;
      financieres: number;
    };
    actif_circulant: {
      stocks: number;
      creances: number;
      disponibilites: number;
    };
    total_actif: number;
  };
  passif: {
    capitaux_propres: {
      capital: number;
      reserves: number;
      resultat: number;
    };
    dettes: {
      financieres: number;
      fournisseurs: number;
      autres: number;
    };
    total_passif: number;
  };
}

export interface CompteResultatComptable {
  exercice_id: string;
  date_debut: string;
  date_fin: string;
  charges: {
    exploitation: number;
    financieres: number;
    exceptionnelles: number;
    total: number;
  };
  produits: {
    exploitation: number;
    financiers: number;
    exceptionnels: number;
    total: number;
  };
  resultat: {
    exploitation: number;
    financier: number;
    courant: number;
    exceptionnel: number;
    net: number;
  };
}

// ============================================================================
// VALIDATION ET CONTRÔLE
// ============================================================================

export interface RegleControle {
  id: string;
  code: string;
  libelle: string;
  description: string;
  type: 'EQUILIBRE' | 'COHERENCE' | 'EXHAUSTIVITE' | 'AUTORISATION' | 'IMPUTATION';
  niveau_severite: 'INFO' | 'AVERTISSEMENT' | 'ERREUR' | 'BLOQUANT';
  est_active: boolean;
  created_at: string;
}

export interface AnomalieComptable {
  id: string;
  ecriture_id?: string;
  regle_id: string;
  type: string;
  severite: 'INFO' | 'AVERTISSEMENT' | 'ERREUR' | 'BLOQUANT';
  description: string;
  details: any;
  statut: 'DETECTEE' | 'EN_COURS' | 'RESOLUE' | 'IGNOREE';
  date_detection: string;
  date_resolution?: string;
  resolu_par?: string;
  commentaire_resolution?: string;
  created_at: string;
}

// ============================================================================
// CLÔTURE ET RÉOUVERTURE
// ============================================================================

export interface CloturePeriode {
  id: string;
  exercice_id: string;
  periode: string;              // YYYY-MM
  type: 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE';
  date_cloture: string;
  cloturee_par: string;
  statut: 'EN_COURS' | 'CLOTUREE' | 'ROUVERTE';
  controles_effectues: {
    equilibre_ecritures: boolean;
    coherence_balance: boolean;
    lettrage_complet: boolean;
    rapprochements_valides: boolean;
  };
  anomalies_detectees: number;
  commentaire?: string;
  created_at: string;
}

export interface EcritureANouveau {
  id: string;
  exercice_precedent_id: string;
  exercice_nouveau_id: string;
  date_generation: string;
  ecriture_id: string;
  comptes_reportes: {
    compte_numero: string;
    solde_debiteur: number;
    solde_crediteur: number;
  }[];
  statut: 'GENEREE' | 'VALIDEE' | 'COMPTABILISEE';
  created_at: string;
}

// ============================================================================
// ANALYTIQUE
// ============================================================================

export interface CentreCout {
  id: string;
  code: string;
  libelle: string;
  type: 'OPERATIONNEL' | 'SUPPORT' | 'PROJET';
  responsable?: string;
  budget_alloue?: number;
  est_actif: boolean;
  created_at: string;
}

export interface ImputationAnalytique {
  id: string;
  ecriture_ligne_id: string;
  centre_cout_id: string;
  projet_id?: string;
  activite_id?: string;
  montant: number;
  pourcentage: number;
  created_at: string;
}
