import React, { useState } from 'react';
import { Eye, Shield, AlertTriangle, CheckCircle, FileText, Users, BarChart3, Clock } from 'lucide-react';

interface TransactionIGF {
  id: string;
  numero: string;
  type: 'Engagement' | 'Liquidation' | 'Paiement';
  entite: string;
  montant: number;
  beneficiaire: string;
  dateTransaction: string;
  statut: 'En attente validation' | 'Validé IGF' | 'Rejeté IGF' | 'Sous surveillance';
  risque: 'Faible' | 'Moyen' | 'Élevé';
  commentaireIGF?: string;
}

interface AlerteIGF {
  id: string;
  type: 'Seuil dépassé' | 'Anomalie détectée' | 'Document manquant' | 'Procédure non respectée';
  description: string;
  entite: string;
  montant?: number;
  dateDetection: string;
  severite: 'Critique' | 'Importante' | 'Modérée';
  statut: 'Nouvelle' | 'En cours' | 'Traitée';
}

export default function IGFModule() {
  const [activeTab, setActiveTab] = useState('surveillance');
  const [selectedRisque, setSelectedRisque] = useState('Tous');

  const transactions: TransactionIGF[] = [
    {
      id: '1',
      numero: 'TXN-2024-001',
      type: 'Engagement',
      entite: 'MIN-INFRA',
      montant: 150000000,
      beneficiaire: 'CONSTRUCTA SPRL',
      dateTransaction: '2024-01-15 14:30',
      statut: 'En attente validation',
      risque: 'Élevé',
      commentaireIGF: 'Montant dépassant le seuil automatique - Vérification requise'
    },
    {
      id: '2',
      numero: 'TXN-2024-002',
      type: 'Paiement',
      entite: 'MIN-SANTE',
      montant: 45000000,
      beneficiaire: 'SONAS SARL',
      dateTransaction: '2024-01-14 16:45',
      statut: 'Validé IGF',
      risque: 'Faible'
    },
    {
      id: '3',
      numero: 'TXN-2024-003',
      type: 'Liquidation',
      entite: 'MIN-EDUC',
      montant: 125000000,
      beneficiaire: 'ÉCOLE CONSTRUCTION',
      dateTransaction: '2024-01-13 11:20',
      statut: 'Sous surveillance',
      risque: 'Moyen',
      commentaireIGF: 'Suivi renforcé - Bénéficiaire récurrent'
    },
    {
      id: '4',
      numero: 'TXN-2024-004',
      type: 'Engagement',
      entite: 'MIN-MINES',
      montant: 75000000,
      beneficiaire: 'MINING SERVICES',
      dateTransaction: '2024-01-12 09:15',
      statut: 'Rejeté IGF',
      risque: 'Élevé',
      commentaireIGF: 'Pièces justificatives insuffisantes - Dossier incomplet'
    }
  ];

  const alertes: AlerteIGF[] = [
    {
      id: '1',
      type: 'Seuil dépassé',
      description: 'Transaction de 150M CDF sans approbation préalable IGF',
      entite: 'MIN-INFRA',
      montant: 150000000,
      dateDetection: '2024-01-15 14:35',
      severite: 'Critique',
      statut: 'Nouvelle'
    },
    {
      id: '2',
      type: 'Anomalie détectée',
      description: 'Dépassement budgétaire de 18% détecté',
      entite: 'MIN-SANTE',
      montant: 45000000,
      dateDetection: '2024-01-14 17:20',
      severite: 'Importante',
      statut: 'En cours'
    },
    {
      id: '3',
      type: 'Document manquant',
      description: 'Facture proforma manquante pour engagement',
      entite: 'MIN-EDUC',
      montant: 25000000,
      dateDetection: '2024-01-13 12:45',
      severite: 'Modérée',
      statut: 'Traitée'
    },
    {
      id: '4',
      type: 'Procédure non respectée',
      description: 'Validation hiérarchique manquante',
      entite: 'MIN-BUDGET',
      montant: 30000000,
      dateDetection: '2024-01-12 15:30',
      severite: 'Importante',
      statut: 'En cours'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatutBadge = (statut: string) => {
    const styles = {
      'En attente validation': 'bg-yellow-100 text-yellow-800',
      'Validé IGF': 'bg-green-100 text-green-800',
      'Rejeté IGF': 'bg-red-100 text-red-800',
      'Sous surveillance': 'bg-blue-100 text-blue-800',
      'Nouvelle': 'bg-red-100 text-red-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Traitée': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getRisqueBadge = (risque: string) => {
    const styles = {
      'Faible': 'bg-green-100 text-green-800',
      'Moyen': 'bg-yellow-100 text-yellow-800',
      'Élevé': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[risque as keyof typeof styles]}`}>
        {risque}
      </span>
    );
  };

  const getSeveriteBadge = (severite: string) => {
    const styles = {
      'Critique': 'bg-red-100 text-red-800',
      'Importante': 'bg-orange-100 text-orange-800',
      'Modérée': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severite as keyof typeof styles]}`}>
        {severite}
      </span>
    );
  };

  const getSeveriteIcon = (severite: string) => {
    switch (severite) {
      case 'Critique':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'Importante':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const stats = {
    transactionsEnAttente: transactions.filter(t => t.statut === 'En attente validation').length,
    transactionsValidees: transactions.filter(t => t.statut === 'Validé IGF').length,
    transactionsRejetees: transactions.filter(t => t.statut === 'Rejeté IGF').length,
    alertesNouveaux: alertes.filter(a => a.statut === 'Nouvelle').length,
    montantSurveille: transactions.reduce((sum, t) => sum + t.montant, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accès IGF - Inspection Générale des Finances</h2>
          <p className="text-gray-600">Validation des processus financiers et surveillance en temps réel</p>
        </div>
        <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-800">Accès Sécurisé IGF</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.transactionsEnAttente}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validées</p>
              <p className="text-2xl font-bold text-green-600">{stats.transactionsValidees}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{stats.transactionsRejetees}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouvelles Alertes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.alertesNouveaux}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant Surveillé</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.montantSurveille)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('surveillance')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'surveillance'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Surveillance Temps Réel</span>
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'validation'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Validation Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('alertes')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'alertes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Alertes & Anomalies</span>
            </button>
            <button
              onClick={() => setActiveTab('rapports')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'rapports'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Rapports IGF</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'surveillance' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Surveillance Continue</h4>
                </div>
                <p className="text-sm text-blue-800">
                  Toutes les transactions sont surveillées en temps réel. Les transactions dépassant 100M CDF 
                  nécessitent une validation IGF obligatoire.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Transactions par Entité</h5>
                  <div className="space-y-3">
                    {['MIN-INFRA', 'MIN-SANTE', 'MIN-EDUC', 'MIN-MINES'].map((entite, index) => {
                      const count = transactions.filter(t => t.entite === entite).length;
                      return (
                        <div key={entite} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{entite}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Répartition par Risque</h5>
                  <div className="space-y-3">
                    {['Élevé', 'Moyen', 'Faible'].map((risque) => {
                      const count = transactions.filter(t => t.risque === risque).length;
                      const percentage = (count / transactions.length) * 100;
                      return (
                        <div key={risque}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">{risque}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                risque === 'Élevé' ? 'bg-red-600' :
                                risque === 'Moyen' ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Activité Récente</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Transaction 150M rejetée</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Paiement 45M validé</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2  bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">Alerte seuil dépassé</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Surveillance renforcée</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex items-center space-x-4">
                <select
                  value={selectedRisque}
                  onChange={(e) => setSelectedRisque(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Tous">Tous les niveaux de risque</option>
                  <option value="Élevé">Risque élevé</option>
                  <option value="Moyen">Risque moyen</option>
                  <option value="Faible">Risque faible</option>
                </select>
              </div>

              {/* Liste des transactions */}
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {transaction.numero} - {transaction.type}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {getRisqueBadge(transaction.risque)}
                              {getStatutBadge(transaction.statut)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Entité</p>
                              <p className="text-sm font-medium text-gray-900">{transaction.entite}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Bénéficiaire</p>
                              <p className="text-sm font-medium text-gray-900">{transaction.beneficiaire}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Montant</p>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.montant)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium text-gray-900">{transaction.dateTransaction}</p>
                            </div>
                          </div>
                          
                          {transaction.commentaireIGF && (
                            <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                              <p className="text-sm text-gray-700">{transaction.commentaireIGF}</p>
                            </div>
                          )}
                          
                          {transaction.statut === 'En attente validation' && (
                            <div className="flex items-center space-x-3">
                              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Valider</span>
                              </button>
                              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Rejeter</span>
                              </button>
                              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                                <Eye className="h-4 w-4" />
                                <span>Surveillance Renforcée</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alertes' && (
            <div className="space-y-4">
              {alertes.map((alerte) => (
                <div key={alerte.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getSeveriteIcon(alerte.severite)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {alerte.type}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {getSeveriteBadge(alerte.severite)}
                            {getStatutBadge(alerte.statut)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-4">{alerte.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Entité</p>
                            <p className="text-sm font-medium text-gray-900">{alerte.entite}</p>
                          </div>
                          {alerte.montant && (
                            <div>
                              <p className="text-xs text-gray-500">Montant</p>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(alerte.montant)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Date de détection</p>
                            <p className="text-sm font-medium text-gray-900">{alerte.dateDetection}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Sévérité</p>
                            <p className="text-sm font-medium text-gray-900">{alerte.severite}</p>
                          </div>
                        </div>
                        
                        {alerte.statut === 'Nouvelle' && (
                          <div className="flex items-center space-x-3">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                              Prendre en Charge
                            </button>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                              Marquer comme Traitée
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rapports' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Rapports IGF Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Rapport Mensuel de Surveillance</h5>
                    <p className="text-sm text-blue-800 mb-3">Synthèse des activités de contrôle et validation</p>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                      Télécharger PDF
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Analyse des Risques</h5>
                    <p className="text-sm text-blue-800 mb-3">Évaluation des risques par entité et type de transaction</p>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                      Télécharger PDF
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Rapport de Conformité</h5>
                    <p className="text-sm text-blue-800 mb-3">État de la conformité aux procédures établies</p>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                      Télécharger PDF
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Tableau de Bord Exécutif</h5>
                    <p className="text-sm text-blue-800 mb-3">Indicateurs clés pour la direction</p>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                      Télécharger PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h4 className="text-lg font-semibold text-red-900 mb-4">Recommandations IGF</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Renforcement des contrôles</p>
                      <p className="text-sm text-red-700">Augmenter la fréquence des vérifications pour les transactions {'>'} 50M CDF</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Formation du personnel</p>
                      <p className="text-sm text-red-700">Organiser des sessions de formation sur les nouvelles procédures</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Amélioration documentaire</p>
                      <p className="text-sm text-red-700">Standardiser les formats de pièces justificatives</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}