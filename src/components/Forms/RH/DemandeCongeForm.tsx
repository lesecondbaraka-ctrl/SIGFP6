import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DemandeCongeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DemandeCongeData) => void;
}

export interface DemandeCongeData {
  reference: string;
  employe: string;
  typeConge: 'Annuel' | 'Maladie' | 'Maternité' | 'Sans solde' | 'Exceptionnel';
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  motif: string;
  remplacant?: string;
}

export default function DemandeCongeForm({
  isOpen,
  onClose,
  onSubmit
}: DemandeCongeFormProps) {
  const [formData, setFormData] = React.useState<DemandeCongeData>({
    reference: '',
    employe: '',
    typeConge: 'Annuel',
    dateDebut: '',
    dateFin: '',
    nombreJours: 0,
    motif: '',
    remplacant: ''
  });

  const calculateDays = (debut: string, fin: string) => {
    if (debut && fin) {
      const start = new Date(debut);
      const end = new Date(fin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData({ ...formData, dateDebut: debut, dateFin: fin, nombreJours: diffDays });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      reference: '',
      employe: '',
      typeConge: 'Annuel',
      dateDebut: '',
      dateFin: '',
      nombreJours: 0,
      motif: '',
      remplacant: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-cyan-600" />
            Demande de Congé
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
                placeholder="Ex: CONG-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
                aria-label="Référence de congé"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employé *
              </label>
              <input
                type="text"
                value={formData.employe}
                onChange={(e) => setFormData({ ...formData, employe: e.target.value })}
                placeholder="Nom de l'employé"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
                aria-label="Nom de l'employé"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Congé *
            </label>
            <select
              value={formData.typeConge}
              onChange={(e) => setFormData({ ...formData, typeConge: e.target.value as any })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              required
              aria-label="Type de congé"
            >
              <option value="Annuel">Congé annuel</option>
              <option value="Maladie">Congé maladie</option>
              <option value="Maternité">Congé maternité</option>
              <option value="Sans solde">Congé sans solde</option>
              <option value="Exceptionnel">Congé exceptionnel</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Début *
              </label>
              <input
                type="date"
                value={formData.dateDebut}
                onChange={(e) => calculateDays(e.target.value, formData.dateFin)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
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
                onChange={(e) => calculateDays(formData.dateDebut, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
                aria-label="Date de fin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Jours
              </label>
              <input
                type="number"
                value={formData.nombreJours}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50"
                aria-label="Nombre de jours"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motif *
            </label>
            <textarea
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              rows={3}
              placeholder="Motif de la demande..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              required
              aria-label="Motif"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remplaçant (optionnel)
            </label>
            <input
              type="text"
              value={formData.remplacant}
              onChange={(e) => setFormData({ ...formData, remplacant: e.target.value })}
              placeholder="Nom du remplaçant"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              aria-label="Nom du remplaçant"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>RH:</strong> La demande sera soumise au supérieur hiérarchique pour approbation.
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
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 font-medium transition-all shadow-md"
              aria-label="Soumettre la demande"
            >
              Soumettre la Demande
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
