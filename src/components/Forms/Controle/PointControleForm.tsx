import React from 'react';
import { Shield, X } from 'lucide-react';

interface PointControleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PointControleData) => void;
}

export interface PointControleData {
  reference: string;
  typeControle: 'Préventif' | 'Détectif' | 'Correctif';
  domaine: string;
  description: string;
  frequence: 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Trimestriel' | 'Annuel';
  responsable: string;
  niveauRisque: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  dateCreation: string;
}

export default function PointControleForm({
  isOpen,
  onClose,
  onSubmit
}: PointControleFormProps) {
  const [formData, setFormData] = React.useState<PointControleData>({
    reference: '',
    typeControle: 'Préventif',
    domaine: '',
    description: '',
    frequence: 'Mensuel',
    responsable: '',
    niveauRisque: 'Moyen',
    dateCreation: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      typeControle: 'Préventif',
      domaine: '',
      description: '',
      frequence: 'Mensuel',
      responsable: '',
      niveauRisque: 'Moyen',
      dateCreation: new Date().toISOString().split('T')[0]
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Point de Contrôle Interne (COSO)
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
                placeholder="Ex: CTRL-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Référence du point de contrôle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Contrôle *
              </label>
              <select
                value={formData.typeControle}
                onChange={(e) => setFormData({ ...formData, typeControle: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Type de contrôle"
              >
                <option value="Préventif">Préventif</option>
                <option value="Détectif">Détectif</option>
                <option value="Correctif">Correctif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaine *
            </label>
            <select
              value={formData.domaine}
              onChange={(e) => setFormData({ ...formData, domaine: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Domaine"
            >
              <option value="">Sélectionner...</option>
              <option value="Budget">Budget</option>
              <option value="Recettes">Recettes</option>
              <option value="Dépenses">Dépenses</option>
              <option value="Trésorerie">Trésorerie</option>
              <option value="Comptabilité">Comptabilité</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Description détaillée du point de contrôle..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fréquence *
              </label>
              <select
                value={formData.frequence}
                onChange={(e) => setFormData({ ...formData, frequence: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Fréquence"
              >
                <option value="Quotidien">Quotidien</option>
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Mensuel">Mensuel</option>
                <option value="Trimestriel">Trimestriel</option>
                <option value="Annuel">Annuel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de Risque *
              </label>
              <select
                value={formData.niveauRisque}
                onChange={(e) => setFormData({ ...formData, niveauRisque: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Niveau de risque"
              >
                <option value="Faible">Faible</option>
                <option value="Moyen">Moyen</option>
                <option value="Élevé">Élevé</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsable *
            </label>
            <input
              type="text"
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              placeholder="Nom du responsable"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Nom du responsable"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>COSO Framework:</strong> Les points de contrôle interne assurent la maîtrise des risques et la conformité aux procédures.
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
              aria-label="Créer le point de contrôle"
            >
              Créer le Point de Contrôle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
