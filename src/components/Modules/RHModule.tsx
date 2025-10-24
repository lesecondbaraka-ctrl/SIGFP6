import { useState } from 'react';
import { Users, Search, Download, Eye, Edit, Calculator, FileText, X, AlertTriangle } from 'lucide-react';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';

interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  grade: string;
  salaireBrut: number;
  primes: number;
  salaireImposable: number;
  ipr: number; // Impôt Professionnel sur les Rémunérations
  inss: number; // Institut National de Sécurité Sociale
  autresRetenues: number;
  salaireNet: number;
  entite: string;
  statut: 'Actif' | 'Inactif' | 'Suspendu';
  numeroINSS: string;
  numeroImpot: string;
}

interface DeclarationFiscale {
  id: string;
  periode: string;
  type: 'IPR' | 'INSS' | 'Mensuelle';
  montantTotal: number;
  nombreAgents: number;
  dateEcheance: string;
  statut: 'Brouillon' | 'Soumise' | 'Validée' | 'Payée';
}

export default function RHModule() {
  const [activeTab, setActiveTab] = useState('agents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntite, setSelectedEntite] = useState('Toutes');
  
  // États pour les modals
  const [showGenererPaieModal, setShowGenererPaieModal] = useState(false);
  const [showAgentDetailModal, setShowAgentDetailModal] = useState(false);
  const [showAgentEditModal, setShowAgentEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showNewDeclarationModal, setShowNewDeclarationModal] = useState(false);
  const [showDeclarationDetailModal, setShowDeclarationDetailModal] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<DeclarationFiscale | null>(null);
  
  // Handlers
  const handleAgentView = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentDetailModal(true);
  };
  const handleAgentEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentEditModal(true);
  };
  const handleExportAgents = () => {
    const data = agents.map(a => ({
      Matricule: a.matricule,
      Nom: `${a.prenom} ${a.nom}`,
      Poste: a.poste,
      Grade: a.grade,
      SalaireBrut: a.salaireBrut,
      Primes: a.primes,
      IPR: a.ipr,
      INSS: a.inss,
      SalaireNet: a.salaireNet,
      Entite: a.entite,
      Statut: a.statut,
    }));
    exportToExcel(data, generateFilename('agents_export'));
  };
  const handleDeclarationView = (decl: DeclarationFiscale) => {
    setSelectedDeclaration(decl);
    setShowDeclarationDetailModal(true);
  };
  const handleDeclarationDownload = (decl: DeclarationFiscale) => {
    const rows = [{
      Periode: decl.periode,
      Type: decl.type,
      NombreAgents: decl.nombreAgents,
      MontantTotal: decl.montantTotal,
      Echeance: decl.dateEcheance,
      Statut: decl.statut,
    }];
    exportToExcel(rows, generateFilename(`declaration_${decl.type}_${decl.periode}`));
  };


  // Barèmes fiscaux RDC 2024
  const baremeIPR = [
    { min: 0, max: 524160, taux: 0 }, // Exonération jusqu'à 524,160 CDF
    { min: 524160, max: 1310400, taux: 15 },
    { min: 1310400, max: 2620800, taux: 20 },
    { min: 2620800, max: 5241600, taux: 30 },
    { min: 5241600, max: Infinity, taux: 40 }
  ];
  const tauxINSS = 0.065; // 6.5% pour l'employé + 6.5% pour l'employeur

  const calculerIPR = (salaireImposable: number): number => {
    let ipr = 0;
    let resteAImposer = salaireImposable;

    for (const tranche of baremeIPR) {
      if (resteAImposer <= 0) break;
      
      const baseImposable = Math.min(resteAImposer, tranche.max - tranche.min);
      ipr += baseImposable * (tranche.taux / 100);
      resteAImposer -= baseImposable;
    }

    return Math.round(ipr);
  };

  const calculerINSS = (salaireBrut: number): number => {
    // Plafond INSS: 262,080 CDF (2024)
    const plafondINSS = 262080;
    const baseINSS = Math.min(salaireBrut, plafondINSS);
    return Math.round(baseINSS * tauxINSS);
  };

  // Fonction de calcul de salaire (utilisée pour les calculs automatiques)
  // const calculerSalaire = (salaireBrut: number, primes: number): number => {
  //   const salaireImposable = salaireBrut + primes;
  //   const ipr = calculerIPR(salaireImposable);
  //   const inss = calculerINSS(salaireBrut);
  //   const salaireNet = salaireImposable - ipr - inss;
  //   return salaireNet;
  // };

  const initialAgents: Agent[] = [
    {
      id: '1',
      matricule: 'AGT-001',
      nom: 'MUKENDI',
      prenom: 'Jean-Pierre',
      poste: 'Directeur Financier',
      grade: 'A1',
      salaireBrut: 2500000,
      primes: 500000,
      salaireImposable: 3000000,
      ipr: calculerIPR(3000000),
      inss: calculerINSS(2500000),
      autresRetenues: 50000,
      salaireNet: 0, // Calculé ci-dessous
      entite: 'MIN-BUDGET',
      statut: 'Actif',
      numeroINSS: 'INSS-001-2024',
      numeroImpot: 'IMP-001-2024'
    },
    {
      id: '2',
      matricule: 'AGT-002',
      nom: 'KABILA',
      prenom: 'Marie-Claire',
      poste: 'Comptable Principal',
      grade: 'A2',
      salaireBrut: 1800000,
      primes: 300000,
      salaireImposable: 2100000,
      ipr: calculerIPR(2100000),
      inss: calculerINSS(1800000),
      autresRetenues: 25000,
      salaireNet: 0,
      entite: 'MIN-SANTE',
      statut: 'Actif',
      numeroINSS: 'INSS-002-2024',
      numeroImpot: 'IMP-002-2024'
    },
    {
      id: '3',
      matricule: 'AGT-003',
      nom: 'TSHISEKEDI',
      prenom: 'Paul',
      poste: 'Contrôleur de Gestion',
      grade: 'B1',
      salaireBrut: 1500000,
      primes: 200000,
      salaireImposable: 1700000,
      ipr: calculerIPR(1700000),
      inss: calculerINSS(1500000),
      autresRetenues: 15000,
      salaireNet: 0,
      entite: 'MIN-EDUC',
      statut: 'Actif',
      numeroINSS: 'INSS-003-2024',
      numeroImpot: 'IMP-003-2024'
    },
    {
      id: '4',
      matricule: 'AGT-004',
      nom: 'MBUYI',
      prenom: 'Françoise',
      poste: 'Secrétaire Administrative',
      grade: 'C1',
      salaireBrut: 800000,
      primes: 100000,
      salaireImposable: 900000,
      ipr: calculerIPR(900000),
      inss: calculerINSS(800000),
      autresRetenues: 10000,
      salaireNet: 0,
      entite: 'MIN-INFRA',
      statut: 'Suspendu',
      numeroINSS: 'INSS-004-2024',
      numeroImpot: 'IMP-004-2024'
    }
  ];
  const [agents, setAgents] = useState(initialAgents);

  // Calculer les salaires nets
  agents.forEach(agent => {
    agent.salaireNet = agent.salaireImposable - agent.ipr - agent.inss - agent.autresRetenues;
  });

  const initialDeclarations: DeclarationFiscale[] = [
    {
      id: '1',
      periode: 'Janvier 2024',
      type: 'IPR',
      montantTotal: agents.reduce((sum, a) => sum + a.ipr, 0),
      nombreAgents: agents.length,
      dateEcheance: '2024-02-15',
      statut: 'Payée'
    },
    {
      id: '2',
      periode: 'Janvier 2024',
      type: 'INSS',
      montantTotal: agents.reduce((sum, a) => sum + a.inss, 0) * 2, // Employé + Employeur
      nombreAgents: agents.length,
      dateEcheance: '2024-02-15',
      statut: 'Payée'
    },
    {
      id: '3',
      periode: 'Février 2024',
      type: 'IPR',
      montantTotal: agents.reduce((sum, a) => sum + a.ipr, 0),
      nombreAgents: agents.length,
      dateEcheance: '2024-03-15',
      statut: 'Soumise'
    }
  ];

  const [declarationsFiscales, setDeclarationsFiscales] = useState(initialDeclarations);

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
      'Brouillon': 'bg-gray-100 text-gray-800',
      'Soumise': 'bg-blue-100 text-blue-800',
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
    totalIPR: agents.reduce((sum, a) => sum + a.ipr, 0),
    totalINSS: agents.reduce((sum, a) => sum + a.inss, 0),
    moyenneSalaire: agents.length ? agents.reduce((sum, a) => sum + a.salaireNet, 0) / agents.length : 0,
    // Champs utilisés dans le résumé de paie
    masseSalarialeBrute: agents.reduce((sum, a) => sum + a.salaireBrut + a.primes, 0),
    totalRetenues: agents.reduce((sum, a) => sum + a.ipr + a.inss + a.autresRetenues, 0),
    masseSalarialeNette: agents.reduce((sum, a) => sum + a.salaireNet, 0),
  };

  // Helpers for new declaration
  const computeDeclarationMontant = (type: DeclarationFiscale['type']) => {
    if (type === 'IPR') return agents.reduce((s, a) => s + a.ipr, 0);
    if (type === 'INSS') return agents.reduce((s, a) => s + a.inss, 0) * 2; // employé + employeur
    return agents.reduce((s, a) => s + a.salaireNet, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ressources Humaines - RDC</h2>
          <p className="text-gray-600">Gestion conforme à la fiscalité congolaise (IPR, INSS)</p>
        </div>
        <button 
          onClick={() => setShowGenererPaieModal(true)}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
        >
          <Calculator className="h-4 w-4" />
          <span>Générer Paie</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Agents</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalAgents}</p>
            </div>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Agents Actifs</p>
              <p className="text-xl font-bold text-green-600">{stats.agentsActifs}</p>
            </div>
            <Users className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Masse Salariale</p>
              <p className="text-sm font-bold text-purple-600">{formatCurrency(stats.masseSalariale)}</p>
            </div>
            <Calculator className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total IPR</p>
              <p className="text-sm font-bold text-red-600">{formatCurrency(stats.totalIPR)}</p>
            </div>
            <FileText className="h-5 w-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total INSS</p>
              <p className="text-sm font-bold text-orange-600">{formatCurrency(stats.totalINSS)}</p>
            </div>
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Salaire Moyen</p>
              <p className="text-sm font-bold text-yellow-600">{formatCurrency(stats.moyenneSalaire)}</p>
            </div>
            <Calculator className="h-5 w-5 text-yellow-600" />
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
              onClick={() => setActiveTab('fiscalite')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'fiscalite'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Déclarations Fiscales</span>
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
                  aria-label="Filtrer par entité"
                  title="Sélectionner une entité"
                >
                  <option value="Toutes">Toutes les entités</option>
                  <option value="MIN-BUDGET">MIN-BUDGET</option>
                  <option value="MIN-SANTE">MIN-SANTE</option>
                  <option value="MIN-EDUC">MIN-EDUC</option>
                  <option value="MIN-INFRA">MIN-INFRA</option>
                </select>

                <button onClick={handleExportAgents} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2" title="Exporter les agents" aria-label="Exporter les agents">
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </button>
              </div>

              {/* Tableau des agents avec calculs fiscaux */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poste/Grade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salaire Brut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IPR (15-40%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        INSS (6.5%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salaire Net
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.prenom} {agent.nom}
                            </div>
                            <div className="text-xs text-gray-500">{agent.matricule}</div>
                            <div className="text-xs text-gray-400">{agent.entite}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{agent.poste}</div>
                          <div className="text-xs text-gray-500">Grade {agent.grade}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(agent.salaireBrut)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(agent.primes)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                          {formatCurrency(agent.ipr)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">
                          {formatCurrency(agent.inss)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(agent.salaireNet)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(agent.statut)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleAgentView(agent)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir les détails"
                              aria-label="Voir les détails de l'agent"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleAgentEdit(agent)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Modifier"
                              aria-label="Modifier l'agent"
                            >
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

          {activeTab === 'fiscalite' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Déclarations Fiscales RDC</h3>
                <button onClick={() => setShowNewDeclarationModal(true)} className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2" title="Créer une nouvelle déclaration" aria-label="Nouvelle déclaration">
                  <FileText className="h-4 w-4" />
                  <span>Nouvelle Déclaration</span>
                </button>
              </div>

              {/* Barème IPR */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Barème IPR 2024 (RDC)</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                  {baremeIPR.map((tranche, index) => (
                    <div key={index} className="text-center">
                      <div className="font-medium text-blue-900">
                        {tranche.max === Infinity ? `> ${formatCurrency(tranche.min)}` : 
                         `${formatCurrency(tranche.min)} - ${formatCurrency(tranche.max)}`}
                      </div>
                      <div className="text-blue-700">{tranche.taux}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre d'Agents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Échéance
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
                    {declarationsFiscales.map((declaration) => (
                      <tr key={declaration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {declaration.periode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            declaration.type === 'IPR' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {declaration.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {declaration.nombreAgents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatCurrency(declaration.montantTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {declaration.dateEcheance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(declaration.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleDeclarationView(declaration)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir les détails"
                              aria-label="Voir les détails de la déclaration"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeclarationDownload(declaration)}
                              className="text-green-600 hover:text-green-900"
                              title="Télécharger"
                              aria-label="Télécharger la déclaration"
                            >
                              <Download className="h-4 w-4" />
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
        </div>
      </div>

      {/* Modal Générer Paie */}
      {showGenererPaieModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Générer la Paie</h3>
              <button onClick={() => setShowGenererPaieModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Période de Paie</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Période" aria-label="Sélectionner la période">
                  <option>Janvier 2024</option>
                  <option>Février 2024</option>
                  <option>Mars 2024</option>
                  <option>Avril 2024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Département" aria-label="Sélectionner le département">
                  <option>Tous les départements</option>
                  <option>Finance</option>
                  <option>IT</option>
                  <option>RH</option>
                  <option>Administration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Paie</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" title="Type" aria-label="Sélectionner le type">
                  <option>Paie Mensuelle</option>
                  <option>Prime</option>
                  <option>13ème Mois</option>
                  <option>Heures Supplémentaires</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Résumé de la Paie</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Nombre d'agents:</span>
                    <span className="font-medium text-blue-900">{stats.totalAgents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Masse salariale brute:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(stats.masseSalarialeBrute)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total retenues:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(stats.totalRetenues)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                    <span className="text-blue-700 font-semibold">Masse salariale nette:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(stats.masseSalarialeNette)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Attention</p>
                  <p>La génération de la paie est irréversible. Assurez-vous que toutes les données sont correctes.</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowGenererPaieModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Générer la Paie</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Agent */}
      {showAgentDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Détails de l'Agent</h3>
              <button onClick={() => setShowAgentDetailModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Matricule:</span> <span className="font-medium">{selectedAgent.matricule}</span></div>
              <div><span className="text-gray-600">Nom:</span> <span className="font-medium">{selectedAgent.prenom} {selectedAgent.nom}</span></div>
              <div><span className="text-gray-600">Poste/Grade:</span> <span className="font-medium">{selectedAgent.poste} • {selectedAgent.grade}</span></div>
              <div><span className="text-gray-600">Entité:</span> <span className="font-medium">{selectedAgent.entite}</span></div>
              <div><span className="text-gray-600">Salaire Brut:</span> <span className="font-medium">{formatCurrency(selectedAgent.salaireBrut)}</span></div>
              <div><span className="text-gray-600">Primes:</span> <span className="font-medium">{formatCurrency(selectedAgent.primes)}</span></div>
              <div><span className="text-gray-600">IPR:</span> <span className="font-medium">{formatCurrency(selectedAgent.ipr)}</span></div>
              <div><span className="text-gray-600">INSS:</span> <span className="font-medium">{formatCurrency(selectedAgent.inss)}</span></div>
              <div><span className="text-gray-600">Salaire Net:</span> <span className="font-medium">{formatCurrency(selectedAgent.salaireNet)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éditer Agent */}
      {showAgentEditModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Modifier Agent</h3>
              <button onClick={() => setShowAgentEditModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const fd = new FormData(form);
              const updated = { ...selectedAgent } as Agent;
              updated.salaireBrut = Number(fd.get('salaireBrut'));
              updated.primes = Number(fd.get('primes'));
              updated.statut = String(fd.get('statut')) as Agent['statut'];
              updated.salaireImposable = updated.salaireBrut + updated.primes;
              updated.ipr = calculerIPR(updated.salaireImposable);
              updated.inss = calculerINSS(updated.salaireBrut);
              updated.salaireNet = updated.salaireImposable - updated.ipr - updated.inss - updated.autresRetenues;
              setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
              setShowAgentEditModal(false);
            }}>
              <div>
                <label htmlFor="edit-salaireBrut" className="block text-sm font-medium text-gray-700 mb-1">Salaire Brut</label>
                <input id="edit-salaireBrut" name="salaireBrut" type="number" defaultValue={selectedAgent.salaireBrut} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="edit-primes" className="block text-sm font-medium text-gray-700 mb-1">Primes</label>
                <input id="edit-primes" name="primes" type="number" defaultValue={selectedAgent.primes} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="edit-statut" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select id="edit-statut" name="statut" defaultValue={selectedAgent.statut} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" aria-label="Sélectionner une option" title="Sélectionner une option">
                  <option>Actif</option>
                  <option>Inactif</option>
                  <option>Suspendu</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowAgentEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Déclaration */}
      {showNewDeclarationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Nouvelle Déclaration</h3>
              <button onClick={() => setShowNewDeclarationModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const fd = new FormData(form);
              const type = String(fd.get('type')) as DeclarationFiscale['type'];
              const periode = String(fd.get('periode'));
              const echeance = String(fd.get('echeance'));
              const newDecl: DeclarationFiscale = {
                id: String(Date.now()),
                periode,
                type,
                montantTotal: computeDeclarationMontant(type),
                nombreAgents: agents.length,
                dateEcheance: echeance,
                statut: 'Brouillon',
              };
              setDeclarationsFiscales(prev => [newDecl, ...prev]);
              setShowNewDeclarationModal(false);
            }}>
              <div>
                <label htmlFor="decl-periode" className="block text-sm font-medium text-gray-700 mb-1">Période</label>
                <input id="decl-periode" name="periode" type="text" placeholder="Ex: Mars 2024" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label htmlFor="decl-type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select id="decl-type" name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="IPR" aria-label="Sélectionner une option" title="Sélectionner une option">
                  <option>IPR</option>
                  <option>INSS</option>
                  <option>Mensuelle</option>
                </select>
              </div>
              <div>
                <label htmlFor="decl-ech" className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input id="decl-ech" name="echeance" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowNewDeclarationModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails Déclaration */}
      {showDeclarationDetailModal && selectedDeclaration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Détails de la Déclaration</h3>
              <button onClick={() => setShowDeclarationDetailModal(false)} className="text-gray-400 hover:text-gray-600" title="Fermer" aria-label="Fermer le modal">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Période:</span> <span className="font-medium">{selectedDeclaration.periode}</span></div>
              <div><span className="text-gray-600">Type:</span> <span className="font-medium">{selectedDeclaration.type}</span></div>
              <div><span className="text-gray-600">Nombre d'Agents:</span> <span className="font-medium">{selectedDeclaration.nombreAgents}</span></div>
              <div><span className="text-gray-600">Montant Total:</span> <span className="font-medium">{formatCurrency(selectedDeclaration.montantTotal)}</span></div>
              <div><span className="text-gray-600">Échéance:</span> <span className="font-medium">{selectedDeclaration.dateEcheance}</span></div>
              <div><span className="text-gray-600">Statut:</span> <span className="font-medium">{selectedDeclaration.statut}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
