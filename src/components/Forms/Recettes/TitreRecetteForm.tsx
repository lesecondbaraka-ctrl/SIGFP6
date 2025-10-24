import React from 'react';
import { FileText, X } from 'lucide-react';

interface TitreRecetteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TitreRecetteData) => void;
}

export interface TitreRecetteData {
  numeroTitre: string;
  natureTitre: 'Titre de perception' | 'Ordre de recette' | 'Avis de crédit';
  debiteur: string;
  montant: number;
  dateEmission: string;
  dateEcheance: string;
  objet: string;
  fondementJuridique: string;
  observations: string;
}

export default function TitreRecetteForm({
  isOpen,
  onClose,
  onSubmit
}: TitreRecetteFormProps) {
  const [formData, setFormData] = React.useState<TitreRecetteData>({
    numeroTitre: '',
    natureTitre: 'Titre de perception',
    debiteur: '',
    montant: 0,
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    objet: '',
    fondementJuridique: '',
    observations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      numeroTitre: '',
      natureTitre: 'Titre de perception',
      debiteur: '',
      montant: 0,
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      objet: '',
      fondementJuridique: '',
      observations: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-indigo-600" />
            Émission de Titre de Recette (OHADA)
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
                Numéro du Titre *
              </label>
              <input
                type="text"
                value={formData.numeroTitre}
                onChange={(e) => setFormData({ ...formData, numeroTitre: e.target.value })}
                placeholder="Ex: TR-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Numéro du titre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nature du Titre *
              </label>
              <select
                value={formData.natureTitre}
                onChange={(e) => setFormData({ ...formData, natureTitre: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Nature du titre"
              >
                <option value="Titre de perception">Titre de perception</option>
                <option value="Ordre de recette">Ordre de recette</option>
                <option value="Avis de crédit">Avis de crédit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Débiteur *
            </label>
            <input
              type="text"
              value={formData.debiteur}
              onChange={(e) => setFormData({ ...formData, debiteur: e.target.value })}
              placeholder="Nom du débiteur ou de l'entité"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Nom du débiteur"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                min="0"
                aria-label="Montant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Émission *
              </label>
              <input
                type="date"
                value={formData.dateEmission}
                onChange={(e) => setFormData({ ...formData, dateEmission: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Date d'émission"
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
              Objet du Titre *
            </label>
            <textarea
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              rows={2}
              placeholder="Description de l'objet du titre..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Objet du titre"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fondement Juridique *
            </label>
            <input
              type="text"
              value={formData.fondementJuridique}
              onChange={(e) => setFormData({ ...formData, fondementJuridique: e.target.value })}
              placeholder="Ex: Article 45 de la Loi n°XXX, Décret n°YYY..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Fondement juridique"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={2}
              placeholder="Observations complémentaires..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA:</strong> Le titre de recette est un document officiel qui constate une créance de l'organisme public et ordonne son recouvrement.
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
              aria-label="Émettre le titre de recette"
            >
              Émettre le Titre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
