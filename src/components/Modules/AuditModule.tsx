import { useState } from 'react';
import { FileText, Download, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface Rapport {
  id: string;
  titre: string;
  type: 'Mensuel' | 'Trimestriel' | 'Annuel' | 'Spécial';
  periode: string;
  statut: 'Généré' | 'En cours' | 'Planifié';
  dateGeneration: string;
  entite: string;
  taille: string;
}

interface IndicateurFinancier {
  nom: string;
  valeur: string;
  evolution: string;
  type: 'positive' | 'negative' | 'neutral';
}

export default function AuditModule() {
  const [activeTab, setActiveTab] = useState('rapports');
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  const rapports: Rapport[] = [
    {
      id: '1',
      titre: 'Rapport d\'Exécution Budgétaire - Janvier 2024',
      type: 'Mensuel',
      periode: 'Janvier 2024',
      statut: 'Généré',
      dateGeneration: '2024-02-01',
      entite: 'MIN-BUDGET',
      taille: '2.4 MB'
    },
    {
      id: '2',
      titre: 'États Financiers Consolidés Q4 2023',
      type: 'Trimestriel',
      periode: 'Q4 2023',
      statut: 'Généré',
      dateGeneration: '2024-01-15',
      entite: 'MIN-FINANCE',
      taille: '5.8 MB'
    },
    {
      id: '3',
      titre: 'Rapport de Conformité - Dépenses Publiques',
      type: 'Spécial',
      periode: 'Décembre 2023',
      statut: 'Généré',
      dateGeneration: '2024-01-10',
      entite: 'IGF',
      taille: '3.2 MB'
    },
    {
      id: '4',
      titre: 'Analyse des Recettes Fiscales - Février 2024',
      type: 'Mensuel',
      periode: 'Février 2024',
      statut: 'En cours',
      dateGeneration: '2024-03-01',
      entite: 'DGI',
      taille: '-'
    }
  ];

  const indicateursFinanciers: IndicateurFinancier[] = [
    {
      nom: 'Taux d\'exécution budgétaire',
      valeur: '72.5%',
      evolution: '+5.2% vs mois dernier',
      type: 'positive'
    },
    {
      nom: 'Ratio recettes/dépenses',
      valeur: '1.15',
      evolution: '+0.08 vs mois dernier',
      type: 'positive'
    },
    {
      nom: 'Délai moyen de paiement',
      valeur: '18 jours',
      evolution: '-3 jours vs mois dernier',
      type: 'positive'
    },
    {
      nom: 'Taux de rejet automatique',
      valeur: '4.8%',
      evolution: '+1.2% vs mois dernier',
      type: 'negative'
    },
    {
      nom: 'Conformité documentaire',
      valeur: '94.2%',
      evolution: '+2.1% vs mois dernier',
      type: 'positive'
    },
    {
      nom: 'Solde de trésorerie',
      valeur: '2.3 Mds CDF',
      evolution: 'Stable',
      type: 'neutral'
    }
  ];

  const getStatusBadge = (statut: string) => {
    const styles = {
      'Généré': 'bg-green-100 text-green-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Planifié': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      'Mensuel': 'bg-blue-100 text-blue-800',
      'Trimestriel': 'bg-purple-100 text-purple-800',
      'Annuel': 'bg-green-100 text-green-800',
      'Spécial': 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {type}
      </span>
    );
  };

  const getEvolutionColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEvolutionIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit & Reporting</h2>
          <p className="text-gray-600">Génération d'états financiers et tableaux de bord</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Nouveau Rapport</span>
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('rapports')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'rapports'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Rapports</span>
            </button>
            <button
              onClick={() => setActiveTab('tableaux')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'tableaux'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Tableaux de Bord</span>
            </button>
            <button
              onClick={() => setActiveTab('indicateurs')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'indicateurs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Indicateurs</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rapports' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Titre du Rapport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rapports.map((rapport) => (
                      <tr key={rapport.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{rapport.titre}</div>
                            <div className="text-sm text-gray-500">{rapport.entite} • {rapport.taille}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(rapport.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {rapport.periode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(rapport.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rapport.dateGeneration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {rapport.statut === 'Généré' && (
                              <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                                <Download className="h-4 w-4" />
                                <span>Télécharger</span>
                              </button>
                            )}
                            {rapport.statut === 'En cours' && (
                              <span className="text-yellow-600 text-sm">En génération...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tableaux' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Exécution Budgétaire par Ministère</h4>
                  <div className="space-y-3">
                    {[
                      { nom: 'MIN-SANTE', taux: 85, couleur: 'bg-green-600' },
                      { nom: 'MIN-EDUC', taux: 78, couleur: 'bg-blue-600' },
                      { nom: 'MIN-INFRA', taux: 65, couleur: 'bg-yellow-600' },
                      { nom: 'MIN-MINES', taux: 92, couleur: 'bg-purple-600' }
                    ].map((ministere, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{ministere.nom}</span>
                          <span className="text-sm font-medium">{ministere.taux}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${ministere.couleur} h-2 rounded-full`}
                            style={{ width: `${ministere.taux}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Recettes (6 mois)</h4>
                  <div className="h-48 flex items-end justify-between space-x-2">
                    {[850, 920, 780, 1100, 950, 1200].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-blue-600 rounded-t w-8"
                          style={{ height: `${(value / 1200) * 150}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">
                          {['Août', 'Sept', 'Oct', 'Nov', 'Déc', 'Jan'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Dépenses par Catégorie</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { categorie: 'Personnel', montant: '1.2T CDF', pourcentage: 45, couleur: 'bg-red-600' },
                    { categorie: 'Investissement', montant: '800M CDF', pourcentage: 30, couleur: 'bg-blue-600' },
                    { categorie: 'Fonctionnement', montant: '670M CDF', pourcentage: 25, couleur: 'bg-green-600' }
                  ].map((item, index) => (
                    <div key={index} className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="w-24 h-24 rounded-full bg-gray-200"></div>
                        <div 
                          className={`absolute top-0 left-0 w-24 h-24 rounded-full ${item.couleur}`}
                          style={{
                            background: `conic-gradient(${item.couleur.replace('bg-', 'rgb(var(--')} 0deg ${item.pourcentage * 3.6}deg, #e5e7eb ${item.pourcentage * 3.6}deg 360deg)`
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{item.pourcentage}%</span>
                        </div>
                      </div>
                      <h5 className="font-medium text-gray-900">{item.categorie}</h5>
                      <p className="text-sm text-gray-600">{item.montant}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'indicateurs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {indicateursFinanciers.map((indicateur, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-600 mb-2">{indicateur.nom}</h4>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{indicateur.valeur}</p>
                        <div className="flex items-center space-x-2">
                          {getEvolutionIcon(indicateur.type)}
                          <span className={`text-sm font-medium ${getEvolutionColor(indicateur.type)}`}>
                            {indicateur.evolution}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Alertes et Recommandations</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Taux de rejet en hausse</p>
                      <p className="text-sm text-blue-700">Le taux de rejet automatique a augmenté de 1.2%. Vérifier la formation des agents.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Amélioration de la conformité</p>
                      <p className="text-sm text-blue-700">La conformité documentaire s'améliore (+2.1%). Maintenir les efforts de formation.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Performance budgétaire positive</p>
                      <p className="text-sm text-blue-700">Le taux d'exécution budgétaire progresse bien (+5.2%). Objectif annuel atteignable.</p>
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