// Read-only accounting data service (mock implementation)
// Provides journal entries and account balances for Rapports.

export type ReadFilters = {
  exerciceId?: string;
  dateFrom?: string; // ISO yyyy-mm-dd
  dateTo?: string;   // ISO yyyy-mm-dd
  entite?: string;
  journal?: string;  // GNRL | ACH | VEN | BNQ | OD
  statut?: 'VALIDEE' | 'BROUILLON' | 'REJETEE';
  q?: string;
};

export type ReadEcriture = {
  id: string;
  date: string;
  numero: string;
  libelle: string;
  compteDebit: string;
  compteCredit: string;
  montant: number;
  reference: string;
  entite: string;
  statut: 'VALIDEE' | 'BROUILLON' | 'REJETEE';
  journal?: string;
};

export type ReadCompte = {
  compte_numero: string;
  compte_libelle: string;
  type: 'Actif' | 'Passif' | 'Charge' | 'Produit';
  solde_debiteur: number;
  solde_crediteur: number;
  solde: number;
};

const MOCK_ECRITURES: ReadEcriture[] = [
  {
    id: '1',
    date: '2024-01-15',
    numero: 'ECR-2024-001',
    libelle: 'Achat médicaments - MIN-SANTE',
    compteDebit: '6011 - Achats de médicaments',
    compteCredit: '4011 - Fournisseurs',
    montant: 45000000,
    reference: 'FAC-2024-001',
    entite: 'MIN-SANTE',
    statut: 'VALIDEE',
    journal: 'ACH'
  },
  {
    id: '2',
    date: '2024-01-14',
    numero: 'ECR-2024-002',
    libelle: 'Paiement salaires janvier 2024',
    compteDebit: '6411 - Salaires',
    compteCredit: '5121 - Banque',
    montant: 1572500000,
    reference: 'PAIE-2024-01',
    entite: 'MIN-BUDGET',
    statut: 'VALIDEE',
    journal: 'BNQ'
  },
  {
    id: '3',
    date: '2024-01-13',
    numero: 'ECR-2024-003',
    libelle: 'Encaissement recettes fiscales',
    compteDebit: '5121 - Banque',
    compteCredit: '7011 - Recettes fiscales',
    montant: 250000000,
    reference: 'REC-2024-001',
    entite: 'DGI',
    statut: 'VALIDEE',
    journal: 'GNRL'
  },
  {
    id: '4',
    date: '2024-01-12',
    numero: 'ECR-2024-004',
    libelle: 'Travaux réhabilitation école',
    compteDebit: '2131 - Bâtiments',
    compteCredit: '4011 - Fournisseurs',
    montant: 125000000,
    reference: 'TRAV-2024-001',
    entite: 'MIN-EDUC',
    statut: 'BROUILLON',
    journal: 'OD'
  }
];

const MOCK_COMPTES: ReadCompte[] = [
  { compte_numero: '5121', compte_libelle: 'Banque', type: 'Actif', solde_debiteur: 2325000000, solde_crediteur: 0, solde: 2325000000 },
  { compte_numero: '4011', compte_libelle: 'Fournisseurs', type: 'Passif', solde_debiteur: 0, solde_crediteur: 170000000, solde: -170000000 },
  { compte_numero: '6011', compte_libelle: 'Achats de médicaments', type: 'Charge', solde_debiteur: 45000000, solde_crediteur: 0, solde: 45000000 },
  { compte_numero: '6411', compte_libelle: 'Salaires', type: 'Charge', solde_debiteur: 1572500000, solde_crediteur: 0, solde: 1572500000 },
  { compte_numero: '7011', compte_libelle: 'Recettes fiscales', type: 'Produit', solde_debiteur: 0, solde_crediteur: 250000000, solde: -250000000 },
  { compte_numero: '2131', compte_libelle: 'Bâtiments', type: 'Actif', solde_debiteur: 125000000, solde_crediteur: 0, solde: 125000000 }
];

function inRange(date: string, from?: string, to?: string) {
  const d = new Date(date);
  if (from) {
    const df = new Date(from);
    if (isFinite(d.getTime()) && isFinite(df.getTime()) && d < df) return false;
  }
  if (to) {
    const dt = new Date(to);
    if (isFinite(d.getTime()) && isFinite(dt.getTime()) && d > dt) return false;
  }
  return true;
}

export const ComptabiliteReadService = {
  async fetchEcritures(filters: ReadFilters = {}): Promise<ReadEcriture[]> {
    const { dateFrom, dateTo, entite, journal, statut, q } = filters;
    const query = (q || '').trim().toLowerCase();
    let rows = [...MOCK_ECRITURES];
    if (entite) rows = rows.filter(r => r.entite === entite);
    if (journal) rows = rows.filter(r => (r.journal || 'GNRL') === journal);
    if (statut) rows = rows.filter(r => r.statut === statut);
    if (dateFrom || dateTo) rows = rows.filter(r => inRange(r.date, dateFrom, dateTo));
    if (query) rows = rows.filter(r => `${r.date} ${r.numero} ${r.reference} ${r.libelle} ${r.entite}`.toLowerCase().includes(query));
    // Simulate network
    await new Promise(res => setTimeout(res, 100));
    return rows;
  },

  async fetchComptes(_filters: ReadFilters = {}): Promise<ReadCompte[]> {
    await new Promise(res => setTimeout(res, 100));
    return [...MOCK_COMPTES];
  }
};
