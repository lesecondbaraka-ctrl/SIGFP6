import React, { useState } from 'react';
import { ExerciceComptableService } from '../../services/ExerciceComptableService';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';

const ClotureExercice: React.FC = () => {
  const { data: exercices, loading } = useExercicesComptables();
  const [selectedExercice, setSelectedExercice] = useState<string>('');
  const [commentaire, setCommentaire] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coherenceMessages, setCoherenceMessages] = useState<Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
  }>>([]);

  type VerificationResult = {
    messages: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
    }>;
  };

  const handleVerification = async () => {
    if (!selectedExercice) return;

    try {
      const resultat = (await ExerciceComptableService.verifierCoherence(selectedExercice)) as VerificationResult;
      setCoherenceMessages(resultat.messages);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la vérification');
    }
  };

  const handleCloture = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedExercice || !commentaire) return;

    try {
      setIsSubmitting(true);
      await ExerciceComptableService.cloturerExercice(selectedExercice, commentaire);
      alert('Exercice clôturé avec succès');
      setCommentaire('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la clôture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValiderReports = async () => {
    if (!selectedExercice) return;

    try {
      setIsSubmitting(true);
      await ExerciceComptableService.validerReports(selectedExercice);
      alert('Reports validés avec succès');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la validation des reports');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;

  const exerciceSelectionne = exercices.find(e => e.id === selectedExercice);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clôture d'Exercice</h1>

      {/* Sélection de l'exercice */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un exercice
        </label>
        <select
          value={selectedExercice}
          onChange={(e) => setSelectedExercice(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Choisir un exercice</option>
          {exercices
            .filter(e => !e.est_cloture)
            .map(e => (
              <option key={e.id} value={e.id}>
                Exercice {e.annee} ({new Date(e.date_debut).toLocaleDateString()} - {new Date(e.date_fin).toLocaleDateString()})
              </option>
            ))}
        </select>
      </div>

      {exerciceSelectionne && (
        <>
          {/* Vérification de la cohérence */}
          <div className="mb-6">
            <button
              onClick={handleVerification}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isSubmitting}
            >
              Vérifier la cohérence
            </button>

            {coherenceMessages.length > 0 && (
              <div className="space-y-2">
                {coherenceMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded ${
                      message.type === 'error'
                        ? 'bg-red-100 text-red-700'
                        : message.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {message.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation des reports */}
          {!exerciceSelectionne.reports_valides && (
            <div className="mb-6">
              <button
                onClick={handleValiderReports}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={isSubmitting}
              >
                Valider les reports
              </button>
              <p className="mt-2 text-sm text-gray-600">
                Validez les reports de l'exercice précédent avant la clôture.
              </p>
            </div>
          )}

          {/* Formulaire de clôture */}
          <form onSubmit={handleCloture} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire de clôture
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                required
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Saisissez un commentaire pour la clôture de l'exercice..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !exerciceSelectionne.reports_valides}
                className={`px-4 py-2 rounded text-white ${
                  isSubmitting || !exerciceSelectionne.reports_valides
                    ? 'bg-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Clôture en cours...' : 'Clôturer l\'exercice'}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Liste des exercices clôturés */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Historique des clôtures</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de clôture
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commentaire
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exercices
                .filter(e => e.est_cloture)
                .map(exercice => (
                  <tr key={exercice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exercice.annee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(exercice.date_debut).toLocaleDateString()} - {new Date(exercice.date_fin).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {exercice.date_cloture && new Date(exercice.date_cloture).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {exercice.commentaire_cloture}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClotureExercice;