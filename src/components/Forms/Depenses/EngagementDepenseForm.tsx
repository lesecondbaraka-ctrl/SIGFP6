import React from 'react';
import { Target, X } from 'lucide-react';

interface EngagementDepenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EngagementDepenseData) => void;
}

export interface EngagementDepenseData {
  ligneBudgetaire: string;
  categorie: 'Personnel' | 'Fonctionnement' | 'Investissement' | 'Transfert';
  fournisseur: string;
  montant: number;
  objet: string;
  pieces: string[];
}

export default function EngagementDepenseForm({
  isOpen,
  onClose,
  onSubmit
}: EngagementDepenseFormProps) {
  const [formData, setFormData] = React.useState<EngagementDepenseData>({
    ligneBudgetaire: '',
    categorie: 'Fonctionnement',
    fournisseur: '',
    montant: 0,
    objet: '',
    pieces: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      ligneBudgetaire: '',
      categorie: 'Fonctionnement',
      fournisseur: '',
      montant: 0,
      objet: '',
      pieces: []
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Target className="h-6 w-6 mr-2 text-blue-600" />
            Nouvel Engagement de Dépense (Phase 1 OHADA)
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
                Ligne Budgétaire *
              </label>
              <select
                value={formData.ligneBudgetaire}
                onChange={(e) => setFormData({ ...formData, ligneBudgetaire: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-label="Ligne budgétaire"
                required
              >
                <option value="">Sélectionner...</option>
                <option value="6211">6211 - Salaires et traitements</option>
                <option value="6241">6241 - Fournitures de bureau</option>
                <option value="6251">6251 - Électricité</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-label="Catégorie"
                required
              >
                <option value="Personnel">Personnel</option>
                <option value="Fonctionnement">Fonctionnement</option>
                <option value="Investissement">Investissement</option>
                <option value="Transfert">Transfert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur *
            </label>
            <input
              type="text"
              value={formData.fournisseur}
              onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
              placeholder="Nom du fournisseur"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (FCFA) *
            </label>
            <input
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objet *
            </label>
            <textarea
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              rows={3}
              placeholder="Description de la dépense..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Contrôle OHADA Phase 1:</strong> Crédit disponible ≥ Montant. Réservation du crédit budgétaire.
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md"
              aria-label="Engager la dépense"
            >
              Engager la Dépense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
