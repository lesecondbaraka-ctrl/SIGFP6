import { useState } from 'react';
import { X, Lock, CheckCircle, AlertTriangle, FileText, RefreshCw } from 'lucide-react';

export interface ClotureExerciceData {
  exercice: string;
  typeCloture: 'Mensuelle' | 'Trimestrielle' | 'Annuelle';
  dateDebut: string;
  dateFin: string;
  controles: {
    equilibreEcritures: boolean;
    coherenceBalance: boolean;
    lettrageComptes: boolean;
    rapprochementsBancaires: boolean;
  };
  regularisations: {
    amortissements: boolean;
    provisions: boolean;
    chargesAPayer: boolean;
    produitsConstatesAvance: boolean;
  };
  clotureur: string;
  observations: string;
}

interface ClotureExerciceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClotureExerciceData) => void;
  exercice?: string;
}

/**
 * Formulaire de clôture d'exercice comptable
 * Conforme SYSCOHADA - Processus de clôture en 4 étapes
 */
export default function ClotureExerciceForm({
  isOpen,
  onClose,
  onSubmit,
  exercice = new Date().getFullYear().toString()
}: ClotureExerciceFormProps) {
  const [etapeActive, setEtapeActive] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<ClotureExerciceData>({
    exercice,
    typeCloture: 'Annuelle',
    dateDebut: `${exercice}-01-01`,
    dateFin: `${exercice}-12-31`,
    controles: {
      equilibreEcritures: false,
      coherenceBalance: false,
      lettrageComptes: false,
      rapprochementsBancaires: false
    },
    regularisations: {
      amortissements: false,
      provisions: false,
      chargesAPayer: false,
      produitsConstatesAvance: false
    },
    clotureur: '',
    observations: ''
  });

  const [confirmationCloture, setConfirmationCloture] = useState(false);

  const handleChange = (field: keyof ClotureExerciceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleControleChange = (controle: keyof typeof formData.controles) => {
    setFormData(prev => ({
      ...prev,
      controles: {
        ...prev.controles,
        [controle]: !prev.controles[controle]
      }
    }));
  };

  const handleRegularisationChange = (regularisation: keyof typeof formData.regularisations) => {
    setFormData(prev => ({
      ...prev,
      regularisations: {
        ...prev.regularisations,
        [regularisation]: !prev.regularisations[regularisation]
      }
    }));
  };

  const tousControlesValides = Object.values(formData.controles).every(v => v);
  const toutesRegularisationsEffectuees = Object.values(formData.regularisations).every(v => v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tousControlesValides) {
      alert('Tous les contrôles préalables doivent être validés');
      return;
    }

    if (!toutesRegularisationsEffectuees) {
      alert('Toutes les régularisations doivent être effectuées');
      return;
    }

    if (!confirmationCloture) {
      alert('Veuillez confirmer la clôture définitive');
      return;
    }

    if (!formData.clotureur) {
      alert('Veuillez indiquer le nom du clôtureur');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-red-600" />
            Clôture d'Exercice Comptable (SYSCOHADA)
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
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exercice <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.exercice}
                onChange={(e) => handleChange('exercice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                readOnly
                aria-label="Exercice comptable"
                title="Exercice comptable à clôturer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de Clôture <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.typeCloture}
                onChange={(e) => handleChange('typeCloture', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                aria-label="Type de clôture"
              >
                <option value="Mensuelle">Mensuelle</option>
                <option value="Trimestrielle">Trimestrielle</option>
                <option value="Annuelle">Annuelle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clôtureur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clotureur}
                onChange={(e) => handleChange('clotureur', e.target.value)}
                placeholder="Nom du comptable"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
                aria-label="Nom du clôtureur"
                title="Nom du comptable effectuant la clôture"
              />
            </div>
          </div>

          {/* Workflow en 4 étapes */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-200">
            <h4 className="text-sm font-bold text-gray-900 mb-4">
              Processus de Clôture (4 Étapes)
            </h4>
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Contrôles', color: 'blue', icon: CheckCircle },
                { num: 2, label: 'Régularisations', color: 'orange', icon: FileText },
                { num: 3, label: 'Clôture', color: 'red', icon: Lock },
                { num: 4, label: 'À-Nouveau', color: 'green', icon: RefreshCw }
              ].map((etape, index) => (
                <div key={etape.num} className="flex-1">
                  <div
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      etapeActive === etape.num
                        ? `bg-${etape.color}-600 border-${etape.color}-700 shadow-lg transform scale-105`
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                    onClick={() => setEtapeActive(etape.num as 1 | 2 | 3 | 4)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        etapeActive === etape.num ? 'bg-white' : `bg-${etape.color}-100`
                      }`}>
                        <etape.icon className={`w-5 h-5 ${
                          etapeActive === etape.num ? `text-${etape.color}-600` : `text-${etape.color}-600`
                        }`} />
                      </div>
                      <span className={`text-xs font-semibold ${
                        etapeActive === etape.num ? 'text-white' : 'text-gray-700'
                      }`}>
                        {etape.label}
                      </span>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="flex justify-center my-2">
                      <div className="w-full h-1 bg-gray-300"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Étape 1: Contrôles Préalables */}
          {etapeActive === 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Étape 1: Contrôles Préalables
              </h4>
              <div className="space-y-3">
                {[
                  { key: 'equilibreEcritures', label: 'Équilibre des écritures vérifié' },
                  { key: 'coherenceBalance', label: 'Cohérence de la balance confirmée' },
                  { key: 'lettrageComptes', label: 'Lettrage des comptes validé' },
                  { key: 'rapprochementsBancaires', label: 'Rapprochements bancaires OK' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData.controles[key as keyof typeof formData.controles]}
                      onChange={() => handleControleChange(key as keyof typeof formData.controles)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={key} className="ml-3 text-sm text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              {tousControlesValides && (
                <div className="mt-4 flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Tous les contrôles sont validés ✓</span>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Écritures de Régularisation */}
          {etapeActive === 2 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Étape 2: Écritures de Régularisation
              </h4>
              <div className="space-y-3">
                {[
                  { key: 'amortissements', label: 'Amortissements générés' },
                  { key: 'provisions', label: 'Provisions constituées' },
                  { key: 'chargesAPayer', label: 'Charges à payer enregistrées' },
                  { key: 'produitsConstatesAvance', label: 'Produits constatés d\'avance enregistrés' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={key}
                      checked={formData.regularisations[key as keyof typeof formData.regularisations]}
                      onChange={() => handleRegularisationChange(key as keyof typeof formData.regularisations)}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label htmlFor={key} className="ml-3 text-sm text-gray-700">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              {toutesRegularisationsEffectuees && (
                <div className="mt-4 flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Toutes les régularisations sont effectuées ✓</span>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Clôture Définitive */}
          {etapeActive === 3 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Étape 3: Clôture Définitive
              </h4>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      ⚠️ ATTENTION: Action Irréversible
                    </p>
                    <p className="text-xs text-red-800">
                      La clôture définitive verrouille la période. Aucune modification ne sera possible après cette étape.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirmationCloture"
                  checked={confirmationCloture}
                  onChange={(e) => setConfirmationCloture(e.target.checked)}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="confirmationCloture" className="ml-3 text-sm font-semibold text-gray-900">
                  Je confirme la clôture définitive de l'exercice {formData.exercice}
                </label>
              </div>
            </div>
          )}

          {/* Étape 4: Écritures d'À-Nouveau */}
          {etapeActive === 4 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Étape 4: Écritures d'À-Nouveau
              </h4>
              <p className="text-sm text-green-800 mb-4">
                Les écritures d'à-nouveau seront générées automatiquement après la clôture pour reporter les soldes sur l'exercice suivant.
              </p>
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <p className="text-xs text-green-800">
                  ✓ Report automatique des soldes de bilan (comptes 1 à 5)<br />
                  ✓ Remise à zéro des comptes de gestion (comptes 6 et 7)<br />
                  ✓ Génération du résultat de l'exercice
                </p>
              </div>
            </div>
          )}

          {/* Observations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations (optionnel)
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => handleChange('observations', e.target.value)}
              rows={3}
              placeholder="Remarques ou observations sur la clôture..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              aria-label="Observations"
              title="Observations sur la clôture"
            />
          </div>

          {/* Informations SYSCOHADA */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">
              📋 Conformité SYSCOHADA
            </h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• La clôture doit respecter les 4 étapes du processus</li>
              <li>• Tous les contrôles et régularisations sont obligatoires</li>
              <li>• La clôture définitive est irréversible</li>
              <li>• Les écritures d'à-nouveau sont générées automatiquement</li>
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
              disabled={!tousControlesValides || !toutesRegularisationsEffectuees || !confirmationCloture}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                tousControlesValides && toutesRegularisationsEffectuees && confirmationCloture
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              Clôturer Définitivement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
