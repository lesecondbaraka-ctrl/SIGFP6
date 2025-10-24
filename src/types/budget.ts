/**
 * Types pour la gestion budgétaire
 * Inclut les investissements (transférés depuis TresorerieModule)
 */

import { 
  Currency, 
  Department, 
  Employee, 
  Project, 
  ApprovalStatus, 
  ExecutionStatus,
  RiskLevel,
  Priority,
  ApprovalStep,
  Document,
  Alert,
  Tag,
  AuditInfo
} from './shared';

// ============= CATÉGORIES BUDGÉTAIRES =============

export type BudgetCategory = 
  | 'Personnel'
  | 'Fonctionnement'
  | 'Investissement'
  | 'Transfert'
  | 'Dette'
  | 'Autre';

export type BudgetType = 
  | 'Initial'
  | 'Rectificatif'
  | 'Supplémentaire';

export type BudgetPeriod = 
  | 'Annuel'
  | 'Trimestriel'
  | 'Mensuel';

export type BudgetStatus = ExecutionStatus;

// ============= LIGNE BUDGÉTAIRE =============

export interface BudgetItem {
  id: string;
  budgetCode: string;
  name: string;
  description: string;
  category: BudgetCategory;
  subcategory: string;
  budgetType: BudgetType;
  fiscalYear: string;
  period: BudgetPeriod;
  currency: Currency;
  exchangeRate?: number;
  
  // Montants budgétaires (cycle budgétaire)
  originalBudget: number;        // Budget initial voté
  revisedBudget: number;         // Budget révisé
  currentBudget: number;         // Budget en vigueur
  allocated: number;             // Montant alloué
  committed: number;             // Montant engagé
  spent: number;                 // Montant dépensé/réalisé
  available: number;             // Disponible = currentBudget - committed
  reserved: number;              // Montant réservé
  
  // Conversion USD pour reporting global
  originalBudgetUSD: number;
  currentBudgetUSD: number;
  spentUSD: number;
  availableUSD: number;
  
  // Organisation
  department: Department;
  costCenter: string;
  glAccount: string;             // Compte du plan comptable OHADA
  project?: Project;
  businessUnit: string;
  region: string;
  
  // Responsabilités
  budgetOwner: Employee;
  approver: Employee;
  controller: Employee;
  
  // Statut et contrôles
  status: BudgetStatus;
  approvalStatus: ApprovalStatus;
  variance: number;              // Écart budget vs réalisé
  variancePercent: number;       // Écart en %
  utilizationRate: number;       // Taux d'utilisation en %
  
  // Prévisions et analyses
  forecast: number;              // Prévision de fin d'année
  forecastAccuracy: number;      // Précision des prévisions
  seasonalityFactor: number;     // Facteur de saisonnalité
  riskLevel: RiskLevel;
  
  // Workflow et approbations
  approvalWorkflow: BudgetApproval[];
  revisionHistory: BudgetRevision[];
  
  // Contrôles et conformité
  complianceChecks: ComplianceRule[];
  alerts: Alert[];
  
  // Métadonnées
  tags: Tag[];
  notes: string;
  audit: AuditInfo;
  lastReviewDate: string;
  nextReviewDate: string;
}

// ============= APPROBATIONS BUDGÉTAIRES =============

export interface BudgetApproval extends ApprovalStep {
  id: string;
  budgetItemId: string;
  documentRef?: string;
}

// ============= RÉVISIONS BUDGÉTAIRES =============

export interface BudgetRevision {
  id: string;
  budgetItemId: string;
  revisionNumber: number;
  date: string;
  type: BudgetRevisionType;
  previousAmount: number;
  newAmount: number;
  difference: number;
  reason: string;
  justification?: string;
  approvedBy: Employee;
  approvalDate: string;
  documentRef: string;
  documents?: Document[];
}

export type BudgetRevisionType = 
  | 'Augmentation'
  | 'Diminution'
  | 'Réallocation'
  | 'Virement'
  | 'Gel'
  | 'Dégel';

// ============= RÈGLES DE CONFORMITÉ =============

export interface ComplianceRule {
  id: string;
  rule: string;
  ruleCode: string;
  category: 'Budgétaire' | 'Comptable' | 'Réglementaire' | 'Interne';
  status: ComplianceStatus;
  checkDate: string;
  details?: string;
  reference?: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
}

