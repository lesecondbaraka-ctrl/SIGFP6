import { useState } from 'react';
import { X, Save, AlertTriangle, Scale } from 'lucide-react';

export interface AjustementBilanData {
  reference: string;
  compteNumero: string;
  compteLibelle: string;
  typeAjustement: 'ACTIF' | 'PASSIF';
  montant: number;
  sens: 'AUGMENTATION' | 'DIMINUTION';
  justification: string;
  pieces: string[];
  dateAjustement: string;
  auteur: string;
}

interface AjustementBilanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AjustementBilanData) => void;
  initialData?: Partial<AjustementBilanData>;
}

/**
 * Formulaire d'ajustement de bilan
 * Conforme SYSCOHADA - Maintien de l'équilibre Actif = Passif
 */
export default function AjustementBilanForm({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: AjustementBilanFormProps) {
  const [formData, setFormData] = useState<AjustementBilanData>({
    reference: initialData?.reference || `AJU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    compteNumero: initialData?.compteNumero || '',
    compteLibelle: initialData?.compteLibelle || '',
    typeAjustement: initialData?.typeAjustement || 'ACTIF',
    montant: initialData?.montant || 0,
    sens: initialData?.sens || 'AUGMENTATION',
    justification: initialData?.justification || '',
    pieces: initialData?.pieces || [],
    dateAjustement: initialData?.dateAjustement || new Date().toISOString().split('T')[0],
    auteur: initialData?.auteur || ''
  });

  const handleChange = (field: keyof AjustementBilanData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.compteNumero || !formData.compteLibelle) {
      alert('Veuillez sélectionner un compte');
      return;
    }

    if (formData.montant <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }

    if (!formData.justification) {
      alert('La justification est obligatoire');
      return;
    }

    if (!formData.auteur) {
      alert('Veuillez indiquer l\'auteur de l\'ajustement');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Scale className="h-6 w-6 mr-2 text-indigo-600" />
            Ajustement de Bilan (SYSCOHADA)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fermer"
            aria-label="Fermer le formulaire"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Référence et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                aria-label="Référence de l'ajustement"
                title="Référence générée automatiquement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date d'Ajustement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateAjustement}
                onChange={(e) => handleChange('dateAjustement', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Date de l'ajustement"
                title="Date de l'ajustement"
              />
            </div>
          </div>

          {/* Compte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Compte <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.compteNumero}
                onChange={(e) => handleChange('compteNumero', e.target.value)}
                placeholder="Ex: 101, 211, 401..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Numéro du compte"
                title="Numéro du compte à ajuster"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Libellé du Compte <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.compteLibelle}
                onChange={(e) => handleChange('compteLibelle', e.target.value)}
                placeholder="Ex: Capital social, Banque..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Libellé du compte"
                title="Libellé du compte"
              />
            </div>
          </div>

          {/* Type et Sens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.typeAjustement}
                onChange={(e) => handleChange('typeAjustement', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Type d'ajustement"
              >
                <option value="ACTIF">Actif</option>
                <option value="PASSIF">Passif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sens <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.sens}
                onChange={(e) => handleChange('sens', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Sens de l'ajustement"
              >
                <option value="AUGMENTATION">Augmentation (+)</option>
                <option value="DIMINUTION">Diminution (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (CDF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.montant}
                onChange={(e) => handleChange('montant', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                aria-label="Montant de l'ajustement"
                title="Montant de l'ajustement en CDF"
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => handleChange('justification', e.target.value)}
              rows={4}
              placeholder="Expliquez la raison de cet ajustement..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              aria-label="Justification de l'ajustement"
              title="Justification détaillée de l'ajustement"
            />
          </div>

          {/* Pièces justificatives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pièces Justificatives
            </label>
            <input
              type="text"
              value={formData.pieces.join(', ')}
              onChange={(e) => handleChange('pieces', e.target.value.split(',').map(p => p.trim()).filter(p => p))}
              placeholder="Ex: facture.pdf, note_service.pdf..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-label="Pièces justificatives"
              title="Liste des pièces justificatives (séparées par des virgules)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez les noms de fichiers par des virgules
            </p>
          </div>

          {/* Auteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auteur de l'Ajustement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.auteur}
              onChange={(e) => handleChange('auteur', e.target.value)}
              placeholder="Nom du comptable"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              aria-label="Auteur de l'ajustement"
              title="Nom du comptable effectuant l'ajustement"
            />
          </div>

          {/* Alerte équilibre */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-900 mb-1">
                  ⚠️ Maintien de l'Équilibre Comptable
                </p>
                <p className="text-xs text-orange-800">
                  Cet ajustement doit être compensé par un ajustement équivalent de sens opposé pour maintenir l'équilibre Actif = Passif du bilan.
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  <strong>Impact:</strong> {formData.typeAjustement} {formData.sens === 'AUGMENTATION' ? '+' : '-'} {formData.montant.toLocaleString('fr-FR')} CDF
                </p>
              </div>
            </div>
          </div>

          {/* Informations SYSCOHADA */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-2">
              📋 Conformité SYSCOHADA
            </h4>
            <ul className="text-xs text-indigo-800 space-y-1">
              <li>• Tout ajustement doit être justifié et documenté</li>
              <li>• L'équilibre Actif = Passif doit être maintenu</li>
              <li>• Les pièces justificatives sont obligatoires</li>
              <li>• Traçabilité complète (auteur, date, montant)</li>
            </ul>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer l'Ajustement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
