import React from 'react';
import { FileCheck, X } from 'lucide-react';

interface LiquidationDepenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LiquidationDepenseData) => void;
}

export interface LiquidationDepenseData {
  reference: string;
  engagementId: string;
  montantLiquide: number;
  dateService: string;
  certificatService: string;
  facture: string;
  liquidateur: string;
  observations: string;
}

export default function LiquidationDepenseForm({
  isOpen,
  onClose,
  onSubmit
}: LiquidationDepenseFormProps) {
  const [formData, setFormData] = React.useState<LiquidationDepenseData>({
    reference: '',
    engagementId: '',
    montantLiquide: 0,
    dateService: new Date().toISOString().split('T')[0],
    certificatService: '',
    facture: '',
    liquidateur: '',
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
      engagementId: '',
      montantLiquide: 0,
      dateService: new Date().toISOString().split('T')[0],
      certificatService: '',
      facture: '',
      liquidateur: '',
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
            <FileCheck className="h-6 w-6 mr-2 text-orange-600" />
            Liquidation de Dépense (OHADA Phase 2)
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
                aria-label="Référence de liquidation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engagement *
              </label>
              <select
                value={formData.engagementId}
                onChange={(e) => setFormData({ ...formData, engagementId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
                aria-label="Engagement"
              >
                <option value="">Sélectionner...</option>
                <option value="ENG-001">ENG-001 - Fournitures de bureau</option>
                <option value="ENG-002">ENG-002 - Prestations informatiques</option>
                <option value="ENG-003">ENG-003 - Travaux de rénovation</option>
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
                min="0"
                aria-label="Montant liquidé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date du Service Fait *
              </label>
              <input
                type="date"
                value={formData.dateService}
                onChange={(e) => setFormData({ ...formData, dateService: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
                aria-label="Date du service fait"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificat de Service Fait *
            </label>
            <input
              type="text"
              value={formData.certificatService}
              onChange={(e) => setFormData({ ...formData, certificatService: e.target.value })}
              placeholder="Référence du certificat"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
              aria-label="Certificat de service fait"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facture *
            </label>
            <input
              type="text"
              value={formData.facture}
              onChange={(e) => setFormData({ ...formData, facture: e.target.value })}
              placeholder="Numéro de facture"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
              aria-label="Numéro de facture"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liquidateur *
            </label>
            <input
              type="text"
              value={formData.liquidateur}
              onChange={(e) => setFormData({ ...formData, liquidateur: e.target.value })}
              placeholder="Nom du liquidateur"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
              aria-label="Nom du liquidateur"
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA Phase 2:</strong> La liquidation vérifie le service fait et certifie le montant exact à payer.
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
              aria-label="Liquider la dépense"
            >
              Liquider la Dépense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
