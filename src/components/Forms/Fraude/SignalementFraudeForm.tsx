import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface SignalementFraudeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SignalementFraudeData) => void;
}

export interface SignalementFraudeData {
  reference: string;
  typeFraude: 'Détournement' | 'Falsification' | 'Corruption' | 'Conflit d\'intérêt' | 'Autre';
  gravite: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
  dateIncident: string;
  lieu: string;
  personnesImpliquees: string;
  montantEstime?: number;
  description: string;
  preuves: string;
  anonyme: boolean;
}

export default function SignalementFraudeForm({
  isOpen,
  onClose,
  onSubmit
}: SignalementFraudeFormProps) {
  const [formData, setFormData] = React.useState<SignalementFraudeData>({
    reference: '',
    typeFraude: 'Détournement',
    gravite: 'Moyenne',
    dateIncident: new Date().toISOString().split('T')[0],
    lieu: '',
    personnesImpliquees: '',
    montantEstime: 0,
    description: '',
    preuves: '',
    anonyme: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      typeFraude: 'Détournement',
      gravite: 'Moyenne',
      dateIncident: new Date().toISOString().split('T')[0],
      lieu: '',
      personnesImpliquees: '',
      montantEstime: 0,
      description: '',
      preuves: '',
      anonyme: false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
            Signalement de Fraude
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

        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
          <p className="text-sm text-red-800">
            <strong>Confidentialité:</strong> Ce signalement sera traité de manière confidentielle. Vous pouvez choisir de rester anonyme.
          </p>
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
                placeholder="Ex: FRAUD-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                aria-label="Référence du signalement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Fraude *
              </label>
              <select
                value={formData.typeFraude}
                onChange={(e) => setFormData({ ...formData, typeFraude: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                aria-label="Type de fraude"
              >
                <option value="Détournement">Détournement de fonds</option>
                <option value="Falsification">Falsification de documents</option>
                <option value="Corruption">Corruption</option>
                <option value="Conflit d'intérêt">Conflit d'intérêt</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gravité *
              </label>
              <select
                value={formData.gravite}
                onChange={(e) => setFormData({ ...formData, gravite: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                aria-label="Gravité"
              >
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Élevée">Élevée</option>
                <option value="Critique">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de l'Incident *
              </label>
              <input
                type="date"
                value={formData.dateIncident}
                onChange={(e) => setFormData({ ...formData, dateIncident: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
                aria-label="Date de l'incident"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu *
            </label>
            <input
              type="text"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              placeholder="Lieu de l'incident"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              aria-label="Lieu de l'incident"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personnes Impliquées *
            </label>
            <input
              type="text"
              value={formData.personnesImpliquees}
              onChange={(e) => setFormData({ ...formData, personnesImpliquees: e.target.value })}
              placeholder="Noms ou fonctions des personnes impliquées"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              aria-label="Personnes impliquées"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant Estimé (FCFA)
            </label>
            <input
              type="number"
              value={formData.montantEstime}
              onChange={(e) => setFormData({ ...formData, montantEstime: parseFloat(e.target.value) })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              min="0"
              aria-label="Montant estimé"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description Détaillée *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Description complète des faits..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              aria-label="Description détaillée"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preuves *
            </label>
            <textarea
              value={formData.preuves}
              onChange={(e) => setFormData({ ...formData, preuves: e.target.value })}
              rows={3}
              placeholder="Description des preuves disponibles..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              aria-label="Preuves"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonyme"
              checked={formData.anonyme}
              onChange={(e) => setFormData({ ...formData, anonyme: e.target.checked })}
              className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              aria-label="Signalement anonyme"
            />
            <label htmlFor="anonyme" className="ml-3 text-sm font-medium text-gray-700">
              Signalement anonyme
            </label>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Protection:</strong> Les lanceurs d'alerte sont protégés par la loi contre toute forme de représailles.
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
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium transition-all shadow-md"
              aria-label="Soumettre le signalement"
            >
              Soumettre le Signalement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
