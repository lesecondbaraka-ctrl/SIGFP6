import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Plus, Search, Download, Eye, Edit, Calculator, X, CheckCircle, AlertTriangle, Clock, FileText, Users, Shield, DollarSign, Target, PieChart, RefreshCw, ArrowUpRight } from 'lucide-react';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';
import { getProgressDataAttrs } from '../../utils/progressBarUtils';
import '../../styles/utilities.css';

// Import des types centralisés (actuellement non utilisés - à migrer)
// import type {
//   RecetteItem as RecetteItemCentral,
//   RecetteType,
//   EncaissementItem as EncaissementItemCentral
// } from '../../types/operations';

// ✅ Interfaces supprimées - Maintenant importées depuis src/types/operations.ts

// Types d'adaptation temporaires pour compatibilité (à migrer progressivement)
interface RecetteItem {
  id: string;
  code: string;
  libelle: string;
  previsionAnnuelle: number;
  realiseADate: number;  // À migrer vers montantConstate + montantLiquide + encaisseADate
  tauxExecution: number;
  entite: string;
  type: 'Fiscale' | 'Non-Fiscale' | 'Exceptionnelle';
  // PRINCIPES DE PRUDENCE COMPTABLE
  coefficientPrudence: number; // Coefficient de minoration (0.8 = -20%)
  provisionCreancesDouteuses: number; // Provision pour créances douteuses
  niveauCertitude: 'Certaine' | 'Probable' | 'Incertaine'; // Niveau de certitude
  dateEcheance?: string; // Date d'échéance pour les recettes différées
  risqueRecouvrement: 'Faible' | 'Moyen' | 'Élevé'; // Risque de non-recouvrement
  montantNetPrudentiel: number; // Montant après application du principe de prudence
  // TODO: Migrer vers RecetteItemCentral qui inclut:
  // - montantConstate, montantLiquide, encaisseADate (séparation phases budgétaires)
  // - status, glAccount, etc.
}

interface EncaissementItem {
  id: string;
  date: string;
  reference: string;
  montant: number;
  recetteId: string;
  statut: 'Encaissé' | 'En attente' | 'Annulé';
  // TODO: Migrer vers EncaissementItemCentral qui inclut:
  // - numeroEncaissement, paymentMethod, bankAccount
  // - validationDate, ecritureComptableId, etc.
}

// Interface pour la liquidation des recettes
interface LiquidationItem {
  id: string;
  recetteId: string;
  dateConstatation: string;
  dateLiquidation?: string;
  montantConstate: number;
  montantLiquide: number;
  tauxLiquidation: number;
  statut: 'En attente' | 'En cours' | 'Validée' | 'Rejetée';
  validateur?: string;
  motifRejet?: string;
  pieceJustificative: string;
  observationsControle: string;
  priorite: 'Haute' | 'Normale' | 'Basse';
  dateEcheance: string;
  penalitesCalculees: number;
  fraisRecouvrement: number;
}

