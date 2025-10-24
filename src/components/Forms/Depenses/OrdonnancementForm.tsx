import React from 'react';
import { FileSignature, X } from 'lucide-react';

interface OrdonnancementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrdonnancementData) => void;
}

export interface OrdonnancementData {
  reference: string;
  liquidationId: string;
  montantOrdonnance: number;
  dateOrdonnancement: string;
  ordonnateur: string;
  modeReglement: 'Virement' | 'Chèque' | 'Espèces';
  compteBancaire?: string;
  observations: string;
}

export default function OrdonnancementForm({
  isOpen,
  onClose,
  onSubmit
}: OrdonnancementFormProps) {
  const [formData, setFormData] = React.useState<OrdonnancementData>({
    reference: '',
    liquidationId: '',
    montantOrdonnance: 0,
    dateOrdonnancement: new Date().toISOString().split('T')[0],
    ordonnateur: '',
    modeReglement: 'Virement',
    compteBancaire: '',
    observations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      liquidationId: '',
      montantOrdonnance: 0,
      dateOrdonnancement: new Date().toISOString().split('T')[0],
      ordonnateur: '',
      modeReglement: 'Virement',
      compteBancaire: '',
      observations: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileSignature className="h-6 w-6 mr-2 text-purple-600" />
            Ordonnancement de Dépense (OHADA Phase 3)
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
                placeholder="Ex: ORD-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Référence d'ordonnancement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liquidation *
              </label>
              <select
                value={formData.liquidationId}
                onChange={(e) => setFormData({ ...formData, liquidationId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Liquidation"
              >
                <option value="">Sélectionner...</option>
                <option value="LIQ-001">LIQ-001 - Fournitures de bureau</option>
                <option value="LIQ-002">LIQ-002 - Prestations informatiques</option>
                <option value="LIQ-003">LIQ-003 - Travaux de rénovation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Ordonnancé (FCFA) *
              </label>
              <input
                type="number"
                value={formData.montantOrdonnance}
                onChange={(e) => setFormData({ ...formData, montantOrdonnance: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                min="0"
                aria-label="Montant ordonnancé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Ordonnancement *
              </label>
              <input
                type="date"
                value={formData.dateOrdonnancement}
                onChange={(e) => setFormData({ ...formData, dateOrdonnancement: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Date d'ordonnancement"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordonnateur *
            </label>
            <input
              type="text"
              value={formData.ordonnateur}
              onChange={(e) => setFormData({ ...formData, ordonnateur: e.target.value })}
              placeholder="Nom de l'ordonnateur"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              aria-label="Nom de l'ordonnateur"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de Règlement *
            </label>
            <select
              value={formData.modeReglement}
              onChange={(e) => setFormData({ ...formData, modeReglement: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              aria-label="Mode de règlement"
            >
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
              <option value="Espèces">Espèces</option>
            </select>
          </div>

          {(formData.modeReglement === 'Virement' || formData.modeReglement === 'Chèque') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compte Bancaire *
              </label>
              <select
                value={formData.compteBancaire}
                onChange={(e) => setFormData({ ...formData, compteBancaire: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Compte bancaire"
              >
                <option value="">Sélectionner...</option>
                <option value="512-001">512-001 - Banque Centrale du Congo</option>
                <option value="512-002">512-002 - Rawbank</option>
                <option value="512-003">512-003 - Equity Bank</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              placeholder="Observations sur l'ordonnancement..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA Phase 3:</strong> L'ordonnancement donne l'ordre de payer et désigne le mode de règlement.
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
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium transition-all shadow-md"
              aria-label="Ordonnancer la dépense"
            >
              Ordonnancer la Dépense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
