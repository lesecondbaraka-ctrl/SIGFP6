import React from 'react';
import { Calendar, X } from 'lucide-react';

interface PrevisionMensuelleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PrevisionMensuelleData) => void;
  taux: number;
}

export interface PrevisionMensuelleData {
  mois: string;
  recettesCDF: number;
  recettesUSD: number;
  depensesCDF: number;
  depensesUSD: number;
  tauxChange: number;
}

export default function PrevisionMensuelleForm({
  isOpen,
  onClose,
  onSubmit,
  taux
}: PrevisionMensuelleFormProps) {
  const [formData, setFormData] = React.useState<PrevisionMensuelleData>({
    mois: '',
    recettesCDF: 0,
    recettesUSD: 0,
    depensesCDF: 0,
    depensesUSD: 0,
    tauxChange: taux
  });

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, tauxChange: taux }));
  }, [taux]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      mois: '',
      recettesCDF: 0,
      recettesUSD: 0,
      depensesCDF: 0,
      depensesUSD: 0,
      tauxChange: taux
    });
    onClose();
  };

  if (!isOpen) return null;

  const totalRecettesCDF = formData.recettesCDF + (formData.recettesUSD * formData.tauxChange);
  const totalDepensesCDF = formData.depensesCDF + (formData.depensesUSD * formData.tauxChange);
  const solde = totalRecettesCDF - totalDepensesCDF;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-purple-600" />
            Prévision Mensuelle
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois *
            </label>
            <input
              type="month"
              value={formData.mois}
              onChange={(e) => setFormData({ ...formData, mois: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              aria-label="Mois"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recettes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-green-700 border-b-2 border-green-200 pb-2">
                Recettes Prévues
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant CDF *
                </label>
                <input
                  type="number"
                  value={formData.recettesCDF}
                  onChange={(e) => setFormData({ ...formData, recettesCDF: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                  aria-label="Recettes en CDF"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant USD *
                </label>
                <input
                  type="number"
                  value={formData.recettesUSD}
                  onChange={(e) => setFormData({ ...formData, recettesUSD: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                  aria-label="Recettes en USD"
                />
              </div>
            </div>

            {/* Dépenses */}
            <div className="space-y-4">
              <h4 className="font-semibold text-red-700 border-b-2 border-red-200 pb-2">
                Dépenses Prévues
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant CDF *
                </label>
                <input
                  type="number"
                  value={formData.depensesCDF}
                  onChange={(e) => setFormData({ ...formData, depensesCDF: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                  min="0"
                  aria-label="Dépenses en CDF"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant USD *
                </label>
                <input
                  type="number"
                  value={formData.depensesUSD}
                  onChange={(e) => setFormData({ ...formData, depensesUSD: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                  min="0"
                  aria-label="Dépenses en USD"
                />
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3">Récapitulatif (en CDF)</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Recettes</p>
                <p className="text-lg font-bold text-green-700">
                  {totalRecettesCDF.toLocaleString()} CDF
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Dépenses</p>
                <p className="text-lg font-bold text-red-700">
                  {totalDepensesCDF.toLocaleString()} CDF
                </p>
              </div>
              <div>
                <p className="text-gray-600">Solde Prévisionnel</p>
                <p className={`text-lg font-bold ${solde >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {solde.toLocaleString()} CDF
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Taux de change: 1 USD = {taux.toLocaleString()} CDF
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 24:</strong> Prévisions budgétaires mensuelles pour le suivi de l'exécution.
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
              aria-label="Enregistrer la prévision mensuelle"
            >
              Enregistrer la Prévision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
