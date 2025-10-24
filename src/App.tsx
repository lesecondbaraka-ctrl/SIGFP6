import React, { useState } from "react";
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { DataProvider } from './contexts/DataContext';
import './styles/progress-bars.css';
import {
  useAlerts,
  useBudgetItems,
  useDepenses,
  useRecettes,
  useFluxTresorerie,
  useAgents,
  useTransactions,
} from './hooks/useSupabase';

import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import { StatCard } from './components/Dashboard/StatCard';
import AlertsPanel from './components/Dashboard/AlertsPanel';
import BudgetModule from './components/Modules/BudgetModule';
import ControlModule from './components/Modules/ControlModule';
import DepensesModule from './components/Modules/DepensesModule';
import RecettesModule from './components/Modules/RecettesModule';
import TresorerieModule from './components/Modules/TresorerieModule';
import RHModule from './components/Modules/RHModule';
import ArchivageModule from './components/Modules/ArchivageModule';
import ValidationModule from './components/Modules/ValidationModule';
import ComptabiliteModule from './components/Modules/ComptabiliteModule';
import EtatsFinanciersModule from './components/Modules/EtatsFinanciersModule';
import IGFModule from './components/Modules/IGFModule';
import FraudeDetectionModule from './components/Modules/FraudeDetectionModule';
import TransparencePubliqueModule from './components/Modules/TransparencePubliqueModule';
import ConformiteModule from './components/Modules/ConformiteModule';
import AuditReportingModule from './components/Modules/AuditReportingModule';

import {
  PieChart,
  CreditCard,
  TrendingUp,
  Vault,
  CheckCircle,
  AlertTriangle,
  Shield,
} from 'lucide-react';

