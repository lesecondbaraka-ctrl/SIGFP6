import React, { useEffect, useMemo, useState } from 'react';
import { Download, AlertCircle, CheckCircle2, XCircle, TrendingUp, List, GitCompare, Link2, BarChart3, Plus, Calendar, DollarSign } from 'lucide-react';
import { useFluxTresorerie } from '../../hooks/useFluxTresorerie';
import { useDevise } from '../../hooks/useDevise';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';
import { usePrevisionsTresorerie } from '../../hooks/usePrevisionsTresorerie';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';
import type { MonthlyForecast } from '../../types/tresorerie';
import FluxTresorerieList from '../Tresorerie/FluxTresorerieList';
import RapprochementBancaire from '../Tresorerie/RapprochementBancaire';
import GestionTauxChange from '../Tresorerie/GestionTauxChange';
import IntegrationComptabilite from '../Tresorerie/IntegrationComptabilite';
import GraphiquesTresorerie from '../Tresorerie/GraphiquesTresorerie';
import { FluxTresorerieForm, PrevisionMensuelleForm, RapprochementBancaireForm } from '../Forms';
import type { FluxTresorerieData, PrevisionMensuelleData, RapprochementBancaireData } from '../Forms';
import '../../styles/utilities.css';

type TabKey = 'overview' | 'synthesis' | 'forecasts' | 'fx' | 'flux' | 'rapprochement' | 'integration' | 'graphiques';

/**
 * Module Trésorerie - Architecture Complète et Conforme
 * 
 * ARCHITECTURE (Oct 2025):
 * - Overview: Dashboard avec KPIs et positions de trésorerie
 * - Synthesis: Synthèse annuelle consolidée (Budget vs Réalisé vs Prévisions)
 * - Forecasts: Prévisions mensuelles multi-devises avec workflow d'approbation
 * - Flux: Liste détaillée des opérations de trésorerie (filtrable, exportable)
 * - FX: Gestion des taux de change et conversions de devises
 * - Rapprochement: Rapprochement bancaire (relevés vs écritures comptables)
 * - Integration: Intégration Comptabilité ↔ Trésorerie (synchronisation temps réel)
 * - Graphiques: Visualisations interactives (Recharts) - Évolution, Répartition, Comparaison
 * 
 * CONFORMITÉ:
 * - IPSAS/IFRS: Présentation des flux par nature (Fonctionnement, Investissement, Financement)
 * - SYSCOHADA: Cohérence avec les comptes 5xx (Trésorerie)
 * - Contrôle interne: Ségrégation des tâches, workflow d'approbation, traçabilité
 * - Multi-devises: Support CDF/USD avec taux de change historisé
 * 
 * INTÉGRATIONS:
 * - Comptabilité: Lecture des flux, pas de double comptabilisation
 * - Budget: Comparaison prévisions vs réalisations
 * - Exercices: Filtrage par exercice comptable actif
 */
