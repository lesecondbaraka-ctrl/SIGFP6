import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, DollarSign, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { FraudDetectionService, FraudAlert } from '../../services/FraudDetectionService';
import { useAuth } from '../../hooks/useAuth.tsx';

export default function FraudeDetectionModule() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { authState } = useAuth();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await FraudDetectionService.getAllAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const runFullScan = async () => {
    if (!authState.user) return;
    
    setScanning(true);
    try {
      const userId = (authState.user as any)?.id ?? (authState.user as any)?.uid ?? (authState.user as any)?.sub ?? 'anonymous';
      const userEmail = (authState.user as any)?.email ?? 'Utilisateur';
      const result = await FraudDetectionService.runFullFraudScan(
        userId,
        userEmail,
        'admin',
        'SYSTEM'
      );
      
      setAlerts(result.alerts);
      alert(`Scan terminé: ${result.summary.total_alerts} alertes détectées`);
    } catch (error) {
      console.error('Erreur scan fraude:', error);
      alert('Erreur lors du scan de fraude');
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (alertId: string, status: FraudAlert['status']) => {
    const success = await FraudDetectionService.updateAlertStatus(alertId, status);
    if (success) {
      await loadAlerts();
      setShowDetailModal(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITIQUE': return 'text-red-600 bg-red-100';
      case 'ELEVEE': return 'text-orange-600 bg-orange-100';
      case 'MOYENNE': return 'text-yellow-600 bg-yellow-100';
      case 'FAIBLE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVELLE': return 'text-red-600 bg-red-100';
      case 'EN_COURS': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMEE': return 'text-orange-600 bg-orange-100';
      case 'FAUSSE_ALERTE': return 'text-gray-600 bg-gray-100';
      case 'RESOLUE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'DOUBLE_PAIEMENT': 'Double Paiement',
      'BENEFICIAIRE_FICTIF': 'Bénéficiaire Fictif',
      'SURFACTURATION': 'Surfacturation',
      'FACTURE_FRAUDULEUSE': 'Facture Frauduleuse',
      'CONFLIT_INTERET': 'Conflit d\'Intérêt',
      'DEPASSEMENT_SEUIL': 'Dépassement de Seuil',
      'FRACTIONNEMENT_SUSPECT': 'Fractionnement Suspect',
      'FOURNISSEUR_SUSPECT': 'Fournisseur Suspect',
      'ENRICHISSEMENT_ILLICITE': 'Enrichissement Illicite',
      'DETOURNEMENT_FONDS': 'Détournement de Fonds',
      'CORRUPTION': 'Corruption',
      'FRAUDE_FISCALE': 'Fraude Fiscale',
      'BLANCHIMENT_ARGENT': 'Blanchiment d\'Argent'
    };
    return labels[type] || type;
  };

  const stats = {
    total: alerts.length,
    nouvelle: alerts.filter(a => a.status === 'NOUVELLE').length,
    critique: alerts.filter(a => a.severity === 'CRITIQUE').length,
    highRisk: alerts.filter(a => a.risk_score >= 70).length,
    totalAmount: alerts.reduce((sum, a) => sum + (a.amount || 0), 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Détection de Fraude et Détournement
          </h2>
          <p className="text-gray-600">Surveillance automatique et analyse forensique des transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAlerts}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
          <button
            onClick={runFullScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Scan en cours...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Lancer Scan Complet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Alertes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nouvelles</p>
              <p className="text-3xl font-bold text-red-600">{stats.nouvelle}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critiques</p>
              <p className="text-3xl font-bold text-orange-600">{stats.critique}</p>
            </div>
            <Shield className="h-10 w-10 text-orange-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Haut Risque</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.highRisk}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant Total</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tableau de Bord
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alertes ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Analyse Forensique
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Par Type */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Alertes par Type</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      alerts.reduce((acc, alert) => {
                        acc[alert.type] = (acc[alert.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{getTypeLabel(type)}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Par Sévérité */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Alertes par Sévérité</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      alerts.reduce((acc, alert) => {
                        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([severity, count]) => (
                      <div key={severity} className="flex justify-between items-center">
                        <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(severity)}`}>
                          {severity}
                        </span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alertes Récentes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Alertes Récentes (Top 5)</h3>
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${alert.severity === 'CRITIQUE' ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-gray-900">{alert.description}</p>
                          <p className="text-sm text-gray-600">{alert.entity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune alerte de fraude détectée</p>
                  <button
                    onClick={runFullScan}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Lancer un Scan
                  </button>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">{getTypeLabel(alert.type)}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">Score: {alert.risk_score}/100</span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{alert.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{alert.entity}</span>
                          {alert.amount && <span>{formatCurrency(alert.amount)}</span>}
                          {alert.beneficiary && <span>Bénéficiaire: {alert.beneficiary}</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Détecté le {new Date(alert.detection_date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                          {alert.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir les détails"
                          aria-label="Voir les détails de l'alerte"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Module d'analyse forensique avancée</p>
              <p className="text-sm text-gray-400 mt-2">Machine Learning et détection de patterns</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">Détails de l'Alerte</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="text-gray-900">{getTypeLabel(selectedAlert.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sévérité</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getSeverityColor(selectedAlert.severity)}`}>
                    {selectedAlert.severity}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Score de Risque</label>
                  <p className="text-gray-900 font-semibold">{selectedAlert.risk_score}/100</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Entité</label>
                <p className="text-gray-900">{selectedAlert.entity}</p>
              </div>

              {selectedAlert.amount && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Montant</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(selectedAlert.amount)}</p>
                </div>
              )}

              {selectedAlert.beneficiary && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Bénéficiaire</label>
                  <p className="text-gray-900">{selectedAlert.beneficiary}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Preuves</label>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedAlert.evidence, null, 2)}
                </pre>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => handleUpdateStatus(selectedAlert.id!, 'CONFIRMEE')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirmer
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedAlert.id!, 'FAUSSE_ALERTE')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Fausse Alerte
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedAlert.id!, 'RESOLUE')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Résoudre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
