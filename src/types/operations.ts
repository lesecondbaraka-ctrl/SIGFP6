/**
 * Types pour les opérations : Recettes et Dépenses
 * Conformes au référentiel OHADA et aux standards de gestion publique
 */

import { 
  Currency, 
  Vendor, 
  Department, 
  Employee, 
  Project, 
  PaymentMethod, 
  ApprovalStatus,
  ApprovalStep,
  Document,
  AuditInfo,
  Tag
} from './shared';

// ============= RECETTES =============

export type RecetteType = 
  | 'Fiscale'
  | 'Non-Fiscale'
  | 'Parafiscale'
  | 'Exceptionnelle'
  | 'Transfert'
  | 'Emprunt';

export type RecetteStatus = 
  | 'Prévue'
  | 'Constatée'
  | 'Liquidée'
  | 'Encaissée'
  | 'Annulée';

export interface RecetteItem {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  type: RecetteType;
  
  // Montants (selon phases d'exécution budgétaire)
  previsionAnnuelle: number;     // Budget prévisionnel
  revisionBudget?: number;       // Budget révisé
  montantConstate: number;       // Montant constaté (droits acquis)
  montantLiquide: number;        // Montant liquidé (droits certains)
  encaisseADate: number;         // Montant encaissé
  resteARecouvrer: number;       // Reste à encaisser
  
  // Indicateurs de performance
  tauxConstatation: number;      // Constaté / Prévu
  tauxLiquidation: number;       // Liquidé / Constaté
  tauxRecouvrement: number;      // Encaissé / Liquidé
  tauxExecution: number;         // Encaissé / Prévu (global)
  
  // Organisation
  entite: string;
  department?: Department;
  glAccount: string;             // Compte comptable OHADA (classe 7)
  budgetLine?: string;
  
  // Devise
  currency: Currency;
  exchangeRate?: number;
  amountUSD?: number;
  
  // Période
  fiscalYear: string;
  period?: string;
  month?: number;
  
  // Statut et workflow
  status: RecetteStatus;
  approvalStatus?: ApprovalStatus;
  validatedBy?: Employee;
  validationDate?: string;
  
  // Métadonnées
  createdBy: Employee;
  audit: AuditInfo;
  tags?: Tag[];
  notes?: string;
  documents?: Document[];
}

// ============= TITRES DE PERCEPTION =============

export interface TitrePerception {
  id: string;
  numeroTitre: string;
  date: string;
  recetteId: string;
  recetteCode: string;
  recetteLibelle: string;
  
  // Montants
  montant: number;
  montantEncaisse: number;
  montantRestant: number;
  
  // Débiteur
  debiteur: Debiteur;
  
  // Dates
  dateEmission: string;
  dateEcheance: string;
  dateEncaissement?: string;
  
  // Statut
  statut: 'Émis' | 'Partiellement encaissé' | 'Encaissé' | 'Annulé' | 'Impayé';
  
  // Organisation
  entite: string;
  emetteur: Employee;
  
  // Comptabilité
  ecritureComptableId?: string;
  journalRef?: string;
  
  // Métadonnées
  currency: Currency;
  exchangeRate?: number;
  audit: AuditInfo;
  notes?: string;
}

export interface Debiteur {
  id: string;
  nom: string;
  type: 'Personne physique' | 'Personne morale' | 'Administration';
  identifiant: string;  // N° contribuable, RCCM, etc.
  adresse?: string;
  telephone?: string;
  email?: string;
}

// ============= ENCAISSEMENTS =============

export interface EncaissementItem {
  id: string;
  numeroEncaissement: string;
  date: string;
  reference: string;
  montant: number;
  
  // Lien avec recette
  recetteId: string;
  recetteCode: string;
  recetteLibelle: string;
  titrePerceptionId?: string;
  
  // Détails paiement
  paymentMethod: PaymentMethod;
  bankAccount?: string;
  bankName?: string;
  checkNumber?: string;
  transactionRef?: string;
  
  // Organisation
  entite: string;
  collectedBy?: Employee;
  cashier?: Employee;
  
  // Statut et validation
  statut: 'Encaissé' | 'En attente' | 'Validé' | 'Annulé' | 'Rejeté';
  validationDate?: string;
  validatedBy?: Employee;
  rejectionReason?: string;
  
  // Comptabilité
  ecritureComptableId?: string;
  journalRef?: string;
  compteDebit: string;   // 5xxx (Trésorerie)
  compteCredit: string;  // 7xxx (Produits)
  
  // Trésorerie
  compteBancaire?: string;
  compteCaisse?: string;
  
  // Métadonnées
  currency: Currency;
  exchangeRate?: number;
  amountUSD?: number;
  audit: AuditInfo;
  notes?: string;
  documents?: Document[];
}

// ============= DÉPENSES =============

export type ExpenseCategory = 
  | 'Personnel'
  | 'Fonctionnement'
  | 'Investissement'
  | 'Transfert'
  | 'Dette'
  | 'Autre';

export type ExpenseStatus = 
  | 'Brouillon'
  | 'Engagé'
  | 'Liquidé'
  | 'Ordonnancé'
  | 'Mandaté'
  | 'Payé'
  | 'Annulé'
  | 'Rejeté';

