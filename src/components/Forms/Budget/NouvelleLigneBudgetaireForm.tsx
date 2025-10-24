import React from 'react';
import { Plus, X } from 'lucide-react';

interface NouvelleLigneBudgetaireFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LigneBudgetaireData) => void;
  initialData?: Partial<LigneBudgetaireData>;
}

export interface LigneBudgetaireData {
  code: string;
  libelle: string;
  budgetInitial: number;
  categorie: 'Fonctionnement' | 'Personnel' | 'Investissement' | 'Transfert';
  entite: string;
}

export default function NouvelleLigneBudgetaireForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = {}
}: NouvelleLigneBudgetaireFormProps) {
  const [formData, setFormData] = React.useState<LigneBudgetaireData>({
    code: initialData.code || '',
    libelle: initialData.libelle || '',
    budgetInitial: initialData.budgetInitial || 0,
    categorie: initialData.categorie || 'Fonctionnement',
    entite: initialData.entite || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      code: '',
      libelle: '',
      budgetInitial: 0,
      categorie: 'Fonctionnement',
      entite: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Plus className="h-6 w-6 mr-2 text-green-600" />
            Nouvelle Ligne Budgétaire
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
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: 6211"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                aria-label="Catégorie budgétaire"
                required
              >
                <option value="Fonctionnement">Fonctionnement</option>
                <option value="Personnel">Personnel</option>
                <option value="Investissement">Investissement</option>
                <option value="Transfert">Transfert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé *
            </label>
            <input
              type="text"
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              placeholder="Description de la ligne budgétaire"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Initial (FCFA) *
              </label>
              <input
                type="number"
                value={formData.budgetInitial}
                onChange={(e) => setFormData({ ...formData, budgetInitial: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entité *
              </label>
              <input
                type="text"
                value={formData.entite}
                onChange={(e) => setFormData({ ...formData, entite: e.target.value })}
                placeholder="Ex: MIN-BUDGET"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 24:</strong> Nomenclature budgétaire conforme au plan comptable.
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
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all shadow-md"
              aria-label="Créer la ligne budgétaire"
            >
              Créer la Ligne
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
