import { useState } from 'react';
import { BookOpen, Search, Download, BarChart3, Filter } from 'lucide-react';

interface EcritureComptable {
  id: string;
  date: string;
  numeroEcriture: string;
  libelle: string;
  compteDebit: string;
  compteCredit: string;
  montant: number;
  reference: string;
  entite: string;
  statut: 'Validée' | 'En attente' | 'Rejetée';
}

interface CompteComptable {
  numero: string;
  intitule: string;
  type: 'Actif' | 'Passif' | 'Charge' | 'Produit';
  soldeDebiteur: number;
  soldeCrediteur: number;
  solde: number;
}

export default function JournalModule() {
  const [activeTab, setActiveTab] = useState('journal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Janvier 2024');

  const ecritures: EcritureComptable[] = [
    {
      id: '1',
      date: '2024-01-15',
      numeroEcriture: 'ECR-2024-001',
      libelle: 'Achat médicaments - MIN-SANTE',
      compteDebit: '6011 - Achats de médicaments',
      compteCredit: '4011 - Fournisseurs',
      montant: 45000000,
      reference: 'FAC-2024-001',
      entite: 'MIN-SANTE',
      statut: 'Validée'
    },
    {
      id: '2',
      date: '2024-01-14',
      numeroEcriture: 'ECR-2024-002',
      libelle: 'Paiement salaires janvier 2024',
      compteDebit: '6411 - Salaires',
      compteCredit: '5121 - Banque',
      montant: 1572500000,
      reference: 'PAIE-2024-01',
      entite: 'MIN-BUDGET',
      statut: 'Validée'
    },
    {
      id: '3',
      date: '2024-01-13',
      numeroEcriture: 'ECR-2024-003',
      libelle: 'Encaissement recettes fiscales',
      compteDebit: '5121 - Banque',
      compteCredit: '7011 - Recettes fiscales',
      montant: 250000000,
      reference: 'REC-2024-001',
      entite: 'DGI',
      statut: 'Validée'
    },
    {
      id: '4',
      date: '2024-01-12',
      numeroEcriture: 'ECR-2024-004',
      libelle: 'Travaux réhabilitation école',
      compteDebit: '2131 - Bâtiments',
      compteCredit: '4011 - Fournisseurs',
      montant: 125000000,
      reference: 'TRAV-2024-001',
      entite: 'MIN-EDUC',
      statut: 'En attente'
    }
  ];

  const comptes: CompteComptable[] = [
    {
      numero: '5121',
      intitule: 'Banque',
      type: 'Actif',
      soldeDebiteur: 2325000000,
      soldeCrediteur: 0,
      solde: 2325000000
    },
    {
      numero: '4011',
      intitule: 'Fournisseurs',
      type: 'Passif',
      soldeDebiteur: 0,
      soldeCrediteur: 170000000,
      solde: -170000000
    },
    {
      numero: '6011',
      intitule: 'Achats de médicaments',
      type: 'Charge',
      soldeDebiteur: 45000000,
      soldeCrediteur: 0,
      solde: 45000000
    },
    {
      numero: '6411',
      intitule: 'Salaires',
      type: 'Charge',
      soldeDebiteur: 1572500000,
      soldeCrediteur: 0,
      solde: 1572500000
    },
    {
      numero: '7011',
      intitule: 'Recettes fiscales',
      type: 'Produit',
      soldeDebiteur: 0,
      soldeCrediteur: 250000000,
      solde: -250000000
    },
    {
      numero: '2131',
      intitule: 'Bâtiments',
      type: 'Actif',
      soldeDebiteur: 125000000,
      soldeCrediteur: 0,
      solde: 125000000
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getStatusBadge = (statut: string) => {
    const styles = {
      'Validée': 'bg-green-100 text-green-800',
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Rejetée': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      'Actif': 'bg-blue-100 text-blue-800',
      'Passif': 'bg-red-100 text-red-800',
      'Charge': 'bg-orange-100 text-orange-800',
      'Produit': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {type}
      </span>
    );
  };

  const totalDebit = ecritures.filter(e => e.statut === 'Validée').reduce((sum, e) => sum + e.montant, 0);
  const totalCredit = totalDebit; // En comptabilité, débit = crédit
  const nombreEcritures = ecritures.filter(e => e.statut === 'Validée').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Journal de Compte</h2>
          <p className="text-gray-600">Suivi des opérations comptables : journal, grand livre, balance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Janvier 2024">Janvier 2024</option>
            <option value="Décembre 2023">Décembre 2023</option>
            <option value="Novembre 2023">Novembre 2023</option>
          </select>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Écritures Validées</p>
              <p className="text-2xl font-bold text-gray-900">{nombreEcritures}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Débit</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totalDebit)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Crédit</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(totalCredit)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Équilibre</p>
              <p className="text-lg font-bold text-purple-600">
                {totalDebit === totalCredit ? 'Équilibré' : 'Déséquilibré'}
              </p>
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
              onClick={() => setActiveTab('journal')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'journal'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Journal</span>
            </button>
            <button
              onClick={() => setActiveTab('grand-livre')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'grand-livre'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Grand Livre</span>
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'balance'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Balance</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une écriture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtres</span>
                </button>
              </div>

              {/* Journal des écritures */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date/N° Écriture
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Libellé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compte Débit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compte Crédit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ecritures.map((ecriture) => (
                      <tr key={ecriture.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ecriture.date}</div>
                            <div className="text-sm text-gray-500">{ecriture.numeroEcriture}</div>
                            <div className="text-xs text-gray-400">{ecriture.entite}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{ecriture.libelle}</div>
                          <div className="text-xs text-gray-500">Réf: {ecriture.reference}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{ecriture.compteDebit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{ecriture.compteCredit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(ecriture.montant)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ecriture.statut)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'grand-livre' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Compte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Intitulé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Débit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crédit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comptes.map((compte) => (
                      <tr key={compte.numero} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {compte.numero}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {compte.intitule}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(compte.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compte.soldeDebiteur > 0 ? formatCurrency(compte.soldeDebiteur) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compte.soldeCrediteur > 0 ? formatCurrency(compte.soldeCrediteur) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={compte.solde >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(compte.solde)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'balance' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Balance Générale - {selectedPeriod}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalDebit)}</p>
                    <p className="text-sm text-blue-700">Total Débit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalCredit)}</p>
                    <p className="text-sm text-blue-700">Total Crédit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-900">
                      {totalDebit === totalCredit ? 'Équilibrée' : 'Déséquilibrée'}
                    </p>
                    <p className="text-sm text-blue-700">État de la Balance</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Comptes d'Actif</h5>
                  <div className="space-y-2">
                    {comptes.filter(c => c.type === 'Actif').map((compte) => (
                      <div key={compte.numero} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{compte.numero} - {compte.intitule}</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(compte.solde)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Comptes de Passif</h5>
                  <div className="space-y-2">
                    {comptes.filter(c => c.type === 'Passif').map((compte) => (
                      <div key={compte.numero} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{compte.numero} - {compte.intitule}</span>
                        <span className="text-sm font-medium text-red-600">{formatCurrency(Math.abs(compte.solde))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Comptes de Charges</h5>
                  <div className="space-y-2">
                    {comptes.filter(c => c.type === 'Charge').map((compte) => (
                      <div key={compte.numero} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{compte.numero} - {compte.intitule}</span>
                        <span className="text-sm font-medium text-orange-600">{formatCurrency(compte.solde)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Comptes de Produits</h5>
                  <div className="space-y-2">
                    {comptes.filter(c => c.type === 'Produit').map((compte) => (
                      <div key={compte.numero} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{compte.numero} - {compte.intitule}</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(Math.abs(compte.solde))}</span>
                      </div>
                    ))}
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