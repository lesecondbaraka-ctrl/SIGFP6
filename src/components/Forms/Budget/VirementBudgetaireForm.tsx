import React from 'react';
import { ArrowRightLeft, X } from 'lucide-react';

interface VirementBudgetaireFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VirementBudgetaireData) => void;
}

export interface VirementBudgetaireData {
  ligneSource: string;
  ligneDestination: string;
  montant: number;
  justification: string;
}

export default function VirementBudgetaireForm({
  isOpen,
  onClose,
  onSubmit
}: VirementBudgetaireFormProps) {
  const [formData, setFormData] = React.useState<VirementBudgetaireData>({
    ligneSource: '',
    ligneDestination: '',
    montant: 0,
    justification: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ ligneSource: '', ligneDestination: '', montant: 0, justification: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowRightLeft className="h-6 w-6 mr-2 text-orange-600" />
            Virement Budgétaire
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
                Ligne Source *
              </label>
              <select
                value={formData.ligneSource}
                onChange={(e) => setFormData({ ...formData, ligneSource: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                aria-label="Ligne source"
                required
              >
                <option value="">Sélectionner...</option>
                <option value="6211">6211 - Salaires</option>
                <option value="6241">6241 - Fournitures</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ligne Destination *
              </label>
              <select
                value={formData.ligneDestination}
                onChange={(e) => setFormData({ ...formData, ligneDestination: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                aria-label="Ligne destination"
                required
              >
                <option value="">Sélectionner...</option>
                <option value="6251">6251 - Électricité</option>
                <option value="6261">6261 - Transport</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (FCFA) *
            </label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification *
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={3}
              placeholder="Motif du virement..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 24:</strong> Workflow d'approbation requis pour les virements budgétaires.
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
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium transition-all shadow-md"
              aria-label="Créer le virement budgétaire"
            >
              Créer le Virement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
