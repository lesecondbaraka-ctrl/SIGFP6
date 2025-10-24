import React from 'react';
import { Wallet, X } from 'lucide-react';

interface EncaissementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EncaissementData) => void;
}

export interface EncaissementData {
  reference: string;
  recetteLiquideId: string;
  montantEncaisse: number;
  dateEncaissement: string;
  modeEncaissement: 'Espèces' | 'Chèque' | 'Virement' | 'Carte bancaire';
  numeroRecu: string;
  compteBancaire?: string;
  observations: string;
}

export default function EncaissementForm({
  isOpen,
  onClose,
  onSubmit
}: EncaissementFormProps) {
  const [formData, setFormData] = React.useState<EncaissementData>({
    reference: '',
    recetteLiquideId: '',
    montantEncaisse: 0,
    dateEncaissement: new Date().toISOString().split('T')[0],
    modeEncaissement: 'Virement',
    numeroRecu: '',
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
      recetteLiquideId: '',
      montantEncaisse: 0,
      dateEncaissement: new Date().toISOString().split('T')[0],
      modeEncaissement: 'Virement',
      numeroRecu: '',
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
            <Wallet className="h-6 w-6 mr-2 text-emerald-600" />
            Encaissement de Recette (OHADA Phase 3)
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
                placeholder="Ex: ENC-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Référence d'encaissement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recette Liquidée *
              </label>
              <select
                value={formData.recetteLiquideId}
                onChange={(e) => setFormData({ ...formData, recetteLiquideId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Recette liquidée"
              >
                <option value="">Sélectionner...</option>
                <option value="LIQ-001">LIQ-001 - Ventes marchandises</option>
                <option value="LIQ-002">LIQ-002 - Produits finis</option>
                <option value="LIQ-003">LIQ-003 - Subventions</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Encaissé (FCFA) *
              </label>
              <input
                type="number"
                value={formData.montantEncaisse}
                onChange={(e) => setFormData({ ...formData, montantEncaisse: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                min="0"
                aria-label="Montant encaissé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Encaissement *
              </label>
              <input
                type="date"
                value={formData.dateEncaissement}
                onChange={(e) => setFormData({ ...formData, dateEncaissement: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Date d'encaissement"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode d'Encaissement *
              </label>
              <select
                value={formData.modeEncaissement}
                onChange={(e) => setFormData({ ...formData, modeEncaissement: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Mode d'encaissement"
              >
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Carte bancaire">Carte bancaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Reçu *
              </label>
              <input
                type="text"
                value={formData.numeroRecu}
                onChange={(e) => setFormData({ ...formData, numeroRecu: e.target.value })}
                placeholder="Ex: REC-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Numéro de reçu"
              />
            </div>
          </div>

          {(formData.modeEncaissement === 'Virement' || formData.modeEncaissement === 'Chèque') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compte Bancaire *
              </label>
              <select
                value={formData.compteBancaire}
                onChange={(e) => setFormData({ ...formData, compteBancaire: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
                aria-label="Compte bancaire"
              >
                <option value="">Sélectionner...</option>
                <option value="512-001">512-001 - Banque Centrale du Congo</option>
                <option value="512-002">512-002 - Rawbank</option>
                <option value="512-003">512-003 - Equity Bank</option>
                <option value="531-001">531-001 - Caisse principale</option>
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
              placeholder="Observations sur l'encaissement..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA Phase 3:</strong> L'encaissement concrétise l'entrée effective des fonds dans la caisse ou le compte bancaire.
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
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 font-medium transition-all shadow-md"
              aria-label="Enregistrer l'encaissement"
            >
              Enregistrer l'Encaissement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
