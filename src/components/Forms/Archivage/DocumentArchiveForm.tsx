import React from 'react';
import { Archive, X } from 'lucide-react';

interface DocumentArchiveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DocumentArchiveData) => void;
}

export interface DocumentArchiveData {
  reference: string;
  titre: string;
  typeDocument: string;
  categorie: string;
  dateCreation: string;
  auteur: string;
  dureeConservation: number;
  niveauConfidentialite: 'Public' | 'Interne' | 'Confidentiel' | 'Secret';
  description: string;
}

export default function DocumentArchiveForm({
  isOpen,
  onClose,
  onSubmit
}: DocumentArchiveFormProps) {
  const [formData, setFormData] = React.useState<DocumentArchiveData>({
    reference: '',
    titre: '',
    typeDocument: '',
    categorie: '',
    dateCreation: new Date().toISOString().split('T')[0],
    auteur: '',
    dureeConservation: 5,
    niveauConfidentialite: 'Interne',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      titre: '',
      typeDocument: '',
      categorie: '',
      dateCreation: new Date().toISOString().split('T')[0],
      auteur: '',
      dureeConservation: 5,
      niveauConfidentialite: 'Interne',
      description: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Archive className="h-6 w-6 mr-2 text-amber-600" />
            Archivage de Document (ISO 15489)
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer le formulaire"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence *
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="Ex: ARC-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                aria-label="Référence du document"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Document *
              </label>
              <select
                value={formData.typeDocument}
                onChange={(e) => setFormData({ ...formData, typeDocument: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                aria-label="Type de document"
              >
                <option value="">Sélectionner...</option>
                <option value="Contrat">Contrat</option>
                <option value="Facture">Facture</option>
                <option value="Rapport">Rapport</option>
                <option value="Procès-verbal">Procès-verbal</option>
                <option value="Courrier">Courrier</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Titre du document"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
              aria-label="Titre du document"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                aria-label="Catégorie"
              >
                <option value="">Sélectionner...</option>
                <option value="Administratif">Administratif</option>
                <option value="Financier">Financier</option>
                <option value="Juridique">Juridique</option>
                <option value="RH">Ressources Humaines</option>
                <option value="Technique">Technique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auteur *
              </label>
              <input
                type="text"
                value={formData.auteur}
                onChange={(e) => setFormData({ ...formData, auteur: e.target.value })}
                placeholder="Nom de l'auteur"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                aria-label="Nom de l'auteur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée de Conservation (années) *
              </label>
              <input
                type="number"
                value={formData.dureeConservation}
                onChange={(e) => setFormData({ ...formData, dureeConservation: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                min="1"
                max="99"
                aria-label="Durée de conservation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de Confidentialité *
              </label>
              <select
                value={formData.niveauConfidentialite}
                onChange={(e) => setFormData({ ...formData, niveauConfidentialite: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
                aria-label="Niveau de confidentialité"
              >
                <option value="Public">Public</option>
                <option value="Interne">Interne</option>
                <option value="Confidentiel">Confidentiel</option>
                <option value="Secret">Secret</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du document..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
              aria-label="Description"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>ISO 15489:</strong> Norme internationale pour la gestion des documents d'archives.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 font-medium transition-all shadow-md"
              aria-label="Archiver le document"
            >
              Archiver le Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
