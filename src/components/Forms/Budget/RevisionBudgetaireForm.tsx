import React from 'react';
import { RefreshCw, X } from 'lucide-react';

interface RevisionBudgetaireFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RevisionBudgetaireData) => void;
}

export interface RevisionBudgetaireData {
  reference: string;
  typeRevision: 'Augmentation' | 'Diminution' | 'Réaffectation';
  lignesBudgetaires: string[];
  montant: number;
  justification: string;
  documentsJustificatifs: string[];
  dateRevision: string;
}

export default function RevisionBudgetaireForm({
  isOpen,
  onClose,
  onSubmit
}: RevisionBudgetaireFormProps) {
  const [formData, setFormData] = React.useState<RevisionBudgetaireData>({
    reference: '',
    typeRevision: 'Augmentation',
    lignesBudgetaires: [''],
    montant: 0,
    justification: '',
    documentsJustificatifs: [''],
    dateRevision: new Date().toISOString().split('T')[0]
  });

  const addLigne = () => {
    setFormData({
      ...formData,
      lignesBudgetaires: [...formData.lignesBudgetaires, '']
    });
  };

  const removeLigne = (index: number) => {
    if (formData.lignesBudgetaires.length > 1) {
      setFormData({
        ...formData,
        lignesBudgetaires: formData.lignesBudgetaires.filter((_, i) => i !== index)
      });
    }
  };

  const updateLigne = (index: number, value: string) => {
    const newLignes = [...formData.lignesBudgetaires];
    newLignes[index] = value;
    setFormData({ ...formData, lignesBudgetaires: newLignes });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      typeRevision: 'Augmentation',
      lignesBudgetaires: [''],
      montant: 0,
      justification: '',
      documentsJustificatifs: [''],
      dateRevision: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <RefreshCw className="h-6 w-6 mr-2 text-purple-600" />
            Révision Budgétaire (IPSAS 24)
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
                placeholder="Ex: REV-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Référence de révision"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Révision *
              </label>
              <select
                value={formData.typeRevision}
                onChange={(e) => setFormData({ ...formData, typeRevision: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Type de révision"
              >
                <option value="Augmentation">Augmentation</option>
                <option value="Diminution">Diminution</option>
                <option value="Réaffectation">Réaffectation</option>
              </select>
            </div>
          </div>

          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Lignes Budgétaires Concernées</h4>
              <button
                type="button"
                onClick={addLigne}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                aria-label="Ajouter une ligne"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {formData.lignesBudgetaires.map((ligne, index) => (
                <div key={index} className="flex gap-2">
                  <select
                    value={ligne}
                    onChange={(e) => updateLigne(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                    aria-label={`Ligne budgétaire ${index + 1}`}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="6211">6211 - Salaires</option>
                    <option value="6241">6241 - Fournitures</option>
                    <option value="6251">6251 - Électricité</option>
                    <option value="6261">6261 - Transport</option>
                  </select>
                  {formData.lignesBudgetaires.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(index)}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label={`Supprimer ligne ${index + 1}`}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                min="0"
                aria-label="Montant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Révision *
              </label>
              <input
                type="date"
                value={formData.dateRevision}
                onChange={(e) => setFormData({ ...formData, dateRevision: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Date de révision"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification *
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={4}
              placeholder="Motifs et justification détaillée de la révision..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
              aria-label="Justification"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>IPSAS 24:</strong> Les révisions budgétaires nécessitent une approbation hiérarchique et une documentation complète.
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
              aria-label="Soumettre la révision budgétaire"
            >
              Soumettre la Révision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
