import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Download, Eye, Edit, Calculator } from 'lucide-react';

interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  grade: string;
  salaire: number;
  primes: number;
  retenues: number;
  salaireNet: number;
  entite: string;
  statut: 'Actif' | 'Inactif' | 'Suspendu';
}

interface Paie {
  id: string;
  periode: string;
  nombreAgents: number;
  montantBrut: number;
  montantRetenues: number;
  montantNet: number;
  statut: 'Calculée' | 'Validée' | 'Payée';
  dateCalcul: string;
}

export default function RHModule() {
  const [activeTab, setActiveTab] = useState('agents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntite, setSelectedEntite] = useState('Toutes');

  const agents: Agent[] = [
    {
      id: '1',
      matricule: 'AGT-001',
      nom: 'MUKENDI',
      prenom: 'Jean-Pierre',
      poste: 'Directeur Financier',
      grade: 'A1',
      salaire: 2500000,
      primes: 500000,
      retenues: 450000,
      salaireNet: 2550000,
      entite: 'MIN-BUDGET',
      statut: 'Actif'
    },
    {
      id: '2',
      matricule: 'AGT-002',
      nom: 'KABILA',
      prenom: 'Marie-Claire',
      poste: 'Comptable Principal',
      grade: 'A2',
      salaire: 1800000,
      primes: 300000,
      retenues: 315000,
      salaireNet: 1785000,
      entite: 'MIN-SANTE',
      statut: 'Actif'
    },
    {
      id: '3',
      matricule: 'AGT-003',
      nom: 'TSHISEKEDI',
      prenom: 'Paul',
      poste: 'Contrôleur de Gestion',
      grade: 'B1',
      salaire: 1500000,
      primes: 200000,
      retenues: 255000,
      salaireNet: 1445000,
      entite: 'MIN-EDUC',
      statut: 'Actif'
    },
    {
      id: '4',
      matricule: 'AGT-004',
      nom: 'MBUYI',
      prenom: 'Françoise',
      poste: 'Secrétaire Administrative',
      grade: 'C1',
      salaire: 800000,
      primes: 100000,
      retenues: 135000,
      salaireNet: 765000,
      entite: 'MIN-INFRA',
      statut: 'Suspendu'
    }
  ];

  const paies: Paie[] = [
    {
      id: '1',
      periode: 'Janvier 2024',
      nombreAgents: 1247,
      montantBrut: 1850000000,
      montantRetenues: 277500000,
      montantNet: 1572500000,
      statut: 'Payée',
      dateCalcul: '2024-01-25'
    },
    {
      id: '2',
      periode: 'Décembre 2023',
      nombreAgents: 1245,
      montantBrut: 1820000000,
      montantRetenues: 273000000,
      montantNet: 1547000000,
      statut: 'Payée',
      dateCalcul: '2023-12-25'
    },
    {
      id: '3',
      periode: 'Février 2024',
      nombreAgents: 1250,
      montantBrut: 1875000000,
      montantRetenues: 281250000,
      montantNet: 1593750000,
      statut: 'Calculée',
      dateCalcul: '2024-02-20'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (statut: string) => {
    const styles = {
      'Actif': 'bg-green-100 text-green-800',
      'Inactif': 'bg-gray-100 text-gray-800',
      'Suspendu': 'bg-red-100 text-red-800',
      'Calculée': 'bg-blue-100 text-blue-800',
      'Validée': 'bg-yellow-100 text-yellow-800',
      'Payée': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const stats = {
    totalAgents: agents.length,
    agentsActifs: agents.filter(a => a.statut === 'Actif').length,
    masseSalariale: agents.reduce((sum, a) => sum + a.salaireNet, 0),
    moyenneSalaire: agents.reduce((sum, a) => sum + a.salaireNet, 0) / agents.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ressources Humaines</h2>
          <p className="text-gray-600">Gestion des salaires, primes et retenues fiscales</p>
        </div>
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouvel Agent</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agents Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.agentsActifs}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Masse Salariale</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.masseSalariale)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salaire Moyen</p>
              <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.moyenneSalaire)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calculator className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'agents'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Agents</span>
            </button>
            <button
              onClick={() => setActiveTab('paie')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'paie'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calculator className="h-4 w-4" />
              <span>Gestion de la Paie</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'agents' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedEntite}
                  onChange={(e) => setSelectedEntite(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Toutes">Toutes les entités</option>
                  <option value="MIN-BUDGET">MIN-BUDGET</option>
                  <option value="MIN-SANTE">MIN-SANTE</option>
                  <option value="MIN-EDUC">MIN-EDUC</option>
                  <option value="MIN-INFRA">MIN-INFRA</option>
                </select>

                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </button>
              </div>

              {/* Tableau des agents */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poste/Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salaire Brut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retenues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salaire Net
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
                    {agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.prenom} {agent.nom}
                            </div>
                            <div className="text-sm text-gray-500">{agent.matricule}</div>
                            <div className="text-xs text-gray-400">{agent.entite}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{agent.poste}</div>
                          <div className="text-sm text-gray-500">Grade {agent.grade}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(agent.salaire)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(agent.primes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(agent.retenues)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(agent.salaireNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(agent.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'paie' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Historique des Paies</h3>
                <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Calculer Nouvelle Paie</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre d'Agents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Brut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retenues
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Net
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
                    {paies.map((paie) => (
                      <tr key={paie.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {paie.periode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {paie.nombreAgents.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(paie.montantBrut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(paie.montantRetenues)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          {formatCurrency(paie.montantNet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(paie.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paie.dateCalcul}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Calcul de la Prochaine Paie</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">1,252</p>
                    <p className="text-sm text-blue-700">Agents éligibles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(1890000000)}</p>
                    <p className="text-sm text-blue-700">Montant brut estimé</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(1606500000)}</p>
                    <p className="text-sm text-blue-700">Montant net estimé</p>
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