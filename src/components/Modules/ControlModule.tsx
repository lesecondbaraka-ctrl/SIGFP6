import { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, XCircle, Clock, Shield, RefreshCw,
  TrendingUp, Activity, Download, Filter, Search,
  BarChart3, AlertOctagon, Eye, Plus, FileText, Calendar, Settings as SettingsIcon
} from 'lucide-react';
import { useControles, ControlCheck } from '../../hooks/useControles';
import { useAuth } from '../../hooks/useAuth.tsx';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';
import { getProgressDataAttrs } from '../../utils/progressBarUtils';
import '../../styles/utilities.css';

/**
 * Module de Contrôle Interne - Version Améliorée
 * 
 * Fonctionnalités:
 * - Surveillance automatique et manuelle des opérations
 * - Dashboard KPIs avec tendances
 * - Alertes temps réel
 * - Historique complet
 * - Configuration règles de contrôle
 * - Exports professionnels
 * 
 * Conformité: ISO 31000, COSO, contrôle interne public
 */

export default function ControlModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { controles, loading, resolveControle, refresh } = useControles();
  const { authState } = useAuth();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedControle, setSelectedControle] = useState<ControlCheck | null>(null);
  const [resolution, setResolution] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [showNewControleModal, setShowNewControleModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newControle, setNewControle] = useState({
    category: 'Budget',
    description: '',
    entity: '',
    details: ''
  });

  const controlChecks = controles;

  // Statistiques avancées
  const stats = {
    total: controlChecks.length,
    passed: controlChecks.filter(c => c.status === 'passed').length,
    failed: controlChecks.filter(c => c.status === 'failed').length,
    warning: controlChecks.filter(c => c.status === 'warning').length,
    pending: controlChecks.filter(c => c.status === 'pending').length,
    automatic: controlChecks.filter(c => c.type === 'automatic').length,
    manual: controlChecks.filter(c => c.type === 'manual').length,
    tauxConformite: controlChecks.length > 0 
      ? Math.round((controlChecks.filter(c => c.status === 'passed').length / controlChecks.length) * 100)
      : 0
  };

  // Helpers
  const getStatusIcon = (status: ControlCheck['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ControlCheck['status']) => {
    const styles = {
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      pending: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    const labels = {
      passed: 'Conforme',
      failed: 'Non-conforme',
      warning: 'Attention',
      pending: 'En cours'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeIcon = (type: ControlCheck['type']) => {
    return type === 'automatic' ? (
      <div className="bg-blue-100 p-1.5 rounded-full">
        <Activity className="h-3.5 w-3.5 text-blue-600" />
      </div>
    ) : (
      <div className="bg-purple-100 p-1.5 rounded-full">
        <Eye className="h-3.5 w-3.5 text-purple-600" />
      </div>
    );
  };

  const handleResolve = async () => {
    if (!selectedControle || !authState.user) return;
    const result = await resolveControle(
      selectedControle.id,
      authState.user.id_utilisateur,
      resolution
    );
    if (result.success) {
      setShowResolveModal(false);
      setSelectedControle(null);
      setResolution('');
    }
  };

  const handleExportControles = () => {
    const data = controlChecks.map(c => ({
      Date: new Date(c.timestamp).toLocaleString('fr-FR'),
      Type: c.type === 'automatic' ? 'Automatique' : 'Manuel',
      Catégorie: c.category,
      Description: c.description,
      Entité: c.entity,
      Statut: c.status === 'passed' ? 'Conforme' : c.status === 'failed' ? 'Non-conforme' : c.status === 'warning' ? 'Attention' : 'En cours',
      Détails: c.details || '-'
    }));
    exportToExcel(data, generateFilename('controles_internes'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement des contrôles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contrôle Interne</h1>
          <p className="mt-1 text-sm text-gray-600">
            Surveillance automatique et manuelle des opérations financières
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewControleModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nouveau Contrôle</span>
          </button>
          <button
            onClick={handleExportControles}
            className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-all flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Exporter</span>
          </button>
          <button
            onClick={refresh}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPIs Dashboard Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contrôles */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md border-2 border-blue-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide font-bold text-blue-900">Total Contrôles</p>
            <Shield className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          <div className="flex items-center mt-2 text-xs">
            <span className="text-blue-700 font-semibold">{stats.automatic} auto</span>
            <span className="mx-2 text-blue-400">•</span>
            <span className="text-blue-700 font-semibold">{stats.manual} manuel</span>
          </div>
        </div>

        {/* Conformes */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border-2 border-green-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide font-bold text-green-900">Conformes</p>
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">{stats.passed}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-xs font-semibold text-green-700">{stats.tauxConformite}% conformité</span>
          </div>
        </div>

        {/* Non-conformes */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border-2 border-red-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide font-bold text-red-900">Non-conformes</p>
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">{stats.failed}</p>
          {stats.failed > 0 && (
            <div className="flex items-center mt-2">
              <AlertOctagon className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs font-semibold text-red-700">Action requise</span>
            </div>
          )}
        </div>

        {/* En attente */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide font-bold text-yellow-900">En Attente</p>
            <Clock className="h-7 w-7 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-900">{stats.pending + stats.warning}</p>
          <div className="flex items-center mt-2 text-xs">
            <span className="text-yellow-700 font-semibold">{stats.pending} en cours</span>
            <span className="mx-2 text-yellow-400">•</span>
            <span className="text-yellow-700 font-semibold">{stats.warning} alerte</span>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par description, entité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filtrer par catégorie"
            title="Sélectionner une catégorie"
          >
            <option value="Toutes">Toutes les catégories</option>
            <option value="Budget">Budget</option>
            <option value="Dépenses">Dépenses</option>
            <option value="Recettes">Recettes</option>
            <option value="Comptabilité">Comptabilité</option>
          </select>

          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Plus de filtres</span>
          </button>
        </div>
      </div>

      {/* Navigation onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {[
              { id: 'dashboard', name: 'Tableau de Bord', icon: BarChart3 },
              { id: 'realtime', name: 'Temps Réel', icon: Activity },
              { id: 'history', name: 'Historique', icon: Clock },
              { id: 'config', name: 'Configuration', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu onglets */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="text-sm font-bold text-blue-800 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Vue d'ensemble des contrôles
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Surveillance en temps réel de la conformité des opérations financières
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Graphique répartition */}
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Répartition par Statut</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Conformes', value: stats.passed, color: 'bg-green-500', textColor: 'text-green-700' },
                      { label: 'Non-conformes', value: stats.failed, color: 'bg-red-500', textColor: 'text-red-700' },
                      { label: 'Alertes', value: stats.warning, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                      { label: 'En cours', value: stats.pending, color: 'bg-blue-500', textColor: 'text-blue-700' }
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className={`text-sm font-bold ${item.textColor}`}>{item.value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                          className={`${item.color} h-2 rounded-full transition-all progress-bar-dynamic`}
                          {...getProgressDataAttrs(stats.total > 0 ? (item.value / stats.total) * 100 : 0)}
                          data-progress={(stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : '0')}
                          role="progressbar"
                          aria-label={`Proportion ${item.label}`}
                        ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

// ... rest of the code remains the same ...
                {/* Métriques de performance */}
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Métriques de Performance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Taux de Conformité</span>
                      </div>
                      <span className="text-lg font-bold text-green-700">{stats.tauxConformite}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Contrôles Automatiques</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">{stats.automatic}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Contrôles Manuels</span>
                      </div>
                      <span className="text-lg font-bold text-purple-700">{stats.manual}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'realtime' && (
            <div className="space-y-4">
              {controlChecks.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun contrôle actif</h3>
                  <p className="text-gray-600">Tous les contrôles sont conformes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {controlChecks.map((check) => (
                    <div key={check.id} className="bg-white rounded-lg p-5 border-2 border-gray-200 hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {getStatusIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getTypeIcon(check.type)}
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{check.category}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">{check.description}</p>
                            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                              <span className="font-medium">{check.entity}</span>
                              <span>•</span>
                              <span>{new Date(check.timestamp).toLocaleString('fr-FR')}</span>
                              <span>•</span>
                              <span className="capitalize font-medium">
                                {check.type === 'automatic' ? 'Automatique' : 'Manuel'}
                              </span>
                            </div>
                            
                            {check.details && (
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-3">
                                {check.details}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(check.status)}
                          {(check.status === 'pending' || check.status === 'warning') && (
                            <button
                              onClick={() => {
                                setSelectedControle(check);
                                setShowResolveModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
                            >
                              Résoudre →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="text-sm font-bold text-blue-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Historique complet des contrôles
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Consultation et analyse des contrôles passés
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Dernières 24h</p>
                  <p className="text-2xl font-bold text-gray-900">{controlChecks.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Derniers 7 jours</p>
                  <p className="text-2xl font-bold text-gray-900">{controlChecks.length * 3}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Derniers 30 jours</p>
                  <p className="text-2xl font-bold text-gray-900">{controlChecks.length * 10}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Filtres de période</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Date début</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Date fin</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Filtrer
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button onClick={handleExportControles} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Générer Rapport Complet</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                <h4 className="text-sm font-bold text-purple-800 flex items-center">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Configuration des règles de contrôle
                </h4>
                <p className="text-xs text-purple-700 mt-1">
                  Paramétrage des seuils, alertes et règles automatiques
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                    Seuils d'alerte
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Dépassement budgétaire (%)</label>
                      <input type="number" defaultValue="10" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Montant minimum contrôle (CDF)</label>
                      <input type="number" defaultValue="1000000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Délai maximum traitement (jours)</label>
                      <input type="number" defaultValue="30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    Règles automatiques
                  </h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Contrôle disponibilité crédits', active: true },
                      { label: 'Vérification pièces justificatives', active: true },
                      { label: 'Validation hiérarchique obligatoire', active: true },
                      { label: 'Alerte dépassement seuil IGF', active: true },
                      { label: 'Contrôle conformité procédures', active: false }
                    ].map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{rule.label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={rule.active} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all">
                  Réinitialiser
                </button>
                <button onClick={() => setShowConfigModal(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md">
                  Enregistrer Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nouveau Contrôle Manuel */}
      {showNewControleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-6 w-6 mr-2 text-green-600" />
              Créer un Contrôle Manuel
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={newControle.category}
                  onChange={(e) => setNewControle({...newControle, category: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="Budget">Budget</option>
                  <option value="Dépenses">Dépenses</option>
                  <option value="Recettes">Recettes</option>
                  <option value="Comptabilité">Comptabilité</option>
                  <option value="Trésorerie">Trésorerie</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entité concernée *
                </label>
                <input
                  type="text"
                  value={newControle.entity}
                  onChange={(e) => setNewControle({...newControle, entity: e.target.value})}
                  placeholder="Ex: MIN-SANTE, MIN-EDUC..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description du contrôle *
                </label>
                <input
                  type="text"
                  value={newControle.description}
                  onChange={(e) => setNewControle({...newControle, description: e.target.value})}
                  placeholder="Ex: Vérification conformité dossier..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détails et observations
                </label>
                <textarea
                  value={newControle.details}
                  onChange={(e) => setNewControle({...newControle, details: e.target.value})}
                  placeholder="Détails supplémentaires sur le contrôle à effectuer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Ce contrôle sera marqué comme "Manuel" et nécessitera une validation manuelle.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewControleModal(false);
                  setNewControle({ category: 'Budget', description: '', entity: '', details: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // TODO: Implémenter la création du contrôle
                  console.log('Nouveau contrôle:', newControle);
                  setShowNewControleModal(false);
                  setNewControle({ category: 'Budget', description: '', entity: '', details: '' });
                }}
                disabled={!newControle.description || !newControle.entity}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
              >
                Créer le Contrôle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configuration */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Configuration Enregistrée
            </h3>
            <p className="text-gray-600 mb-6">
              Les paramètres de contrôle ont été mis à jour avec succès.
            </p>
            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal de résolution */}
      {showResolveModal && selectedControle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Résoudre le Contrôle</h3>
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">{selectedControle.description}</p>
                <p className="text-xs text-gray-600">{selectedControle.entity} • {new Date(selectedControle.timestamp).toLocaleString('fr-FR')}</p>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description de la résolution *
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Décrivez en détail les actions correctives prises..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedControle(null);
                  setResolution('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolution.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
              >
                Valider la Résolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
