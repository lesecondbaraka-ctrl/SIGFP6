import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface LiquidationRecetteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LiquidationRecetteData) => void;
}

export interface LiquidationRecetteData {
  reference: string;
  recetteConstateeId: string;
  montantLiquide: number;
  dateValidation: string;
  validateur: string;
  observations: string;
  pieceJustificative: string;
}

export default function LiquidationRecetteForm({
  isOpen,
  onClose,
  onSubmit
}: LiquidationRecetteFormProps) {
  const [formData, setFormData] = React.useState<LiquidationRecetteData>({
    reference: '',
    recetteConstateeId: '',
    montantLiquide: 0,
    dateValidation: new Date().toISOString().split('T')[0],
    validateur: '',
    observations: '',
    pieceJustificative: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      recetteConstateeId: '',
      montantLiquide: 0,
      dateValidation: new Date().toISOString().split('T')[0],
      validateur: '',
      observations: '',
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
            <CheckCircle2 className="h-6 w-6 mr-2 text-green-600" />
            Liquidation de Recette (OHADA Phase 2)
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
                placeholder="Ex: LIQ-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Référence de liquidation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recette Constatée *
              </label>
              <select
                value={formData.recetteConstateeId}
                onChange={(e) => setFormData({ ...formData, recetteConstateeId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Recette constatée"
              >
                <option value="">Sélectionner...</option>
                <option value="REC-001">REC-001 - Ventes marchandises</option>
                <option value="REC-002">REC-002 - Produits finis</option>
                <option value="REC-003">REC-003 - Subventions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Liquidé (FCFA) *
              </label>
              <input
                type="number"
                value={formData.montantLiquide}
                onChange={(e) => setFormData({ ...formData, montantLiquide: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                min="0"
                aria-label="Montant liquidé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Validation *
              </label>
              <input
                type="date"
                value={formData.dateValidation}
                onChange={(e) => setFormData({ ...formData, dateValidation: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Date de validation"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validateur *
            </label>
            <input
              type="text"
              value={formData.validateur}
              onChange={(e) => setFormData({ ...formData, validateur: e.target.value })}
              placeholder="Nom du validateur"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              aria-label="Nom du validateur"
            />
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              aria-label="Pièce justificative"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              placeholder="Observations sur la liquidation..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA Phase 2:</strong> La liquidation valide le montant exact à recouvrer après vérification des pièces justificatives.
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
              aria-label="Liquider la recette"
            >
              Liquider la Recette
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
