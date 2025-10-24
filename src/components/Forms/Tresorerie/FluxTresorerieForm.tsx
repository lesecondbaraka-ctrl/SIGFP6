import React from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

interface FluxTresorerieFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FluxTresorerieData) => void;
}

export interface FluxTresorerieData {
  type: 'Encaissement' | 'Décaissement';
  categorie: 'Exploitation' | 'Investissement' | 'Financement';
  montant: number;
  date: string;
  reference: string;
  description: string;
}

export default function FluxTresorerieForm({
  isOpen,
  onClose,
  onSubmit
}: FluxTresorerieFormProps) {
  const [formData, setFormData] = React.useState<FluxTresorerieData>({
    type: 'Encaissement',
    categorie: 'Exploitation',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'Encaissement',
      categorie: 'Exploitation',
      montant: 0,
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            {formData.type === 'Encaissement' ? (
              <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 mr-2 text-red-600" />
            )}
            Flux de Trésorerie
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
                Type de Flux *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Encaissement' | 'Décaissement' })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                aria-label="Type de flux"
                required
              >
                <option value="Encaissement">Encaissement</option>
                <option value="Décaissement">Décaissement</option>
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
                <option value="Exploitation">Exploitation</option>
                <option value="Investissement">Investissement</option>
                <option value="Financement">Financement</option>
              </select>
            </div>
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
                aria-label="Montant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Date"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Référence *
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ex: FLX-2025-001"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Référence"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description du flux..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Description"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 2:</strong> Classification des flux selon les activités d'exploitation, d'investissement et de financement.
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
              aria-label="Enregistrer le flux de trésorerie"
            >
              Enregistrer le Flux
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
