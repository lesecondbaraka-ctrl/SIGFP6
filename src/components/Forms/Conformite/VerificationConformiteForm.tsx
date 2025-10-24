import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface VerificationConformiteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VerificationConformiteData) => void;
}

export interface VerificationConformiteData {
  reference: string;
  typeVerification: 'Réglementaire' | 'Procédurale' | 'Documentaire';
  norme: string;
  entite: string;
  dateVerification: string;
  verificateur: string;
  resultat: 'Conforme' | 'Non conforme' | 'Partiellement conforme';
  observations: string;
}

export default function VerificationConformiteForm({
  isOpen,
  onClose,
  onSubmit
}: VerificationConformiteFormProps) {
  const [formData, setFormData] = React.useState<VerificationConformiteData>({
    reference: '',
    typeVerification: 'Réglementaire',
    norme: '',
    entite: '',
    dateVerification: new Date().toISOString().split('T')[0],
    verificateur: '',
    resultat: 'Conforme',
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
      typeVerification: 'Réglementaire',
      norme: '',
      entite: '',
      dateVerification: new Date().toISOString().split('T')[0],
      verificateur: '',
      resultat: 'Conforme',
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
            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
            Vérification de Conformité (ISO 19600)
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
                placeholder="Ex: CONF-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Référence de vérification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Vérification *
              </label>
              <select
                value={formData.typeVerification}
                onChange={(e) => setFormData({ ...formData, typeVerification: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Type de vérification"
              >
                <option value="Réglementaire">Réglementaire</option>
                <option value="Procédurale">Procédurale</option>
                <option value="Documentaire">Documentaire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Norme *
              </label>
              <select
                value={formData.norme}
                onChange={(e) => setFormData({ ...formData, norme: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Norme"
              >
                <option value="">Sélectionner...</option>
                <option value="IPSAS">IPSAS</option>
                <option value="SYSCOHADA">SYSCOHADA</option>
                <option value="ISO 19600">ISO 19600</option>
                <option value="COSO">COSO</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entité *
              </label>
              <input
                type="text"
                value={formData.entite}
                onChange={(e) => setFormData({ ...formData, entite: e.target.value })}
                placeholder="Nom de l'entité"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Nom de l'entité"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Vérification *
              </label>
              <input
                type="date"
                value={formData.dateVerification}
                onChange={(e) => setFormData({ ...formData, dateVerification: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Date de vérification"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vérificateur *
              </label>
              <input
                type="text"
                value={formData.verificateur}
                onChange={(e) => setFormData({ ...formData, verificateur: e.target.value })}
                placeholder="Nom du vérificateur"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
                aria-label="Nom du vérificateur"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Résultat *
            </label>
            <select
              value={formData.resultat}
              onChange={(e) => setFormData({ ...formData, resultat: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              aria-label="Résultat"
            >
              <option value="Conforme">Conforme</option>
              <option value="Partiellement conforme">Partiellement conforme</option>
              <option value="Non conforme">Non conforme</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations *
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={4}
              placeholder="Observations détaillées..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>ISO 19600:</strong> Système de management de la conformité pour garantir le respect des obligations.
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
              aria-label="Enregistrer la vérification"
            >
              Enregistrer la Vérification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
