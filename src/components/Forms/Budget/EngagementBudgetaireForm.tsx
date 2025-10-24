import React from 'react';
import { Lock, X } from 'lucide-react';

interface EngagementBudgetaireFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EngagementBudgetaireData) => void;
}

export interface EngagementBudgetaireData {
  reference: string;
  ligneBudgetaire: string;
  montantEngage: number;
  beneficiaire: string;
  objet: string;
  dateEngagement: string;
  dateEcheance: string;
  pieceJustificative: string;
}

export default function EngagementBudgetaireForm({
  isOpen,
  onClose,
  onSubmit
}: EngagementBudgetaireFormProps) {
  const [formData, setFormData] = React.useState<EngagementBudgetaireData>({
    reference: '',
    ligneBudgetaire: '',
    montantEngage: 0,
    beneficiaire: '',
    objet: '',
    dateEngagement: new Date().toISOString().split('T')[0],
    dateEcheance: '',
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
      ligneBudgetaire: '',
      montantEngage: 0,
      beneficiaire: '',
      objet: '',
      dateEngagement: new Date().toISOString().split('T')[0],
      dateEcheance: '',
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
            <Lock className="h-6 w-6 mr-2 text-indigo-600" />
            Engagement Budgétaire (IPSAS 24)
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
                placeholder="Ex: ENG-BUD-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Référence d'engagement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ligne Budgétaire *
              </label>
              <select
                value={formData.ligneBudgetaire}
                onChange={(e) => setFormData({ ...formData, ligneBudgetaire: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Ligne budgétaire"
              >
                <option value="">Sélectionner...</option>
                <option value="6211">6211 - Salaires</option>
                <option value="6241">6241 - Fournitures</option>
                <option value="6251">6251 - Électricité</option>
                <option value="6261">6261 - Transport</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant Engagé (FCFA) *
            </label>
            <input
              type="number"
              value={formData.montantEngage}
              onChange={(e) => setFormData({ ...formData, montantEngage: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              min="0"
              aria-label="Montant engagé"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bénéficiaire *
            </label>
            <input
              type="text"
              value={formData.beneficiaire}
              onChange={(e) => setFormData({ ...formData, beneficiaire: e.target.value })}
              placeholder="Nom du bénéficiaire"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Nom du bénéficiaire"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objet de l'Engagement *
            </label>
            <textarea
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              rows={3}
              placeholder="Description de l'objet de l'engagement..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Objet de l'engagement"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Engagement *
              </label>
              <input
                type="date"
                value={formData.dateEngagement}
                onChange={(e) => setFormData({ ...formData, dateEngagement: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Date d'engagement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Échéance *
              </label>
              <input
                type="date"
                value={formData.dateEcheance}
                onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Date d'échéance"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Pièce justificative"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 24:</strong> L'engagement budgétaire réserve les crédits et réduit le disponible de la ligne budgétaire.
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
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium transition-all shadow-md"
              aria-label="Créer l'engagement budgétaire"
            >
              Créer l'Engagement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