// Composant principal de l'application
function AppContent() {
    const { authState, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');

  // Si pas authentifié, afficher le formulaire de connexion
  if (!authState.isAuthenticated) {
    return <LoginForm />;
  }

  // Si en cours de chargement
  if (authState.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <MainApp user={authState.user!} onLogout={logout} activeModule={activeModule} setActiveModule={setActiveModule} />;
}

// Error boundary to display runtime errors instead of a blank page
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any; info: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Runtime error caught by ErrorBoundary:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-700">Erreur d'exécution</h2>
          <pre className="whitespace-pre-wrap mt-4 text-sm text-gray-900">{String(this.state.error && this.state.error.message) || String(this.state.error)}</pre>
          <details className="mt-2 text-xs text-gray-600">
            <summary>Stack</summary>
            <pre className="whitespace-pre-wrap">{this.state.info?.componentStack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}

// Composant principal avec utilisateur authentifié
function MainApp({ 
  user, 
  onLogout, 
  activeModule, 
  setActiveModule 
}: { 
  user: any; 
  onLogout: () => void; 
  activeModule: string; 
  setActiveModule: (module: string) => void; 
}) {
  const { hasPermission } = useAuth();

  const { alerts = [], dismissAlert = () => {} } = useAlerts() || {};
  const { budgetItems = [] } = useBudgetItems() || {};
  const { depenses = [] } = useDepenses() || {};
  const { recettes = [] } = useRecettes() || {};
  const { fluxData = [] } = useFluxTresorerie() || {};
  const { agents = [] } = useAgents() || {};
  const { transactions = [] } = useTransactions() || {};

  // Typage explicite des tableaux extraits
  const recettesTyped = recettes;
  const fluxTyped = fluxData;
  const transactionsTyped: Transaction[] = transactions;
  const agentsTyped: Agent[] = agents;

  const dashboardStats = {
    budgetTotal: budgetItems.reduce((sum: number, item: any) => sum + (item.allocation || 0), 0),
    budgetExecute: budgetItems.reduce((sum: number, item: any) => sum + (item.execute || 0), 0),
    depensesTotal: depenses.reduce((sum: number, dep: any) => sum + (dep.montant || 0), 0),
    recettesTotal: recettesTyped.filter((r: any) => r?.statut === 'Encaissé')
      .reduce((sum: number, rec: any) => sum + (rec.montant || 0), 0),
    soldeTresorerie: fluxTyped.length > 0 ? (fluxTyped[0].solde || 0) : 0,
    transactionsValidees: transactionsTyped.filter((t: Transaction) => t?.statut === 'Validé IGF').length,
    anomaliesDetectees: transactionsTyped.filter((t: Transaction) => t?.statut === 'Rejeté IGF').length,
    totalAgents: agentsTyped.length,
    masseSalariale: agentsTyped.reduce((sum: number, agent: Agent) => sum + (agent.salaire_net || 0), 0),
  };

  // Map percentage to Tailwind width classes to avoid inline styles
  const getWidthClass = (pct: number) => {
    if (pct <= 0) return 'w-0';
    if (pct <= 25) return 'w-1/4';
    if (pct <= 50) return 'w-2/4';
    if (pct <= 75) return 'w-3/4';
    return 'w-full';
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(1)}T CDF`;
    } else if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(0)}M CDF`;
    } else {
      return new Intl.NumberFormat('fr-CD', {
        style: 'currency',
        currency: 'CDF',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'budget':
        return hasPermission('GESTION_BUDGET') ? <BudgetModule /> : <AccessDenied />;
      case 'comptabilite':
        return <ComptabiliteModule />;
      case 'depenses':
        return hasPermission('GESTION_DEPENSES') ? <DepensesModule /> : <AccessDenied />;
      case 'recettes':
        return hasPermission('GESTION_RECETTES') ? <RecettesModule /> : <AccessDenied />;
      case 'tresorerie':
        return hasPermission('GESTION_TRESORERIE') ? <TresorerieModule /> : <AccessDenied />;
      case 'controle':
        return hasPermission('CONTROLE_INTERNE') ? <ControlModule /> : <AccessDenied />;
      case 'audit':
        return hasPermission('AUDIT_REPORTING') ? <AuditReportingModule /> : <AccessDenied />;
      case 'igf':
        return <IGFModule />;
      case 'fraude':
        return <FraudeDetectionModule />;
      case 'transparence':
        return <TransparencePubliqueModule />;
      case 'rh-enhanced':
        return <RHModule />;
      case 'archivage':
        return <ArchivageModule />;
      case 'validation':
        return <ValidationModule />;
      case 'conformite':
        return <ConformiteModule />;
      
      case 'etats':
        return <EtatsFinanciersModule />;
      case 'dashboard':
      default:
        const budgetExecPct = Math.round(
          Math.min(
            100,
            dashboardStats.budgetTotal > 0
              ? (dashboardStats.budgetExecute / Math.max(1, dashboardStats.budgetTotal)) * 100
              : 0
          )
        );
        const budgetExecText = `Exécution: ${budgetExecPct}%`;
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord Principal</h2>
              <p className="text-gray-600">Vue d'ensemble du système financier public</p>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Budget Total Alloué"
                value={formatCurrency(dashboardStats.budgetTotal)}
                change={`${dashboardStats.budgetTotal > 0 ? ((dashboardStats.budgetExecute / dashboardStats.budgetTotal) * 100).toFixed(1) : 0}% d'exécution`}
                changeType="positive"
                icon={<PieChart />}
                color="bg-blue-600"
              />
              <StatCard
                title="Dépenses Exécutées"
                value={formatCurrency(dashboardStats.depensesTotal)}
                change={`${depenses.filter((d: any) => d.statut === 'Payé').length} dépenses payées`}
                changeType="positive"
                icon={<CreditCard />}
                color="bg-green-600"
              />
              <StatCard
                title="Recettes Collectées"
                value={formatCurrency(dashboardStats.recettesTotal)}
                change={`${recettesTyped.filter((r: any) => r.statut === 'Encaissé').length} recettes encaissées`}
                changeType="positive"
                icon={<TrendingUp />}
                color="bg-yellow-600"
              />
              <StatCard
                title="Solde Trésorerie"
                value={formatCurrency(dashboardStats.soldeTresorerie)}
                change="Position stable"
                changeType="neutral"
                icon={<Vault />}
                color="bg-purple-600"
              />
            </div>

            {/* Alertes et contrôles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Contrôles en Temps Réel</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">{dashboardStats.transactionsValidees}</p>
                      <p className="text-sm text-green-600">Transactions Validées</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{dashboardStats.anomaliesDetectees}</p>
                      <p className="text-sm text-red-600">Anomalies Détectées</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors">
                    Voir Détails des Contrôles
                  </button>
                </div>
              </div>
            </div>

            {/* Budget vs Réalisé */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Budget vs Réalisé</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Budget Total Alloué</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats.budgetTotal)}</p>
                    <progress className="sr-only" value={budgetExecPct} max={100} aria-label="Pourcentage d'exécution du budget"></progress>
                    <div
                      className="mt-2 h-2 w-full bg-gray-200 rounded-full"
                      title={budgetExecText}
                    >
                      <div
                        className={`h-2 bg-blue-600 rounded-full ${getWidthClass(budgetExecPct)}`}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Exécuté: {formatCurrency(dashboardStats.budgetExecute)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Dépenses vs Recettes</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700">Dépenses</p>
                        <p className="text-lg font-bold text-red-900">{formatCurrency(dashboardStats.depensesTotal)}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-700">Recettes</p>
                        <p className="text-lg font-bold text-green-900">{formatCurrency(dashboardStats.recettesTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dernières transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Dernières Transactions</h3>
              </div>
              <div className="p-6">
                {transactionsTyped && transactionsTyped.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsTyped.slice(0, 5).map((t: any, idx: number) => (
                          <tr key={`txn-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-700">{t?.date || '-'}</td>
                            <td className="px-6 py-3 text-sm text-gray-900">{t?.reference || t?.id || '-'}</td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{formatCurrency(t?.montant || 0)}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{t?.statut || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Aucune transaction récente.</p>
                )}
              </div>
            </div>

            {/* Résumé des modules */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Résumé des Activités</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Budget & Finances</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Postes budgétaires:</span>
                        <span className="font-medium text-blue-900">{budgetItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Dépenses totales:</span>
                        <span className="font-medium text-blue-900">{depenses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Recettes totales:</span>
                        <span className="font-medium text-blue-900">{recettes.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Ressources Humaines</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Total agents:</span>
                        <span className="font-medium text-green-900">{dashboardStats.totalAgents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Agents actifs:</span>
                        <span className="font-medium text-green-900">{agentsTyped.filter((a: Agent) => a.statut === 'Actif').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Masse salariale:</span>
                        <span className="font-medium text-green-900">{formatCurrency(dashboardStats.masseSalariale)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">Contrôle & Validation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Transactions IGF:</span>
                        <span className="font-medium text-purple-900">{transactionsTyped.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">En attente:</span>
                        <span className="font-medium text-purple-900">{transactionsTyped.filter((t: Transaction) => t.statut === 'En attente validation').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Alertes actives:</span>
                        <span className="font-medium text-purple-900">{alerts.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modules rapides */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Accès Rapide aux Modules</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'budget', name: 'Budget', icon: PieChart, color: 'text-blue-600' },
                    { id: 'depenses', name: 'Dépenses', icon: CreditCard, color: 'text-red-600' },
                    { id: 'recettes', name: 'Recettes', icon: TrendingUp, color: 'text-green-600' },
                    { id: 'controle', name: 'Contrôle', icon: Shield, color: 'text-purple-600' }
                  ].map((module) => {
                    const Icon = module.icon;
                    return (
                      <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className="p-4 text-center hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${module.color}`} />
                        <p className="text-sm font-medium text-gray-900">{module.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.id === 'budget' && `${budgetItems.length} postes`}
                          {module.id === 'depenses' && `${depenses.length} dépenses`}
                          {module.id === 'recettes' && `${recettes.length} recettes`}
                          {module.id === 'controle' && `${transactions.length} contrôles`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        userRole={user?.role || 'Utilisateur'}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentUser={{
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          entity: user.entityName
        }} onLogout={onLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

// Composant d'accès refusé
function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès Refusé</h3>
        <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à ce module.</p>
      </div>
    </div>
  );
}

interface Transaction {
  statut: string;
}

interface Agent {
  salaire_net: number;
  statut: string;
}

// App principale avec AuthProvider et DataProvider
export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </DataProvider>
    </AuthProvider>
  );
}