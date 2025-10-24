import React from 'react';
import { Building2, X } from 'lucide-react';

interface RapprochementBancaireFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RapprochementBancaireData) => void;
}

export interface RapprochementBancaireData {
  compteBancaire: string;
  soldeReleve: number;
  soldeComptable: number;
  ecarts: number;
  dateReleve: string;
}

export default function RapprochementBancaireForm({
  isOpen,
  onClose,
  onSubmit
}: RapprochementBancaireFormProps) {
  const [formData, setFormData] = React.useState<RapprochementBancaireData>({
    compteBancaire: '',
    soldeReleve: 0,
    soldeComptable: 0,
    ecarts: 0,
    dateReleve: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    const ecart = formData.soldeReleve - formData.soldeComptable;
    setFormData(prev => ({ ...prev, ecarts: ecart }));
  }, [formData.soldeReleve, formData.soldeComptable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      compteBancaire: '',
      soldeReleve: 0,
      soldeComptable: 0,
      ecarts: 0,
      dateReleve: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  if (!isOpen) return null;

  const isEquilibre = Math.abs(formData.ecarts) < 0.01;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-indigo-600" />
            Rapprochement Bancaire
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
              Compte Bancaire *
            </label>
            <select
              value={formData.compteBancaire}
              onChange={(e) => setFormData({ ...formData, compteBancaire: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Compte bancaire"
            >
              <option value="">Sélectionner un compte...</option>
              <option value="512-001">512-001 - Banque Centrale du Congo</option>
              <option value="512-002">512-002 - Rawbank</option>
              <option value="512-003">512-003 - Equity Bank</option>
              <option value="512-004">512-004 - TMB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date du Relevé *
            </label>
            <input
              type="date"
              value={formData.dateReleve}
              onChange={(e) => setFormData({ ...formData, dateReleve: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Date du relevé"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solde Relevé Bancaire (FCFA) *
              </label>
              <input
                type="number"
                value={formData.soldeReleve}
                onChange={(e) => setFormData({ ...formData, soldeReleve: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                step="0.01"
                aria-label="Solde relevé bancaire"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solde Comptable (FCFA) *
              </label>
              <input
                type="number"
                value={formData.soldeComptable}
                onChange={(e) => setFormData({ ...formData, soldeComptable: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                step="0.01"
                aria-label="Solde comptable"
              />
            </div>
          </div>

          {/* Résultat du rapprochement */}
          <div className={`p-4 rounded-lg border-2 ${
            isEquilibre 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Résultat du Rapprochement</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                isEquilibre 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {isEquilibre ? '✓ Équilibré' : '⚠ Écart détecté'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Solde Relevé</p>
                <p className="text-lg font-bold text-blue-700">
                  {formData.soldeReleve.toLocaleString()} CDF
                </p>
              </div>
              <div>
                <p className="text-gray-600">Solde Comptable</p>
                <p className="text-lg font-bold text-purple-700">
                  {formData.soldeComptable.toLocaleString()} CDF
                </p>
              </div>
              <div>
                <p className="text-gray-600">Écart</p>
                <p className={`text-lg font-bold ${
                  isEquilibre ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {formData.ecarts.toLocaleString()} CDF
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>SYSCOHADA:</strong> Le rapprochement bancaire doit être effectué mensuellement pour garantir la fiabilité des comptes.
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
              aria-label="Enregistrer le rapprochement bancaire"
            >
              Enregistrer le Rapprochement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
