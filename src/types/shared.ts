/**
 * Types partagés entre tous les modules du SIGFP
 * Centralise les entités organisationnelles communes
 */

// ============= ENTITÉS ORGANISATIONNELLES =============

export interface Department {
  id: string;
  name: string;
  code: string;
  manager: Employee;
  totalBudget: number;
  totalSpent: number;
  utilizationRate: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  approvalLimit: number;
}

export interface Entity {
  id: string;
  code: string;
  name: string;
  type: 'Ministère' | 'Direction' | 'Service' | 'Autre';
  parentId?: string;
  isActive: boolean;
}

// ============= PROJETS =============

export interface Project {
  id: string;
  name: string;
  code: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  manager: Employee;
  department: Department;
  description?: string;
}

export type ProjectStatus = 
  | 'Active' 
  | 'Completed' 
  | 'On Hold' 
  | 'Cancelled';

// ============= FOURNISSEURS =============

export interface Vendor {
  id: string;
  name: string;
  code: string;
  type: VendorType;
  taxId: string;
  address: string;
  email?: string;
  phone?: string;
  paymentTerms: string;
  preferredPaymentMethod: PaymentMethod;
  riskLevel: RiskLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VendorType = 
  | 'Individual' 
  | 'Company' 
  | 'Government';

// ============= DEVISES ET TAUX DE CHANGE =============

export type Currency = 'CDF' | 'USD' | 'EUR';

export interface ExchangeRate {
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  date: string;
  source: string;
}

export interface MonetaryAmount {
  amount: number;
  currency: Currency;
  amountCDF?: number; // Équivalent en CDF
  exchangeRate?: number;
}

// ============= MÉTHODES DE PAIEMENT =============

export type PaymentMethod = 
  | 'Virement bancaire'
  | 'Chèque'
  | 'Espèces'
  | 'Mobile Money'
  | 'Carte bancaire'
  | 'Autre';

// ============= STATUTS GÉNÉRIQUES =============

export type ApprovalStatus = 
  | 'Brouillon'
  | 'En attente'
  | 'Approuvé'
  | 'Rejeté'
  | 'En révision';

export type ExecutionStatus =
  | 'Non démarré'
  | 'En cours'
  | 'Terminé'
  | 'Suspendu'
  | 'Annulé';

export type RiskLevel = 
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type Priority = 
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

// ============= WORKFLOW ET APPROBATIONS =============

export interface ApprovalStep {
  level: number;
  approver: Employee;
  status: ApprovalStatus;
  date?: string;
  comments?: string;
  requiredAmount?: number;
}

export interface WorkflowHistory {
  id: string;
  date: string;
  action: string;
  performedBy: Employee;
  previousStatus?: string;
  newStatus: string;
  comments?: string;
}

// ============= DOCUMENTS ET PIÈCES JOINTES =============

export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: Employee;
  category?: string;
  description?: string;
}

// ============= PÉRIODES FISCALES =============

export interface FiscalPeriod {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
}

export type PeriodType = 
  | 'Annuel'
  | 'Semestriel'
  | 'Trimestriel'
  | 'Mensuel';

// ============= ALERTES ET NOTIFICATIONS =============

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  entityId?: string;
  entityType?: string;
  actionRequired?: boolean;
  actionUrl?: string;
}

export type AlertType = 
  | 'Budget'
  | 'Trésorerie'
  | 'Conformité'
  | 'Approbation'
  | 'Système'
  | 'Autre';

export type AlertSeverity = 
  | 'Info'
  | 'Warning'
  | 'Error'
  | 'Critical';

// ============= TAGS ET MÉTADONNÉES =============

export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
}

export interface AuditInfo {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}

// ============= FILTRES ET RECHERCHE =============

export interface SearchFilters {
  query?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  entity?: string;
  department?: string;
  tags?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  totalCount?: number;
  totalPages?: number;
}

// ============= PARAMÈTRES SYSTÈME =============

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  isEditable: boolean;
}
