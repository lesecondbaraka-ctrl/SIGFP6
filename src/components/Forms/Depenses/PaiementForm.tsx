import React from 'react';
import { Banknote, X } from 'lucide-react';

interface PaiementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaiementData) => void;
}

export interface PaiementData {
  reference: string;
  ordonnancementId: string;
  montantPaye: number;
  datePaiement: string;
  modePaiement: 'Virement' | 'Chèque' | 'Espèces';
  numeroPiece: string;
  beneficiaire: string;
  compteBeneficiaire?: string;
  observations: string;
}

export default function PaiementForm({
  isOpen,
  onClose,
  onSubmit
}: PaiementFormProps) {
  const [formData, setFormData] = React.useState<PaiementData>({
    reference: '',
    ordonnancementId: '',
    montantPaye: 0,
    datePaiement: new Date().toISOString().split('T')[0],
    modePaiement: 'Virement',
    numeroPiece: '',
    beneficiaire: '',
    compteBeneficiaire: '',
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
      ordonnancementId: '',
      montantPaye: 0,
      datePaiement: new Date().toISOString().split('T')[0],
      modePaiement: 'Virement',
      numeroPiece: '',
      beneficiaire: '',
      compteBeneficiaire: '',
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
            <Banknote className="h-6 w-6 mr-2 text-green-600" />
            Paiement de Dépense (OHADA Phase 4)
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
                placeholder="Ex: PAY-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Référence de paiement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordonnancement *
              </label>
              <select
                value={formData.ordonnancementId}
                onChange={(e) => setFormData({ ...formData, ordonnancementId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Ordonnancement"
              >
                <option value="">Sélectionner...</option>
                <option value="ORD-001">ORD-001 - Fournitures de bureau</option>
                <option value="ORD-002">ORD-002 - Prestations informatiques</option>
                <option value="ORD-003">ORD-003 - Travaux de rénovation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant Payé (FCFA) *
              </label>
              <input
                type="number"
                value={formData.montantPaye}
                onChange={(e) => setFormData({ ...formData, montantPaye: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                min="0"
                aria-label="Montant payé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Paiement *
              </label>
              <input
                type="date"
                value={formData.datePaiement}
                onChange={(e) => setFormData({ ...formData, datePaiement: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Date de paiement"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de Paiement *
              </label>
              <select
                value={formData.modePaiement}
                onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Mode de paiement"
              >
                <option value="Virement">Virement bancaire</option>
                <option value="Chèque">Chèque</option>
                <option value="Espèces">Espèces</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Pièce *
              </label>
              <input
                type="text"
                value={formData.numeroPiece}
                onChange={(e) => setFormData({ ...formData, numeroPiece: e.target.value })}
                placeholder="N° chèque ou référence virement"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Numéro de pièce"
              />
            </div>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              aria-label="Nom du bénéficiaire"
            />
          </div>

          {formData.modePaiement === 'Virement' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compte Bénéficiaire *
              </label>
              <input
                type="text"
                value={formData.compteBeneficiaire}
                onChange={(e) => setFormData({ ...formData, compteBeneficiaire: e.target.value })}
                placeholder="IBAN ou numéro de compte"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Compte bénéficiaire"
              />
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
              placeholder="Observations sur le paiement..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA Phase 4:</strong> Le paiement concrétise la sortie effective des fonds et clôture le cycle de la dépense.
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
              aria-label="Effectuer le paiement"
            >
              Effectuer le Paiement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