export type ComplianceStatus = 
  | 'Compliant'
  | 'Non-Compliant'
  | 'Warning'
  | 'Not Applicable';

// ============= ALERTES BUDGÉTAIRES =============

export interface BudgetAlert extends Alert {
  budgetItemId: string;
  threshold?: number;
  currentValue?: number;
  triggerCondition?: string;
}

// ============= INVESTISSEMENTS (transférés depuis TresorerieModule) =============

export type InvestmentType = 
  | 'Infrastructure'
  | 'Équipement'
  | 'Immobilier'
  | 'Technologie'
  | 'Véhicules'
  | 'Mobilier'
  | 'Autre';

export type InvestmentPriority = Priority;

export type InvestmentStatus = 
  | 'Planifié'
  | 'En cours'
  | 'Terminé'
  | 'Suspendu'
  | 'Annulé';

export interface Investment {
  id: string;
  code: string;
  nom: string;
  description: string;
  type: InvestmentType;
  
  // Montants
  montantCDF: number;
  montantUSD: number;
  montantTotal: number;          // Équivalent total en CDF
  montantDepense: number;        // Montant déjà dépensé
  montantRestant: number;        // Reste à dépenser
  
  // Dates et durée
  dateDebut: string;
  dateFin: string;
  dureeJours: number;
  dateDebutReel?: string;
  dateFinReelle?: string;
  tauxAvancement: number;        // % d'avancement
  
  // Statut et priorité
  statut: InvestmentStatus;
  priorite: InvestmentPriority;
  
  // Organisation
  exercice: string;
  department?: Department;
  project?: Project;
  responsable: Employee;
  budgetLineId?: string;         // Lien avec ligne budgétaire
  
  // Comptabilité
  glAccount?: string;            // Compte d'immobilisation OHADA (classe 2)
  amortissementDuree?: number;   // Durée d'amortissement en années
  amortissementType?: string;    // Type d'amortissement
  
  // Documents et suivi
  documents?: Document[];
  milestones?: InvestmentMilestone[];
  
  // Risques
  riskLevel: RiskLevel;
  risksIdentified?: string[];
  
  // Métadonnées
  tags?: Tag[];
  notes?: string;
  audit: AuditInfo;
}

// ============= JALONS D'INVESTISSEMENT =============

export interface InvestmentMilestone {
  id: string;
  investmentId: string;
  name: string;
  description?: string;
  targetDate: string;
  completionDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  responsable?: Employee;
  montantAssocie?: number;
}

// ============= STATISTIQUES BUDGÉTAIRES =============

export interface BudgetStatistics {
  totalBudget: number;
  totalAllocated: number;
  totalCommitted: number;
  totalSpent: number;
  totalAvailable: number;
  utilizationRate: number;
  commitmentRate: number;
  executionRate: number;
  byCategory: Record<BudgetCategory, BudgetCategoryStats>;
  byDepartment: Record<string, DepartmentBudgetStats>;
}

export interface BudgetCategoryStats {
  category: BudgetCategory;
  budget: number;
  spent: number;
  available: number;
  count: number;
  utilizationRate: number;
}

export interface DepartmentBudgetStats {
  departmentId: string;
  departmentName: string;
  budget: number;
  spent: number;
  available: number;
  utilizationRate: number;
}

// ============= SYNTHÈSE INVESTISSEMENTS =============

export interface InvestmentSummary {
  totalCDF: number;
  totalUSD: number;
  equivalentTotalCDF: number;
  nombreProjets: number;
  nombreEnCours: number;
  nombreTermines: number;
  nombrePlanifies: number;
  nombreSuspendus: number;
  tauxAvancementMoyen: number;
  byType: Record<InvestmentType, InvestmentTypeStats>;
}

export interface InvestmentTypeStats {
  type: InvestmentType;
  montantTotal: number;
  nombre: number;
  pourcentage: number;
}

// ============= RÉPARTITION BUDGÉTAIRE =============

export interface BudgetAllocation {
  id: string;
  budgetItemId: string;
  fiscalYear: string;
  period: string;
  amount: number;
  currency: Currency;
  allocatedTo: Department | Project;
  allocationType: 'Department' | 'Project' | 'Activity';
  status: 'Active' | 'Suspended' | 'Cancelled';
  effectiveDate: string;
  expiryDate?: string;
  audit: AuditInfo;
}
