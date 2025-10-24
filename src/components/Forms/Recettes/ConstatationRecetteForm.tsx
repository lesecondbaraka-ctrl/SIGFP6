import React from 'react';
import { FileText, X } from 'lucide-react';

interface ConstatationRecetteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConstatationRecetteData) => void;
}

export interface ConstatationRecetteData {
  type: 'Fiscale' | 'Non-Fiscale' | 'Exceptionnelle';
  libelle: string;
  montant: number;
  debiteur: string;
  dateConstatation: string;
  pieceJustificative: string;
}

export default function ConstatationRecetteForm({
  isOpen,
  onClose,
  onSubmit
}: ConstatationRecetteFormProps) {
  const [formData, setFormData] = React.useState<ConstatationRecetteData>({
    type: 'Fiscale',
    libelle: '',
    montant: 0,
    debiteur: '',
    dateConstatation: new Date().toISOString().split('T')[0],
    pieceJustificative: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'Fiscale',
      libelle: '',
      montant: 0,
      debiteur: '',
      dateConstatation: new Date().toISOString().split('T')[0],
      pieceJustificative: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Constatation de Recette (Phase 1 OHADA)
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
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-label="Type de recette"
                required
              >
                <option value="Fiscale">Fiscale</option>
                <option value="Non-Fiscale">Non-Fiscale</option>
                <option value="Exceptionnelle">Exceptionnelle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Constatation *
              </label>
              <input
                type="date"
                value={formData.dateConstatation}
                onChange={(e) => setFormData({ ...formData, dateConstatation: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
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
              placeholder="Ex: Impôt sur les sociétés T1 2025"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Débiteur *
              </label>
              <input
                type="text"
                value={formData.debiteur}
                onChange={(e) => setFormData({ ...formData, debiteur: e.target.value })}
                placeholder="Nom du débiteur"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pièce Justificative *
            </label>
            <input
              type="text"
              value={formData.pieceJustificative}
              onChange={(e) => setFormData({ ...formData, pieceJustificative: e.target.value })}
              placeholder="Référence de la pièce justificative"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 23 + OHADA:</strong> La constatation est la reconnaissance d'un droit acquis. Pièce justificative obligatoire.
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
              aria-label="Constater la recette"
            >
              Constater la Recette
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
