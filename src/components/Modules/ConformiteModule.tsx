import { useState } from 'react';
import { Shield, AlertTriangle, XCircle, CheckCircle, Settings } from 'lucide-react';

interface RegleConformite {
  id: string;
  nom: string;
  description: string;
  type: 'Budgétaire' | 'Documentaire' | 'Procédurale' | 'Seuil';
  statut: 'Actif' | 'Inactif';
  severite: 'Bloquant' | 'Avertissement' | 'Information';
}

interface ViolationConformite {
  id: string;
  regle: string;
  description: string;
  entite: string;
  montant?: number;
  dateDetection: string;
  statut: 'Rejetée' | 'En cours' | 'Résolue';
  severite: 'Bloquant' | 'Avertissement' | 'Information';
}

export default function ConformiteModule() {
  const [activeTab, setActiveTab] = useState('violations');
  const [selectedType, setSelectedType] = useState('Tous');

  const regles: RegleConformite[] = [
    {
      id: '1',
      nom: 'Limite budgétaire mensuelle',
      description: 'Vérification que les dépenses ne dépassent pas 15% du budget mensuel alloué',
      type: 'Budgétaire',
      statut: 'Actif',
      severite: 'Bloquant'
    },
    {
      id: '2',
      nom: 'Pièces justificatives obligatoires',
      description: 'Contrôle de la présence de toutes les pièces justificatives requises',
      type: 'Documentaire',
      statut: 'Actif',
      severite: 'Bloquant'
    },
    {
      id: '3',
      nom: 'Seuil d\'approbation IGF',
      description: 'Transactions supérieures à 100M CDF nécessitent une approbation IGF',
      type: 'Seuil',
      statut: 'Actif',
      severite: 'Bloquant'
    },
    {
      id: '4',
      nom: 'Validation hiérarchique',
      description: 'Respect de la chaîne de validation selon le manuel des procédures',
      type: 'Procédurale',
      statut: 'Actif',
      severite: 'Bloquant'
    },
    {
      id: '5',
      nom: 'Délai de traitement',
      description: 'Alerte si le traitement dépasse 30 jours',
      type: 'Procédurale',
      statut: 'Actif',
      severite: 'Avertissement'
    }
  ];

  const violations: ViolationConformite[] = [
    {
      id: '1',
      regle: 'Limite budgétaire mensuelle',
      description: 'Dépassement de 18% du budget mensuel pour les médicaments',
      entite: 'MIN-SANTE',
      montant: 45000000,
      dateDetection: '2024-01-15 14:30',
      statut: 'Rejetée',
      severite: 'Bloquant'
    },
    {
      id: '2',
      regle: 'Pièces justificatives obligatoires',
      description: 'Facture proforma manquante pour achat d\'équipements',
      entite: 'MIN-EDUC',
      montant: 25000000,
      dateDetection: '2024-01-14 16:45',
      statut: 'Rejetée',
      severite: 'Bloquant'
    },
    {
      id: '3',
      regle: 'Seuil d\'approbation IGF',
      description: 'Transaction de 150M CDF sans approbation IGF préalable',
      entite: 'MIN-INFRA',
      montant: 150000000,
      dateDetection: '2024-01-13 11:20',
      statut: 'En cours',
      severite: 'Bloquant'
    },
    {
      id: '4',
      regle: 'Délai de traitement',
      description: 'Dossier en attente depuis 35 jours',
      entite: 'MIN-MINES',
      montant: 75000000,
      dateDetection: '2024-01-12 09:15',
      statut: 'En cours',
      severite: 'Avertissement'
    },
    {
      id: '5',
      regle: 'Validation hiérarchique',
      description: 'Signature du directeur manquante',
      entite: 'MIN-BUDGET',
      montant: 30000000,
      dateDetection: '2024-01-11 15:30',
      statut: 'Résolue',
      severite: 'Bloquant'
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
      'Actif': 'bg-green-100 text-green-800',
      'Inactif': 'bg-gray-100 text-gray-800',
      'Rejetée': 'bg-red-100 text-red-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Résolue': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getSeveriteBadge = (severite: string) => {
    const styles = {
      'Bloquant': 'bg-red-100 text-red-800',
      'Avertissement': 'bg-yellow-100 text-yellow-800',
      'Information': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severite as keyof typeof styles]}`}>
        {severite}
      </span>
    );
  };

  const getSeveriteIcon = (severite: string) => {
    switch (severite) {
      case 'Bloquant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Avertissement':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const stats = {
    totalViolations: violations.length,
    violationsBloquantes: violations.filter(v => v.severite === 'Bloquant').length,
    violationsResolues: violations.filter(v => v.statut === 'Résolue').length,
    reglesActives: regles.filter(r => r.statut === 'Actif').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Filtre de Conformité</h2>
          <p className="text-gray-600">Rejet automatique des dépenses ne respectant pas les procédures établies</p>
        </div>
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Configurer Règles</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Violations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViolations}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Shield className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Violations Bloquantes</p>
              <p className="text-2xl font-bold text-red-600">{stats.violationsBloquantes}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Violations Résolues</p>
              <p className="text-2xl font-bold text-green-600">{stats.violationsResolues}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Règles Actives</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reglesActives}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('violations')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'violations'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Violations Détectées</span>
            </button>
            <button
              onClick={() => setActiveTab('regles')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'regles'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Règles de Conformité</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'violations' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex items-center space-x-4 mb-6">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Tous">Toutes les sévérités</option>
                  <option value="Bloquant">Bloquant</option>
                  <option value="Avertissement">Avertissement</option>
                  <option value="Information">Information</option>
                </select>
              </div>

              {/* Liste des violations */}
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div key={violation.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getSeveriteIcon(violation.severite)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {violation.regle}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {getSeveriteBadge(violation.severite)}
                              {getStatutBadge(violation.statut)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-4">{violation.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500">Entité</p>
                              <p className="text-sm font-medium text-gray-900">{violation.entite}</p>
                            </div>
                            {violation.montant && (
                              <div>
                                <p className="text-xs text-gray-500">Montant</p>
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(violation.montant)}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500">Date de détection</p>
                              <p className="text-sm font-medium text-gray-900">{violation.dateDetection}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Statut</p>
                              <p className="text-sm font-medium text-gray-900">{violation.statut}</p>
                            </div>
                          </div>
                          
                          {violation.statut === 'En cours' && (
                            <div className="flex items-center space-x-3">
                              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                Marquer comme Résolue
                              </button>
                              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Voir Détails
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

          {activeTab === 'regles' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Règle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sévérité
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
                    {regles.map((regle) => (
                      <tr key={regle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{regle.nom}</div>
                            <div className="text-sm text-gray-500">{regle.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            regle.type === 'Budgétaire' ? 'bg-blue-100 text-blue-800' :
                            regle.type === 'Documentaire' ? 'bg-green-100 text-green-800' :
                            regle.type === 'Procédurale' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {regle.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getSeveriteBadge(regle.severite)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatutBadge(regle.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              Modifier
                            </button>
                            <button className={`${
                              regle.statut === 'Actif' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}>
                              {regle.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Configuration du Système</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Paramètres Généraux</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Contrôles automatiques activés 24h/24</li>
                      <li>• Notifications en temps réel</li>
                      <li>• Journalisation complète des violations</li>
                      <li>• Escalade automatique des violations critiques</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Seuils Configurés</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Approbation IGF: {'>'} 100M CDF</li>
                      <li>• Limite budgétaire: 15% mensuel</li>
                      <li>• Délai maximum: 30 jours</li>
                      <li>• Validation hiérarchique: Obligatoire</li>
                    </ul>
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