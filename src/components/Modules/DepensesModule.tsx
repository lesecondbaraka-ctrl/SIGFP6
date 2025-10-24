import { useState, useMemo } from 'react';
import { 
  Package, FileText, Clock, CheckCircle, Plus, Search, Download, 
  DollarSign, ArrowRight, Filter, Target, TrendingUp, AlertTriangle, PieChart, BarChart3,
  Edit, ShoppingCart, User, Calendar, XCircle
} from 'lucide-react';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';

// ✅ Import UNIQUEMENT des types centralisés (pas de duplication)
import type {
  ExpenseItem,
  ExpenseStatus
} from '../../types/operations';

import type {
  Currency
} from '../../types/shared';

/**
 * Module Dépenses - Cycle complet conforme OHADA
 * 
 * ARCHITECTURE OHADA - 4 PHASES OBLIGATOIRES:
 * 
 * Phase 1 - ENGAGEMENT: Réservation crédit budgétaire
 * Phase 2 - LIQUIDATION: Vérification service fait
 * Phase 3 - ORDONNANCEMENT: Ordre de payer par ordonnateur
 * Phase 4 - PAIEMENT: Paiement effectif par comptable
 * 
 * Principe fondamental: Séparation ordonnateur/comptable
 * Normes: OHADA, IPSAS, comptabilité publique africaine
 */

