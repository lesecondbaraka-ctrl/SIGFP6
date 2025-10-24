import { useState } from 'react';
import { 
  CheckCircle, XCircle, Clock, FileText, User, Calendar, Shield, Download, AlertCircle
} from 'lucide-react';

/**
 * Module Validation - Workflow validation multi-niveaux
 * Circuit de validation configurable
 * Statistiques temps réel
 */

interface DocumentValidation {
  id: string;
  nom: string;
  type: 'Engagement' | 'Liquidation' | 'Paiement' | 'Budget' | 'Contrat';
  montant?: number;
  demandeur: string;
  entite: string;
  dateSubmission: string;
  statut: 'En attente' | 'Validé' | 'Rejeté' | 'En révision';
  validateur?: string;
  commentaire?: string;
  pieceJointe: boolean;
  urgence: 'Normale' | 'Urgente' | 'Critique';
}

export default function ValidationModule() {
  const [activeTab, setActiveTab] = useState('en-attente');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentValidation | null>(null);
  const [validationComment, setValidationComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionRequest, setRevisionRequest] = useState('');

  const documents: DocumentValidation[] = [
    {
      id: '1',
      nom: 'Engagement_Medicaments_JAN_2024',
      type: 'Engagement',
      montant: 45000000,
      demandeur: 'Dr. MUKENDI Jean',
      entite: 'MIN-SANTE',
      dateSubmission: '2024-01-15 14:30',
      statut: 'En attente',
      pieceJointe: true,
      urgence: 'Urgente'
    },
    {
      id: '2',
      nom: 'Liquidation_Travaux_Ecole_Kinshasa',
      type: 'Liquidation',
      montant: 125000000,
      demandeur: 'Ing. KABILA Marie',
      entite: 'MIN-EDUC',
      dateSubmission: '2024-01-14 16:45',
      statut: 'Validé',
      validateur: 'IGF - Inspecteur TSHISEKEDI',
      pieceJointe: true,
      urgence: 'Normale'
    },
    {
      id: '3',
      nom: 'Paiement_Salaires_Janvier_2024',
      type: 'Paiement',
      montant: 1572500000,
      demandeur: 'RH - MBUYI Françoise',
      entite: 'MIN-BUDGET',
      dateSubmission: '2024-01-13 09:15',
      statut: 'Validé',
      validateur: 'IGF - Inspecteur LUMUMBA',
      pieceJointe: true,
      urgence: 'Critique'
    },
    {
      id: '4',
      nom: 'Contrat_Maintenance_Informatique',
      type: 'Contrat',
      montant: 15000000,
      demandeur: 'IT - KASONGO Paul',
      entite: 'MIN-BUDGET',
      dateSubmission: '2024-01-12 11:20',
      statut: 'Rejeté',
      validateur: 'IGF - Inspecteur MOBUTU',
      commentaire: 'Pièces justificatives incomplètes - Devis manquant',
      pieceJointe: false,
      urgence: 'Normale'
    },
    {
      id: '5',
      nom: 'Budget_Supplementaire_Q1_2024',
      type: 'Budget',
      montant: 500000000,
      demandeur: 'Dir. NGOZI Albert',
      entite: 'MIN-MINES',
      dateSubmission: '2024-01-11 13:45',
      statut: 'En révision',
      validateur: 'IGF - Inspecteur KABILA',
      commentaire: 'Demande de clarifications sur les postes budgétaires',
      pieceJointe: true,
      urgence: 'Normale'
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
      'En attente': 'bg-yellow-100 text-yellow-800',
      'Validé': 'bg-green-100 text-green-800',
      'Rejeté': 'bg-red-100 text-red-800',
      'En révision': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[statut as keyof typeof styles]}`}>
        {statut}
      </span>
    );
  };

  const getUrgenceBadge = (urgence: string) => {
    const styles = {
      'Normale': 'bg-gray-100 text-gray-800',
      'Urgente': 'bg-orange-100 text-orange-800',
      'Critique': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[urgence as keyof typeof styles]}`}>
        {urgence}
      </span>
    );
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Validé':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Rejeté':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'En révision':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    switch (activeTab) {
      case 'en-attente':
        return doc.statut === 'En attente';
      case 'valides':
        return doc.statut === 'Validé';
      case 'rejetes':
        return doc.statut === 'Rejeté';
      case 'revision':
        return doc.statut === 'En révision';
      default:
        return true;
    }
  });

  const stats = {
    enAttente: documents.filter(d => d.statut === 'En attente').length,
    valides: documents.filter(d => d.statut === 'Validé').length,
    rejetes: documents.filter(d => d.statut === 'Rejeté').length,
    enRevision: documents.filter(d => d.statut === 'En révision').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Validation Dématérialisée</h2>
          <p className="text-gray-600">Validation à distance des documents officiels et pièces justificatives</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Accès IGF sécurisé</span>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Validés</p>
              <p className="text-2xl font-bold text-green-600">{stats.valides}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejetes}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Révision</p>
              <p className="text-2xl font-bold text-blue-600">{stats.enRevision}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('en-attente')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'en-attente'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>En Attente ({stats.enAttente})</span>
            </button>
            <button
              onClick={() => setActiveTab('valides')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'valides'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Validés ({stats.valides})</span>
            </button>
            <button
              onClick={() => setActiveTab('rejetes')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'rejetes'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span>Rejetés ({stats.rejetes})</span>
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`py-4 px-6 text-sm font-medium flex items-center space-x-2 ${
                activeTab === 'revision'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>En Révision ({stats.enRevision})</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(document.statut)}
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {document.nom}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {getUrgenceBadge(document.urgence)}
                          {getStatusBadge(document.statut)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm font-medium text-gray-900">{document.type}</p>
                        </div>
                        {document.montant && (
                          <div>
                            <p className="text-xs text-gray-500">Montant</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(document.montant)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Demandeur</p>
                          <p className="text-sm font-medium text-gray-900">{document.demandeur}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Entité</p>
                          <p className="text-sm font-medium text-gray-900">{document.entite}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Soumis le {document.dateSubmission}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>{document.pieceJointe ? 'Pièces jointes' : 'Aucune pièce jointe'}</span>
                          </div>
                        </div>
                        {document.validateur && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Validé par {document.validateur}</span>
                          </div>
                        )}
                      </div>
                      
                      {document.commentaire && (
                        <div className="bg-white p-3 rounded border border-gray-200 mb-4">
                          <p className="text-sm text-gray-700">{document.commentaire}</p>
                        </div>
                      )}
                      
                      {document.statut === 'En attente' && (
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowValidateModal(true);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Valider</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowRejectModal(true);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Rejeter</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowRevisionModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Demander Révision</span>
                          </button>
                        </div>
                      )}
                      
                      {(document.statut === 'Validé' || document.statut === 'Rejeté') && (
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                          <Download className="h-4 w-4" />
                          <span>Télécharger Certificat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredDocuments.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun document dans cette catégorie</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Validation */}
      {showValidateModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
              Valider le Document
            </h3>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
              <p className="text-sm font-bold text-green-900 mb-2">{selectedDocument.nom}</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-green-800">
                <div><strong>Type:</strong> {selectedDocument.type}</div>
                <div><strong>Montant:</strong> {selectedDocument.montant ? formatCurrency(selectedDocument.montant) : 'N/A'}</div>
                <div><strong>Demandeur:</strong> {selectedDocument.demandeur}</div>
                <div><strong>Entité:</strong> {selectedDocument.entite}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire de validation (optionnel)
              </label>
              <textarea
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                placeholder="Ajoutez un commentaire sur cette validation..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={4}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <p className="text-xs text-blue-800">
                <strong>Attention:</strong> La validation de ce document est irréversible. Assurez-vous que toutes les vérifications ont été effectuées.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowValidateModal(false);
                  setSelectedDocument(null);
                  setValidationComment('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Document validé:', selectedDocument.id, validationComment);
                  setShowValidateModal(false);
                  setSelectedDocument(null);
                  setValidationComment('');
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all shadow-md"
              >
                Confirmer la Validation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <XCircle className="h-6 w-6 mr-2 text-red-600" />
              Rejeter le Document
            </h3>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
              <p className="text-sm font-bold text-red-900 mb-2">{selectedDocument.nom}</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-red-800">
                <div><strong>Type:</strong> {selectedDocument.type}</div>
                <div><strong>Montant:</strong> {selectedDocument.montant ? formatCurrency(selectedDocument.montant) : 'N/A'}</div>
                <div><strong>Demandeur:</strong> {selectedDocument.demandeur}</div>
                <div><strong>Entité:</strong> {selectedDocument.entite}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motif du rejet *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Décrivez en détail les raisons du rejet (obligatoire)..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={5}
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Le demandeur sera notifié du rejet avec le motif indiqué. Soyez précis et constructif.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Document rejeté:', selectedDocument.id, rejectionReason);
                  setShowRejectModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
                disabled={!rejectionReason.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Demande de Révision */}
      {showRevisionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Demander une Révision
            </h3>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <p className="text-sm font-bold text-blue-900 mb-2">{selectedDocument.nom}</p>
              <div className="grid grid-cols-2 gap-3 text-xs text-blue-800">
                <div><strong>Type:</strong> {selectedDocument.type}</div>
                <div><strong>Montant:</strong> {selectedDocument.montant ? formatCurrency(selectedDocument.montant) : 'N/A'}</div>
                <div><strong>Demandeur:</strong> {selectedDocument.demandeur}</div>
                <div><strong>Entité:</strong> {selectedDocument.entite}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Éléments à réviser *
              </label>
              <textarea
                value={revisionRequest}
                onChange={(e) => setRevisionRequest(e.target.value)}
                placeholder="Listez les éléments qui nécessitent une révision ou des clarifications..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={5}
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
              <p className="text-xs text-green-800">
                <strong>Note:</strong> Le document sera renvoyé au demandeur pour correction. Il pourra le resoumettre après modifications.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setSelectedDocument(null);
                  setRevisionRequest('');
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Révision demandée:', selectedDocument.id, revisionRequest);
                  setShowRevisionModal(false);
                  setSelectedDocument(null);
                  setRevisionRequest('');
                }}
                disabled={!revisionRequest.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-md"
              >
                Envoyer la Demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}