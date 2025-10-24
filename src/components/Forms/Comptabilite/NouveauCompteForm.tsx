import { useState } from 'react';
import { X, Save, BookOpen } from 'lucide-react';

export interface NouveauCompteData {
  numero: string;
  libelle: string;
  classe: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  nature: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
  type: 'GENERAL' | 'AUXILIAIRE' | 'ANALYTIQUE';
  lettrable: boolean;
  actif: boolean;
}

interface NouveauCompteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NouveauCompteData) => void;
  initialData?: Partial<NouveauCompteData>;
}

/**
 * Formulaire de création d'un nouveau compte comptable
 * Conforme SYSCOHADA - Plan comptable OHADA
 */
export default function NouveauCompteForm({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: NouveauCompteFormProps) {
  const [formData, setFormData] = useState<NouveauCompteData>({
    numero: initialData?.numero || '',
    libelle: initialData?.libelle || '',
    classe: initialData?.classe || '1',
    nature: initialData?.nature || 'ACTIF',
    type: initialData?.type || 'GENERAL',
    lettrable: initialData?.lettrable ?? false,
    actif: initialData?.actif ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.numero || !formData.libelle) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation numéro compte (doit commencer par le numéro de classe)
    if (!formData.numero.startsWith(formData.classe)) {
      alert(`Le numéro de compte doit commencer par ${formData.classe} (classe sélectionnée)`);
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const handleChange = (field: keyof NouveauCompteData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getClasseLabel = (classe: string) => {
    const labels: Record<string, string> = {
      '1': 'Classe 1 - Comptes de capitaux',
      '2': 'Classe 2 - Comptes d\'immobilisations',
      '3': 'Classe 3 - Comptes de stocks',
      '4': 'Classe 4 - Comptes de tiers',
      '5': 'Classe 5 - Comptes de trésorerie',
      '6': 'Classe 6 - Comptes de charges',
      '7': 'Classe 7 - Comptes de produits',
      '8': 'Classe 8 - Comptes spéciaux',
      '9': 'Classe 9 - Comptabilité analytique'
    };
    return labels[classe] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-purple-600" />
            Nouveau Compte Comptable (SYSCOHADA)
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
          {/* Numéro et Classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classe <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classe}
                onChange={(e) => handleChange('classe', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                aria-label="Classe du compte"
              >
                <option value="1">1 - Capitaux</option>
                <option value="2">2 - Immobilisations</option>
                <option value="3">3 - Stocks</option>
                <option value="4">4 - Tiers</option>
                <option value="5">5 - Trésorerie</option>
                <option value="6">6 - Charges</option>
                <option value="7">7 - Produits</option>
                <option value="8">8 - Comptes spéciaux</option>
                <option value="9">9 - Analytique</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">{getClasseLabel(formData.classe)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de Compte <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                placeholder={`Ex: ${formData.classe}01, ${formData.classe}11, ${formData.classe}21...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                maxLength={10}
                aria-label="Numéro du compte"
                title="Numéro unique du compte (doit commencer par le numéro de classe)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Doit commencer par {formData.classe}
              </p>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Libellé du Compte <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.libelle}
              onChange={(e) => handleChange('libelle', e.target.value)}
              placeholder="Ex: Capital social, Banque BIC, Fournisseurs..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              aria-label="Libellé du compte"
              title="Description du compte"
            />
          </div>

          {/* Nature et Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nature <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.nature}
                onChange={(e) => handleChange('nature', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                aria-label="Nature du compte"
              >
                <option value="ACTIF">Actif</option>
                <option value="PASSIF">Passif</option>
                <option value="CHARGE">Charge</option>
                <option value="PRODUIT">Produit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                aria-label="Type du compte"
              >
                <option value="GENERAL">Général</option>
                <option value="AUXILIAIRE">Auxiliaire</option>
                <option value="ANALYTIQUE">Analytique</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="lettrable"
                checked={formData.lettrable}
                onChange={(e) => handleChange('lettrable', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="lettrable" className="ml-2 text-sm text-gray-700">
                Compte lettrable (pour rapprochements)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => handleChange('actif', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="actif" className="ml-2 text-sm text-gray-700">
                Compte actif (utilisable dans les écritures)
              </label>
            </div>
          </div>

          {/* Informations SYSCOHADA */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">
              📋 Conformité SYSCOHADA
            </h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Le numéro de compte doit être unique dans le plan comptable</li>
              <li>• Respecter la nomenclature SYSCOHADA révisé</li>
              <li>• Les comptes auxiliaires sont rattachés à un compte général</li>
              <li>• Les comptes lettrables permettent les rapprochements (ex: 401, 411)</li>
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Créer le Compte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