export default function TresorerieModule(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2025');
  const [showEditForecastModal, setShowEditForecastModal] = useState(false);
  const [editedMonthly, setEditedMonthly] = useState<MonthlyForecast[] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [, setWorkflowError] = useState<string | null>(null);

  // ✅ Investissements transférés vers BudgetModule (architecture correcte)
  // TresorerieModule = Flux de liquidités uniquement

  // hooks réutilisables du projet
  const { data: exercices = [] } = useExercicesComptables();
  const exerciceActif = useMemo(() => exercices.length > 0 ? exercices[0].id : selectedFiscalYear, [exercices, selectedFiscalYear]);
  const { flux: fluxTresorerie = [], loading: fluxLoading } = useFluxTresorerie(exerciceActif);
  const { taux } = useDevise(); // Taux de change USD/CDF
  
  // États pour les 3 nouveaux formulaires (après taux)
  const [showNewFluxModal, setShowNewFluxModal] = useState(false);
  const [showNewPrevisionModal, setShowNewPrevisionModal] = useState(false);
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  
  const [newFlux, setNewFlux] = useState({
    type: 'Encaissement' as 'Encaissement' | 'Décaissement',
    categorie: 'Exploitation' as 'Exploitation' | 'Investissement' | 'Financement',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: ''
  });
  
  const [newPrevision, setNewPrevision] = useState({
    mois: '',
    recettesCDF: 0,
    recettesUSD: 0,
    depensesCDF: 0,
    depensesUSD: 0,
    tauxChange: taux
  });
  
  const [newRapprochement, setNewRapprochement] = useState({
    compteBancaire: '',
    soldeReleve: 0,
    soldeComptable: 0,
    ecarts: 0,
    dateReleve: new Date().toISOString().split('T')[0]
  });
  const { createPrevision, submitForApproval, approvePrevision, rejectPrevision } = usePrevisionsTresorerie(exerciceActif);

  // états locaux
  const [soldeNetActual, setSoldeNetActual] = useState<number | null>(null);
  const [soldeNetBudget, setSoldeNetBudget] = useState<number | null>(null);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [manualInternalReceipts, setManualInternalReceipts] = useState<number | null>(null);
  const [manualExternalReceipts, setManualExternalReceipts] = useState<number | null>(null);
  const [openingBalanceUSD, setOpeningBalanceUSD] = useState<number>(0);
  const [manualInternalReceiptsUSD, setManualInternalReceiptsUSD] = useState<number | null>(null);
  const [manualExternalReceiptsUSD, setManualExternalReceiptsUSD] = useState<number | null>(null);

  const defaultMonthly: MonthlyForecast[] = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      monthNumber: i + 1,
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      recettesCDF: 0,
      depensesCDF: 0,
      recettesUSD: 0,
      depensesUSD: 0,
      soldeCDF: 0,
      soldeUSD: 0,
      exchangeRate: taux,
    })),
    [taux]
  );

  const [selectedForecast, setSelectedForecast] = useState<{ fiscalYear: string; startDate: string; endDate: string; monthlyForecasts: MonthlyForecast[] }>(
    { fiscalYear: selectedFiscalYear, startDate: `${selectedFiscalYear}-01-01`, endDate: `${selectedFiscalYear}-12-31`, monthlyForecasts: defaultMonthly }
  );

  // Données exemples et placeholders conservés mais typés pour l'intégration
  const [fiscalYearForecasts] = useState<Array<{ id: number; fiscalYear: string; status: string }>>([
    { id: 1, fiscalYear: '2025', status: 'Provisoire' },
    { id: 2, fiscalYear: '2024', status: 'Réalisé' },
  ]);

  // Synthèses - dans la vraie app, proviennent des services / hooks
  const [recettes] = useState<Array<{ id: string; budgetAmount: number; actualAmount: number }>>([
    { id: 'r1', budgetAmount: 500_000_000, actualAmount: 450_000_000 }
  ]);
  const [depenses] = useState<Array<{ id: string; budgetAmount: number; actualAmount: number }>>([
    { id: 'd1', budgetAmount: 300_000_000, actualAmount: 320_000_000 }
  ]);

  const totalRecettesBudget = useMemo(() => recettes.reduce((s, r) => s + (Number(r.budgetAmount) || 0), 0), [recettes]);
  const totalRecettesActual = useMemo(() => recettes.reduce((s, r) => s + (Number(r.actualAmount) || 0), 0), [recettes]);
  const totalDepensesBudget = useMemo(() => depenses.reduce((s, d) => s + (Number(d.budgetAmount) || 0), 0), [depenses]);
  const totalDepensesActual = useMemo(() => depenses.reduce((s, d) => s + (Number(d.actualAmount) || 0), 0), [depenses]);
  const autoInternalReceipts = useMemo(() => {
    try {
      return fluxTresorerie
        .filter((f: any) => String(f.origine || f.source || f.type_recette || '').toLowerCase().includes('interne'))
        .reduce((s: number, f: any) => s + (Number(f.montant_encaisse) || 0), 0);
    } catch { return 0; }
  }, [fluxTresorerie]);
  const autoExternalReceipts = useMemo(() => {
    try {
      return fluxTresorerie
        .filter((f: any) => String(f.origine || f.source || f.type_recette || '').toLowerCase().includes('externe'))
        .reduce((s: number, f: any) => s + (Number(f.montant_encaisse) || 0), 0);
    } catch { return 0; }
  }, [fluxTresorerie]);
  const displayedInternalReceipts = manualInternalReceipts ?? autoInternalReceipts;
  const displayedExternalReceipts = manualExternalReceipts ?? autoExternalReceipts;
  const receiptsCanvasTotal = (displayedInternalReceipts + displayedExternalReceipts) > 0
    ? (displayedInternalReceipts + displayedExternalReceipts)
    : totalRecettesActual;
  const closingBalance = useMemo(() => openingBalance + receiptsCanvasTotal - totalDepensesActual, [openingBalance, receiptsCanvasTotal, totalDepensesActual]);

  // Totaux USD basés sur les prévisions mensuelles (évite la redondance)
  const totalRecettesUSD = useMemo(() => selectedForecast.monthlyForecasts.reduce((s, m) => s + (Number(m.recettesUSD) || 0), 0), [selectedForecast.monthlyForecasts]);
  const totalDepensesUSD = useMemo(() => selectedForecast.monthlyForecasts.reduce((s, m) => s + (Number(m.depensesUSD) || 0), 0), [selectedForecast.monthlyForecasts]);
  const receiptsCanvasTotalUSD = (Number(manualInternalReceiptsUSD ?? 0) + Number(manualExternalReceiptsUSD ?? 0)) > 0
    ? Number(manualInternalReceiptsUSD ?? 0) + Number(manualExternalReceiptsUSD ?? 0)
    : totalRecettesUSD;
  const closingBalanceUSD = useMemo(() => openingBalanceUSD + receiptsCanvasTotalUSD - totalDepensesUSD, [openingBalanceUSD, receiptsCanvasTotalUSD, totalDepensesUSD]);

  useEffect(() => {
    // when fiscal year changes, refresh selection
    setSelectedForecast((p) => ({ ...p, fiscalYear: selectedFiscalYear, startDate: `${selectedFiscalYear}-01-01`, endDate: `${selectedFiscalYear}-12-31` }));
  }, [selectedFiscalYear]);

  const [openingBalanceBudget] = useState<number>(0); // Solde d'ouverture budgété
  const openEditForecasts = () => {
    setEditedMonthly(selectedForecast.monthlyForecasts.map(m => ({ ...m })));
    setShowEditForecastModal(true);
  };

  const saveEditedForecasts = async () => {
    if (!editedMonthly || editedMonthly.length !== 12 || !exerciceActif) {
      setWorkflowError('Les prévisions doivent contenir 12 mois et être associées à un exercice.');
      return;
    }

    // Validation des montants CDF et USD
    for (const m of editedMonthly) {
      if (Number.isNaN(Number(m.recettesCDF)) || Number.isNaN(Number(m.depensesCDF)) ||
          Number.isNaN(Number(m.recettesUSD)) || Number.isNaN(Number(m.depensesUSD))) {
        setWorkflowError('Les montants CDF et USD doivent être des nombres valides.');
        return;
      }
    }

    try {
      // Conversion au format PrevisionTresorerie (CDF et USD)
      const previsionsToSave = editedMonthly.flatMap(m => [
        // Recettes CDF
        {
          exercice_id: exerciceActif,
          mois: m.monthNumber,
          annee: parseInt(selectedFiscalYear),
          montant: m.recettesCDF,
          type: 'recette' as const,
          categorie: 'Prévision mensuelle CDF',
          statut: 'brouillon' as const,
          commentaire: `Prévision recettes CDF pour ${m.month} ${selectedFiscalYear}`
        },
        // Dépenses CDF
        {
          exercice_id: exerciceActif,
          mois: m.monthNumber,
          annee: parseInt(selectedFiscalYear),
          montant: m.depensesCDF,
          type: 'depense' as const,
          categorie: 'Prévision mensuelle CDF',
          statut: 'brouillon' as const,
          commentaire: `Prévision dépenses CDF pour ${m.month} ${selectedFiscalYear}`
        },
        // Recettes USD
        {
          exercice_id: exerciceActif,
          mois: m.monthNumber,
          annee: parseInt(selectedFiscalYear),
          montant: m.recettesUSD,
          type: 'recette' as const,
          categorie: 'Prévision mensuelle USD',
          statut: 'brouillon' as const,
          commentaire: `Prévision recettes USD pour ${m.month} ${selectedFiscalYear} (Taux: ${m.exchangeRate})`
        },
        // Dépenses USD
        {
          exercice_id: exerciceActif,
          mois: m.monthNumber,
          annee: parseInt(selectedFiscalYear),
          montant: m.depensesUSD,
          type: 'depense' as const,
          categorie: 'Prévision mensuelle USD',
          statut: 'brouillon' as const,
          commentaire: `Prévision dépenses USD pour ${m.month} ${selectedFiscalYear} (Taux: ${m.exchangeRate})`
        }
      ]);

      // Sauvegarder chaque prévision
      for (const prevision of previsionsToSave) {
        const result = await createPrevision(prevision);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      setSelectedForecast(prev => ({
        ...prev,
        monthlyForecasts: editedMonthly.map(m => ({
          ...m,
          statut: 'brouillon',
          version: 1,
          date_modification: new Date().toISOString()
        }))
      }));

      setWorkflowError(null);
      setShowEditForecastModal(false);

    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleSubmitForApproval = async () => {
    if (!editedMonthly || !exerciceActif) return;

    try {
      // Soumettre toutes les prévisions du mois pour approbation
      for (const m of editedMonthly) {
        if (!m.id) continue;
        const result = await submitForApproval(m.id);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      setSelectedForecast(prev => ({
        ...prev,
        monthlyForecasts: editedMonthly.map(m => ({
          ...m,
          statut: 'en_revue',
          date_modification: new Date().toISOString()
        }))
      }));

      setWorkflowError(null);

    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Erreur lors de la soumission pour approbation');
    }
  };

  const handleApprove = async () => {
    if (!editedMonthly || !exerciceActif) return;

    try {
      // Approuver toutes les prévisions du mois
      for (const m of editedMonthly) {
        if (!m.id) continue;
        const result = await approvePrevision(m.id);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      setSelectedForecast(prev => ({
        ...prev,
        monthlyForecasts: editedMonthly.map(m => ({
          ...m,
          statut: 'approuve',
          date_modification: new Date().toISOString()
        }))
      }));

      setWorkflowError(null);
      setShowEditForecastModal(false);

    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!editedMonthly || !exerciceActif || !rejectReason.trim()) {
      setWorkflowError('Un motif de rejet est requis');
      return;
    }

    try {
      // Rejeter toutes les prévisions du mois
      for (const m of editedMonthly) {
        if (!m.id) continue;
        const result = await rejectPrevision(m.id, rejectReason);
        if (!result.success) {
          throw new Error(result.message);
        }
      }

      setSelectedForecast(prev => ({
        ...prev,
        monthlyForecasts: editedMonthly.map(m => ({
          ...m,
          statut: 'rejete',
          commentaire: rejectReason,
          date_modification: new Date().toISOString()
        }))
      }));

      setWorkflowError(null);
      setRejectReason('');
      setShowEditForecastModal(false);

    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : 'Erreur lors du rejet');
    }
  };

  const updateEditedMonth = (index: number, key: keyof MonthlyForecast, value: string | number) => {
    if (!editedMonthly) return;
    const copy = editedMonthly.map(m => ({ ...m }));
    // @ts-ignore
    copy[index][key] = key === 'month' ? String(value) : Number(value);
    setEditedMonthly(copy);
  };

  useEffect(() => {
    // compute balances from fluxTresorerie when data available
    if (!fluxLoading && fluxTresorerie && fluxTresorerie.length > 0) {
      const totalEncaissements = fluxTresorerie.reduce((s: number, f: any) => s + (Number(f.montant_encaisse || 0)), 0);
      const totalDecaissements = fluxTresorerie.reduce((s: number, f: any) => s + (Number(f.montant_decaisse || 0)), 0);
      setSoldeNetActual(totalEncaissements - totalDecaissements);
      // budget placeholder: sum of forecasts if present
      const totalBudget = selectedForecast.monthlyForecasts.reduce((s, m) => s + (m.recettesCDF - m.depensesCDF), 0);
      setSoldeNetBudget(totalBudget || null);
    } else {
      // fallback defaults for empty state
      setSoldeNetActual(prev => prev ?? 1_200_000_000);
      setSoldeNetBudget(prev => prev ?? 900_000_000);
    }
  }, [fluxLoading, fluxTresorerie, selectedForecast]);

  const formatCurrency = (value: number | undefined | null, currency = 'CDF') => {
    const num = Number(value ?? 0);
    try {
      if (currency === 'USD') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num);
      return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(num) + ' ' + currency;
    } catch {
      return `${num} ${currency}`;
    }
  };

  const handleExportBudgetSynthesis = () => {
    const data = [{
      fiscalYear: selectedForecast.fiscalYear,
      totalRecettesBudget: totalRecettesBudget,
      totalRecettesActual: totalRecettesActual,
      totalDepensesBudget: totalDepensesBudget,
      totalDepensesActual: totalDepensesActual,
      soldeNetActual: soldeNetActual,
      soldeNetBudget: soldeNetBudget,
    }];
    exportToExcel(data, generateFilename(`synthese_tresorerie_${selectedForecast.fiscalYear}`));
  };

  // Export géré dans le composant FluxTresorerieList
  // const handleExportFlux = () => {
  //   const data = fluxTresorerie.map((f: any) => ({
  //     date: f.date_operation,
  //     libelle: f.libelle,
  //     type: f.type_operation,
  //     montant_encaisse: f.montant_encaisse,
  //     montant_decaisse: f.montant_decaisse,
  //     solde: (Number(f.montant_encaisse || 0) - Number(f.montant_decaisse || 0))
  //   }));
  //   exportToExcel(data, generateFilename(`flux_tresorerie_${exerciceActif}`));
  // };

  // simple validation: monthly forecasts array length
  useEffect(() => {
    if (selectedForecast.monthlyForecasts && selectedForecast.monthlyForecasts.length !== 12) {
          }
  }, [selectedForecast]);

  // Prévisions CDF (somme des 12 mois) pour synthèse
  const totalRecettesForecastCDF = useMemo(() => selectedForecast.monthlyForecasts.reduce((s, m) => s + (Number(m.recettesCDF) || 0), 0), [selectedForecast.monthlyForecasts]);
  const totalDepensesForecastCDF = useMemo(() => selectedForecast.monthlyForecasts.reduce((s, m) => s + (Number(m.depensesCDF) || 0), 0), [selectedForecast.monthlyForecasts]);
  const closingBudgetCDF = useMemo(() => openingBalanceBudget + totalRecettesBudget - totalDepensesBudget, [openingBalanceBudget, totalRecettesBudget, totalDepensesBudget]);
  const closingForecastCDF = useMemo(() => openingBalanceBudget + totalRecettesForecastCDF - totalDepensesForecastCDF, [openingBalanceBudget, totalRecettesForecastCDF, totalDepensesForecastCDF]);

  return (
    <div className="space-y-6">
      {/* En-tête du module avec titre et description */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="mr-3" size={28} />
              Module Trésorerie
            </h1>
            <p className="text-blue-100 mt-2">Gestion complète de la trésorerie et des flux financiers - Conforme IPSAS/IFRS & SYSCOHADA</p>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center space-x-2 overflow-x-auto" role="tablist" aria-label="Navigation module trésorerie">
          <button 
            onClick={() => setActiveTab('overview')} 
            role="tab"
            {...(activeTab === 'overview' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-overview"
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <TrendingUp size={18} />
            <span>Vue d'ensemble</span>
          </button>
          <button 
            onClick={() => setActiveTab('synthesis')} 
            role="tab"
            {...(activeTab === 'synthesis' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-synthesis"
            className={`px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${
              activeTab === 'synthesis' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            Synthèse
          </button>
          <button
            onClick={() => setActiveTab('forecasts')} 
            role="tab"
            {...(activeTab === 'forecasts' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-forecasts"
            className={`px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${
              activeTab === 'forecasts' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            Prévisions
          </button>
          <button 
            onClick={() => setActiveTab('flux')} 
            role="tab"
            {...(activeTab === 'flux' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-flux"
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium whitespace-nowrap ${
              activeTab === 'flux' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <List size={18} />
            <span>Flux</span>
          </button>
          <button 
            onClick={() => setActiveTab('fx')} 
            role="tab"
            {...(activeTab === 'fx' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-fx"
            className={`px-4 py-3 rounded-lg transition-all font-medium whitespace-nowrap ${
              activeTab === 'fx' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            FX
          </button>
          <button 
            onClick={() => setActiveTab('rapprochement')} 
            role="tab"
            {...(activeTab === 'rapprochement' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-rapprochement"
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium whitespace-nowrap ${
              activeTab === 'rapprochement' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <GitCompare size={18} />
            <span>Rapprochement</span>
          </button>
          <button 
            onClick={() => setActiveTab('integration')} 
            role="tab"
            {...(activeTab === 'integration' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-integration"
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium whitespace-nowrap ${
              activeTab === 'integration' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <Link2 size={18} />
            <span>Intégration</span>
          </button>
          <button 
            onClick={() => setActiveTab('graphiques')} 
            role="tab"
            {...(activeTab === 'graphiques' ? { 'aria-selected': 'true' as const } : { 'aria-selected': 'false' as const })}
            aria-controls="panel-graphiques"
            className={`px-4 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium whitespace-nowrap ${
              activeTab === 'graphiques' 
                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
            }`}
          >
            <BarChart3 size={18} />
            <span>Graphiques</span>
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
          {/* Canvas - Budget de Trésorerie */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-md mr-3">Budget de Trésorerie (Canvas)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-300">
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Disponibilité début période</p>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Disponibilité début période"
                />
                <details className="mt-3">
                  <summary className="text-xs text-gray-600 cursor-pointer select-none">Ajuster les valeurs (avancé)</summary>
                  <div className="mt-2">
                    <label className="block text-xxs text-gray-600 mb-1">USD</label>
                    <input
                      type="number"
                      value={openingBalanceUSD}
                      onChange={(e) => setOpeningBalanceUSD(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Disponibilité début période (USD)"
                    />
                  </div>
                </details>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-300">
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Recettes globales</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Total CDF</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(receiptsCanvasTotal, 'CDF')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total USD</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(receiptsCanvasTotalUSD, 'USD')}</p>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="text-xs text-gray-600 cursor-pointer select-none">Ajuster les ventilations (avancé)</summary>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xxs text-gray-600 mb-1">Interne (CDF)</p>
                      <input
                        type="number"
                        value={manualInternalReceipts ?? ''}
                        onChange={(e) => setManualInternalReceipts(e.target.value === '' ? null : Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder={String(autoInternalReceipts || 0)}
                        aria-label="Recettes internes CDF"
                      />
                    </div>
                    <div>
                      <p className="text-xxs text-gray-600 mb-1">Interne (USD)</p>
                      <input
                        type="number"
                        value={manualInternalReceiptsUSD ?? ''}
                        onChange={(e) => setManualInternalReceiptsUSD(e.target.value === '' ? null : Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder={String(0)}
                        aria-label="Recettes internes USD"
                      />
                    </div>
                    <div>
                      <p className="text-xxs text-gray-600 mb-1">Externe (CDF)</p>
                      <input
                        type="number"
                        value={manualExternalReceipts ?? ''}
                        onChange={(e) => setManualExternalReceipts(e.target.value === '' ? null : Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder={String(autoExternalReceipts || 0)}
                        aria-label="Recettes externes CDF"
                      />
                    </div>
                    <div>
                      <p className="text-xxs text-gray-600 mb-1">Externe (USD)</p>
                      <input
                        type="number"
                        value={manualExternalReceiptsUSD ?? ''}
                        onChange={(e) => setManualExternalReceiptsUSD(e.target.value === '' ? null : Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                        placeholder={String(0)}
                        aria-label="Recettes externes USD"
                      />
                    </div>
                  </div>
                </details>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-300">
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Dépenses globales</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalDepensesActual, 'CDF')}</p>
                <p className="text-sm font-semibold text-red-800 mt-1">{formatCurrency(totalDepensesUSD, 'USD')}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl border-2 border-indigo-300">
                <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Disponibilité fin période</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(closingBalance, 'CDF')}</p>
                <p className="text-sm font-semibold text-indigo-800 mt-1">{formatCurrency(closingBalanceUSD, 'USD')}</p>
                <p className="text-xs text-gray-600 mt-1">Calculée: Début + Recettes - Dépenses</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'synthesis' && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tableau de Synthèse Annuel</h3>
          <p className="text-sm text-gray-600 mb-4">Vue consolidée des flux de trésorerie pour l'exercice {selectedFiscalYear}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border">Libellé</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase border">Réalisés</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase border">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase border">Prévisions</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase border">Écart</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 font-medium border">Disponibilité début période</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(openingBalance, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(openingBalanceBudget, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(openingBalanceBudget, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(openingBalance - openingBalanceBudget, 'CDF')}</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-4 py-3 font-semibold border">Recettes globales</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium border">{formatCurrency(receiptsCanvasTotal, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(totalRecettesBudget, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(totalRecettesForecastCDF, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(receiptsCanvasTotal - totalRecettesBudget, 'CDF')}</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-semibold border">Dépenses globales</td>
                  <td className="px-4 py-3 text-right text-red-700 font-medium border">{formatCurrency(totalDepensesActual, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(totalDepensesBudget, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(totalDepensesForecastCDF, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(totalDepensesActual - totalDepensesBudget, 'CDF')}</td>
                </tr>
                <tr className="bg-blue-50 font-bold">
                  <td className="px-4 py-3 border">Disponibilité fin période</td>
                  <td className="px-4 py-3 text-right text-blue-700 border">{formatCurrency(closingBalance, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(closingBudgetCDF, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(closingForecastCDF, 'CDF')}</td>
                  <td className="px-4 py-3 text-right border">{formatCurrency(closingBalance - closingBudgetCDF, 'CDF')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleExportBudgetSynthesis} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <Download size={16} className="mr-2" />
              Exporter Synthèse
            </button>
          </div>
        </div>
      )}

      {activeTab === 'forecasts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-semibold">Prévisions</h3>
                <p className="text-sm text-gray-600">Sélectionnez un exercice pour afficher ses prévisions mensuelles.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={openEditForecasts} 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Éditer prévisions mensuelles"
                  aria-label="Éditer prévisions mensuelles"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle Prévision
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Approuver cette prévision ?')) {
                      console.log('Prévision approuvée');
                    }
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Approuver la prévision"
                  aria-label="Approuver la prévision"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approuver
                </button>
                <button 
                  onClick={() => {
                    const reason = prompt('Motif du rejet :');
                    if (reason) {
                      console.log('Prévision rejetée:', reason);
                    }
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Rejeter la prévision"
                  aria-label="Rejeter la prévision"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Synthèse du Budget de Trésorerie - Exercice {selectedForecast.fiscalYear}</h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-semibold">
                Taux: {taux.toFixed(2)} CDF/USD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-300">Mois</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-300">Recettes</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-300">Dépenses</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-300">Solde Net</th>
              <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Total Équivalent CDF</th>
            </tr>
            <tr className="bg-blue-50">
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r">CDF</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r border-gray-300">USD</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r">CDF</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r border-gray-300">USD</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r">CDF</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 border-r border-gray-300">USD</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedForecast.monthlyForecasts.map((m) => {
              const soldeNetCDF = m.recettesCDF - m.depensesCDF;
              const soldeNetUSD = m.recettesUSD - m.depensesUSD;
              const totalEquivalentCDF = soldeNetCDF + (soldeNetUSD * m.exchangeRate);
              
              return (
                <tr key={m.monthNumber} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 border-r border-gray-200">{m.month}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-700 font-medium border-r">
                    {formatCurrency(m.recettesCDF, 'CDF')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-700 font-medium border-r border-gray-300">
                    {formatCurrency(m.recettesUSD, 'USD')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-700 font-medium border-r">
                    {formatCurrency(m.depensesCDF, 'CDF')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-700 font-medium border-r border-gray-300">
                    {formatCurrency(m.depensesUSD, 'USD')}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold border-r ${soldeNetCDF >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(soldeNetCDF, 'CDF')}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold border-r border-gray-300 ${soldeNetUSD >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {formatCurrency(soldeNetUSD, 'USD')}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${totalEquivalentCDF >= 0 ? 'text-blue-800 bg-blue-50' : 'text-orange-800 bg-orange-50'}`}>
                    {formatCurrency(totalEquivalentCDF, 'CDF')}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr className="font-bold border-t-2 border-gray-400">
              <td className="px-4 py-4 text-sm text-gray-900 border-r border-gray-300">TOTAL ANNUEL</td>
              <td className="px-4 py-4 text-sm text-right text-green-800 border-r">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesCDF, 0), 'CDF')}
              </td>
              <td className="px-4 py-4 text-sm text-right text-green-800 border-r border-gray-300">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesUSD, 0), 'USD')}
              </td>
              <td className="px-4 py-4 text-sm text-right text-red-800 border-r">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.depensesCDF, 0), 'CDF')}
              </td>
              <td className="px-4 py-4 text-sm text-right text-red-800 border-r border-gray-300">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.depensesUSD, 0), 'USD')}
              </td>
              <td className={`px-4 py-4 text-sm text-right border-r ${
                (selectedForecast.monthlyForecasts.reduce((sum, m) => sum + (m.recettesCDF - m.depensesCDF), 0)) >= 0 
                  ? 'text-blue-900 bg-blue-100' 
                  : 'text-orange-900 bg-orange-100'
              }`}>
                {formatCurrency(
                  selectedForecast.monthlyForecasts.reduce((sum, m) => sum + (m.recettesCDF - m.depensesCDF), 0),
                  'CDF'
                )}
              </td>
              <td className={`px-4 py-4 text-sm text-right border-r border-gray-300 ${
                (selectedForecast.monthlyForecasts.reduce((sum, m) => sum + (m.recettesUSD - m.depensesUSD), 0)) >= 0 
                  ? 'text-blue-900 bg-blue-100' 
                  : 'text-orange-900 bg-orange-100'
              }`}>
                {formatCurrency(
                  selectedForecast.monthlyForecasts.reduce((sum, m) => sum + (m.recettesUSD - m.depensesUSD), 0),
                  'USD'
                )}
              </td>
              <td className={`px-4 py-4 text-sm text-right font-extrabold text-lg ${
                selectedForecast.monthlyForecasts.reduce((sum, m) => {
                  const soldeNetCDF = m.recettesCDF - m.depensesCDF;
                  const soldeNetUSD = m.recettesUSD - m.depensesUSD;
                  return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
                }, 0) >= 0 
                  ? 'text-blue-900 bg-blue-100' 
                  : 'text-orange-900 bg-orange-100'
              }`}>
                {formatCurrency(
                  selectedForecast.monthlyForecasts.reduce((sum, m) => {
                    const soldeNetCDF = m.recettesCDF - m.depensesCDF;
                    const soldeNetUSD = m.recettesUSD - m.depensesUSD;
                    return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
                  }, 0),
                  'CDF'
                )}
              </td>
            </tr>
          </tfoot>
              </table>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 font-semibold mb-1">RECETTES TOTALES</p>
          <p className="text-lg font-bold text-green-800">
            {formatCurrency(
              selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesCDF + (m.recettesUSD * m.exchangeRate), 0),
              'CDF'
            )}
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-xs text-red-700 font-semibold mb-1">DÉPENSES TOTALES</p>
          <p className="text-lg font-bold text-red-800">
            {formatCurrency(
              selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.depensesCDF + (m.depensesUSD * m.exchangeRate), 0),
              'CDF'
            )}
          </p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${
          selectedForecast.monthlyForecasts.reduce((sum, m) => {
            const soldeNetCDF = m.recettesCDF - m.depensesCDF;
            const soldeNetUSD = m.recettesUSD - m.depensesUSD;
            return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
          }, 0) >= 0 
            ? 'bg-blue-50 border-blue-300' 
            : 'bg-orange-50 border-orange-300'
        }`}>
          <p className={`text-xs font-semibold mb-1 ${
            selectedForecast.monthlyForecasts.reduce((sum, m) => {
              const soldeNetCDF = m.recettesCDF - m.depensesCDF;
              const soldeNetUSD = m.recettesUSD - m.depensesUSD;
              return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
            }, 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
          }`}>
            SOLDE NET ANNUEL
          </p>
          <p className={`text-xl font-extrabold ${
            selectedForecast.monthlyForecasts.reduce((sum, m) => {
              const soldeNetCDF = m.recettesCDF - m.depensesCDF;
              const soldeNetUSD = m.recettesUSD - m.depensesUSD;
              return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
            }, 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
          }`}>
            {formatCurrency(
              selectedForecast.monthlyForecasts.reduce((sum, m) => {
                const soldeNetCDF = m.recettesCDF - m.depensesCDF;
                const soldeNetUSD = m.recettesUSD - m.depensesUSD;
                return sum + soldeNetCDF + (soldeNetUSD * m.exchangeRate);
              }, 0),
              'CDF'
            )}
          </p>
        </div>
      </div>
    </div>

    {/* Tableau d'évolution des recettes par exercice */}
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-md font-semibold mb-3">Analyse de l'Évolution des Recettes</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recettes CDF</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recettes USD</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total CDF Équivalent</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Évolution (%)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedForecast.monthlyForecasts.map((m, idx) => {
              const prevMonth = idx > 0 ? selectedForecast.monthlyForecasts[idx - 1] : null;
              const totalCDFEquivalent = m.recettesCDF + (m.recettesUSD * m.exchangeRate);
              const prevTotalCDFEquivalent = prevMonth ? prevMonth.recettesCDF + (prevMonth.recettesUSD * prevMonth.exchangeRate) : 0;
              const evolution = prevMonth && prevTotalCDFEquivalent > 0 
                ? ((totalCDFEquivalent - prevTotalCDFEquivalent) / prevTotalCDFEquivalent * 100)
                : 0;
              
              return (
                <tr key={m.monthNumber} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.month}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {formatCurrency(m.recettesCDF, 'CDF')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    {formatCurrency(m.recettesUSD, 'USD')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(totalCDFEquivalent, 'CDF')}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {idx > 0 ? (
                      evolution > 0 ? `+${evolution.toFixed(1)}%` : `${evolution.toFixed(1)}%`
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-bold">
              <td className="px-4 py-3 text-sm text-gray-900">TOTAL ANNUEL</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesCDF, 0), 'CDF')}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {formatCurrency(selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesUSD, 0), 'USD')}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {formatCurrency(
                  selectedForecast.monthlyForecasts.reduce((sum, m) => sum + m.recettesCDF + (m.recettesUSD * m.exchangeRate), 0),
                  'CDF'
                )}
              </td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <p>Taux de change appliqué : {taux.toFixed(2)} CDF/USD</p>
        <p>Exercice : {selectedForecast.fiscalYear}</p>
      </div>
    </div>

    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm text-gray-600">Exercices disponibles</p>
      <ul className="mt-2 space-y-1 text-sm">
        {fiscalYearForecasts.map(fy => (
          <li key={fy.id} className="flex items-center justify-between">
            <span>{fy.fiscalYear} — {fy.status}</span>
            <button onClick={() => setSelectedFiscalYear(fy.fiscalYear)} className="text-blue-600 text-sm">Ouvrir</button>
          </li>
        ))}
      </ul>
    </div>
  </div>
)}

{/* Modal édition prévisions avec workflow */}
{showEditForecastModal && editedMonthly && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Éditer Prévisions - {selectedForecast.fiscalYear}</h3>
          <p className="text-sm text-gray-500">Les modifications seront soumises pour approbation</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedForecast.monthlyForecasts[0]?.statut && (
            <span className={`px-2 py-1 rounded text-sm ${
              selectedForecast.monthlyForecasts[0].statut === 'approuve' ? 'bg-green-100 text-green-800' :
              selectedForecast.monthlyForecasts[0].statut === 'en_revue' ? 'bg-yellow-100 text-yellow-800' :
              selectedForecast.monthlyForecasts[0].statut === 'rejete' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedForecast.monthlyForecasts[0].statut === 'approuve' ? (
                <span className="flex items-center"><CheckCircle2 size={16} className="mr-1" /> Approuvé</span>
              ) : selectedForecast.monthlyForecasts[0].statut === 'en_revue' ? (
                <span className="flex items-center"><AlertCircle size={16} className="mr-1" /> En revue</span>
              ) : selectedForecast.monthlyForecasts[0].statut === 'rejete' ? (
                <span className="flex items-center"><XCircle size={16} className="mr-1" /> Rejeté</span>
              ) : (
                'Brouillon'
              )}
            </span>
          )}
          <button onClick={() => setShowEditForecastModal(false)} className="text-gray-500">Fermer</button>
        </div>
      </div>

            {selectedForecast.monthlyForecasts[0]?.statut === 'rejete' && selectedForecast.monthlyForecasts[0]?.commentaire && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Motif du rejet :</p>
                <p className="text-sm text-red-700">{selectedForecast.monthlyForecasts[0].commentaire}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mois</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Recettes CDF</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Dépenses CDF</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Recettes USD</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Dépenses USD</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Version</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editedMonthly.map((m, idx) => (
                    <tr key={m.monthNumber} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{m.month}</td>
                      <td className="px-3 py-2">
                        <input
                          id={`recettes-cdf-${idx}`}
                          type="number"
                          value={m.recettesCDF}
                          onChange={(e) => updateEditedMonth(idx, 'recettesCDF', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
                          disabled={selectedForecast.monthlyForecasts[0]?.statut === 'approuve'}
                          aria-label={`Recettes CDF pour ${m.month}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          id={`depenses-cdf-${idx}`}
                          type="number"
                          value={m.depensesCDF}
                          onChange={(e) => updateEditedMonth(idx, 'depensesCDF', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
                          disabled={selectedForecast.monthlyForecasts[0]?.statut === 'approuve'}
                          aria-label={`Dépenses CDF pour ${m.month}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          id={`recettes-usd-${idx}`}
                          type="number"
                          value={m.recettesUSD}
                          onChange={(e) => updateEditedMonth(idx, 'recettesUSD', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
                          disabled={selectedForecast.monthlyForecasts[0]?.statut === 'approuve'}
                          aria-label={`Recettes USD pour ${m.month}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          id={`depenses-usd-${idx}`}
                          type="number"
                          value={m.depensesUSD}
                          onChange={(e) => updateEditedMonth(idx, 'depensesUSD', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
                          disabled={selectedForecast.monthlyForecasts[0]?.statut === 'approuve'}
                          aria-label={`Dépenses USD pour ${m.month}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 text-right">
                        {m.version && m.date_modification ? (
                          <span>v{m.version} • {new Date(m.date_modification).toLocaleDateString()}</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-3 py-2 text-sm text-gray-900">TOTAL</td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(editedMonthly.reduce((sum, m) => sum + (Number(m.recettesCDF) || 0), 0), 'CDF')}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(editedMonthly.reduce((sum, m) => sum + (Number(m.depensesCDF) || 0), 0), 'CDF')}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(editedMonthly.reduce((sum, m) => sum + (Number(m.recettesUSD) || 0), 0), 'USD')}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900">
                      {formatCurrency(editedMonthly.reduce((sum, m) => sum + (Number(m.depensesUSD) || 0), 0), 'USD')}
                    </td>
                    <td className="px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedForecast.monthlyForecasts[0]?.statut !== 'approuve' && (
              <div className="mt-6 flex justify-between items-center">
                <div className="flex-1">
                  {selectedForecast.monthlyForecasts[0]?.statut === 'en_revue' ? (
                    <p className="text-sm text-yellow-600">En attente d'approbation...</p>
                  ) : selectedForecast.monthlyForecasts[0]?.modificateur && (
                    <p className="text-sm text-gray-500">
                      Dernière modification par : {selectedForecast.monthlyForecasts[0].modificateur}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => setShowEditForecastModal(false)} 
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                    Annuler
                  </button>
                  {selectedForecast.monthlyForecasts[0]?.statut === 'en_revue' ? (
                    <>
                      <button
                        onClick={handleReject}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                        Rejeter
                      </button>
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">
                        Approuver
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveEditedForecasts}
                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                        Enregistrer comme brouillon
                      </button>
                      <button
                        onClick={handleSubmitForApproval}
                        className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                        Soumettre pour approbation
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'flux' && (
        <div id="panel-flux" role="tabpanel" aria-labelledby="tab-flux">
          <FluxTresorerieList />
        </div>
      )}

      {activeTab === 'fx' && (
        <div id="panel-fx" role="tabpanel" aria-labelledby="tab-fx">
          <GestionTauxChange />
        </div>
      )}

      {activeTab === 'rapprochement' && (
        <div id="panel-rapprochement" role="tabpanel" aria-labelledby="tab-rapprochement" className="space-y-4">
          {/* Boutons d'action pour le rapprochement */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-semibold">Rapprochement Bancaire</h3>
                <p className="text-sm text-gray-600">Rapprochez vos relevés bancaires avec vos écritures comptables</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRapprochementModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Lancer un nouveau rapprochement"
                  aria-label="Lancer un nouveau rapprochement"
                >
                  <Plus className="w-4 h-4" />
                  Lancer Rapprochement
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Valider ce rapprochement bancaire ?')) {
                      console.log('Rapprochement validé');
                    }
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  title="Valider le rapprochement"
                  aria-label="Valider le rapprochement"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider Rapprochement
                </button>
              </div>
            </div>
          </div>
          <RapprochementBancaire />
        </div>
      )}

      {activeTab === 'integration' && (
        <div id="panel-integration" role="tabpanel" aria-labelledby="tab-integration">
          <IntegrationComptabilite />
        </div>
      )}

      {activeTab === 'graphiques' && (
        <div id="panel-graphiques" role="tabpanel" aria-labelledby="tab-graphiques">
          <GraphiquesTresorerie exerciceId={selectedFiscalYear} />
        </div>
      )}

      {/* ✅ Onglet Investissements transféré vers BudgetModule */}

      {/* Modal Nouveau Flux de Trésorerie (IPSAS 2) */}
      <FluxTresorerieForm
        isOpen={showNewFluxModal}
        onClose={() => setShowNewFluxModal(false)}
        onSubmit={(data: FluxTresorerieData) => {
          console.log('Nouveau flux:', data);
          // TODO: Intégrer avec le service de trésorerie
        }}
      />

      {/* Modal Nouvelle Prévision Mensuelle (IPSAS 24) */}
      <PrevisionMensuelleForm
        isOpen={showNewPrevisionModal}
        onClose={() => setShowNewPrevisionModal(false)}
        onSubmit={(data: PrevisionMensuelleData) => {
          console.log('Nouvelle prévision:', data);
          // TODO: Intégrer avec le service de prévisions
        }}
        taux={taux}
      />

      {/* ANCIEN CODE COMMENTÉ - À SUPPRIMER APRÈS VALIDATION */}
      {false && showNewPrevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-green-600" />
              Nouvelle Prévision Mensuelle (IPSAS 24)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mois *</label>
                <select
                  value={newPrevision.mois}
                  onChange={(e) => setNewPrevision({...newPrevision, mois: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Mois de prévision"
                >
                  <option value="">Sélectionner...</option>
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map((m, i) => (
                    <option key={i} value={m}>{m} 2025</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="text-sm font-bold text-green-900 mb-3">Recettes Prévues</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">CDF *</label>
                      <input
                        type="number"
                        value={newPrevision.recettesCDF}
                        onChange={(e) => setNewPrevision({...newPrevision, recettesCDF: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">USD *</label>
                      <input
                        type="number"
                        value={newPrevision.recettesUSD}
                        onChange={(e) => setNewPrevision({...newPrevision, recettesUSD: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-sm font-bold text-red-900 mb-3">Dépenses Prévues</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">CDF *</label>
                      <input
                        type="number"
                        value={newPrevision.depensesCDF}
                        onChange={(e) => setNewPrevision({...newPrevision, depensesCDF: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">USD *</label>
                      <input
                        type="number"
                        value={newPrevision.depensesUSD}
                        onChange={(e) => setNewPrevision({...newPrevision, depensesUSD: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taux de Change USD/CDF</label>
                <input
                  type="number"
                  value={newPrevision.tauxChange}
                  onChange={(e) => setNewPrevision({...newPrevision, tauxChange: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>IPSAS 24:</strong> Workflow: Brouillon → Soumis → Approuvé. Multi-devises CDF/USD.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewPrevisionModal(false);
                  setNewPrevision({ mois: '', recettesCDF: 0, recettesUSD: 0, depensesCDF: 0, depensesUSD: 0, tauxChange: taux });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle prévision:', newPrevision);
                  setShowNewPrevisionModal(false);
                  setNewPrevision({ mois: '', recettesCDF: 0, recettesUSD: 0, depensesCDF: 0, depensesUSD: 0, tauxChange: taux });
                }}
                disabled={!newPrevision.mois}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-medium"
              >
                Créer la Prévision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rapprochement Bancaire (SYSCOHADA) */}
      <RapprochementBancaireForm
        isOpen={showRapprochementModal}
        onClose={() => setShowRapprochementModal(false)}
        onSubmit={(data: RapprochementBancaireData) => {
          console.log('Nouveau rapprochement:', data);
          // TODO: Intégrer avec le service de rapprochement
        }}
      />

      {/* ANCIEN CODE COMMENTÉ - À SUPPRIMER APRÈS VALIDATION */}
      {false && showRapprochementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <GitCompare className="h-6 w-6 mr-2 text-purple-600" />
              Lancer un Rapprochement Bancaire (SYSCOHADA)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Compte Bancaire *</label>
                <select
                  value={newRapprochement.compteBancaire}
                  onChange={(e) => setNewRapprochement({...newRapprochement, compteBancaire: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  aria-label="Compte bancaire"
                >
                  <option value="">Sélectionner...</option>
                  <option value="521">521 - Banques CDF</option>
                  <option value="522">522 - Banques USD</option>
                  <option value="531">531 - Chèques postaux</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Solde Relevé Bancaire (FCFA) *</label>
                  <input
                    type="number"
                    value={newRapprochement.soldeReleve}
                    onChange={(e) => setNewRapprochement({...newRapprochement, soldeReleve: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Solde Comptable (FCFA) *</label>
                  <input
                    type="number"
                    value={newRapprochement.soldeComptable}
                    onChange={(e) => {
                      const soldeComptable = parseFloat(e.target.value);
                      const ecarts = newRapprochement.soldeReleve - soldeComptable;
                      setNewRapprochement({...newRapprochement, soldeComptable, ecarts});
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date du Relevé *</label>
                <input
                  type="date"
                  value={newRapprochement.dateReleve}
                  onChange={(e) => setNewRapprochement({...newRapprochement, dateReleve: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className={`p-4 rounded-lg border ${newRapprochement.ecarts === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <p className={`text-sm font-bold ${newRapprochement.ecarts === 0 ? 'text-green-900' : 'text-yellow-900'}`}>
                  Écarts: {newRapprochement.ecarts.toLocaleString()} FCFA
                </p>
                <p className={`text-xs mt-1 ${newRapprochement.ecarts === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                  {newRapprochement.ecarts === 0 ? '✓ Comptes rapprochés' : '⚠ Écarts à justifier'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>SYSCOHADA + Contrôle interne:</strong> Solde relevé = Solde comptable + Écarts.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRapprochementModal(false);
                  setNewRapprochement({ compteBancaire: '', soldeReleve: 0, soldeComptable: 0, ecarts: 0, dateReleve: new Date().toISOString().split('T')[0] });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau rapprochement:', newRapprochement);
                  setShowRapprochementModal(false);
                  setNewRapprochement({ compteBancaire: '', soldeReleve: 0, soldeComptable: 0, ecarts: 0, dateReleve: new Date().toISOString().split('T')[0] });
                }}
                disabled={!newRapprochement.compteBancaire}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 font-medium"
              >
                Lancer le Rapprochement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
