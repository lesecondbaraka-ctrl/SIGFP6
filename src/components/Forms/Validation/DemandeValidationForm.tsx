import React from 'react';
import { CheckSquare, X } from 'lucide-react';

interface DemandeValidationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DemandeValidationData) => void;
}

export interface DemandeValidationData {
  reference: string;
  typeDocument: string;
  module: string;
  demandeur: string;
  priorite: 'Normale' | 'Urgente' | 'Critique';
  description: string;
  pieceJointe: string;
  dateCreation: string;
}

export default function DemandeValidationForm({
  isOpen,
  onClose,
  onSubmit
}: DemandeValidationFormProps) {
  const [formData, setFormData] = React.useState<DemandeValidationData>({
    reference: '',
    typeDocument: '',
    module: '',
    demandeur: '',
    priorite: 'Normale',
    description: '',
    pieceJointe: '',
    dateCreation: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      typeDocument: '',
      module: '',
      demandeur: '',
      priorite: 'Normale',
      description: '',
      pieceJointe: '',
      dateCreation: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="h-6 w-6 mr-2 text-teal-600" />
            Demande de Validation Numérique
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
                placeholder="Ex: VAL-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
                aria-label="Référence de validation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Document *
              </label>
              <select
                value={formData.typeDocument}
                onChange={(e) => setFormData({ ...formData, typeDocument: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
                aria-label="Type de document"
              >
                <option value="">Sélectionner...</option>
                <option value="Engagement">Engagement</option>
                <option value="Bon de commande">Bon de commande</option>
                <option value="Facture">Facture</option>
                <option value="Ordonnancement">Ordonnancement</option>
                <option value="Virement">Virement budgétaire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Module *
              </label>
              <select
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
                aria-label="Module"
              >
                <option value="">Sélectionner...</option>
                <option value="Budget">Budget</option>
                <option value="Dépenses">Dépenses</option>
                <option value="Recettes">Recettes</option>
                <option value="Trésorerie">Trésorerie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité *
              </label>
              <select
                value={formData.priorite}
                onChange={(e) => setFormData({ ...formData, priorite: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                required
                aria-label="Priorité"
              >
                <option value="Normale">Normale</option>
                <option value="Urgente">Urgente</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Demandeur *
            </label>
            <input
              type="text"
              value={formData.demandeur}
              onChange={(e) => setFormData({ ...formData, demandeur: e.target.value })}
              placeholder="Nom du demandeur"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
              aria-label="Nom du demandeur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description de la demande..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
              aria-label="Description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pièce Jointe
            </label>
            <input
              type="text"
              value={formData.pieceJointe}
              onChange={(e) => setFormData({ ...formData, pieceJointe: e.target.value })}
              placeholder="Référence ou lien du document"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              aria-label="Pièce jointe"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Workflow:</strong> La demande sera soumise au circuit de validation hiérarchique.
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
              className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-700 hover:to-teal-800 font-medium transition-all shadow-md"
              aria-label="Soumettre la demande"
            >
              Soumettre la Demande
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
