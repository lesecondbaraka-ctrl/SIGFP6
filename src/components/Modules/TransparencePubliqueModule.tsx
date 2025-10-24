import { useState, useEffect } from 'react';
import { Globe, AlertCircle, TrendingUp, FileText, Send, CheckCircle } from 'lucide-react';
import { TransparencePubliqueService, CitizenAlert, PublicExpense } from '../../services/TransparencePubliqueService';

export default function TransparencePubliqueModule() {
  const [activeTab, setActiveTab] = useState('public');
  const [expenses, setExpenses] = useState<PublicExpense[]>([]);
  const [citizenAlerts, setCitizenAlerts] = useState<CitizenAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<CitizenAlert>>({
    is_anonymous: false,
    alert_type: 'IRREGULARITE'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, alertsData] = await Promise.all([
        TransparencePubliqueService.getPublicExpenses({ limit: 50 }),
        TransparencePubliqueService.getCitizenAlerts()
      ]);
      setExpenses(expensesData);
      setCitizenAlerts(alertsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAlert = async () => {
    if (!newAlert.description || !newAlert.entity) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const result = await TransparencePubliqueService.submitCitizenAlert(newAlert as any);
    
    if (result.success) {
      alert(result.message);
      setShowAlertForm(false);
      setNewAlert({ is_anonymous: false, alert_type: 'IRREGULARITE' });
      await loadData();
    } else {
      alert(result.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'IRREGULARITE': 'Irrégularité',
      'CORRUPTION': 'Corruption',
      'DETOURNEMENT': 'Détournement',
      'SURFACTURATION': 'Surfacturation',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENTE': return 'text-red-600 bg-red-100';
      case 'HAUTE': return 'text-orange-600 bg-orange-100';
      case 'MOYENNE': return 'text-yellow-600 bg-yellow-100';
      case 'BASSE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOUVELLE': return 'text-red-600 bg-red-100';
      case 'EN_COURS': return 'text-yellow-600 bg-yellow-100';
      case 'VERIFIEE': return 'text-blue-600 bg-blue-100';
      case 'REJETEE': return 'text-gray-600 bg-gray-100';
      case 'TRAITEE': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Transparence Publique
          </h2>
          <p className="text-gray-600">Portail citoyen pour la transparence des finances publiques</p>
        </div>
        <button
          onClick={() => setShowAlertForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <AlertCircle className="h-4 w-4" />
          Signaler une Irrégularité
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dépenses Publiées</p>
              <p className="text-3xl font-bold text-gray-900">{expenses.length}</p>
            </div>
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant Total</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alertes Citoyennes</p>
              <p className="text-3xl font-bold text-yellow-600">{citizenAlerts.length}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alertes Traitées</p>
              <p className="text-3xl font-bold text-green-600">
                {citizenAlerts.filter(a => a.status === 'TRAITEE').length}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('public')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'public'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dépenses Publiques
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'alerts'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Alertes Citoyennes ({citizenAlerts.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'public' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Dépenses Publiques Récentes</h3>
                <p className="text-sm text-gray-600">
                  Consultez les dépenses publiques en toute transparence
                </p>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune dépense publiée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entité</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bénéficiaire</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(expense.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.entity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.beneficiary}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                              {expense.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Alertes Citoyennes</h3>
                <p className="text-sm text-gray-600">
                  Signalements d'irrégularités par les citoyens
                </p>
              </div>

              {citizenAlerts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune alerte citoyenne</p>
                </div>
              ) : (
                citizenAlerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </span>
                          <span className="text-xs text-gray-500">{getAlertTypeLabel(alert.alert_type)}</span>
                          {alert.is_anonymous && (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                              Anonyme
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{alert.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{alert.entity}</span>
                          {alert.amount && <span>{formatCurrency(alert.amount)}</span>}
                        </div>
                        {!alert.is_anonymous && alert.reporter_name && (
                          <p className="text-xs text-gray-500 mt-2">
                            Signalé par: {alert.reporter_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.submission_date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'alerte */}
      {showAlertForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">Signaler une Irrégularité</h3>
              <button
                onClick={() => setShowAlertForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'Alerte *
                </label>
                <select
                  value={newAlert.alert_type}
                  onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  title="Type d'alerte"
                  aria-label="Sélectionner le type d'alerte"
                >
                  <option value="IRREGULARITE">Irrégularité</option>
                  <option value="CORRUPTION">Corruption</option>
                  <option value="DETOURNEMENT">Détournement</option>
                  <option value="SURFACTURATION">Surfacturation</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entité Concernée *
                </label>
                <input
                  type="text"
                  value={newAlert.entity || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, entity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Ministère des Finances"
                  title="Entité concernée"
                  aria-label="Entité concernée"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newAlert.description || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Décrivez l'irrégularité en détail..."
                  title="Description de l'alerte"
                  aria-label="Description de l'alerte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (optionnel)
                </label>
                <input
                  type="number"
                  value={newAlert.amount || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Montant en CDF"
                  title="Montant"
                  aria-label="Montant en CDF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence Transaction (optionnel)
                </label>
                <input
                  type="text"
                  value={newAlert.transaction_reference || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, transaction_reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Numéro de transaction"
                  title="Référence de la transaction"
                  aria-label="Référence de la transaction"
                />
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newAlert.is_anonymous}
                    onChange={(e) => setNewAlert({ ...newAlert, is_anonymous: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Signalement anonyme</span>
                </label>
              </div>

              {!newAlert.is_anonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Votre Nom
                    </label>
                    <input
                      type="text"
                      value={newAlert.reporter_name || ''}
                      onChange={(e) => setNewAlert({ ...newAlert, reporter_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      title="Votre nom"
                      aria-label="Votre nom"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newAlert.reporter_email || ''}
                      onChange={(e) => setNewAlert({ ...newAlert, reporter_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      title="Votre email"
                      aria-label="Votre email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newAlert.reporter_phone || ''}
                      onChange={(e) => setNewAlert({ ...newAlert, reporter_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      title="Votre téléphone"
                      aria-label="Votre téléphone"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitAlert}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
