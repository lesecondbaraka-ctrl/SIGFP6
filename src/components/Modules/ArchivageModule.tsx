import { useState } from 'react';
import { Archive, Search, Download, Eye, Upload, FileText, Shield, Calendar } from 'lucide-react';

interface Document {
  id: string;
  nom: string;
  type: 'Budget' | 'Dépense' | 'Recette' | 'Contrat' | 'Rapport' | 'Autre';
  taille: string;
  dateCreation: string;
  dateArchivage: string;
  entite: string;
  statut: 'Archivé' | 'En cours' | 'Vérifié';
  confidentialite: 'Public' | 'Confidentiel' | 'Secret';
  checksum: string;
}

export default function ArchivageModule() {
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Tous');
  const [selectedConfidentialite, setSelectedConfidentialite] = useState('Tous');

  const documents: Document[] = [
    {
      id: '1',
      nom: 'Budget_2024_MIN_SANTE.pdf',
      type: 'Budget',
      taille: '2.4 MB',
      dateCreation: '2024-01-15',
      dateArchivage: '2024-01-15',
      entite: 'MIN-SANTE',
      statut: 'Archivé',
      confidentialite: 'Confidentiel',
      checksum: 'SHA256:a1b2c3d4e5f6...'
    },
    {
      id: '2',
      nom: 'Contrat_Infrastructure_2024_001.pdf',
      type: 'Contrat',
      taille: '5.8 MB',
      dateCreation: '2024-01-12',
      dateArchivage: '2024-01-12',
      entite: 'MIN-INFRA',
      statut: 'Vérifié',
      confidentialite: 'Public',
      checksum: 'SHA256:f6e5d4c3b2a1...'
    },
    {
      id: '3',
      nom: 'Rapport_Audit_Q4_2023.pdf',
      type: 'Rapport',
      taille: '3.2 MB',
      dateCreation: '2024-01-10',
      dateArchivage: '2024-01-10',
      entite: 'IGF',
      statut: 'Archivé',
      confidentialite: 'Secret',
      checksum: 'SHA256:b2c3d4e5f6a1...'
    },
    {
      id: '4',
      nom: 'Facture_Medicaments_JAN_2024.pdf',
      type: 'Dépense',
      taille: '1.1 MB',
      dateCreation: '2024-01-08',
      dateArchivage: '2024-01-08',
      entite: 'MIN-SANTE',
      statut: 'En cours',
      confidentialite: 'Confidentiel',
      checksum: 'SHA256:c3d4e5f6a1b2...'
    }
  ];

  const getTypeBadge = (type: string) => {
    const styles = {
      'Budget': 'bg-blue-100 text-blue-800',
      'Dépense': 'bg-red-100 text-red-800',
      'Recette': 'bg-green-100 text-green-800',
      'Contrat': 'bg-purple-100 text-purple-800',
      'Rapport': 'bg-orange-100 text-orange-800',
      'Autre': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (statut: string) => {
    const styles = {
      'Archivé': 'bg-green-100 text-green-800',
      'En cours': 'bg-yellow-100 text-yellow-800',
      'Vérifié': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getConfidentialiteBadge = (confidentialite: string) => {
    const styles = {
      'Public': 'bg-green-100 text-green-800',
      'Confidentiel': 'bg-yellow-100 text-yellow-800',
      'Secret': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[confidentialite as keyof typeof styles]}`}>
        {confidentialite}
      </span>
    );
  };

  const stats = {
    totalDocuments: documents.length,
    documentsArchives: documents.filter(d => d.statut === 'Archivé').length,
    tailleTotal: '12.5 GB',
    documentsSecrets: documents.filter(d => d.confidentialite === 'Secret').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Archivage Électronique</h2>
          <p className="text-gray-600">Centralisation et sécurisation des documents financiers</p>
        </div>
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Archiver Document</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents Archivés</p>
              <p className="text-2xl font-bold text-green-600">{stats.documentsArchives}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Archive className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Espace Utilisé</p>
              <p className="text-2xl font-bold text-purple-600">{stats.tailleTotal}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Archive className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documents Secrets</p>
              <p className="text-2xl font-bold text-red-600">{stats.documentsSecrets}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'documents'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('securite')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'securite'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Sécurité</span>
            </button>
            <button
              onClick={() => setActiveTab('retention')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'retention'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Rétention</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Tous">Tous les types</option>
                  <option value="Budget">Budget</option>
                  <option value="Dépense">Dépense</option>
                  <option value="Recette">Recette</option>
                  <option value="Contrat">Contrat</option>
                  <option value="Rapport">Rapport</option>
                </select>

                <select
                  value={selectedConfidentialite}
                  onChange={(e) => setSelectedConfidentialite(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Tous">Toutes confidentialités</option>
                  <option value="Public">Public</option>
                  <option value="Confidentiel">Confidentiel</option>
                  <option value="Secret">Secret</option>
                </select>

                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Exporter</span>
                </button>
              </div>

              {/* Tableau des documents */}
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taille
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Archivage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidentialité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{document.nom}</div>
                            <div className="text-sm text-gray-500">{document.entite}</div>
                            <div className="text-xs text-gray-400 font-mono">{document.checksum.substring(0, 20)}...</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTypeBadge(document.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {document.taille}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.dateArchivage}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(document.statut)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getConfidentialiteBadge(document.confidentialite)}
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
            </div>
          )}

          {activeTab === 'securite' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Mesures de Sécurité Actives</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">Chiffrement AES-256</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">Signature numérique</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">Contrôle d'intégrité SHA-256</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-800">Sauvegarde redondante</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Journaux d'Accès</h4>
                <div className="space-y-3">
                  {[
                    { utilisateur: 'admin@igf.cd', action: 'Consultation', document: 'Rapport_Audit_Q4_2023.pdf', date: '2024-01-15 14:30' },
                    { utilisateur: 'comptable@min-sante.cd', action: 'Téléchargement', document: 'Budget_2024_MIN_SANTE.pdf', date: '2024-01-15 10:15' },
                    { utilisateur: 'directeur@min-infra.cd', action: 'Archivage', document: 'Contrat_Infrastructure_2024_001.pdf', date: '2024-01-12 16:45' }
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-gray-900">{log.utilisateur}</div>
                        <div className="text-sm text-gray-600">{log.action}</div>
                        <div className="text-sm text-gray-500">{log.document}</div>
                      </div>
                      <div className="text-xs text-gray-400">{log.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Politique de Rétention</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Durées de Conservation</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Documents budgétaires: 10 ans</li>
                      <li>• Contrats et marchés: 15 ans</li>
                      <li>• Rapports d'audit: 20 ans</li>
                      <li>• Documents comptables: 30 ans</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-900 mb-2">Règles d'Archivage</h5>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Archivage automatique après validation</li>
                      <li>• Vérification d'intégrité mensuelle</li>
                      <li>• Migration vers stockage froid après 5 ans</li>
                      <li>• Destruction sécurisée après expiration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents Arrivant à Expiration</h4>
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Document
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date d'Expiration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jours Restants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-900">Contrat_Ancien_2014.pdf</td>
                        <td className="px-6 py-4 text-sm text-gray-500">2024-03-15</td>
                        <td className="px-6 py-4 text-sm text-red-600 font-medium">45 jours</td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-red-600 hover:text-red-900">Programmer destruction</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}