export default function DepensesModule() {
  // État onglets (4 phases OHADA)
  const [activeTab, setActiveTab] = useState<'engagement' | 'liquidation' | 'ordonnancement' | 'paiement'>('engagement');
  
  // États filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Tous');
  
  // États pour les formulaires OHADA
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [showOrdonnancementModal, setShowOrdonnancementModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showBonCommandeModal, setShowBonCommandeModal] = useState(false);
  
  const [newEngagement, setNewEngagement] = useState({
    ligneBudgetaire: '',
    categorie: 'Fonctionnement' as 'Personnel' | 'Fonctionnement' | 'Investissement' | 'Transfert',
    fournisseur: '',
    montant: 0,
    objet: '',
    pieces: [] as string[]
  });
  
  const [newLiquidation, setNewLiquidation] = useState({
    engagement: '',
    serviceFait: false,
    montantLiquide: 0,
    piecesControle: ''
  });
  
  const [newOrdonnancement, setNewOrdonnancement] = useState({
    depenseLiquidee: '',
    montantOrdonne: 0,
    ordonnateur: '',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });
  
  const [newPaiement, setNewPaiement] = useState({
    depenseOrdonnancee: '',
    montantPaye: 0,
    modePaiement: 'Virement' as 'Virement' | 'Chèque' | 'Espèces',
    banque: '',
    reference: '',
    comptable: ''
  });
  
  const [newBonCommande, setNewBonCommande] = useState({
    fournisseur: '',
    articles: [{ designation: '', quantite: 0, prixUnitaire: 0 }],
    total: 0
  });
  
  // Données d'exemple (à remplacer par useDepenses hook)
  const [expenses] = useState<ExpenseItem[]>([
    {
      id: 'DEP-2025-001',
      expenseNumber: 'DEP-2025-001',
      category: 'Personnel',
      description: 'Salaires du personnel administratif - Octobre 2025',
      vendor: { id: 'V001', name: 'Trésor Public', taxId: 'TP-001', address: 'Kinshasa', contact: '+243 123 456' },
      montantDemande: 5000000,
      montantEngage: 5000000,
      montantLiquide: 5000000,
      montantOrdonnance: 5000000,
      montantPaye: 5000000,
      currency: 'CDF',
      status: 'Payé',
      requestDate: '2025-10-01',
      engagementDate: '2025-10-02',
      liquidationDate: '2025-10-25',
      ordonnancementDate: '2025-10-26',
      paymentDate: '2025-10-28',
      budgetLine: 'Personnel - Salaires',
      fiscalYear: '2025',
      department: 'MIN-BUDGET',
      pieceJustificatives: ['Fiche_paie_Oct2025.pdf'],
      notes: 'Paiement mensuel régulier'
    },
    {
      id: 'DEP-2025-002',
      expenseNumber: 'DEP-2025-002',
      category: 'Fonctionnement',
      description: 'Fournitures de bureau - Trimestre 4',
      vendor: { id: 'V002', name: 'PAPETERIE MODERNE', taxId: 'PM-2025', address: 'Gombe', contact: '+243 987 654' },
      montantDemande: 1500000,
      montantEngage: 1500000,
      montantLiquide: 1450000,
      montantOrdonnance: 1450000,
      montantPaye: 0,
      currency: 'CDF',
      status: 'Ordonnancé',
      requestDate: '2025-10-15',
      engagementDate: '2025-10-16',
      liquidationDate: '2025-10-20',
      ordonnancementDate: '2025-10-22',
      budgetLine: 'Fonctionnement - Fournitures',
      fiscalYear: '2025',
      department: 'MIN-BUDGET',
      pieceJustificatives: ['Facture_PM_Oct2025.pdf', 'BL_Oct2025.pdf'],
      notes: 'Livraison effectuée et vérifiée'
    },
    {
      id: 'DEP-2025-003',
      expenseNumber: 'DEP-2025-003',
      category: 'Investissement',
      description: 'Acquisition de 5 ordinateurs portables',
      vendor: { id: 'V003', name: 'TECH SOLUTIONS RDC', taxId: 'TS-789', address: 'Limete', contact: '+243 555 123' },
      montantDemande: 8000000,
      montantEngage: 8000000,
      montantLiquide: 7800000,
      montantOrdonnance: 0,
      montantPaye: 0,
      currency: 'CDF',
      status: 'Liquidé',
      requestDate: '2025-10-18',
      engagementDate: '2025-10-19',
      liquidationDate: '2025-10-23',
      budgetLine: 'Investissement - Équipements',
      fiscalYear: '2025',
      department: 'MIN-BUDGET',
      pieceJustificatives: ['Devis_Tech_Solutions.pdf', 'PV_Reception.pdf'],
      notes: 'Matériel réceptionné et testé'
    },
    {
      id: 'DEP-2025-004',
      expenseNumber: 'DEP-2025-004',
      category: 'Fonctionnement',
      description: 'Maintenance véhicules de service',
      vendor: { id: 'V004', name: 'GARAGE CENTRAL', taxId: 'GC-456', address: 'Ngaliema', contact: '+243 777 888' },
      montantDemande: 2500000,
      montantEngage: 2500000,
      montantLiquide: 0,
      montantOrdonnance: 0,
      montantPaye: 0,
      currency: 'CDF',
      status: 'Engagé',
      requestDate: '2025-10-20',
      engagementDate: '2025-10-21',
      budgetLine: 'Fonctionnement - Maintenance',
      fiscalYear: '2025',
      department: 'MIN-BUDGET',
      pieceJustificatives: ['Devis_Garage.pdf'],
      notes: 'Travaux en cours'
    },
    {
      id: 'DEP-2025-005',
      expenseNumber: 'DEP-2025-005',
      category: 'Personnel',
      description: 'Primes de performance - Octobre 2025',
      vendor: { id: 'V001', name: 'Trésor Public', taxId: 'TP-001', address: 'Kinshasa', contact: '+243 123 456' },
      montantDemande: 3000000,
      montantEngage: 3000000,
      montantLiquide: 3000000,
      montantOrdonnance: 3000000,
      montantPaye: 3000000,
      currency: 'CDF',
      status: 'Payé',
      requestDate: '2025-10-10',
      engagementDate: '2025-10-11',
      liquidationDate: '2025-10-26',
      ordonnancementDate: '2025-10-27',
      paymentDate: '2025-10-28',
      budgetLine: 'Personnel - Primes',
      fiscalYear: '2025',
      department: 'MIN-BUDGET',
      pieceJustificatives: ['Liste_beneficiaires.pdf'],
      notes: 'Paiement effectué'
    }
  ]);

  // Helper: Format currency
  const formatCurrency = (amount: number, currency: Currency = 'CDF'): string => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper: Déterminer la phase depuis le statut
  const getPhaseFromStatus = (status: ExpenseStatus): string => {
    if (status === 'Brouillon') return 'Préparation';
    if (status === 'Engagé') return 'Engagement';
    if (status === 'Liquidé') return 'Liquidation';
    if (status === 'Ordonnancé') return 'Ordonnancement';
    if (status === 'Payé') return 'Paiement';
    if (status === 'Annulé') return 'Annulé';
    return 'Inconnu';
  };

  // Statistiques par phase
  const stats = {
    engagement: {
      count: expenses.filter(e => e.status === 'Engagé').length,
      amount: expenses.filter(e => e.status === 'Engagé').reduce((sum, e) => sum + e.montantEngage, 0)
    },
    liquidation: {
      count: expenses.filter(e => e.status === 'Liquidé').length,
      amount: expenses.filter(e => e.status === 'Liquidé').reduce((sum, e) => sum + e.montantLiquide, 0)
    },
    ordonnancement: {
      count: expenses.filter(e => e.status === 'Ordonnancé').length,
      amount: expenses.filter(e => e.status === 'Ordonnancé').reduce((sum, e) => sum + e.montantOrdonnance, 0)
    },
    paiement: {
      count: expenses.filter(e => e.status === 'Payé').length,
      amount: expenses.filter(e => e.status === 'Payé').reduce((sum, e) => sum + e.montantPaye, 0)
    },
    total: {
      count: expenses.length,
      amount: expenses.reduce((sum, e) => sum + e.montantDemande, 0)
    }
  };

  // Handler: Export Excel
  const handleExportAll = () => {
    const data = expenses.map(exp => ({
      Numéro: exp.expenseNumber,
      Catégorie: exp.category,
      Description: exp.description,
      Fournisseur: exp.vendor.name,
      'Montant Demandé': exp.montantDemande,
      'Montant Engagé': exp.montantEngage,
      'Montant Liquidé': exp.montantLiquide,
      'Montant Payé': exp.montantPaye,
      Devise: exp.currency,
      Statut: exp.status,
      Phase: getPhaseFromStatus(exp.status),
      'Date Demande': exp.requestDate,
      'Date Paiement': exp.paymentDate || 'N/A'
    }));
    exportToExcel(data, generateFilename('cycle_depenses'));
  };

  // KPIs avancés
  const kpisAvances = useMemo(() => {
    const totalBudget = 25000000; // Budget total alloué
    const totalEngage = expenses.reduce((sum, e) => sum + e.montantEngage, 0);
    const totalPaye = expenses.reduce((sum, e) => sum + e.montantPaye, 0);
    const disponible = totalBudget - totalEngage;
    const tauxEngagement = totalBudget > 0 ? (totalEngage / totalBudget) * 100 : 0;
    const tauxExecution = totalEngage > 0 ? (totalPaye / totalEngage) * 100 : 0;
    const enAttente = expenses.filter(e => ['Engagé', 'Liquidé', 'Ordonnancé'].includes(e.status)).length;
    const delaiMoyen = 15; // jours (à calculer réellement)
    
    return {
      totalBudget,
      totalEngage,
      totalPaye,
      disponible,
      tauxEngagement,
      tauxExecution,
      enAttente,
      delaiMoyen
    };
  }, [expenses]);

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Cycle complet conforme OHADA : Engagement → Liquidation → Ordonnancement → Paiement
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nouvelle Dépense</span>
          </button>
          <button
            onClick={() => {
              const expenseNumber = prompt('Numéro de la dépense à annuler :');
              if (expenseNumber) {
                const justification = prompt('Justification de l\'annulation :');
                if (justification) {
                  console.log('Annulation dépense:', expenseNumber, justification);
                  alert('Dépense annulée avec succès');
                }
              }
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            title="Annuler une dépense"
            aria-label="Annuler une dépense"
          >
            <XCircle className="h-5 w-5" />
            <span>Annuler Dépense</span>
          </button>
          <button
            onClick={handleExportAll}
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Workflow visuel - 4 phases OHADA */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border-2 border-blue-200">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Cycle de la Dépense Publique (OHADA)
        </h3>
        <div className="flex items-center justify-between">
          {/* Phase 1: Engagement */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${activeTab === 'engagement' ? 'bg-blue-600 border-blue-700 shadow-lg transform scale-105' : 'bg-white border-gray-300 hover:border-blue-400'}`}
                 onClick={() => setActiveTab('engagement')}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${activeTab === 'engagement' ? 'text-white' : 'text-gray-600'}`}>
                  PHASE 1
                </span>
                <Package className={`h-5 w-5 ${activeTab === 'engagement' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <p className={`text-sm font-semibold ${activeTab === 'engagement' ? 'text-white' : 'text-gray-900'}`}>
                Engagement
              </p>
              <p className={`text-xs mt-1 ${activeTab === 'engagement' ? 'text-blue-100' : 'text-gray-600'}`}>
                {stats.engagement.count} dépenses
              </p>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-gray-400 mx-2 flex-shrink-0" />

          {/* Phase 2: Liquidation */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${activeTab === 'liquidation' ? 'bg-yellow-600 border-yellow-700 shadow-lg transform scale-105' : 'bg-white border-gray-300 hover:border-yellow-400'}`}
                 onClick={() => setActiveTab('liquidation')}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${activeTab === 'liquidation' ? 'text-white' : 'text-gray-600'}`}>
                  PHASE 2
                </span>
                <FileText className={`h-5 w-5 ${activeTab === 'liquidation' ? 'text-white' : 'text-yellow-600'}`} />
              </div>
              <p className={`text-sm font-semibold ${activeTab === 'liquidation' ? 'text-white' : 'text-gray-900'}`}>
                Liquidation
              </p>
              <p className={`text-xs mt-1 ${activeTab === 'liquidation' ? 'text-yellow-100' : 'text-gray-600'}`}>
                {stats.liquidation.count} dépenses
              </p>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-gray-400 mx-2 flex-shrink-0" />

          {/* Phase 3: Ordonnancement */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${activeTab === 'ordonnancement' ? 'bg-purple-600 border-purple-700 shadow-lg transform scale-105' : 'bg-white border-gray-300 hover:border-purple-400'}`}
                 onClick={() => setActiveTab('ordonnancement')}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${activeTab === 'ordonnancement' ? 'text-white' : 'text-gray-600'}`}>
                  PHASE 3
                </span>
                <Clock className={`h-5 w-5 ${activeTab === 'ordonnancement' ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <p className={`text-sm font-semibold ${activeTab === 'ordonnancement' ? 'text-white' : 'text-gray-900'}`}>
                Ordonnancement
              </p>
              <p className={`text-xs mt-1 ${activeTab === 'ordonnancement' ? 'text-purple-100' : 'text-gray-600'}`}>
                {stats.ordonnancement.count} dépenses
              </p>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-gray-400 mx-2 flex-shrink-0" />

          {/* Phase 4: Paiement */}
          <div className="flex-1">
            <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${activeTab === 'paiement' ? 'bg-green-600 border-green-700 shadow-lg transform scale-105' : 'bg-white border-gray-300 hover:border-green-400'}`}
                 onClick={() => setActiveTab('paiement')}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${activeTab === 'paiement' ? 'text-white' : 'text-gray-600'}`}>
                  PHASE 4
                </span>
                <CheckCircle className={`h-5 w-5 ${activeTab === 'paiement' ? 'text-white' : 'text-green-600'}`} />
              </div>
              <p className={`text-sm font-semibold ${activeTab === 'paiement' ? 'text-white' : 'text-gray-900'}`}>
                Paiement
              </p>
              <p className={`text-xs mt-1 ${activeTab === 'paiement' ? 'text-green-100' : 'text-gray-600'}`}>
                {stats.paiement.count} dépenses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Dashboard Avancés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl shadow-md border-2 border-indigo-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-indigo-900">Budget Total</p>
            <Target className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900">{formatCurrency(kpisAvances.totalBudget)}</p>
          <p className="text-xs text-indigo-600 mt-1">Alloué pour l'exercice</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md border-2 border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-blue-900">Engagé</p>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(kpisAvances.totalEngage)}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-700">Taux</span>
              <span className="font-bold text-blue-900">{kpisAvances.tauxEngagement.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpisAvances.tauxEngagement, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md border-2 border-green-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-green-900">Payé</p>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(kpisAvances.totalPaye)}</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-green-700">Exécution</span>
              <span className="font-bold text-green-900">{kpisAvances.tauxExecution.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpisAvances.tauxExecution, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl shadow-md border-2 border-orange-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-orange-900">Disponible</p>
            <PieChart className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900">{formatCurrency(kpisAvances.disponible)}</p>
          <p className="text-xs text-orange-600 mt-1">{((kpisAvances.disponible / kpisAvances.totalBudget) * 100).toFixed(1)}% du budget</p>
        </div>
      </div>

      {/* Alertes et Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">En Attente</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{kpisAvances.enAttente}</p>
          <p className="text-xs text-yellow-600 mt-1">Dépenses en cours de traitement</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-purple-800">Délai Moyen</h4>
          </div>
          <p className="text-3xl font-bold text-purple-700">{kpisAvances.delaiMoyen} j</p>
          <p className="text-xs text-purple-600 mt-1">Engagement → Paiement</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-800">Performance</h4>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {kpisAvances.tauxExecution >= 90 ? 'Excellent' : kpisAvances.tauxExecution >= 70 ? 'Bon' : 'Moyen'}
          </p>
          <p className="text-xs text-blue-600 mt-1">Taux d'exécution global</p>
        </div>
      </div>

      {/* KPIs par Phase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md border-2 border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-blue-900">Total Dépenses</p>
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.total.count}</p>
          <p className="text-sm font-semibold text-blue-700 mt-1">
            {formatCurrency(stats.total.amount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md border-2 border-blue-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-blue-900">Engagées</p>
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.engagement.count}</p>
          <p className="text-sm font-semibold text-blue-700 mt-1">
            {formatCurrency(stats.engagement.amount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl shadow-md border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-yellow-900">Liquidées</p>
            <FileText className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.liquidation.count}</p>
          <p className="text-sm font-semibold text-yellow-700 mt-1">
            {formatCurrency(stats.liquidation.amount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-md border-2 border-purple-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-purple-900">Ordonnancées</p>
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.ordonnancement.count}</p>
          <p className="text-sm font-semibold text-purple-700 mt-1">
            {formatCurrency(stats.ordonnancement.amount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md border-2 border-green-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide font-bold text-green-900">Payées</p>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.paiement.count}</p>
          <p className="text-sm font-semibold text-green-700 mt-1">
            {formatCurrency(stats.paiement.amount)}
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, fournisseur, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filtrer par statut"
            title="Sélectionner un statut"
          >
            <option value="Tous">Tous les statuts</option>
            <option value="Brouillon">Brouillon</option>
            <option value="Engagé">Engagé</option>
            <option value="Liquidé">Liquidé</option>
            <option value="Ordonnancé">Ordonnancé</option>
            <option value="Payé">Payé</option>
            <option value="Annulé">Annulé</option>
          </select>

          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtres avancés</span>
          </button>
        </div>
      </div>

      {/* Contenu des onglets (4 phases OHADA) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'engagement' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 flex-1">
                <h4 className="text-sm font-bold text-blue-800 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Phase 1 : Engagement (OHADA)
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Réservation du crédit budgétaire. L'ordonnateur vérifie la disponibilité du budget et engage juridiquement l'administration.
                </p>
              </div>
              <div className="flex items-center space-x-3 ml-4">
                <button
                  onClick={() => setShowBonCommandeModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Bon de Commande</span>
                </button>
                <button
                  onClick={() => setShowEngagementModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvel Engagement</span>
                </button>
              </div>
            </div>
            
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Package className="h-20 w-20 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Engagements</h3>
              <p className="text-gray-600 mb-4">
                Liste des dépenses engagées (crédit budgétaire réservé)
              </p>
              <p className="text-sm text-gray-500">
                {stats.engagement.count} dépense{stats.engagement.count > 1 ? 's' : ''} engagée{stats.engagement.count > 1 ? 's' : ''} - Total: {formatCurrency(stats.engagement.amount)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'liquidation' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 flex-1">
              <h4 className="text-sm font-bold text-yellow-800 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Phase 2 : Liquidation (OHADA)
              </h4>
              <p className="text-xs text-yellow-700 mt-1">
                Vérification du service fait et calcul du montant exact dû. L'ordonnateur contrôle les pièces justificatives et certifie que le service 
                a été effectivement réalisé avant d'autoriser le paiement.
              </p>
            </div>
            <button
              onClick={() => setShowLiquidationModal(true)}
              className="ml-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Liquider</span>
            </button>
            </div>
            
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <FileText className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Liquidations</h3>
              <p className="text-gray-600 mb-4">
                Liste des dépenses liquidées (service fait vérifié)
              </p>
              <p className="text-sm text-gray-500">
                {stats.liquidation.count} dépense{stats.liquidation.count > 1 ? 's' : ''} liquidée{stats.liquidation.count > 1 ? 's' : ''} - Total: {formatCurrency(stats.liquidation.amount)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'ordonnancement' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 flex-1">
              <h4 className="text-sm font-bold text-purple-800 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Phase 3 : Ordonnancement (OHADA)
              </h4>
              <p className="text-xs text-purple-700 mt-1">
                Ordre de payer émis par l'ordonnateur. Le mandat de paiement est transmis au comptable public qui effectuera les contrôles de régularité 
                avant le paiement effectif. Séparation ordonnateur/comptable respectée.
              </p>
            </div>
            <button
              onClick={() => setShowOrdonnancementModal(true)}
              className="ml-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ordonnancer</span>
            </button>
            </div>
            
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Clock className="h-20 w-20 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Ordonnancements</h3>
              <p className="text-gray-600 mb-4">
                Liste des mandats de paiement transmis au comptable
              </p>
              <p className="text-sm text-gray-500">
                {stats.ordonnancement.count} dépense{stats.ordonnancement.count > 1 ? 's' : ''} ordonnancée{stats.ordonnancement.count > 1 ? 's' : ''} - Total: {formatCurrency(stats.ordonnancement.amount)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'paiement' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 flex-1">
              <h4 className="text-sm font-bold text-green-800 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Phase 4 : Paiement (OHADA)
              </h4>
              <p className="text-xs text-green-700 mt-1">
                Paiement effectif réalisé par le comptable public après tous les contrôles de régularité. Le comptable engage sa responsabilité personnelle 
                et pécuniaire. Enregistrement comptable et archivage des documents justificatifs.
              </p>
            </div>
            <button
              onClick={() => setShowPaiementModal(true)}
              className="ml-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Payer</span>
            </button>
            </div>
            
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestion des Paiements</h3>
              <p className="text-gray-600 mb-4">
                Liste des dépenses effectivement payées
              </p>
              <p className="text-sm text-gray-500">
                {stats.paiement.count} dépense{stats.paiement.count > 1 ? 's' : ''} payée{stats.paiement.count > 1 ? 's' : ''} - Total: {formatCurrency(stats.paiement.amount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Engagement D\u00e9pense (Phase 1 OHADA) */}
      {showEngagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="h-6 w-6 mr-2 text-blue-600" />
              Nouvel Engagement de D\u00e9pense (Phase 1 OHADA)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ligne Budg\u00e9taire *</label>
                  <select
                    value={newEngagement.ligneBudgetaire}
                    onChange={(e) => setNewEngagement({...newEngagement, ligneBudgetaire: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-label="Ligne budg\u00e9taire"
                  >
                    <option value="">S\u00e9lectionner...</option>
                    <option value="6211">6211 - Salaires et traitements</option>
                    <option value="6241">6241 - Fournitures de bureau</option>
                    <option value="6251">6251 - \u00c9lectricit\u00e9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cat\u00e9gorie *</label>
                  <select
                    value={newEngagement.categorie}
                    onChange={(e) => setNewEngagement({...newEngagement, categorie: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-label="Cat\u00e9gorie"
                  >
                    <option value="Personnel">Personnel</option>
                    <option value="Fonctionnement">Fonctionnement</option>
                    <option value="Investissement">Investissement</option>
                    <option value="Transfert">Transfert</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur *</label>
                <input
                  type="text"
                  value={newEngagement.fournisseur}
                  onChange={(e) => setNewEngagement({...newEngagement, fournisseur: e.target.value})}
                  placeholder="Nom du fournisseur"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={newEngagement.montant}
                  onChange={(e) => setNewEngagement({...newEngagement, montant: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objet *</label>
                <textarea
                  value={newEngagement.objet}
                  onChange={(e) => setNewEngagement({...newEngagement, objet: e.target.value})}
                  rows={3}
                  placeholder="Description de la d\u00e9pense..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Contr\u00f4le OHADA Phase 1:</strong> Cr\u00e9dit disponible \u2265 Montant. R\u00e9servation du cr\u00e9dit budg\u00e9taire.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEngagementModal(false);
                  setNewEngagement({ ligneBudgetaire: '', categorie: 'Fonctionnement', fournisseur: '', montant: 0, objet: '', pieces: [] });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvel engagement:', newEngagement);
                  setShowEngagementModal(false);
                  setNewEngagement({ ligneBudgetaire: '', categorie: 'Fonctionnement', fournisseur: '', montant: 0, objet: '', pieces: [] });
                }}
                disabled={!newEngagement.ligneBudgetaire || !newEngagement.fournisseur || newEngagement.montant <= 0 || !newEngagement.objet}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium"
              >
                Engager la D\u00e9pense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Liquidation D\u00e9pense (Phase 2 OHADA) */}
      {showLiquidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Liquidation de D\u00e9pense (Phase 2 OHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Engagement *</label>
                <select
                  value={newLiquidation.engagement}
                  onChange={(e) => setNewLiquidation({...newLiquidation, engagement: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Engagement"
                >
                  <option value="">S\u00e9lectionner...</option>
                  <option value="DEP-2025-001">DEP-2025-001 - Salaires personnel</option>
                  <option value="DEP-2025-002">DEP-2025-002 - Fournitures bureau</option>
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newLiquidation.serviceFait}
                    onChange={(e) => setNewLiquidation({...newLiquidation, serviceFait: e.target.checked})}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-blue-900">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Service fait v\u00e9rifi\u00e9 (obligatoire)
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant Liquid\u00e9 (FCFA) *</label>
                <input
                  type="number"
                  value={newLiquidation.montantLiquide}
                  onChange={(e) => setNewLiquidation({...newLiquidation, montantLiquide: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pi\u00e8ces de Contr\u00f4le *</label>
                <textarea
                  value={newLiquidation.piecesControle}
                  onChange={(e) => setNewLiquidation({...newLiquidation, piecesControle: e.target.value})}
                  rows={4}
                  placeholder="Liste des pi\u00e8ces justificatives v\u00e9rifi\u00e9es..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-800">
                  <strong>OHADA Phase 2:</strong> V\u00e9rification obligatoire du service fait avant liquidation.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLiquidationModal(false);
                  setNewLiquidation({ engagement: '', serviceFait: false, montantLiquide: 0, piecesControle: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle liquidation:', newLiquidation);
                  setShowLiquidationModal(false);
                  setNewLiquidation({ engagement: '', serviceFait: false, montantLiquide: 0, piecesControle: '' });
                }}
                disabled={!newLiquidation.engagement || !newLiquidation.serviceFait || newLiquidation.montantLiquide <= 0 || !newLiquidation.piecesControle}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-medium"
              >
                Liquider la D\u00e9pense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ordonnancement (Phase 3 OHADA) */}
      {showOrdonnancementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Edit className="h-6 w-6 mr-2 text-purple-600" />
              Ordonnancement (Phase 3 OHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">D\u00e9pense Liquid\u00e9e *</label>
                <select
                  value={newOrdonnancement.depenseLiquidee}
                  onChange={(e) => setNewOrdonnancement({...newOrdonnancement, depenseLiquidee: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  aria-label="D\u00e9pense liquid\u00e9e"
                >
                  <option value="">S\u00e9lectionner...</option>
                  <option value="DEP-2025-001">DEP-2025-001 - Salaires (Liquid\u00e9e)</option>
                  <option value="DEP-2025-002">DEP-2025-002 - Fournitures (Liquid\u00e9e)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant Ordonn\u00e9 (FCFA) *</label>
                  <input
                    type="number"
                    value={newOrdonnancement.montantOrdonne}
                    onChange={(e) => setNewOrdonnancement({...newOrdonnancement, montantOrdonne: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newOrdonnancement.date}
                    onChange={(e) => setNewOrdonnancement({...newOrdonnancement, date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordonnateur *</label>
                <input
                  type="text"
                  value={newOrdonnancement.ordonnateur}
                  onChange={(e) => setNewOrdonnancement({...newOrdonnancement, ordonnateur: e.target.value})}
                  placeholder="Nom de l'ordonnateur"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">R\u00e9f\u00e9rence</label>
                <input
                  type="text"
                  value={newOrdonnancement.reference}
                  onChange={(e) => setNewOrdonnancement({...newOrdonnancement, reference: e.target.value})}
                  placeholder="Num\u00e9ro d'ordre de paiement"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-800">
                  <strong>OHADA Phase 3:</strong> Signature de l'ordonnateur. S\u00e9paration ordonnateur/comptable respect\u00e9e.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOrdonnancementModal(false);
                  setNewOrdonnancement({ depenseLiquidee: '', montantOrdonne: 0, ordonnateur: '', date: new Date().toISOString().split('T')[0], reference: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvel ordonnancement:', newOrdonnancement);
                  setShowOrdonnancementModal(false);
                  setNewOrdonnancement({ depenseLiquidee: '', montantOrdonne: 0, ordonnateur: '', date: new Date().toISOString().split('T')[0], reference: '' });
                }}
                disabled={!newOrdonnancement.depenseLiquidee || newOrdonnancement.montantOrdonne <= 0 || !newOrdonnancement.ordonnateur}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 font-medium"
              >
                Ordonnancer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paiement (Phase 4 OHADA) */}
      {showPaiementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-orange-600" />
              Paiement (Phase 4 OHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">D\u00e9pense Ordonnanc\u00e9e *</label>
                <select
                  value={newPaiement.depenseOrdonnancee}
                  onChange={(e) => setNewPaiement({...newPaiement, depenseOrdonnancee: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  aria-label="D\u00e9pense ordonnanc\u00e9e"
                >
                  <option value="">S\u00e9lectionner...</option>
                  <option value="DEP-2025-001">DEP-2025-001 - Salaires (Ordonnanc\u00e9e)</option>
                  <option value="DEP-2025-002">DEP-2025-002 - Fournitures (Ordonnanc\u00e9e)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant Pay\u00e9 (FCFA) *</label>
                <input
                  type="number"
                  value={newPaiement.montantPaye}
                  onChange={(e) => setNewPaiement({...newPaiement, montantPaye: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode Paiement *</label>
                  <select
                    value={newPaiement.modePaiement}
                    onChange={(e) => setNewPaiement({...newPaiement, modePaiement: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    aria-label="Mode de paiement"
                  >
                    <option value="Virement">Virement</option>
                    <option value="Ch\u00e8que">Ch\u00e8que</option>
                    <option value="Esp\u00e8ces">Esp\u00e8ces</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banque *</label>
                  <input
                    type="text"
                    value={newPaiement.banque}
                    onChange={(e) => setNewPaiement({...newPaiement, banque: e.target.value})}
                    placeholder="Nom de la banque"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">R\u00e9f\u00e9rence *</label>
                <input
                  type="text"
                  value={newPaiement.reference}
                  onChange={(e) => setNewPaiement({...newPaiement, reference: e.target.value})}
                  placeholder="Num\u00e9ro de transaction"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comptable Public *</label>
                <input
                  type="text"
                  value={newPaiement.comptable}
                  onChange={(e) => setNewPaiement({...newPaiement, comptable: e.target.value})}
                  placeholder="Nom du comptable"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <p className="text-xs text-orange-800">
                  <strong>OHADA Phase 4:</strong> Signature du comptable public. Paiement effectif au fournisseur.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaiementModal(false);
                  setNewPaiement({ depenseOrdonnancee: '', montantPaye: 0, modePaiement: 'Virement', banque: '', reference: '', comptable: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau paiement:', newPaiement);
                  setShowPaiementModal(false);
                  setNewPaiement({ depenseOrdonnancee: '', montantPaye: 0, modePaiement: 'Virement', banque: '', reference: '', comptable: '' });
                }}
                disabled={!newPaiement.depenseOrdonnancee || newPaiement.montantPaye <= 0 || !newPaiement.banque || !newPaiement.reference || !newPaiement.comptable}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 font-medium"
              >
                Effectuer le Paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bon de Commande */}
      {showBonCommandeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ShoppingCart className="h-6 w-6 mr-2 text-indigo-600" />
              G\u00e9n\u00e9rer un Bon de Commande
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur *</label>
                <input
                  type="text"
                  value={newBonCommande.fournisseur}
                  onChange={(e) => setNewBonCommande({...newBonCommande, fournisseur: e.target.value})}
                  placeholder="Nom du fournisseur"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Articles</label>
                {newBonCommande.articles.map((article, index) => (
                  <div key={index} className="grid grid-cols-3 gap-3 mb-2">
                    <input
                      type="text"
                      placeholder="D\u00e9signation"
                      value={article.designation}
                      onChange={(e) => {
                        const newArticles = [...newBonCommande.articles];
                        newArticles[index].designation = e.target.value;
                        setNewBonCommande({...newBonCommande, articles: newArticles});
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Quantit\u00e9"
                      value={article.quantite}
                      onChange={(e) => {
                        const newArticles = [...newBonCommande.articles];
                        newArticles[index].quantite = parseFloat(e.target.value);
                        setNewBonCommande({...newBonCommande, articles: newArticles});
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={article.prixUnitaire}
                      onChange={(e) => {
                        const newArticles = [...newBonCommande.articles];
                        newArticles[index].prixUnitaire = parseFloat(e.target.value);
                        const total = newArticles.reduce((sum, a) => sum + (a.quantite * a.prixUnitaire), 0);
                        setNewBonCommande({...newBonCommande, articles: newArticles, total});
                      }}
                      className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setNewBonCommande({...newBonCommande, articles: [...newBonCommande.articles, { designation: '', quantite: 0, prixUnitaire: 0 }]})}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un article
                </button>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm font-bold text-indigo-900">
                  Total: {newBonCommande.total.toLocaleString()} FCFA
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>March\u00e9s Publics:</strong> G\u00e9n\u00e9ration automatique apr\u00e8s engagement.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBonCommandeModal(false);
                  setNewBonCommande({ fournisseur: '', articles: [{ designation: '', quantite: 0, prixUnitaire: 0 }], total: 0 });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau bon de commande:', newBonCommande);
                  setShowBonCommandeModal(false);
                  setNewBonCommande({ fournisseur: '', articles: [{ designation: '', quantite: 0, prixUnitaire: 0 }], total: 0 });
                }}
                disabled={!newBonCommande.fournisseur || newBonCommande.total <= 0}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 font-medium"
              >
                G\u00e9n\u00e9rer le Bon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
