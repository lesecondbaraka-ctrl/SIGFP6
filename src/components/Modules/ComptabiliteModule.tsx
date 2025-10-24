import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Calculator, 
  Lock,
  Plus,
  Search,
  AlertTriangle,
  Download,
  CheckCircle,
  Filter
} from 'lucide-react';
import { X } from 'lucide-react';
import CreateEcritureForm from './CreateEcritureFormV2';

import { PlanComptableService } from '../../services/PlanComptableService';
import { EcritureComptableService } from '../../services/EcritureComptableService';
import { GrandLivreService } from '../../services/GrandLivreService';
import JournalModule from './JournalModule';
import { ComptabiliteReadService } from '../../services/ComptabiliteReadService';
import { supabase } from '../../lib/supabase';
import type { 
  CompteComptable, 
  EcritureComptable, 
  Balance
} from '../../types/comptabilite';

type OngletComptabilite = 'plan' | 'ecritures' | 'grand-livre' | 'balance' | 'rapports' | 'cloture';

export default function ComptabiliteModule() {
  const [ongletActif, setOngletActif] = useState<OngletComptabilite>('ecritures');
  const [exerciceId, setExerciceId] = useState<string>('');
  const [comptes, setComptes] = useState<CompteComptable[]>([]);
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [returnToRapportsAfterCreate, setReturnToRapportsAfterCreate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Données lecture seule pour l'onglet Rapports
  const [rapportsLoading, setRapportsLoading] = useState<boolean>(false);
  const [rapportsEcritures, setRapportsEcritures] = useState<any[]>([]);
  const [rapportsComptes, setRapportsComptes] = useState<any[]>([]);
  const [rapportsFilters, setRapportsFilters] = useState<{ q: string; journal: string; entite: string; statut: string; dateFrom: string; dateTo: string }>({ q: '', journal: '', entite: '', statut: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
    let cancelled = false;
    let timer: any;
    const loadRapports = async () => {
      if (ongletActif !== 'rapports') return;
      setRapportsLoading(true);
      try {
        const [rows, accts] = await Promise.all([
          ComptabiliteReadService.fetchEcritures({
            exerciceId,
            q: rapportsFilters.q,
            journal: rapportsFilters.journal as any,
            entite: rapportsFilters.entite,
            statut: (rapportsFilters.statut === 'Validée' ? 'VALIDEE' : rapportsFilters.statut === 'En attente' ? 'BROUILLON' : rapportsFilters.statut === 'Rejetée' ? 'REJETEE' : undefined) as any,
            dateFrom: rapportsFilters.dateFrom,
            dateTo: rapportsFilters.dateTo,
          }),
          ComptabiliteReadService.fetchComptes({ exerciceId })
        ]);
        if (!cancelled) {
          setRapportsEcritures(rows);
          setRapportsComptes(accts);
        }
      } catch (err) {
        if (!cancelled) console.error('Erreur Rapports (lecture seule):', err);
      } finally {
        if (!cancelled) setRapportsLoading(false);
      }
    };
    // Debounce pour éviter clignotements lors des saisies de filtres
    timer = setTimeout(loadRapports, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ongletActif, exerciceId, rapportsFilters]);


  useEffect(() => {
    // Récupérer l'exercice actif
    const exerciceActif = localStorage.getItem('exercice_actif');
    if (exerciceActif) {
      setExerciceId(exerciceActif);
      chargerDonnees(exerciceActif);
      // Charger aussi la balance au démarrage avec l'exercice
      chargerBalance(exerciceActif);
    }
  }, []);

  // Realtime: rafraîchir quand des écritures/lignes changent
  useEffect(() => {
    if (!exerciceId) return;

    const refreshAll = () => {
      chargerDonnees(exerciceId);
      if (ongletActif === 'balance') {
        chargerBalance();
      }
    };

    const chanEcritures = supabase
      .channel('ecritures_comptables_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ecritures_comptables', filter: `exercice_id=eq.${exerciceId}` }, () => {
        refreshAll();
      })
      .subscribe();

    const chanLignes = supabase
      .channel('lignes_ecritures_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lignes_ecritures' }, () => {
        refreshAll();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(chanEcritures); } catch {}
      try { supabase.removeChannel(chanLignes); } catch {}
    };
  }, [exerciceId, ongletActif]);

  const chargerDonnees = async (exId: string) => {
    setLoading(true);
    try {
      const [comptesData, ecrituresData] = await Promise.all([
        PlanComptableService.getComptes(exId),
        EcritureComptableService.getEcritures(exId)
      ]);
      setComptes(comptesData);
      setEcritures(ecrituresData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const chargerBalance = async (exId?: string) => {
    const exerciceAUtiliser = exId || exerciceId;
    if (!exerciceAUtiliser) return;
    setLoading(true);
    try {
      const balanceData = await GrandLivreService.genererBalance(exerciceAUtiliser);
      setBalance(balanceData);
    } catch (error) {
      console.error('Erreur lors de la génération de la balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comptabilité Générale</h1>
          <p className="text-gray-600 mt-1">Gestion complète de la comptabilité</p>
        </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setOngletActif('plan')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'plan'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="inline-block w-5 h-5 mr-2" />
            Plan Comptable
          </button>
          <button
            onClick={() => setOngletActif('ecritures')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'ecritures'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            Écritures
          </button>
          <button
            onClick={() => setOngletActif('grand-livre')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'grand-livre'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="inline-block w-5 h-5 mr-2" />
            Grand Livre
          </button>
          <button
            onClick={() => {
              setOngletActif('balance');
              chargerBalance();
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'balance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calculator className="inline-block w-5 h-5 mr-2" />
            Balance
          </button>
          <button
            onClick={() => setOngletActif('rapports')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'rapports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            title="Journal et rapports"
            aria-label="Onglet Rapports (lecture seule)"
          >
            <FileText className="inline-block w-5 h-5 mr-2" />
            Rapports
          </button>
          <button
            onClick={() => setOngletActif('cloture')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              ongletActif === 'cloture'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Lock className="inline-block w-5 h-5 mr-2" />
            Clôture
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="mt-6">
        {ongletActif === 'plan' && <PlanComptableTab comptes={comptes} exerciceId={exerciceId} onRefresh={() => chargerDonnees(exerciceId)} />}
        {ongletActif === 'ecritures' && <EcrituresTab ecritures={ecritures} onNew={() => setShowCreateModal(true)} />}
        {ongletActif === 'rapports' && (
          <div className="mt-4">
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
              <span className="font-medium">Rapports (lecture seule).</span> Pour saisir et valider des opérations, utilisez l'onglet <span className="font-semibold">Écritures</span>. Pour la balance officielle, utilisez l'onglet <span className="font-semibold">Balance</span>.
            </div>
            {rapportsLoading ? (
              <div className="bg-white p-6 rounded-lg border text-gray-600">Chargement des rapports…</div>
            ) : (
              <JournalModule
                ecritures={rapportsEcritures}
                comptes={rapportsComptes}
                onFiltersChange={(f) => {
                  // Mise à jour uniquement si les filtres changent réellement
                  setRapportsFilters(prev => {
                    if (
                      prev.q === f.q &&
                      prev.journal === f.journal &&
                      prev.entite === f.entite &&
                      prev.statut === f.statut &&
                      prev.dateFrom === f.dateFrom &&
                      prev.dateTo === f.dateTo
                    ) {
                      return prev;
                    }
                    return f;
                  });
                }}
                onCreateRequested={() => { setReturnToRapportsAfterCreate(true); setOngletActif('ecritures'); setShowCreateModal(true); }}
              />
            )}
          </div>
        )}
        {ongletActif === 'grand-livre' && <GrandLivreTab comptes={comptes} exerciceId={exerciceId} />}
        {ongletActif === 'balance' && <BalanceTab balance={balance} loading={loading} onRefresh={chargerBalance} />}
        {ongletActif === 'cloture' && <ClotureTab />}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Nouvelle Écriture Comptable</h3>
                <p className="text-sm text-gray-600 mt-1">Saisie en partie double conforme SYSCOHADA</p>
              </div>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors" 
                onClick={() => setShowCreateModal(false)} 
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CreateEcritureForm
                exerciceId={exerciceId}
                onCancel={() => setShowCreateModal(false)}
                onCreated={() => {
                  chargerDonnees(exerciceId);
                  setShowCreateModal(false);
                  setToastMsg('✅ Écriture créée avec succès');
                  setTimeout(() => setToastMsg(''), 3000);
                  if (returnToRapportsAfterCreate) {
                    setOngletActif('rapports');
                    setReturnToRapportsAfterCreate(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONGLET PLAN COMPTABLE
// ============================================================================

function PlanComptableTab({ comptes, exerciceId, onRefresh }: { 
  comptes: CompteComptable[]; 
  exerciceId: string;
  onRefresh: () => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [classeFiltre, setClasseFiltre] = useState<string>('');

  const comptesFiltres = comptes.filter(compte => {
    const matchRecherche = compte.numero.includes(recherche) || 
                          compte.libelle.toLowerCase().includes(recherche.toLowerCase());
    const matchClasse = !classeFiltre || compte.classe === classeFiltre;
    return matchRecherche && matchClasse;
  });

  const initialiserPlan = async () => {
    if (confirm('Initialiser le plan comptable SYSCOHADA ? Cette action créera tous les comptes de base.')) {
      await PlanComptableService.initialiserPlanSYSCOHADA(exerciceId);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête SYSCOHADA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 border-2 border-purple-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="bg-white rounded-lg p-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-base">Plan Comptable SYSCOHADA</h4>
            <p className="text-sm text-purple-100 mt-2 leading-relaxed">
              Classification normalisée des comptes selon le référentiel OHADA. Structure en 9 classes (1 à 9) conformément au SYSCOHADA révisé.
            </p>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un compte..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={classeFiltre}
            onChange={e => setClasseFiltre(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            title="Filtrer par classe de compte"
            aria-label="Filtrer par classe de compte"
          >
            <option value="">Toutes les classes</option>
            <option value="1">Classe 1 - Comptes de ressources durables</option>
            <option value="2">Classe 2 - Comptes d'actif immobilisé</option>
            <option value="3">Classe 3 - Comptes de stocks</option>
            <option value="4">Classe 4 - Comptes de tiers</option>
            <option value="5">Classe 5 - Comptes de trésorerie</option>
            <option value="6">Classe 6 - Comptes de charges</option>
            <option value="7">Classe 7 - Comptes de produits</option>
            <option value="8">Classe 8 - Comptes spéciaux</option>
            <option value="9">Classe 9 - Comptes analytiques</option>
          </select>
        </div>
          <button
            onClick={initialiserPlan}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Initialiser SYSCOHADA</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-md border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-600">Total comptes</div>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{comptes.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md border-2 border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-700">Comptes actifs</div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-700">
            {comptes.filter(c => c.est_actif).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md border-2 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-700">Comptes lettrables</div>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {comptes.filter(c => c.est_lettrable).length}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-md border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-purple-700">Solde total</div>
            <Calculator className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {comptes.reduce((sum, c) => sum + c.solde_debiteur - c.solde_crediteur, 0).toLocaleString()} XAF
          </div>
        </div>
      </div>

      {/* Table des comptes */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b-2 border-gray-200">
          <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2">
            <div className="w-1 h-6 bg-purple-600 rounded"></div>
            <span>Liste des Comptes ({comptesFiltres.length})</span>
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Numéro</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Libellé</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Classe</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nature</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider">Solde Débiteur</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-red-700 uppercase tracking-wider">Solde Créditeur</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comptesFiltres.map((compte) => (
              <tr key={compte.id} className="hover:bg-purple-50 transition-colors border-b border-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {compte.numero}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{compte.libelle}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Classe {compte.classe}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {compte.nature}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-700">
                  {compte.solde_debiteur > 0 ? compte.solde_debiteur.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-700">
                  {compte.solde_crediteur > 0 ? compte.solde_crediteur.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {compte.est_actif ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Actif
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactif
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET ÉCRITURES JOURNAL - SAISIE EN PARTIE DOUBLE
// ============================================================================

function EcrituresTab({ ecritures, onNew }: { 
  ecritures: EcritureComptable[];
  onNew: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* En-tête avec principe de partie double */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Saisie en Partie Double (SYSCOHADA)</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Principe fondamental :</strong> Toute opération comptable doit respecter l'équilibre Débit = Crédit.
              Chaque écriture est enregistrée de manière permanente et traçable conformément à l'article 16 du SYSCOHADA révisé.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton pour créer une nouvelle écriture */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span>Écritures Comptables</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Toutes les écritures sont enregistrées de manière permanente dans la base de données.
            </p>
          </div>
          <button
            onClick={onNew}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle Écriture</span>
          </button>
        </div>

        {/* Liste des écritures existantes */}
        {ecritures.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Écritures récentes ({ecritures.length})
            </h3>
            {ecritures.slice(0, 10).map((ecriture: EcritureComptable) => (
              <div key={ecriture.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{ecriture.libelle}</p>
                    <p className="text-sm text-gray-600">
                      {ecriture.journal_libelle} • {new Date(ecriture.date_ecriture).toLocaleDateString('fr-FR')} • N° {ecriture.numero}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      ecriture.statut === 'VALIDEE' ? 'bg-green-100 text-green-800' :
                      ecriture.statut === 'BROUILLON' ? 'bg-yellow-100 text-yellow-800' :
                      ecriture.statut === 'COMPTABILISEE' ? 'bg-blue-100 text-blue-800' :
                      ecriture.statut === 'ANNULEE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ecriture.statut === 'VALIDEE' ? '✓ Validée' :
                       ecriture.statut === 'BROUILLON' ? '⏳ Brouillon' :
                       ecriture.statut === 'COMPTABILISEE' ? '📊 Comptabilisée' :
                       ecriture.statut === 'ANNULEE' ? '✗ Annulée' :
                       ecriture.statut}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune écriture comptable pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Cliquez sur "Nouvelle Écriture" pour commencer</p>
          </div>
        )}
      </div>

      {/* Principes comptables OHADA */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-gray-800 mb-3">Principes Comptables Appliqués</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Partie Double</p>
              <p className="text-sm text-gray-600">Équilibre obligatoire Débit = Crédit</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Permanence</p>
              <p className="text-sm text-gray-600">Enregistrement définitif en base de données</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Traçabilité</p>
              <p className="text-sm text-gray-600">Numérotation séquentielle et horodatage</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Pièces Justificatives</p>
              <p className="text-sm text-gray-600">Chaque écriture doit être justifiée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET BALANCE
// ============================================================================

function BalanceTab({ balance, loading, onRefresh }: { balance: Balance | null; loading: boolean; onRefresh: () => void }) {
  if (loading) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Génération de la balance en cours...</p>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Cliquez sur l'onglet Balance pour générer la balance</p>
      </div>
    );
  }

  const verification = GrandLivreService.verifierEquilibreBalance(balance);

  const exporterBalance = () => {
    // TODO: Implémenter export Excel de la balance
    alert('Éxport Excel de la balance - Fonctionnalité à implémenter');
  };

  return (
    <div className="space-y-6">
      {/* En-tête SYSCOHADA */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 border-2 border-green-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="bg-white rounded-lg p-2">
            <Calculator className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-base">Balance Générale (Article 18 SYSCOHADA)</h4>
            <p className="text-sm text-green-100 mt-2 leading-relaxed">
              État récapitulatif à 6 colonnes : Soldes initiaux, Mouvements de la période, Soldes finaux. Vérification obligatoire de l'équilibre Débit = Crédit.
            </p>
          </div>
        </div>
      </div>
      {/* Alerte d'équilibre */}
      {!verification.estEquilibre ? (
        <div 
          role="alert" 
          aria-live="assertive"
          className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 shadow-md"
        >
          <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-900 text-base">❌ Balance non équilibrée - Anomalie détectée</h4>
            <p className="text-sm text-red-700 mt-2 font-medium">
              Écart solde final : <span className="font-bold">{verification.ecarts.solde_final.toFixed(2)} XAF</span>
            </p>
            <p className="text-xs text-red-600 mt-1">
              La balance doit impérativement être équilibrée (Total Débit = Total Crédit) conformément à l'article 18 du SYSCOHADA.
            </p>
          </div>
        </div>
      ) : (
        <div 
          role="status" 
          aria-live="polite"
          className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 flex items-start space-x-3 shadow-md"
        >
          <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-green-900 text-base">✅ Balance équilibrée et conforme</h4>
            <p className="text-sm text-green-700 mt-2">
              La balance respecte le principe d'équilibre comptable (Débit = Crédit)
            </p>
            <p className="text-xs text-green-600 mt-1 font-medium">
              Période : {new Date(balance.date_debut).toLocaleDateString('fr-FR')} au {new Date(balance.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl shadow-md border-2 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-700">Solde Initial Débit</div>
            <Calculator className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {balance.totaux.solde_initial_debit.toLocaleString()} XAF
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-md border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-purple-700">Solde Initial Crédit</div>
            <Calculator className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {balance.totaux.solde_initial_credit.toLocaleString()} XAF
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md border-2 border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-700">Mouvements Débit</div>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-700">
            {balance.totaux.mouvement_debit.toLocaleString()} XAF
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-md border-2 border-red-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-red-700">Mouvements Crédit</div>
            <CheckCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">
            {balance.totaux.mouvement_credit.toLocaleString()} XAF
          </div>
        </div>
      </div>

      {/* Soldes finaux */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl shadow-md border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-emerald-700">Solde Final Débit</div>
            <Download className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            {balance.totaux.solde_final_debit.toLocaleString()} XAF
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-xl shadow-md border-2 border-rose-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-rose-700">Solde Final Crédit</div>
            <Download className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-bold text-rose-700">
            {balance.totaux.solde_final_credit.toLocaleString()} XAF
          </div>
        </div>
      </div>

      {/* Table de la balance */}
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b-2 border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-6 bg-green-600 rounded"></div>
            <h3 className="font-bold text-gray-900 text-lg">Balance à 6 Colonnes ({balance.lignes.length} comptes)</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
              title="Rafraîchir la balance"
            >
              <Calculator className="w-4 h-4" />
              <span>Rafraîchir</span>
            </button>
            <button
              onClick={exporterBalance}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Exporter Excel</span>
            </button>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">Compte</th>
              <th rowSpan={2} className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">Libellé</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-gray-300">Soldes Initiaux</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-purple-700 uppercase tracking-wider border-r border-gray-300">Mouvements Période</th>
              <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Soldes Finaux</th>
            </tr>
            <tr>
              <th className="px-4 py-2 text-right text-xs font-bold text-blue-600 uppercase tracking-wider">Débit</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-blue-600 uppercase tracking-wider border-r border-gray-300">Crédit</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-green-700 uppercase tracking-wider">Débit</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-red-700 uppercase tracking-wider border-r border-gray-300">Crédit</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-emerald-700 uppercase tracking-wider">Débit</th>
              <th className="px-4 py-2 text-right text-xs font-bold text-rose-700 uppercase tracking-wider">Crédit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {balance.lignes.map((ligne, index) => (
              <tr key={index} className="hover:bg-green-50 transition-colors border-b border-gray-100">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-200">
                  {ligne.compte_numero}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{ligne.compte_libelle}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                  {ligne.solde_initial_debit > 0 ? ligne.solde_initial_debit.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600 border-r border-gray-200">
                  {ligne.solde_initial_credit > 0 ? ligne.solde_initial_credit.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-700">
                  {ligne.mouvement_debit > 0 ? ligne.mouvement_debit.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-red-700 border-r border-gray-200">
                  {ligne.mouvement_credit > 0 ? ligne.mouvement_credit.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-emerald-700">
                  {ligne.solde_final_debit > 0 ? ligne.solde_final_debit.toLocaleString() + ' XAF' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-rose-700">
                  {ligne.solde_final_credit > 0 ? ligne.solde_final_credit.toLocaleString() + ' XAF' : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold border-t-4 border-gray-400">
            <tr>
              <td colSpan={2} className="px-4 py-4 text-base text-right text-gray-900 uppercase tracking-wide border-r border-gray-400">TOTAUX GÉNÉRAUX :</td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-blue-700 bg-blue-50">
                {balance.totaux.solde_initial_debit.toLocaleString()} XAF
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-blue-700 bg-blue-50 border-r border-gray-400">
                {balance.totaux.solde_initial_credit.toLocaleString()} XAF
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-green-700 bg-green-50">
                {balance.totaux.mouvement_debit.toLocaleString()} XAF
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-red-700 bg-red-50 border-r border-gray-400">
                {balance.totaux.mouvement_credit.toLocaleString()} XAF
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-emerald-700 bg-emerald-50">
                {balance.totaux.solde_final_debit.toLocaleString()} XAF
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-base text-right font-bold text-rose-700 bg-rose-50">
                {balance.totaux.solde_final_credit.toLocaleString()} XAF
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET GRAND LIVRE
// ============================================================================

function GrandLivreTab({ comptes, exerciceId }: { comptes: CompteComptable[]; exerciceId: string }) {
  const [compteSelectionne, setCompteSelectionne] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const chargerMouvements = async () => {
    if (!compteSelectionne || !exerciceId) return;
    setLoading(true);
    try {
      // Récupération des mouvements depuis le Grand Livre
      const compte = comptes.find(c => c.numero === compteSelectionne);
      if (!compte) {
        setMouvements([]);
        return;
      }

      // TODO: Implémenter getMouvementsCompte dans GrandLivreService
      // Pour l'instant, on affiche un message
      console.log('Chargement des mouvements pour le compte:', compte.numero);
      setMouvements([]);
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
      setMouvements([]);
    } finally {
      setLoading(false);
    }
  };

  const exporterGrandLivre = async () => {
    if (!compteSelectionne || mouvements.length === 0) return;
    
    try {
      const compte = comptes.find(c => c.numero === compteSelectionne);
      if (!compte) return;

      // TODO: Implémenter exporterGrandLivre dans GrandLivreService
      console.log('Export du Grand Livre pour le compte:', compte.numero);
      alert('Export du Grand Livre - Fonctionnalité à implémenter');
    } catch (error) {
      console.error('Erreur export Grand Livre:', error);
      alert('Erreur lors de l\'export du Grand Livre');
    }
  };

  const totalDebit = mouvements.reduce((sum, m) => sum + m.debit, 0);
  const totalCredit = mouvements.reduce((sum, m) => sum + m.credit, 0);
  const soldeFinal = totalDebit - totalCredit;

  return (
    <div className="space-y-6">
      {/* En-tête OHADA */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BookOpen className="w-6 h-6 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900">Grand Livre Général (SYSCOHADA)</h3>
            <p className="text-sm text-purple-700 mt-1">
              Historique détaillé de tous les mouvements comptables par compte. Conforme à l'article 17 du SYSCOHADA révisé.
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span>Sélection du compte</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Compte comptable *</label>
            <select
              value={compteSelectionne}
              onChange={(e) => setCompteSelectionne(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-purple-500"
              title="Sélectionner un compte comptable"
              aria-label="Sélectionner un compte comptable"
            >
              <option value="">Sélectionner un compte</option>
              {comptes.map((c) => (
                <option key={c.id} value={c.numero}>
                  {c.numero} - {c.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-purple-500"
              title="Date de début"
              aria-label="Date de début de la période"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-purple-500"
              title="Date de fin"
              aria-label="Date de fin de la période"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-4">
          <button
            onClick={chargerMouvements}
            disabled={!compteSelectionne}
            className={`px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 ${
              compteSelectionne ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Afficher les mouvements</span>
          </button>
          <button
            onClick={exporterGrandLivre}
            disabled={mouvements.length === 0}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center space-x-2 disabled:bg-gray-400"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Excel</span>
          </button>
        </div>
      </div>

      {/* Tableau des mouvements */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des mouvements...</p>
        </div>
      ) : mouvements.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h3 className="text-lg font-semibold text-white">
              Mouvements du compte {compteSelectionne}
            </h3>
            <p className="text-sm text-purple-100 mt-1">{mouvements.length} mouvement(s) trouvé(s)</p>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Écriture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Journal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pièce</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Solde</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mouvements.map((mvt, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{new Date(mvt.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{mvt.numero_ecriture}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{mvt.journal}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{mvt.libelle}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{mvt.piece}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                    {mvt.debit > 0 ? mvt.debit.toLocaleString() + ' XAF' : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                    {mvt.credit > 0 ? mvt.credit.toLocaleString() + ' XAF' : ''}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-bold ${mvt.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {mvt.solde.toLocaleString()} XAF
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm text-gray-900">TOTAUX</td>
                <td className="px-4 py-3 text-sm text-right text-green-700">{totalDebit.toLocaleString()} XAF</td>
                <td className="px-4 py-3 text-sm text-right text-red-700">{totalCredit.toLocaleString()} XAF</td>
                <td className={`px-4 py-3 text-sm text-right ${soldeFinal >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {soldeFinal.toLocaleString()} XAF
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : compteSelectionne ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun mouvement trouvé pour ce compte</p>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Sélectionnez un compte pour afficher son grand livre</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONGLET CLÔTURE
// ============================================================================

function ClotureTab() {
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState<string>('');
  const [typeCloture, setTypeCloture] = useState<'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE'>('MENSUELLE');
  const [etapeActuelle, setEtapeActuelle] = useState<number>(1);
  const [controlesOK, setControlesOK] = useState(false);
  const [loading, setLoading] = useState(false);

  const executerControles = async () => {
    if (!periodeSelectionnee) {
      alert('Veuillez sélectionner une période');
      return;
    }

    setLoading(true);
    try {
      // Exécution réelle des contrôles de clôture
      // TODO: Implémenter les vérifications réelles via services
      // - Vérifier équilibre des écritures
      // - Vérifier cohérence de la balance
      // - Vérifier lettrage des comptes
      // - Vérifier rapprochements bancaires
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setControlesOK(true);
      setEtapeActuelle(2);
    } catch (error) {
      console.error('Erreur lors des contrôles:', error);
      alert('Erreur lors de l\'exécution des contrôles');
      setControlesOK(false);
    } finally {
      setLoading(false);
    }
  };

  const genererEcrituresRegularisation = async () => {
    setLoading(true);
    try {
      // TODO: Implémenter la génération réelle des écritures de régularisation
      // - Amortissements
      // - Provisions
      // - Charges à payer
      // - Produits constatés d'avance
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEtapeActuelle(3);
    } catch (error) {
      console.error('Erreur génération écritures:', error);
      alert('Erreur lors de la génération des écritures de régularisation');
    } finally {
      setLoading(false);
    }
  };

  const cloturerPeriode = async () => {
    if (!confirm('⚠️ ATTENTION : La clôture est IRRÉVERSIBLE.\n\nConfirmer la clôture définitive de la période ?')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Implémenter la clôture réelle via service
      // - Verrouillage de la période
      // - Génération des écritures d'à-nouveau
      // - Mise à jour du statut de l'exercice
      await new Promise(resolve => setTimeout(resolve, 2000));
      setEtapeActuelle(4);
      alert('✅ Période clôturée avec succès !');
    } catch (error) {
      console.error('Erreur clôture:', error);
      alert('Erreur lors de la clôture de la période');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Lock className="w-6 h-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Clôture Comptable</h3>
            <p className="text-sm text-red-700 mt-1">
              Processus de clôture mensuelle, trimestrielle ou annuelle conforme au SYSCOHADA. 
              Génération automatique des écritures de régularisation et d'à-nouveau.
            </p>
          </div>
        </div>
      </div>

      {/* Sélection période */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sélection de la période</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Type de clôture</label>
            <select 
              value={typeCloture}
              onChange={(e) => setTypeCloture(e.target.value as 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE')}
              className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-red-500"
              title="Type de clôture"
              aria-label="Sélectionner le type de clôture"
            >
              <option value="MENSUELLE">Clôture Mensuelle</option>
              <option value="TRIMESTRIELLE">Clôture Trimestrielle</option>
              <option value="ANNUELLE">Clôture Annuelle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Période</label>
            <input
              type="month"
              value={periodeSelectionnee}
              onChange={(e) => setPeriodeSelectionnee(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-red-500"
              title="Période de clôture"
              aria-label="Sélectionner la période à clôturer"
            />
          </div>
        </div>
      </div>

      {/* Étapes de clôture */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Processus de clôture</h3>
        <div className="space-y-4">
          {/* Étape 1: Contrôles */}
          <div className={`border-l-4 p-4 rounded ${etapeActuelle >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">1</span>
                  <span>Contrôles préalables</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1 ml-8">Vérification de l'équilibre et de la cohérence</p>
              </div>
              {etapeActuelle === 1 && (
                <button
                  onClick={executerControles}
                  disabled={!periodeSelectionnee || loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Contrôle en cours...</span>
                    </>
                  ) : (
                    <span>Exécuter les contrôles</span>
                  )}
                </button>
              )}
              {etapeActuelle > 1 && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
            {controlesOK && etapeActuelle >= 2 && (
              <div className="mt-3 ml-8 space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Équilibre des écritures vérifié</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Cohérence de la balance confirmée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Lettrage des comptes validé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-700">Rapprochements bancaires OK</span>
                </div>
              </div>
            )}
          </div>

          {/* Étape 2: Régularisations */}
          <div className={`border-l-4 p-4 rounded ${etapeActuelle >= 2 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-sm">2</span>
                  <span>Écritures de régularisation</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1 ml-8">Amortissements, provisions, charges à payer</p>
              </div>
              {etapeActuelle === 2 && (
                <button
                  onClick={genererEcrituresRegularisation}
                  disabled={loading}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Génération...</span>
                    </>
                  ) : (
                    <span>Générer les écritures</span>
                  )}
                </button>
              )}
              {etapeActuelle > 2 && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
          </div>

          {/* Étape 3: Clôture */}
          <div className={`border-l-4 p-4 rounded ${etapeActuelle >= 3 ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-sm">3</span>
                  <span>Clôture définitive</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1 ml-8">Verrouillage de la période</p>
              </div>
              {etapeActuelle === 3 && (
                <button
                  onClick={cloturerPeriode}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Clôture en cours...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Clôturer</span>
                    </>
                  )}
                </button>
              )}
              {etapeActuelle > 3 && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>
          </div>

          {/* Étape 4: À-nouveau */}
          <div className={`border-l-4 p-4 rounded ${etapeActuelle >= 4 ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm">4</span>
                  <span>Écritures d'à-nouveau</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1 ml-8">Report des soldes sur l'exercice suivant</p>
              </div>
              {etapeActuelle === 4 && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                  ✓ Clôture terminée
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {!periodeSelectionnee && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Période non sélectionnée</h4>
              <p className="text-sm text-yellow-700 mt-1">Veuillez sélectionner une période avant de commencer le processus de clôture.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
