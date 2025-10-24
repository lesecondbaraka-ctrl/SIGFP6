import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, CheckCircle, PieChart, BarChart3, Activity, Link2, FileCheck } from 'lucide-react';
import { IntegrationFinanciereService } from '../../services/IntegrationFinanciereService';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';
import { useBilanActif } from '../../hooks/useBilanActif';
import { useBilanPassif } from '../../hooks/useBilanPassif';
import { useCompteResultat } from '../../hooks/useCompteResultat';
import { useFluxTresorerie } from '../../hooks/useFluxTresorerie';
import { useRatiosFinanciers } from '../../hooks/useRatiosFinanciers';
import { prepareExcelData } from '../../utils/exportUtils';
import { RatioFinancier } from '../../types/finance';
import * as XLSX from 'xlsx';

const tabs = ['Dashboard Consolidé', 'Intégration', 'Bilan', 'Compte de Résultat', 'Flux de Trésorerie', 'Indicateurs', 'Analyse Financière'];

// Dashboard Consolidé Component
const DashboardConsolide = () => {
  // Données simulées - à remplacer par vraies données des modules
  const kpisConsolides = useMemo(() => ({
    budget: {
      totalBudgetRevise: 25000000,
      totalEngagement: 20000000,
      totalRealisation: 9200000,
      totalDisponible: 5000000,
      tauxEngagement: 80,
      tauxRealisation: 46,
      lignesAlerte: 2,
      lignesDepassement: 1
    },
    recettes: {
      totalPrevision: 5250000,
      totalRealise: 3770000,
      totalPrudentiel: 4869000,
      tauxRealisation: 71.8,
      recettesIncertaines: 1,
      ecart: 1480000
    },
    depenses: {
      totalBudget: 25000000,
      totalEngage: 20000000,
      totalPaye: 8000000,
      disponible: 5000000,
      tauxEngagement: 80,
      tauxExecution: 40,
      enAttente: 3
    },
    tresorerie: {
      soldeActuel: 5500000,
      recettesMois: 3770000,
      depensesMois: 8000000,
      soldePrevisionnel: 1270000,
      ratioLiquidite: 0.47,
      joursAutonomie: 20
    }
  }), []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-2">Dashboard Consolidé - Vue d'Ensemble</h2>
        <p className="text-indigo-100">Synthèse des indicateurs Budget, Recettes, Dépenses et Trésorerie</p>
      </div>

      {/* Section Budget */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <Target className="w-5 h-5 text-green-600" />
          Module Budget
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Budget Révisé</p>
            <p className="text-2xl font-bold text-green-700">{kpisConsolides.budget.totalBudgetRevise.toLocaleString()} CDF</p>
            <p className="text-xs text-green-600 mt-1">Alloué pour l'exercice</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">Engagements</p>
            <p className="text-2xl font-bold text-blue-700">{kpisConsolides.budget.totalEngagement.toLocaleString()} CDF</p>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${kpisConsolides.budget.tauxEngagement}%` }}></div>
            </div>
            <p className="text-xs text-blue-600 mt-1">{kpisConsolides.budget.tauxEngagement}% du budget</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1">Réalisations</p>
            <p className="text-2xl font-bold text-purple-700">{kpisConsolides.budget.totalRealisation.toLocaleString()} CDF</p>
            <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${kpisConsolides.budget.tauxRealisation}%` }}></div>
            </div>
            <p className="text-xs text-purple-600 mt-1">{kpisConsolides.budget.tauxRealisation}% exécuté</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200">
            <p className="text-xs font-semibold text-orange-800 mb-1">Disponible</p>
            <p className="text-2xl font-bold text-orange-700">{kpisConsolides.budget.totalDisponible.toLocaleString()} CDF</p>
            <p className="text-xs text-orange-600 mt-1">{((kpisConsolides.budget.totalDisponible / kpisConsolides.budget.totalBudgetRevise) * 100).toFixed(1)}% restant</p>
          </div>
        </div>
      </div>

      {/* Section Recettes */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Module Recettes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">Prévues</p>
            <p className="text-2xl font-bold text-blue-700">{kpisConsolides.recettes.totalPrevision.toLocaleString()} CDF</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Réalisées</p>
            <p className="text-2xl font-bold text-green-700">{kpisConsolides.recettes.totalRealise.toLocaleString()} CDF</p>
            <p className="text-xs text-green-600 mt-1">{kpisConsolides.recettes.tauxRealisation.toFixed(1)}% du prévu</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1">Prudentiel</p>
            <p className="text-2xl font-bold text-purple-700">{kpisConsolides.recettes.totalPrudentiel.toLocaleString()} CDF</p>
            <p className="text-xs text-purple-600 mt-1">Avec provisions</p>
          </div>
        </div>
      </div>

      {/* Section Dépenses */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <TrendingDown className="w-5 h-5 text-red-600" />
          Module Dépenses (OHADA)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">Engagé</p>
            <p className="text-2xl font-bold text-blue-700">{kpisConsolides.depenses.totalEngage.toLocaleString()} CDF</p>
            <p className="text-xs text-blue-600 mt-1">{kpisConsolides.depenses.tauxEngagement}%</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Payé</p>
            <p className="text-2xl font-bold text-green-700">{kpisConsolides.depenses.totalPaye.toLocaleString()} CDF</p>
            <p className="text-xs text-green-600 mt-1">{kpisConsolides.depenses.tauxExecution}% exécuté</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border-2 border-yellow-200">
            <p className="text-xs font-semibold text-yellow-800 mb-1">En Attente</p>
            <p className="text-3xl font-bold text-yellow-700">{kpisConsolides.depenses.enAttente}</p>
            <p className="text-xs text-yellow-600 mt-1">Dépenses en cours</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-200">
            <p className="text-xs font-semibold text-orange-800 mb-1">Disponible</p>
            <p className="text-2xl font-bold text-orange-700">{kpisConsolides.depenses.disponible.toLocaleString()} CDF</p>
          </div>
        </div>
      </div>

      {/* Section Trésorerie */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-800">
          <Activity className="w-5 h-5 text-indigo-600" />
          Module Trésorerie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border-2 border-indigo-200">
            <p className="text-xs font-semibold text-indigo-800 mb-1">Solde Actuel</p>
            <p className="text-2xl font-bold text-indigo-700">{kpisConsolides.tresorerie.soldeActuel.toLocaleString()} CDF</p>
            <p className="text-xs text-indigo-600 mt-1">{kpisConsolides.tresorerie.joursAutonomie} jours d'autonomie</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-1">Ratio Liquidité</p>
            <p className="text-3xl font-bold text-blue-700">{kpisConsolides.tresorerie.ratioLiquidite.toFixed(2)}</p>
            <p className="text-xs text-blue-600 mt-1">
              {kpisConsolides.tresorerie.ratioLiquidite >= 1 ? '✅ Sain' : '⚠️ Attention'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-800 mb-1">Solde Prévisionnel</p>
            <p className="text-2xl font-bold text-purple-700">{kpisConsolides.tresorerie.soldePrevisionnel.toLocaleString()} CDF</p>
            <p className="text-xs text-purple-600 mt-1">Fin de mois</p>
          </div>
        </div>
      </div>

      {/* Alertes Globales */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h4 className="font-semibold text-yellow-800">Alertes et Recommandations</h4>
        </div>
        <ul className="space-y-1 text-sm text-yellow-700">
          <li>• {kpisConsolides.budget.lignesAlerte} lignes budgétaires en alerte (taux &gt; 95%)</li>
          <li>• {kpisConsolides.budget.lignesDepassement} ligne en dépassement budgétaire</li>
          <li>• {kpisConsolides.recettes.recettesIncertaines} recette incertaine nécessitant attention</li>
          <li>• {kpisConsolides.depenses.enAttente} dépenses en attente de traitement</li>
          <li>• Ratio de liquidité {kpisConsolides.tresorerie.ratioLiquidite < 1 ? 'faible - surveiller la trésorerie' : 'acceptable'}</li>
        </ul>
      </div>

      {/* Synthèse Financière */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Équilibre Budgétaire
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Recettes réalisées:</span>
              <span className="font-semibold">{kpisConsolides.recettes.totalRealise.toLocaleString()} CDF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Dépenses payées:</span>
              <span className="font-semibold">{kpisConsolides.depenses.totalPaye.toLocaleString()} CDF</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Solde:</span>
              <span className={kpisConsolides.recettes.totalRealise - kpisConsolides.depenses.totalPaye >= 0 ? 'text-green-600' : 'text-red-600'}>
                {(kpisConsolides.recettes.totalRealise - kpisConsolides.depenses.totalPaye).toLocaleString()} CDF
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Performance Globale
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux d'engagement:</span>
                <span className="font-semibold">{kpisConsolides.budget.tauxEngagement}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${kpisConsolides.budget.tauxEngagement}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taux d'exécution:</span>
                <span className="font-semibold">{kpisConsolides.budget.tauxRealisation}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${kpisConsolides.budget.tauxRealisation}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Réalisation recettes:</span>
                <span className="font-semibold">{kpisConsolides.recettes.tauxRealisation.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${kpisConsolides.recettes.tauxRealisation}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Intégration
const IntegrationFinanciere = () => {
  const [rapport, setRapport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [conformite, setConformite] = useState<any>(null);

  useEffect(() => {
    chargerRapport();
  }, []);

  const chargerRapport = async () => {
    setLoading(true);
    try {
      const rapportTexte = await IntegrationFinanciereService.genererRapportIntegration('2025');
      const conformiteData = await IntegrationFinanciereService.verifierConformite('2025');
      setRapport(rapportTexte);
      setConformite(conformiteData);
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Link2 className="w-7 h-7" />
          Intégration Financière et Comptable
        </h2>
        <p className="text-indigo-100">Vérification de la cohérence entre modules selon normes IPSAS/SYSCOHADA</p>
      </div>

      {/* Score de conformité */}
      {conformite && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-lg shadow-lg border-2 ${
            conformite.conforme ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Score de Conformité</h3>
              {conformite.conforme ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              )}
            </div>
            <div className="text-5xl font-bold mb-2 ${
              conformite.conforme ? 'text-green-700' : 'text-yellow-700'
            }">
              {conformite.score.toFixed(1)}%
            </div>
            <p className={`text-sm font-medium ${
              conformite.conforme ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {conformite.conforme ? '✅ CONFORME' : '⚠️ NON CONFORME'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              Normes Respectées
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">IPSAS 1 - États financiers</span>
                <span className={conformite.details.ipsas1 ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.ipsas1 ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">IPSAS 2 - Flux trésorerie</span>
                <span className={conformite.details.ipsas2 ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.ipsas2 ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">IPSAS 23 - Recettes</span>
                <span className={conformite.details.ipsas23 ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.ipsas23 ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">IPSAS 24 - Budget</span>
                <span className={conformite.details.ipsas24 ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.ipsas24 ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SYSCOHADA - Plan comptable</span>
                <span className={conformite.details.syscohada ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.syscohada ? '✅' : '❌'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">COSO - Contrôle interne</span>
                <span className={conformite.details.coso ? 'text-green-600' : 'text-red-600'}>
                  {conformite.details.coso ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommandations */}
      {conformite && conformite.recommandations.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recommandations
          </h4>
          <ul className="space-y-1 text-sm text-blue-700">
            {conformite.recommandations.map((rec: string, idx: number) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rapport détaillé */}
      <div className="bg-gray-900 text-green-400 p-6 rounded-lg shadow-lg font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap">{rapport}</pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={chargerRapport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Activity className="w-4 h-4" />
          Actualiser
        </button>
        <button 
          onClick={() => {
            const blob = new Blob([rapport], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport_integration_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
          }}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FileCheck className="w-4 h-4" />
          Télécharger Rapport
        </button>
      </div>
    </div>
  );
};

const getColor = (val: number, seuil: number = 1) => {
  if (val >= seuil) return 'bg-green-500';
  if (val >= seuil * 0.75) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function EtatsFinanciersModule() {
  const { data: exercices } = useExercicesComptables();
  const [selectedExercice, setSelectedExercice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const printRef = useRef<HTMLDivElement>(null);

  const { actif } = useBilanActif(selectedExercice ?? '');
  const { passif } = useBilanPassif(selectedExercice ?? '');
  const { resultat } = useCompteResultat(selectedExercice ?? '');
  const { flux } = useFluxTresorerie(selectedExercice ?? '');
  const { ratios } = useRatiosFinanciers(selectedExercice ?? '');

  useEffect(() => {
    if (exercices.length > 0) {
      setSelectedExercice(exercices[0].id);
    }
  }, [exercices]);

  const groupedRatios: Record<RatioFinancier['categorie'], RatioFinancier[]> = {
    liquidité: [],
    rentabilité: [],
    endettement: [],
    activité: [],
  };

  ratios.forEach((r) => {
    groupedRatios[r.categorie].push(r);
  });

  const handleExportExcel = () => {
    const sheets = prepareExcelData(actif, passif, resultat, flux);
    const workbook = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([sheetName, rows]) => {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Etats_Financiers_${selectedExercice}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Etats Financiers</title>');
        printWindow.document.write('<style>body { font-family: Arial, sans-serif; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">États Financiers</h1>

      {/* Sélecteur + Export */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Exercice :</label>
        <select
          className="border px-3 py-1 rounded"
          value={selectedExercice ?? ''}
          onChange={(e) => setSelectedExercice(e.target.value)}
          aria-label="Sélectionner l'exercice financier"
        >
          {exercices.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.annee}</option>
          ))}
        </select>
        <button
          onClick={handleExportExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exporter Excel
        </button>
        <button
          onClick={handlePrint}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Exporter PDF
        </button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <KPI 
          label="Total Actif" 
          value={actif.length > 0 
            ? actif.reduce((sum, item) => sum + (item.net || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Total Passif" 
          value={passif.length > 0 
            ? passif.reduce((sum, item) => sum + (item.montant || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Résultat Net" 
          value={resultat.length > 0 
            ? resultat.reduce((sum, item) => sum + (item.montant || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Trésorerie Nette" 
          value={flux.length > 0 
            ? flux.reduce((sum, item) => sum + (item.montant * (item.sens === 'encaissement' ? 1 : -1) || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
      </div>

      {/* Navigation par onglets */}
      <div className="flex gap-4 border-b pb-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenu dynamique */}
      {selectedExercice && (
        <div ref={printRef} className="mt-4 space-y-6">
          {activeTab === 'Dashboard Consolidé' && (
            <DashboardConsolide />
          )}
          
          {activeTab === 'Intégration' && (
            <IntegrationFinanciere />
          )}
          
          {activeTab === 'Bilan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="ACTIF" data={actif} columns={['libelle', 'net']} />
              <Section title="PASSIF" data={passif} columns={['libelle', 'montant']} />
            </div>
          )}

          {activeTab === 'Compte de Résultat' && (
            <Section title="Compte de Résultat" data={resultat} columns={['type', 'libelle', 'montant']} />
          )}

          {activeTab === 'Flux de Trésorerie' && (
            <Section title="Flux de Trésorerie" data={flux} columns={['categorie', 'libelle', 'sens', 'montant']} />
          )}

          {activeTab === 'Indicateurs' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h4 className="text-sm font-bold text-blue-800">📊 Indicateurs de Gestion et KPIs</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Tableau de bord complet des indicateurs clés de performance financière (Migration depuis TresorerieModule - INDEX_RESTRUCTURATION.md §151-161)
                </p>
              </div>

              {/* KPIs Principaux */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-md border-2 border-blue-300">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Solde Net</p>
                  <p className="text-3xl font-bold text-blue-700">À calculer</p>
                  <p className="text-xs text-gray-600 mt-2">Excédent / Déficit</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-md border-2 border-green-300">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Recettes</p>
                  <p className="text-3xl font-bold text-green-700">À calculer</p>
                  <p className="text-xs text-gray-600 mt-2">Taux de réalisation</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-md border-2 border-red-300">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Dépenses</p>
                  <p className="text-3xl font-bold text-red-700">À calculer</p>
                  <p className="text-xs text-gray-600 mt-2">Taux d'exécution</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-md border-2 border-purple-300">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Écart Global</p>
                  <p className="text-3xl font-bold text-purple-700">À calculer</p>
                  <p className="text-xs text-gray-600 mt-2">vs Budget prévisionnel</p>
                </div>
              </div>

              {/* Ratios Financiers */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md mr-3">Ratios Financiers</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ratio de Liquidité</p>
                    <p className="text-2xl font-bold text-gray-900">À calculer</p>
                    <p className="text-xs text-gray-600 mt-1">Recettes / Dépenses</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Taux de Réalisation</p>
                    <p className="text-2xl font-bold text-gray-900">À calculer</p>
                    <p className="text-xs text-gray-600 mt-1">Recettes vs Budget</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Taux d'Exécution</p>
                    <p className="text-2xl font-bold text-gray-900">À calculer</p>
                    <p className="text-xs text-gray-600 mt-1">Dépenses vs Budget</p>
                  </div>
                </div>
              </div>

              {/* Système d'Alertes */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-yellow-800 mb-2">⚠️ Alertes de Gestion</h4>
                <p className="text-xs text-yellow-700">Système d'alertes automatiques à implémenter (déficit, dépassements, sous-réalisation)</p>
              </div>

              {/* Note de migration */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium mb-2">📋 Note technique :</p>
                <p>
                  Cet onglet "Indicateurs" a été créé conformément à <strong>INDEX_RESTRUCTURATION.md</strong> (Migration 3, lignes 151-161).
                  Les calculs KPIs doivent être connectés aux données réelles de l'exercice sélectionné.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'Analyse Financière' && (
            <>
              <h2 className="text-lg font-semibold">Analyse Financière</h2>
              {Object.entries(groupedRatios).map(([categorie, items]) => (
                <div key={categorie}>
                  <h3 className="text-md font-medium capitalize mb-2">{categorie}</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{item.libelle}</span>
                          <span>{item.valeur?.toFixed(2)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded">
                          <div
                            className={`h-2 rounded progress-bar ${getColor(item.valeur)}`}
                            data-width={Math.round(Math.min(item.valeur * 10, 100) / 5) * 5}
                          />
                        </div>
                        {item.commentaire && (
                          <p className="text-xs text-gray-500 italic">{item.commentaire}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Composant KPI
const KPI = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white shadow rounded p-4 text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

// Composant Section générique
const Section = ({
  title,
  data,
  columns,
}: {
  title: string;
  data: any[];
  columns: string[];
}) => (
  <div>
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <table className="table-auto w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          {columns.map((col) => (
            <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            {columns.map((col) => (
                <td key={col}>
                {typeof item[col] === 'number'
                  ? item[col].toLocaleString()
                  : item[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
