import { useState } from 'react';
import { X, Link2, CheckCircle, AlertCircle } from 'lucide-react';

export interface EcritureLettrage {
  id: string;
  date: string;
  numeroEcriture: string;
  libelle: string;
  debit: number;
  credit: number;
  selected: boolean;
}

export interface LettrageData {
  compteNumero: string;
  compteLibelle: string;
  ecritures: EcritureLettrage[];
  lettreAffectee: string;
  dateLettrage: string;
}

interface LettrageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LettrageData) => void;
  compteNumero?: string;
  compteLibelle?: string;
  ecrituresDisponibles?: EcritureLettrage[];
}

/**
 * Formulaire de lettrage comptable
 * Conforme SYSCOHADA - Rapprochement des écritures
 */
export default function LettrageForm({
  isOpen,
  onClose,
  onSubmit,
  compteNumero = '',
  compteLibelle = '',
  ecrituresDisponibles = []
}: LettrageFormProps) {
  const [selectedEcritures, setSelectedEcritures] = useState<string[]>([]);
  const [lettreAffectee, setLettreAffectee] = useState('');

  // Calcul des totaux
  const totaux = ecrituresDisponibles.reduce(
    (acc, ecriture) => {
      if (selectedEcritures.includes(ecriture.id)) {
        acc.debit += ecriture.debit;
        acc.credit += ecriture.credit;
      }
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  const isEquilibre = Math.abs(totaux.debit - totaux.credit) < 0.01;
  const canSubmit = selectedEcritures.length >= 2 && isEquilibre;

  const handleToggleEcriture = (id: string) => {
    setSelectedEcritures(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      alert('Sélectionnez au moins 2 écritures équilibrées (Débit = Crédit)');
      return;
    }

    const ecrituresSelectionnees = ecrituresDisponibles.filter(e =>
      selectedEcritures.includes(e.id)
    );

    onSubmit({
      compteNumero,
      compteLibelle,
      ecritures: ecrituresSelectionnees.map(e => ({ ...e, selected: true })),
      lettreAffectee: lettreAffectee || generateLettre(),
      dateLettrage: new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  const generateLettre = () => {
    // Génère une lettre de A à Z, puis AA, AB, etc.
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const index = Math.floor(Math.random() * letters.length);
    return letters[index];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Link2 className="h-6 w-6 mr-2 text-blue-600" />
            Lettrage Comptable (SYSCOHADA)
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
          {/* Informations du compte */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Compte à lettrer
            </h4>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-blue-800">{compteNumero}</span>
              <span className="text-sm text-blue-700">{compteLibelle}</span>
            </div>
          </div>

          {/* Lettre de lettrage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lettre de Lettrage (optionnel)
            </label>
            <input
              type="text"
              value={lettreAffectee}
              onChange={(e) => setLettreAffectee(e.target.value.toUpperCase())}
              placeholder="A, B, C... (générée automatiquement si vide)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={2}
              aria-label="Lettre de lettrage"
              title="Lettre affectée au lettrage (ex: A, B, AA...)"
            />
          </div>

          {/* Liste des écritures */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Sélectionnez les écritures à lettrer (minimum 2)
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEcritures(ecrituresDisponibles.map(e => e.id));
                          } else {
                            setSelectedEcritures([]);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      N° Écriture
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Libellé
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Débit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Crédit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ecrituresDisponibles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Aucune écriture disponible pour ce compte
                      </td>
                    </tr>
                  ) : (
                    ecrituresDisponibles.map((ecriture) => (
                      <tr
                        key={ecriture.id}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedEcritures.includes(ecriture.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleToggleEcriture(ecriture.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedEcritures.includes(ecriture.id)}
                            onChange={() => handleToggleEcriture(ecriture.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(ecriture.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {ecriture.numeroEcriture}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {ecriture.libelle}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-700">
                          {ecriture.debit > 0 ? ecriture.debit.toLocaleString('fr-FR') + ' CDF' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-red-700">
                          {ecriture.credit > 0 ? ecriture.credit.toLocaleString('fr-FR') + ' CDF' : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {selectedEcritures.length > 0 && (
                  <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <tr className="font-bold border-t-2 border-gray-400">
                      <td colSpan={4} className="px-4 py-4 text-sm text-gray-900">
                        TOTAL ({selectedEcritures.length} écritures sélectionnées)
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-green-800">
                        {totaux.debit.toLocaleString('fr-FR')} CDF
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-red-800">
                        {totaux.credit.toLocaleString('fr-FR')} CDF
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Statut d'équilibre */}
          {selectedEcritures.length > 0 && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              isEquilibre ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              {isEquilibre ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      ✓ Écritures équilibrées
                    </p>
                    <p className="text-xs text-green-700">
                      Total Débit = Total Crédit ({totaux.debit.toLocaleString('fr-FR')} CDF)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      ✗ Écritures non équilibrées
                    </p>
                    <p className="text-xs text-orange-700">
                      Écart: {Math.abs(totaux.debit - totaux.credit).toLocaleString('fr-FR')} CDF
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Informations SYSCOHADA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              📋 Principe du Lettrage
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Le lettrage permet de rapprocher les écritures débit et crédit</li>
              <li>• Les écritures lettrées doivent être équilibrées (Débit = Crédit)</li>
              <li>• Utilisé principalement pour les comptes de tiers (401, 411, etc.)</li>
              <li>• Facilite le suivi des paiements et encaissements</li>
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
              disabled={!canSubmit}
              className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Lettrer les Écritures
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
