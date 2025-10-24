import React from 'react';
import { FileSearch, X } from 'lucide-react';

interface MissionAuditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MissionAuditData) => void;
}

export interface MissionAuditData {
  reference: string;
  typeMission: 'Audit interne' | 'Audit externe' | 'Audit de conformité' | 'Audit financier';
  domaine: string;
  auditeur: string;
  dateDebut: string;
  dateFin: string;
  objectifs: string;
  perimetre: string;
}

export default function MissionAuditForm({
  isOpen,
  onClose,
  onSubmit
}: MissionAuditFormProps) {
  const [formData, setFormData] = React.useState<MissionAuditData>({
    reference: '',
    typeMission: 'Audit interne',
    domaine: '',
    auditeur: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    objectifs: '',
    perimetre: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      typeMission: 'Audit interne',
      domaine: '',
      auditeur: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: '',
      objectifs: '',
      perimetre: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileSearch className="h-6 w-6 mr-2 text-indigo-600" />
            Mission d'Audit (ISSAI/ISA)
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
                placeholder="Ex: AUD-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Référence de mission"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Mission *
              </label>
              <select
                value={formData.typeMission}
                onChange={(e) => setFormData({ ...formData, typeMission: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Type de mission"
              >
                <option value="Audit interne">Audit interne</option>
                <option value="Audit externe">Audit externe</option>
                <option value="Audit de conformité">Audit de conformité</option>
                <option value="Audit financier">Audit financier</option>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Domaine"
            >
              <option value="">Sélectionner...</option>
              <option value="Budget">Budget</option>
              <option value="Recettes">Recettes</option>
              <option value="Dépenses">Dépenses</option>
              <option value="Trésorerie">Trésorerie</option>
              <option value="Comptabilité">Comptabilité</option>
              <option value="RH">Ressources Humaines</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auditeur *
            </label>
            <input
              type="text"
              value={formData.auditeur}
              onChange={(e) => setFormData({ ...formData, auditeur: e.target.value })}
              placeholder="Nom de l'auditeur ou cabinet"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Nom de l'auditeur"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Début *
              </label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Date de début"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Fin *
              </label>
              <input
                type="date"
                value={formData.dateFin}
                onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
                aria-label="Date de fin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objectifs *
            </label>
            <textarea
              value={formData.objectifs}
              onChange={(e) => setFormData({ ...formData, objectifs: e.target.value })}
              rows={3}
              placeholder="Objectifs de la mission d'audit..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Objectifs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Périmètre *
            </label>
            <textarea
              value={formData.perimetre}
              onChange={(e) => setFormData({ ...formData, perimetre: e.target.value })}
              rows={2}
              placeholder="Périmètre de la mission..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
              aria-label="Périmètre"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>ISSAI/ISA:</strong> Normes internationales d'audit pour le secteur public et privé.
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
              aria-label="Créer la mission d'audit"
            >
              Créer la Mission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