export type ExpensePriority = 
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export interface ExpenseItem {
  id: string;
  expenseNumber: string;
  numeroEngagement?: string;
  numeroLiquidation?: string;
  numeroOrdonnancement?: string;
  numeroMandat?: string;
  
  category: ExpenseCategory;
  subcategory: string;
  description: string;
  object: string;              // Objet de la dépense
  
  // Montants (cycle de la dépense)
  montantDemande: number;      // Montant demandé
  montantEngage: number;       // Montant engagé
  montantLiquide: number;      // Montant liquidé (service fait)
  montantOrdonnance: number;   // Montant ordonnancé
  montantPaye: number;         // Montant payé
  
  currency: Currency;
  exchangeRate?: number;
  amountUSD: number;
  
  // Taxes
  taxAmount: number;
  taxRate: number;
  netAmount: number;
  
  // Organisation
  vendor: Vendor;
  beneficiaire?: string;       // Nom du bénéficiaire si différent du fournisseur
  department: Department;
  project?: Project;
  costCenter: string;
  glAccount: string;           // Compte comptable OHADA (classe 6)
  budgetLine: string;
  budgetLineId: string;
  
  // Responsabilités
  requestedBy: Employee;       // Demandeur
  engagedBy?: Employee;        // Agent engageant (ordonnateur)
  liquidatedBy?: Employee;     // Agent liquidateur
  orderedBy?: Employee;        // Ordonnateur
  paidBy?: Employee;           // Agent payeur (comptable)
  approvedBy?: Employee;
  
  // Dates (cycle complet de la dépense publique)
  requestDate: string;         // Date de demande
  engagementDate?: string;     // Date d'engagement
  serviceDeliveryDate?: string;// Date de service fait
  liquidationDate?: string;    // Date de liquidation
  ordonnancementDate?: string; // Date d'ordonnancement
  approvalDate?: string;
  paymentDate?: string;        // Date de paiement
  dueDate: string;             // Date d'échéance
  
  // Statut et workflow
  status: ExpenseStatus;
  priority: ExpensePriority;
  approvalStatus: ApprovalStatus;
  paymentMethod: PaymentMethod;
  
  // Documents justificatifs
  receipts: Document[];        // Factures, bons de livraison
  attachments: Document[];     // Autres pièces jointes
  invoiceRef?: string;
  purchaseOrderRef?: string;
  contractRef?: string;
  
  // Workflow et contrôles
  approvalWorkflow: ApprovalStep[];
  complianceChecks: ComplianceCheck[];
  
  // Contrôle budgétaire
  budgetCheckPassed: boolean;
  availableBudget?: number;
  budgetExceeded?: boolean;
  budgetCheckDate?: string;
  budgetCheckBy?: Employee;
  
  // Paiements (peut être fractionné)
  payments?: Payment[];
  
  // Comptabilité
  ecritureComptableId?: string;
  journalRef?: string;
  
  // Métadonnées
  tags: Tag[];
  notes: string;
  audit: AuditInfo;
}

// ============= PAIEMENTS =============

export interface Payment {
  id: string;
  paymentNumber: string;
  expenseId: string;
  expenseNumber: string;
  
  paymentDate: string;
  amount: number;
  currency: Currency;
  amountUSD?: number;
  
  paymentMethod: PaymentMethod;
  reference: string;
  
  // Coordonnées bancaires
  bankAccount?: string;
  bankName?: string;
  iban?: string;
  swift?: string;
  checkNumber?: string;
  
  // Bénéficiaire
  beneficiary: string;
  beneficiaryAccount?: string;
  
  // Statut
  status: PaymentStatus;
  executedBy?: Employee;
  validatedBy?: Employee;
  
  // Comptabilité
  compteDebit: string;   // 6xxx (Charges)
  compteCredit: string;  // 5xxx (Trésorerie) ou 4xxx (Fournisseurs)
  ecritureComptableId?: string;
  
  // Métadonnées
  audit: AuditInfo;
  notes?: string;
}

export type PaymentStatus = 
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

// ============= ENGAGEMENTS =============

export interface Engagement {
  id: string;
  numeroEngagement: string;
  date: string;
  
  // Montants
  montantInitial: number;
  montantLiquide: number;
  montantRestant: number;
  
  // Lien avec dépense
  expenseId: string;
  budgetLineId: string;
  
  // Bénéficiaire
  vendor: Vendor;
  
  // Validité
  dateDebut: string;
  dateFin: string;
  isActive: boolean;
  
  // Responsabilité
  engagedBy: Employee;
  approvedBy?: Employee;
  
  // Statut
  status: 'Actif' | 'Partiellement liquidé' | 'Liquidé' | 'Expiré' | 'Annulé';
  
  // Métadonnées
  audit: AuditInfo;
  notes?: string;
}

// ============= CONTRÔLES DE CONFORMITÉ =============

export interface ComplianceCheck {
  id: string;
  checkType: string;
  checkCode: string;
  description: string;
  passed: boolean;
  date: string;
  performedBy?: Employee;
  details?: string;
  recommendation?: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Blocking';
}

// ============= STATISTIQUES DES OPÉRATIONS =============

export interface RecettesStatistics {
  totalPrevu: number;
  totalConstate: number;
  totalLiquide: number;
  totalEncaisse: number;
  totalResteARecouvrer: number;
  tauxConstatationMoyen: number;
  tauxRealisationMoyen: number;
  tauxRecouvrementMoyen: number;
  byType: Record<RecetteType, RecetteTypeStats>;
  byMonth: MonthlyStats[];
}

export interface RecetteTypeStats {
  type: RecetteType;
  prevu: number;
  realise: number;
  taux: number;
  nombre: number;
}

export interface DepensesStatistics {
  totalDemande: number;
  totalEngage: number;
  totalLiquide: number;
  totalOrdonnance: number;
  totalPaye: number;
  tauxEngagement: number;
  tauxLiquidation: number;
  tauxPaiement: number;
  byCategory: Record<ExpenseCategory, ExpenseCategoryStats>;
  byMonth: MonthlyStats[];
}

export interface ExpenseCategoryStats {
  category: ExpenseCategory;
  budget: number;
  engage: number;
  paye: number;
  disponible: number;
  taux: number;
  nombre: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  montant: number;
  nombre: number;
}