// Dashboard KPIs Component
const DashboardRecettes = ({ recettes }: { recettes: RecetteItem[] }) => {
  const kpis = useMemo(() => {
    const totalPrevision = recettes.reduce((sum, r) => sum + r.previsionAnnuelle, 0);
    const totalRealise = recettes.reduce((sum, r) => sum + r.realiseADate, 0);
    const totalPrudentiel = recettes.reduce((sum, r) => sum + r.montantNetPrudentiel, 0);
    const totalProvisions = recettes.reduce((sum, r) => sum + r.provisionCreancesDouteuses, 0);
    const tauxRealisationGlobal = totalPrevision > 0 ? (totalRealise / totalPrevision) * 100 : 0;
    const impactPrudence = totalPrevision > 0 ? ((totalPrevision - totalPrudentiel) / totalPrevision) * 100 : 0;
    
    const recettesIncertaines = recettes.filter(r => r.niveauCertitude === 'Incertaine').length;
    const recettesRisqueEleve = recettes.filter(r => r.risqueRecouvrement === 'Élevé').length;
    
    return {
      totalPrevision,
      totalRealise,
      totalPrudentiel,
      totalProvisions,
      tauxRealisationGlobal,
      impactPrudence,
      recettesIncertaines,
      recettesRisqueEleve,
      ecart: totalPrevision - totalRealise
    };
  }, [recettes]);

  const getStatutColor = (taux: number) => {
    if (taux >= 95) return 'text-green-600';
    if (taux >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded">Prévision</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Recettes Prévues</h3>
          <p className="text-2xl font-bold text-blue-700">{kpis.totalPrevision.toLocaleString()} CDF</p>
          <p className="text-xs text-gray-500 mt-1">Budget annuel</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded">Réalisé</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Recettes Réalisées</h3>
          <p className="text-2xl font-bold text-green-700">{kpis.totalRealise.toLocaleString()} CDF</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Taux</span>
              <span className={`font-medium ${getStatutColor(kpis.tauxRealisationGlobal)}`}>
                {kpis.tauxRealisationGlobal.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpis.tauxRealisationGlobal, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded">Prudentiel</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Montant Prudentiel</h3>
          <p className="text-2xl font-bold text-purple-700">{kpis.totalPrudentiel.toLocaleString()} CDF</p>
          <p className="text-xs text-gray-500 mt-1">
            Impact: -{kpis.impactPrudence.toFixed(1)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <Calculator className="w-8 h-8 text-orange-600" />
            <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded">Provisions</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Provisions Créances</h3>
          <p className="text-2xl font-bold text-orange-700">{kpis.totalProvisions.toLocaleString()} CDF</p>
          <p className="text-xs text-gray-500 mt-1">Créances douteuses</p>
        </div>
      </div>

      {/* Alertes et Risques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Recettes Incertaines</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{kpis.recettesIncertaines}</p>
          <p className="text-xs text-yellow-600 mt-1">Nécessitent attention</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Risque Élevé</h4>
          </div>
          <p className="text-3xl font-bold text-red-700">{kpis.recettesRisqueEleve}</p>
          <p className="text-xs text-red-600 mt-1">Recouvrement difficile</p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-600" />
            <h4 className="font-medium text-indigo-800">Écart à Combler</h4>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{kpis.ecart.toLocaleString()} CDF</p>
          <p className="text-xs text-indigo-600 mt-1">Prévision - Réalisé</p>
        </div>
      </div>

      {/* Répartition par Type */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Répartition par Type de Recette</h3>
        <div className="space-y-3">
          {['Fiscale', 'Non-Fiscale', 'Exceptionnelle'].map(type => {
            const recettesType = recettes.filter(r => r.type === type);
            const totalType = recettesType.reduce((sum, r) => sum + r.realiseADate, 0);
            const pourcentage = kpis.totalRealise > 0 ? (totalType / kpis.totalRealise) * 100 : 0;
            
            return (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{type}</span>
                  <span className="text-gray-600">
                    {totalType.toLocaleString()} CDF ({pourcentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      type === 'Fiscale' ? 'bg-blue-600' :
                      type === 'Non-Fiscale' ? 'bg-green-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${pourcentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function RecettesModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Toutes');
  
  // États pour les modals
  const [showNewRecetteModal, setShowNewRecetteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecette, setSelectedRecette] = useState<RecetteItem | null>(null);
  const [showNewEncaissementModal, setShowNewEncaissementModal] = useState(false);
  
  // États pour la liquidation
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [selectedLiquidation, setSelectedLiquidation] = useState<LiquidationItem | null>(null);
  const [liquidationFilter, setLiquidationFilter] = useState('Toutes');
  const [liquidationSearch, setLiquidationSearch] = useState('');
  
  // États pour les nouveaux formulaires OHADA
  const [showConstatationModal, setShowConstatationModal] = useState(false);
  const [showLiquidationFormModal, setShowLiquidationFormModal] = useState(false);
  const [showEncaissementFormModal, setShowEncaissementFormModal] = useState(false);
  const [showTitreRecetteModal, setShowTitreRecetteModal] = useState(false);
  
  const [newConstatation, setNewConstatation] = useState({
    type: 'Fiscale' as 'Fiscale' | 'Non-Fiscale' | 'Exceptionnelle',
    libelle: '',
    montant: 0,
    debiteur: '',
    dateConstatation: new Date().toISOString().split('T')[0],
    pieceJustificative: ''
  });
  
  const [newLiquidation, setNewLiquidation] = useState({
    recetteConstatee: '',
    montantLiquide: 0,
    controlesEffectues: '',
    validateur: ''
  });
  
  const [newEncaissement, setNewEncaissement] = useState({
    recetteLiquidee: '',
    montantEncaisse: 0,
    modePaiement: 'Virement' as 'Virement' | 'Chèque' | 'Espèces' | 'Carte',
    banque: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [newTitreRecette, setNewTitreRecette] = useState({
    numeroTitre: '',
    debiteur: '',
    montant: 0,
    echeance: '',
    objet: ''
  });
  
  // Handlers
  const handleViewDetails = (recette: RecetteItem) => {
    setSelectedRecette(recette);
    setShowDetailModal(true);
  };
  
  const handleExportAll = () => {
    const data = recettes.map(r => ({
      Code: r.code,
      Libellé: r.libelle,
      Type: r.type,
      'Prévision Annuelle': r.previsionAnnuelle,
      'Montant Prudentiel': r.montantNetPrudentiel,
      'Coefficient Prudence': r.coefficientPrudence,
      'Provision Créances': r.provisionCreancesDouteuses,
      'Réalisé': r.realiseADate,
      'Taux Exécution': `${r.tauxExecution}%`,
      'Niveau Certitude': r.niveauCertitude,
      'Risque Recouvrement': r.risqueRecouvrement,
      Entité: r.entite
    }));
    exportToExcel(data, generateFilename('recettes_prudence_export'));
  };

  // Données conformes au plan comptable OHADA - Classe 7 (Produits) + Principes de Prudence
  const recettes: RecetteItem[] = [
    {
      id: '701',
      code: '701',
      libelle: 'Ventes de marchandises',
      previsionAnnuelle: 2500000000,
      realiseADate: 1850000000,
      tauxExecution: 74,
      entite: 'MIN-BUDGET',
      type: 'Non-Fiscale',
      // PRINCIPES DE PRUDENCE
      coefficientPrudence: 0.95, // Prudence modérée (-5%)
      provisionCreancesDouteuses: 125000000, // 5% de provision
      niveauCertitude: 'Probable',
      risqueRecouvrement: 'Faible',
      montantNetPrudentiel: 2375000000 // 2.5M * 0.95
    },
    {
      id: '702',
      code: '702',
      libelle: 'Ventes de produits finis',
      previsionAnnuelle: 1800000000,
      realiseADate: 1200000000,
      tauxExecution: 67,
      entite: 'MIN-BUDGET',
      type: 'Non-Fiscale',
      // PRINCIPES DE PRUDENCE
      coefficientPrudence: 0.90, // Prudence élevée (-10%)
      provisionCreancesDouteuses: 180000000, // 10% de provision
      niveauCertitude: 'Probable',
      risqueRecouvrement: 'Moyen',
      montantNetPrudentiel: 1620000000 // 1.8M * 0.90
    },
    {
      id: '706',
      code: '706',
      libelle: 'Prestations de services',
      previsionAnnuelle: 950000000,
      realiseADate: 720000000,
      tauxExecution: 76,
      entite: 'MIN-BUDGET',
      type: 'Non-Fiscale',
      // PRINCIPES DE PRUDENCE
      coefficientPrudence: 0.92, // Prudence modérée (-8%)
      provisionCreancesDouteuses: 76000000, // 8% de provision
      niveauCertitude: 'Probable',
      risqueRecouvrement: 'Moyen',
      montantNetPrudentiel: 874000000 // 950K * 0.92
    },
    {
      id: '741',
      code: '741',
      libelle: 'Subventions d\'exploitation',
      previsionAnnuelle: 5000000000,
      realiseADate: 3750000000,
      tauxExecution: 75,
      entite: 'MIN-BUDGET',
      type: 'Exceptionnelle',
      // PRINCIPES DE PRUDENCE - Recettes exceptionnelles = plus de prudence
      coefficientPrudence: 0.80, // Prudence très élevée (-20%)
      provisionCreancesDouteuses: 1000000000, // 20% de provision
      niveauCertitude: 'Incertaine',
      dateEcheance: '2024-12-31',
      risqueRecouvrement: 'Élevé',
      montantNetPrudentiel: 4000000000 // 5M * 0.80
    },
    {
      id: '771',
      code: '771',
      libelle: 'Produits exceptionnels sur opérations de gestion',
      previsionAnnuelle: 300000000,
      realiseADate: 180000000,
      tauxExecution: 60,
      entite: 'MIN-BUDGET',
      type: 'Exceptionnelle',
      // PRINCIPES DE PRUDENCE - Produits exceptionnels = maximum de prudence
      coefficientPrudence: 0.70, // Prudence maximale (-30%)
      provisionCreancesDouteuses: 90000000, // 30% de provision
      niveauCertitude: 'Incertaine',
      dateEcheance: '2024-06-30',
      risqueRecouvrement: 'Élevé',
      montantNetPrudentiel: 210000000 // 300K * 0.70
    }
  ];

  // Données de liquidation des recettes
  const liquidations: LiquidationItem[] = [
    {
      id: 'LIQ-001',
      recetteId: '701',
      dateConstatation: '2024-01-10',
      dateLiquidation: '2024-01-12',
      montantConstate: 500000000,
      montantLiquide: 485000000,
      tauxLiquidation: 97,
      statut: 'Validée',
      validateur: 'Marie KABILA',
      pieceJustificative: 'Facture F-2024-001',
      observationsControle: 'Contrôle réalisé - Conforme',
      priorite: 'Haute',
      dateEcheance: '2024-01-31',
      penalitesCalculees: 0,
      fraisRecouvrement: 15000000
    },
    {
      id: 'LIQ-002',
      recetteId: '702',
      dateConstatation: '2024-01-15',
      montantConstate: 300000000,
      montantLiquide: 295000000,
      tauxLiquidation: 98,
      statut: 'En cours',
      pieceJustificative: 'Contrat C-2024-002',
      observationsControle: 'Vérification en cours des pièces justificatives',
      priorite: 'Normale',
      dateEcheance: '2024-02-15',
      penalitesCalculees: 5000000,
      fraisRecouvrement: 10000000
    },
    {
      id: 'LIQ-003',
      recetteId: '741',
      dateConstatation: '2024-01-20',
      montantConstate: 1000000000,
      montantLiquide: 0,
      tauxLiquidation: 0,
      statut: 'En attente',
      pieceJustificative: 'Convention CONV-2024-003',
      observationsControle: 'En attente de validation hiérarchique',
      priorite: 'Haute',
      dateEcheance: '2024-03-01',
      penalitesCalculees: 0,
      fraisRecouvrement: 25000000
    },
    {
      id: 'LIQ-004',
      recetteId: '771',
      dateConstatation: '2024-01-25',
      montantConstate: 150000000,
      montantLiquide: 0,
      tauxLiquidation: 0,
      statut: 'Rejetée',
      motifRejet: 'Pièces justificatives incomplètes',
      pieceJustificative: 'Dossier incomplet',
      observationsControle: 'Rejet - Documents manquants',
      priorite: 'Basse',
      dateEcheance: '2024-02-28',
      penalitesCalculees: 7500000,
      fraisRecouvrement: 5000000
    }
  ];

  const encaissements: EncaissementItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      reference: 'ENC-2024-001',
      montant: 450000000,
      recetteId: '701',
      statut: 'Encaissé'
    },
    {
      id: '2',
      date: '2024-01-20',
      reference: 'ENC-2024-002',
      montant: 300000000,
      recetteId: '702',
      statut: 'Encaissé'
    },
    {
      id: '3',
      date: '2024-01-25',
      reference: 'ENC-2024-003',
      montant: 1250000000,
      recetteId: '741',
      statut: 'En attente'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (statut: string) => {
    const styles = {
      'Encaissé': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Annulé': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      'Fiscale': 'bg-blue-100 text-blue-800',
      'Non-Fiscale': 'bg-purple-100 text-purple-800',
      'Exceptionnelle': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {type}
      </span>
    );
  };

  // Calculs avec principes de prudence comptable
  const stats = {
    totalPrevisions: recettes.reduce((sum, r) => sum + r.previsionAnnuelle, 0),
    totalRealise: recettes.reduce((sum, r) => sum + r.realiseADate, 0),
    tauxExecutionMoyen: recettes.reduce((sum, r) => sum + r.tauxExecution, 0) / recettes.length,
    nombreRecettes: recettes.length,
    // NOUVEAUX INDICATEURS DE PRUDENCE
    totalPrudentiel: recettes.reduce((sum, r) => sum + r.montantNetPrudentiel, 0),
    totalProvisions: recettes.reduce((sum, r) => sum + r.provisionCreancesDouteuses, 0),
    recettesCertaines: recettes.filter(r => r.niveauCertitude === 'Certaine').length,
    recettesIncertaines: recettes.filter(r => r.niveauCertitude === 'Incertaine').length,
    risqueGlobal: recettes.filter(r => r.risqueRecouvrement === 'Élevé').length > 0 ? 'Élevé' : 
                  recettes.filter(r => r.risqueRecouvrement === 'Moyen').length > 0 ? 'Moyen' : 'Faible'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Module Recettes</h2>
          <p className="text-gray-600">Gestion des prévisions et encaissements - Conforme OHADA</p>
        </div>
        <button 
          onClick={() => setShowNewRecetteModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle Recette</span>
        </button>
      </div>

      {/* Statistiques avec Principes de Prudence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prévisions Totales</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalPrevisions)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Réalisé à Date</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRealise)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Calculator className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Prudentiel</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalPrudentiel)}</p>
              <p className="text-xs text-gray-500 mt-1">Après provisions</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Provisions Totales</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalProvisions)}</p>
              <p className="text-xs text-gray-500 mt-1">Créances douteuses</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Calculator className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau de Bord Prudence */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="h-5 w-5 text-yellow-600 mr-2" />
          Tableau de Bord - Principes de Prudence Comptable
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-gray-600">Taux d'Exécution</p>
            <p className="text-xl font-bold text-purple-600">{stats.tauxExecutionMoyen.toFixed(1)}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-gray-600">Recettes Incertaines</p>
            <p className="text-xl font-bold text-red-600">{stats.recettesIncertaines}/{stats.nombreRecettes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-gray-600">Niveau de Risque</p>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              stats.risqueGlobal === 'Élevé' ? 'bg-red-100 text-red-800' :
              stats.risqueGlobal === 'Moyen' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {stats.risqueGlobal}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-gray-600">Impact Prudence</p>
            <p className="text-xl font-bold text-orange-600">
              {((1 - stats.totalPrudentiel / stats.totalPrevisions) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Alertes Automatiques - Principes de Prudence */}
      {(stats.risqueGlobal === 'Élevé' || stats.recettesIncertaines > 0 || ((1 - stats.totalPrudentiel / stats.totalPrevisions) * 100) > 15) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Alertes Prudence Comptable</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {stats.risqueGlobal === 'Élevé' && (
                    <li>⚠️ <strong>Risque élevé</strong> détecté sur le portefeuille de recettes</li>
                  )}
                  {stats.recettesIncertaines > 0 && (
                    <li>⚠️ <strong>{stats.recettesIncertaines} recette(s) incertaine(s)</strong> nécessitent une attention particulière</li>
                  )}
                  {((1 - stats.totalPrudentiel / stats.totalPrevisions) * 100) > 15 && (
                    <li>⚠️ <strong>Impact prudence élevé</strong> ({((1 - stats.totalPrudentiel / stats.totalPrevisions) * 100).toFixed(1)}%) - Révision des prévisions recommandée</li>
                  )}
                  {recettes.some(r => r.dateEcheance && new Date(r.dateEcheance) < new Date()) && (
                    <li>⚠️ <strong>Recettes échues</strong> détectées - Vérification du recouvrement nécessaire</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglets - Architecture cible OHADA: 3 phases budgétaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PieChart className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('constatation')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'constatation'
                  ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Constatation</span>
            </button>
            <button
              onClick={() => setActiveTab('liquidation')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'liquidation'
                  ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Edit className="h-4 w-4" />
              <span>Liquidation</span>
            </button>
            <button
              onClick={() => setActiveTab('encaissements')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'encaissements'
                  ? 'border-b-2 border-green-600 text-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Encaissement</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardRecettes recettes={recettes} />
          )}
          
          {activeTab === 'constatation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 flex-1">
                  <h4 className="text-sm font-bold text-blue-800">Phase 1: Constatation des Droits</h4>
                  <p className="text-xs text-blue-700 mt-1">Identification et constatation des droits à recouvrer conformément au plan comptable OHADA Classe 7</p>
                </div>
                <button
                  onClick={() => setShowConstatationModal(true)}
                  className="ml-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle Recette</span>
                </button>
              </div>
              {/* Contenu Constatation - Réutiliser l'ancien code prévisions */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une recette..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-label="Filtrer par type de recette"
                  title="Sélectionner le type de recette"
                >
                  <option value="Toutes">Tous types</option>
                  <option value="Fiscale">Fiscale</option>
                  <option value="Non-Fiscale">Non-Fiscale</option>
                  <option value="Exceptionnelle">Exceptionnelle</option>
                </select>

                <button
                  onClick={() => setShowNewRecetteModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvelle Recette</span>
                </button>

                <button
                  onClick={handleExportAll}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </button>
              </div>

              {/* Tableau des recettes constatées */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prévision</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prudentiel</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Réalisé</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Certitude</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Risque</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recettes
                      .filter(r => selectedType === 'Toutes' || r.type === selectedType)
                      .filter(r => r.libelle.toLowerCase().includes(searchTerm.toLowerCase()) || r.code.includes(searchTerm))
                      .map((recette) => (
                        <tr key={recette.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{recette.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{recette.libelle}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              recette.type === 'Fiscale' ? 'bg-blue-100 text-blue-800' :
                              recette.type === 'Non-Fiscale' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {recette.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(recette.previsionAnnuelle)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-orange-600">
                            {formatCurrency(recette.montantNetPrudentiel)}
                            <div className="text-xs text-gray-500">-{((1-recette.coefficientPrudence)*100).toFixed(0)}%</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                            {formatCurrency(recette.realiseADate)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              recette.niveauCertitude === 'Certaine' ? 'bg-green-100 text-green-800' :
                              recette.niveauCertitude === 'Probable' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {recette.niveauCertitude}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              recette.risqueRecouvrement === 'Faible' ? 'bg-green-100 text-green-800' :
                              recette.risqueRecouvrement === 'Moyen' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {recette.risqueRecouvrement}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(recette)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-gray-800"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'liquidation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 flex-1">
                  <h4 className="text-sm font-bold text-yellow-800">Phase 2: Liquidation des Droits</h4>
                  <p className="text-xs text-yellow-700 mt-1">Vérification et validation des montants à encaisser</p>
                </div>
                <button
                  onClick={() => setShowLiquidationFormModal(true)}
                  className="ml-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Liquider</span>
                </button>
              </div>

              {/* KPIs Liquidation */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Attente</p>
                      <p className="text-xl font-bold text-blue-600">{liquidations.filter(l => l.statut === 'En attente').length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En Cours</p>
                      <p className="text-xl font-bold text-yellow-600">{liquidations.filter(l => l.statut === 'En cours').length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Validées</p>
                      <p className="text-xl font-bold text-green-600">{liquidations.filter(l => l.statut === 'Validée').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejetées</p>
                      <p className="text-xl font-bold text-red-600">{liquidations.filter(l => l.statut === 'Rejetée').length}</p>
                    </div>
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Workflow d'approbation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  Workflow d'Approbation OHADA
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                      <p className="text-xs text-center mt-2 font-medium">Constatation</p>
                    </div>
                    <div className="w-8 h-0.5 bg-blue-300"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                      <p className="text-xs text-center mt-2 font-medium">Vérification</p>
                    </div>
                    <div className="w-8 h-0.5 bg-yellow-300"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                      <p className="text-xs text-center mt-2 font-medium">Validation</p>
                    </div>
                    <div className="w-8 h-0.5 bg-orange-300"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                      <p className="text-xs text-center mt-2 font-medium">Liquidation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtres et actions */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une liquidation..."
                    value={liquidationSearch}
                    onChange={(e) => setLiquidationSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={liquidationFilter}
                  onChange={(e) => setLiquidationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  aria-label="Filtrer par statut de liquidation"
                  title="Sélectionner le statut de liquidation"
                >
                  <option value="Toutes">Tous statuts</option>
                  <option value="En attente">En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Validée">Validées</option>
                  <option value="Rejetée">Rejetées</option>
                </select>

                <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Rapport Contrôle</span>
                </button>
              </div>

              {/* Tableau des liquidations */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-yellow-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recette</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Constaté</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Liquidé</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Taux</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Échéance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liquidations
                      .filter(l => liquidationFilter === 'Toutes' || l.statut === liquidationFilter)
                      .filter(l => l.id.toLowerCase().includes(liquidationSearch.toLowerCase()) || 
                                  recettes.find(r => r.id === l.recetteId)?.libelle.toLowerCase().includes(liquidationSearch.toLowerCase()))
                      .map((liquidation) => {
                        const recette = recettes.find(r => r.id === liquidation.recetteId);
                        return (
                          <tr key={liquidation.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{liquidation.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="font-medium">{recette?.code} - {recette?.libelle}</div>
                              <div className="text-xs text-gray-500">{liquidation.pieceJustificative}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                              {formatCurrency(liquidation.montantConstate)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(liquidation.montantLiquide)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 progress-bar-dynamic ${
                                      liquidation.tauxLiquidation >= 95 ? 'bg-green-600' :
                                      liquidation.tauxLiquidation >= 80 ? 'bg-yellow-600' :
                                      'bg-red-600'
                                    }`}
                                    {...getProgressDataAttrs(liquidation.tauxLiquidation)}
                                    data-progress={liquidation.tauxLiquidation}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-gray-700">{liquidation.tauxLiquidation}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                liquidation.statut === 'Validée' ? 'bg-green-100 text-green-800' :
                                liquidation.statut === 'En cours' ? 'bg-yellow-100 text-yellow-800' :
                                liquidation.statut === 'En attente' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {liquidation.statut}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                liquidation.priorite === 'Haute' ? 'bg-red-100 text-red-800' :
                                liquidation.priorite === 'Normale' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {liquidation.priorite}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className={`font-medium ${
                                new Date(liquidation.dateEcheance) < new Date() ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {liquidation.dateEcheance}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedLiquidation(liquidation);
                                    setShowLiquidationModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Voir détails"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {liquidation.statut === 'En attente' && (
                                  <button
                                    className="text-green-600 hover:text-green-800"
                                    title="Valider"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Outils de calcul et vérification */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 text-indigo-600 mr-2" />
                  Outils de Calcul et Vérification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Calculs Automatiques</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Pénalités de retard</li>
                      <li>• Frais de recouvrement</li>
                      <li>• Intérêts moratoires</li>
                      <li>• Taux de liquidation</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Contrôles Qualité</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Vérification pièces</li>
                      <li>• Validation juridique</li>
                      <li>• Contrôle cohérence</li>
                      <li>• Audit conformité</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Rapports Générés</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• État des liquidations</li>
                      <li>• Rapport de contrôle</li>
                      <li>• Suivi des échéances</li>
                      <li>• Analyse des rejets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ancien onglet prévisions désactivé */}
          {activeTab === 'previsions_old' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une recette..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  aria-label="Filtrer par type de recette"
                  title="Sélectionner le type de recette"
                >
                  <option value="Toutes">Tous types</option>
                  <option value="Fiscale">Fiscale</option>
                  <option value="Non-Fiscale">Non-Fiscale</option>
                  <option value="Exceptionnelle">Exceptionnelle</option>
                </select>

                <button 
                  onClick={handleExportAll}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </button>
              </div>

              {/* Tableau des prévisions */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code OHADA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prévision Annuelle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Réalisé à Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taux d'Exécution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recettes.map((recette) => (
                      <tr key={recette.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {recette.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{recette.libelle}</div>
                          <div className="text-sm text-gray-500">{recette.entite}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(recette.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(recette.previsionAnnuelle)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(recette.realiseADate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full progress-bar" 
                                data-width={Math.round(Math.min(recette.tauxExecution, 100) / 5) * 5}
                                role="progressbar"
                                aria-label={`Taux d'exécution: ${recette.tauxExecution}%`}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{recette.tauxExecution}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewDetails(recette)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir les détails"
                              aria-label="Voir les détails de la recette"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Modifier"
                              aria-label="Modifier la recette"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'encaissements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 flex-1">
                  <h4 className="text-sm font-bold text-purple-800">Phase 3: Encaissement</h4>
                  <p className="text-xs text-purple-700 mt-1">Enregistrement des paiements reçus</p>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <button
                    onClick={() => setShowTitreRecetteModal(true)}
                    className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Émettre Titre</span>
                  </button>
                  <button
                    onClick={() => setShowEncaissementFormModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Encaisser</span>
                  </button>
                </div>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                <h4 className="text-sm font-bold text-green-800">Phase 3: Encaissement</h4>
                <p className="text-xs text-green-700 mt-1">Recouvrement effectif des recettes et enregistrement des encaissements</p>
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historique des Encaissements</h3>
                <button
                  onClick={() => setShowNewEncaissementModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  title="Nouvel encaissement"
                  aria-label="Ouvrir le formulaire d'encaissement"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvel Encaissement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ligne Budgétaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {encaissements.map((encaissement) => {
                      const recette = recettes.find(r => r.id === encaissement.recetteId);
                      return (
                        <tr key={encaissement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {encaissement.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {encaissement.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{recette?.code} - {recette?.libelle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(encaissement.montant)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(encaissement.statut)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                title="Voir les détails"
                                aria-label="Voir les détails de l'encaissement"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-900"
                                title="Télécharger"
                                aria-label="Télécharger le reçu"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ancien onglet encaissements conservé */}
          {activeTab === 'encaissements_content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historique des Encaissements</h3>
                <button
                  onClick={() => setShowNewEncaissementModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  title="Nouvel encaissement"
                  aria-label="Ouvrir le formulaire d'encaissement"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouvel Encaissement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ligne Budgétaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {encaissements.map((encaissement) => {
                      const recette = recettes.find(r => r.id === encaissement.recetteId);
                      return (
                        <tr key={encaissement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {encaissement.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {encaissement.reference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{recette?.code} - {recette?.libelle}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                            {formatCurrency(encaissement.montant)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(encaissement.statut)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button 
                                className="text-blue-600 hover:text-blue-900"
                                title="Voir les détails"
                                aria-label="Voir les détails de l'encaissement"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-green-600 hover:text-green-900"
                                title="Télécharger"
                                aria-label="Télécharger le reçu"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouvelle Recette */}
      {showNewRecetteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Nouvelle Recette</h3>
              <button onClick={() => setShowNewRecetteModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code OHADA</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Ex: 701" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de Recette</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Type" aria-label="Sélectionner le type">
                    <option>Fiscale</option>
                    <option>Non Fiscale</option>
                    <option>Dons et Subventions</option>
                    <option>Exceptionnelle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Ex: Ventes de marchandises" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prévision Annuelle (CDF)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entité</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Entité" aria-label="Sélectionner l'entité">
                    <option>MIN-BUDGET</option>
                    <option>MIN-FINANCE</option>
                    <option>MIN-SANTE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" rows={3} placeholder="Description de la recette"></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowNewRecetteModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvel Encaissement */}
      {showNewEncaissementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Nouvel Encaissement</h3>
              <button onClick={() => setShowNewEncaissementModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ligne Budgétaire (OHADA)</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Ligne budgétaire" aria-label="Sélectionner la ligne budgétaire">
                    {recettes.map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.libelle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'encaissement</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Date d'encaissement" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="0" title="Montant" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Devise" aria-label="Sélectionner la devise">
                    <option>CDF</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Référence Bancaire</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Ex: ENC-2024-045" title="Référence" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pièce Justificative</label>
                <input type="file" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" title="Pièce justificative" aria-label="Télécharger la pièce justificative" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowNewEncaissementModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Liquidation */}
      {showLiquidationModal && selectedLiquidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Détails de la Liquidation - {selectedLiquidation.id}</h3>
              <button onClick={() => setShowLiquidationModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-4 w-4 text-blue-600 mr-2" />
                    Informations Générales
                  </h4>
                  <dl className="space-y-2">
                    <div><dt className="text-sm text-gray-600">Référence:</dt><dd className="text-sm font-medium">{selectedLiquidation.id}</dd></div>
                    <div><dt className="text-sm text-gray-600">Recette:</dt><dd className="text-sm font-medium">{recettes.find(r => r.id === selectedLiquidation.recetteId)?.code} - {recettes.find(r => r.id === selectedLiquidation.recetteId)?.libelle}</dd></div>
                    <div><dt className="text-sm text-gray-600">Date Constatation:</dt><dd className="text-sm font-medium">{selectedLiquidation.dateConstatation}</dd></div>
                    <div><dt className="text-sm text-gray-600">Date Liquidation:</dt><dd className="text-sm font-medium">{selectedLiquidation.dateLiquidation || 'En attente'}</dd></div>
                    <div><dt className="text-sm text-gray-600">Pièce Justificative:</dt><dd className="text-sm font-medium">{selectedLiquidation.pieceJustificative}</dd></div>
                  </dl>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calculator className="h-4 w-4 text-green-600 mr-2" />
                    Montants et Calculs
                  </h4>
                  <dl className="space-y-2">
                    <div><dt className="text-sm text-gray-600">Montant Constaté:</dt><dd className="text-sm font-medium">{formatCurrency(selectedLiquidation.montantConstate)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Montant Liquidé:</dt><dd className="text-sm font-medium text-green-600">{formatCurrency(selectedLiquidation.montantLiquide)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Taux de Liquidation:</dt><dd className="text-sm font-medium">{selectedLiquidation.tauxLiquidation}%</dd></div>
                    <div><dt className="text-sm text-gray-600">Pénalités:</dt><dd className="text-sm font-medium text-red-600">{formatCurrency(selectedLiquidation.penalitesCalculees)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Frais Recouvrement:</dt><dd className="text-sm font-medium text-orange-600">{formatCurrency(selectedLiquidation.fraisRecouvrement)}</dd></div>
                  </dl>
                </div>
              </div>

              {/* Statut et validation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="h-4 w-4 text-blue-600 mr-2" />
                  Statut et Validation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Statut Actuel</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedLiquidation.statut === 'Validée' ? 'bg-green-100 text-green-800' :
                      selectedLiquidation.statut === 'En cours' ? 'bg-yellow-100 text-yellow-800' :
                      selectedLiquidation.statut === 'En attente' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedLiquidation.statut}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priorité</p>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedLiquidation.priorite === 'Haute' ? 'bg-red-100 text-red-800' :
                      selectedLiquidation.priorite === 'Normale' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedLiquidation.priorite}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Échéance</p>
                    <p className={`text-sm font-medium ${
                      new Date(selectedLiquidation.dateEcheance) < new Date() ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {selectedLiquidation.dateEcheance}
                    </p>
                  </div>
                </div>
                {selectedLiquidation.validateur && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Validateur</p>
                    <p className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 text-blue-600 mr-1" />
                      {selectedLiquidation.validateur}
                    </p>
                  </div>
                )}
              </div>

              {/* Observations et contrôle */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  Observations de Contrôle
                </h4>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                  {selectedLiquidation.observationsControle}
                </p>
                {selectedLiquidation.motifRejet && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-800 mb-1">Motif de Rejet:</p>
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                      {selectedLiquidation.motifRejet}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions recommandées */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Actions Recommandées
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  {selectedLiquidation.statut === 'En attente' && (
                    <li>• Procéder à la vérification des pièces justificatives</li>
                  )}
                  {selectedLiquidation.statut === 'En cours' && (
                    <li>• Finaliser les contrôles de conformité et valider</li>
                  )}
                  {selectedLiquidation.statut === 'Validée' && (
                    <li>• Procéder à l'encaissement de la recette</li>
                  )}
                  {selectedLiquidation.statut === 'Rejetée' && (
                    <li>• Compléter le dossier selon les observations</li>
                  )}
                  {new Date(selectedLiquidation.dateEcheance) < new Date() && (
                    <li>• ⚠️ Recette échue - Action urgente requise</li>
                  )}
                  {selectedLiquidation.penalitesCalculees > 0 && (
                    <li>• Appliquer les pénalités de retard calculées</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              {selectedLiquidation.statut === 'En attente' && (
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Valider</span>
                </button>
              )}
              {selectedLiquidation.statut === 'En cours' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </button>
              )}
              <button onClick={() => setShowLiquidationModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Recette */}
      {showDetailModal && selectedRecette && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Détails de la Recette</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Informations Générales</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-sm text-gray-600">Code OHADA:</dt><dd className="text-sm font-medium">{selectedRecette.code}</dd></div>
                    <div><dt className="text-sm text-gray-600">Libellé:</dt><dd className="text-sm font-medium">{selectedRecette.libelle}</dd></div>
                    <div><dt className="text-sm text-gray-600">Type:</dt><dd className="text-sm font-medium">{getTypeBadge(selectedRecette.type)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Entité:</dt><dd className="text-sm font-medium">{selectedRecette.entite}</dd></div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Montants</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-sm text-gray-600">Prévision Annuelle:</dt><dd className="text-sm font-medium">{formatCurrency(selectedRecette.previsionAnnuelle)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Montant Prudentiel:</dt><dd className="text-sm font-medium text-orange-600">{formatCurrency(selectedRecette.montantNetPrudentiel)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Provision Créances:</dt><dd className="text-sm font-medium text-red-600">{formatCurrency(selectedRecette.provisionCreancesDouteuses)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Réalisé à Date:</dt><dd className="text-sm font-medium text-green-600">{formatCurrency(selectedRecette.realiseADate)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Reste à Réaliser:</dt><dd className="text-sm font-medium text-orange-600">{formatCurrency(selectedRecette.previsionAnnuelle - selectedRecette.realiseADate)}</dd></div>
                    <div><dt className="text-sm text-gray-600">Taux d'Exécution:</dt><dd className="text-sm font-medium">{selectedRecette.tauxExecution}%</dd></div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Analyse de Prudence</h4>
                  <dl className="space-y-2">
                    <div><dt className="text-sm text-gray-600">Coefficient Prudence:</dt><dd className="text-sm font-medium">{(selectedRecette.coefficientPrudence * 100).toFixed(0)}%</dd></div>
                    <div><dt className="text-sm text-gray-600">Niveau Certitude:</dt><dd className="text-sm font-medium">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedRecette.niveauCertitude === 'Certaine' ? 'bg-green-100 text-green-800' :
                        selectedRecette.niveauCertitude === 'Probable' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedRecette.niveauCertitude}
                      </span>
                    </dd></div>
                    <div><dt className="text-sm text-gray-600">Risque Recouvrement:</dt><dd className="text-sm font-medium">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedRecette.risqueRecouvrement === 'Faible' ? 'bg-green-100 text-green-800' :
                        selectedRecette.risqueRecouvrement === 'Moyen' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedRecette.risqueRecouvrement}
                      </span>
                    </dd></div>
                    {selectedRecette.dateEcheance && (
                      <div><dt className="text-sm text-gray-600">Date Échéance:</dt><dd className="text-sm font-medium">{selectedRecette.dateEcheance}</dd></div>
                    )}
                    <div><dt className="text-sm text-gray-600">Impact Prudence:</dt><dd className="text-sm font-medium text-orange-600">-{((1-selectedRecette.coefficientPrudence)*100).toFixed(1)}%</dd></div>
                  </dl>
                </div>
              </div>
              
              {/* Recommandations basées sur l'analyse de prudence */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Recommandations Comptables</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {selectedRecette.niveauCertitude === 'Incertaine' && (
                    <li>• Suivi renforcé recommandé pour cette recette incertaine</li>
                  )}
                  {selectedRecette.risqueRecouvrement === 'Élevé' && (
                    <li>• Envisager une provision supplémentaire pour risque de non-recouvrement</li>
                  )}
                  {selectedRecette.coefficientPrudence < 0.85 && (
                    <li>• Coefficient de prudence élevé appliqué - Révision des prévisions conseillée</li>
                  )}
                  {selectedRecette.dateEcheance && new Date(selectedRecette.dateEcheance) < new Date() && (
                    <li>• ⚠️ Recette échue - Vérification urgente du statut de recouvrement</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Constatation Recette (Phase 1 OHADA) */}
      {showConstatationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Constatation de Recette (Phase 1 OHADA)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={newConstatation.type}
                    onChange={(e) => setNewConstatation({...newConstatation, type: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-label="Type de recette"
                  >
                    <option value="Fiscale">Fiscale</option>
                    <option value="Non-Fiscale">Non-Fiscale</option>
                    <option value="Exceptionnelle">Exceptionnelle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Constatation *</label>
                  <input
                    type="date"
                    value={newConstatation.dateConstatation}
                    onChange={(e) => setNewConstatation({...newConstatation, dateConstatation: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Libellé *</label>
                <input
                  type="text"
                  value={newConstatation.libelle}
                  onChange={(e) => setNewConstatation({...newConstatation, libelle: e.target.value})}
                  placeholder="Ex: Impôt sur les sociétés T1 2025"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                  <input
                    type="number"
                    value={newConstatation.montant}
                    onChange={(e) => setNewConstatation({...newConstatation, montant: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Débiteur *</label>
                  <input
                    type="text"
                    value={newConstatation.debiteur}
                    onChange={(e) => setNewConstatation({...newConstatation, debiteur: e.target.value})}
                    placeholder="Nom du débiteur"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pièce Justificative *</label>
                <input
                  type="text"
                  value={newConstatation.pieceJustificative}
                  onChange={(e) => setNewConstatation({...newConstatation, pieceJustificative: e.target.value})}
                  placeholder="Référence de la pièce justificative"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>IPSAS 23 + OHADA:</strong> La constatation est la reconnaissance d'un droit acquis. Pièce justificative obligatoire.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConstatationModal(false);
                  setNewConstatation({ type: 'Fiscale', libelle: '', montant: 0, debiteur: '', dateConstatation: new Date().toISOString().split('T')[0], pieceJustificative: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle constatation:', newConstatation);
                  setShowConstatationModal(false);
                  setNewConstatation({ type: 'Fiscale', libelle: '', montant: 0, debiteur: '', dateConstatation: new Date().toISOString().split('T')[0], pieceJustificative: '' });
                }}
                disabled={!newConstatation.libelle || newConstatation.montant <= 0 || !newConstatation.debiteur || !newConstatation.pieceJustificative}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium"
              >
                Constater la Recette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Liquidation Recette (Phase 2 OHADA) */}
      {showLiquidationFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Calculator className="h-6 w-6 mr-2 text-green-600" />
              Liquidation de Recette (Phase 2 OHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recette Constatée *</label>
                <select
                  value={newLiquidation.recetteConstatee}
                  onChange={(e) => setNewLiquidation({...newLiquidation, recetteConstatee: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Recette constatée"
                >
                  <option value="">Sélectionner...</option>
                  <option value="701">701 - Ventes de marchandises</option>
                  <option value="702">702 - Ventes de produits finis</option>
                  <option value="706">706 - Prestations de services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant Liquidé (FCFA) *</label>
                <input
                  type="number"
                  value={newLiquidation.montantLiquide}
                  onChange={(e) => setNewLiquidation({...newLiquidation, montantLiquide: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contrôles Effectués *</label>
                <textarea
                  value={newLiquidation.controlesEffectues}
                  onChange={(e) => setNewLiquidation({...newLiquidation, controlesEffectues: e.target.value})}
                  rows={4}
                  placeholder="Détails des contrôles effectués..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validateur *</label>
                <input
                  type="text"
                  value={newLiquidation.validateur}
                  onChange={(e) => setNewLiquidation({...newLiquidation, validateur: e.target.value})}
                  placeholder="Nom du validateur"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>OHADA Phase 2:</strong> Vérification du service fait et validation du montant à encaisser.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLiquidationFormModal(false);
                  setNewLiquidation({ recetteConstatee: '', montantLiquide: 0, controlesEffectues: '', validateur: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle liquidation:', newLiquidation);
                  setShowLiquidationFormModal(false);
                  setNewLiquidation({ recetteConstatee: '', montantLiquide: 0, controlesEffectues: '', validateur: '' });
                }}
                disabled={!newLiquidation.recetteConstatee || newLiquidation.montantLiquide <= 0 || !newLiquidation.controlesEffectues || !newLiquidation.validateur}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-medium"
              >
                Valider la Liquidation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encaissement (Phase 3 OHADA) */}
      {showEncaissementFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-purple-600" />
              Encaissement (Phase 3 OHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recette Liquidée *</label>
                <select
                  value={newEncaissement.recetteLiquidee}
                  onChange={(e) => setNewEncaissement({...newEncaissement, recetteLiquidee: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  aria-label="Recette liquidée"
                >
                  <option value="">Sélectionner...</option>
                  <option value="701">701 - Ventes de marchandises (Liquidée)</option>
                  <option value="702">702 - Ventes de produits finis (Liquidée)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant Encaissé (FCFA) *</label>
                  <input
                    type="number"
                    value={newEncaissement.montantEncaisse}
                    onChange={(e) => setNewEncaissement({...newEncaissement, montantEncaisse: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newEncaissement.date}
                    onChange={(e) => setNewEncaissement({...newEncaissement, date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode Paiement *</label>
                  <select
                    value={newEncaissement.modePaiement}
                    onChange={(e) => setNewEncaissement({...newEncaissement, modePaiement: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    aria-label="Mode de paiement"
                  >
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Espèces">Espèces</option>
                    <option value="Carte">Carte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banque *</label>
                  <input
                    type="text"
                    value={newEncaissement.banque}
                    onChange={(e) => setNewEncaissement({...newEncaissement, banque: e.target.value})}
                    placeholder="Nom de la banque"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence *</label>
                <input
                  type="text"
                  value={newEncaissement.reference}
                  onChange={(e) => setNewEncaissement({...newEncaissement, reference: e.target.value})}
                  placeholder="Numéro de transaction"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-xs text-green-800">
                  <strong>IPSAS 23 + OHADA Phase 3:</strong> Montant encaissé ≤ Montant liquidé. Traçabilité bancaire obligatoire.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEncaissementFormModal(false);
                  setNewEncaissement({ recetteLiquidee: '', montantEncaisse: 0, modePaiement: 'Virement', banque: '', reference: '', date: new Date().toISOString().split('T')[0] });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvel encaissement:', newEncaissement);
                  setShowEncaissementFormModal(false);
                  setNewEncaissement({ recetteLiquidee: '', montantEncaisse: 0, modePaiement: 'Virement', banque: '', reference: '', date: new Date().toISOString().split('T')[0] });
                }}
                disabled={!newEncaissement.recetteLiquidee || newEncaissement.montantEncaisse <= 0 || !newEncaissement.banque || !newEncaissement.reference}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 font-medium"
              >
                Enregistrer l'Encaissement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Titre de Recette */}
      {showTitreRecetteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-indigo-600" />
              Émettre un Titre de Recette
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numéro Titre *</label>
                  <input
                    type="text"
                    value={newTitreRecette.numeroTitre}
                    onChange={(e) => setNewTitreRecette({...newTitreRecette, numeroTitre: e.target.value})}
                    placeholder="Ex: TR-2025-001"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Échéance *</label>
                  <input
                    type="date"
                    value={newTitreRecette.echeance}
                    onChange={(e) => setNewTitreRecette({...newTitreRecette, echeance: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Débiteur *</label>
                <input
                  type="text"
                  value={newTitreRecette.debiteur}
                  onChange={(e) => setNewTitreRecette({...newTitreRecette, debiteur: e.target.value})}
                  placeholder="Nom du débiteur"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  type="number"
                  value={newTitreRecette.montant}
                  onChange={(e) => setNewTitreRecette({...newTitreRecette, montant: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objet *</label>
                <textarea
                  value={newTitreRecette.objet}
                  onChange={(e) => setNewTitreRecette({...newTitreRecette, objet: e.target.value})}
                  rows={3}
                  placeholder="Objet du titre de recette..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-800">
                  <strong>Comptabilité Publique:</strong> Le titre de recette est généré automatiquement après liquidation.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTitreRecetteModal(false);
                  setNewTitreRecette({ numeroTitre: '', debiteur: '', montant: 0, echeance: '', objet: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau titre de recette:', newTitreRecette);
                  setShowTitreRecetteModal(false);
                  setNewTitreRecette({ numeroTitre: '', debiteur: '', montant: 0, echeance: '', objet: '' });
                }}
                disabled={!newTitreRecette.numeroTitre || !newTitreRecette.debiteur || newTitreRecette.montant <= 0 || !newTitreRecette.echeance || !newTitreRecette.objet}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 font-medium"
              >
                Émettre le Titre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
