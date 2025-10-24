import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { TresorerieService } from '../../services/TresorerieService';
import type { CompteTresorerie, ReleveBancaire, RapprochementBancaire as RapprochementType } from '../../types/tresorerie';

/**
 * Composant de rapprochement bancaire
 * Permet de rapprocher les écritures comptables avec les relevés bancaires
 * Conforme aux normes de contrôle interne et d'audit
 */
export default function RapprochementBancaire(): React.ReactElement {
  const [comptes, setComptes] = useState<CompteTresorerie[]>([]);
  const [compteSelectionne, setCompteSelectionne] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [soldeBancaire, setSoldeBancaire] = useState<string>('');
  const [operationsNonRapprochees, setOperationsNonRapprochees] = useState<ReleveBancaire[]>([]);
  const [rapprochementActif, setRapprochementActif] = useState<RapprochementType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chargerComptes();
  }, []);

  useEffect(() => {
    if (compteSelectionne) {
      chargerOperationsNonRapprochees();
    }
  }, [compteSelectionne]);

  const chargerComptes = async () => {
    try {
      const data = await TresorerieService.getComptesTresorerie();
      setComptes(data);
      if (data.length > 0) {
        setCompteSelectionne(data[0].id);
      }
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
      console.error(err);
    }
  };

  const chargerOperationsNonRapprochees = async () => {
    try {
      const data = await TresorerieService.getOperationsNonRapprochees(compteSelectionne);
      setOperationsNonRapprochees(data);
    } catch (err) {
      console.error('Erreur lors du chargement des opérations:', err);
    }
  };

  const creerRapprochement = async () => {
    if (!compteSelectionne || !dateDebut || !dateFin || !soldeBancaire) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rapprochement = await TresorerieService.creerRapprochement(
        compteSelectionne,
        dateDebut,
        dateFin,
        parseFloat(soldeBancaire)
      );
      setRapprochementActif(rapprochement);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du rapprochement');
    } finally {
      setLoading(false);
    }
  };

  const validerRapprochement = async () => {
    if (!rapprochementActif) return;

    setLoading(true);
    try {
      await TresorerieService.validerRapprochement(rapprochementActif.id);
      setRapprochementActif(null);
      setSoldeBancaire('');
      setDateDebut('');
      setDateFin('');
      chargerOperationsNonRapprochees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal',
      minimumFractionDigits: 2 
    }).format(value) + ' CDF';
  };

  const compteActuel = comptes.find(c => c.id === compteSelectionne);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Rapprochement Bancaire</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            Opérations non rapprochées: <span className="font-bold text-blue-600">{operationsNonRapprochees.length}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <XCircle className="text-red-600 mr-3 flex-shrink-0" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formulaire de création de rapprochement */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Nouveau Rapprochement</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sélection du compte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compte bancaire
            </label>
            <select
              value={compteSelectionne}
              onChange={(e) => setCompteSelectionne(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!!rapprochementActif}
              aria-label="Sélectionner le compte bancaire"
            >
              {comptes.map((compte) => (
                <option key={compte.id} value={compte.id}>
                  {compte.banque} - {compte.numero_compte} ({compte.devise})
                </option>
              ))}
            </select>
            {compteActuel && (
              <p className="mt-1 text-xs text-gray-600">
                Solde actuel: {formatCurrency(compteActuel.solde_actuel)}
              </p>
            )}
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="date-debut" className="block text-sm font-medium text-gray-700 mb-2">
                Date début
              </label>
              <input
                id="date-debut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!rapprochementActif}
                aria-label="Date de début de la période"
              />
            </div>
            <div>
              <label htmlFor="date-fin" className="block text-sm font-medium text-gray-700 mb-2">
                Date fin
              </label>
              <input
                id="date-fin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!rapprochementActif}
                aria-label="Date de fin de la période"
              />
            </div>
          </div>

          {/* Solde bancaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solde bancaire (selon relevé)
            </label>
            <input
              type="number"
              value={soldeBancaire}
              onChange={(e) => setSoldeBancaire(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={!!rapprochementActif}
            />
          </div>

          {/* Bouton de création */}
          <div className="flex items-end">
            {!rapprochementActif ? (
              <button
                onClick={creerRapprochement}
                disabled={loading || !compteSelectionne || !dateDebut || !dateFin || !soldeBancaire}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le rapprochement'}
              </button>
            ) : (
              <button
                onClick={validerRapprochement}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Validation...' : 'Valider le rapprochement'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Résultat du rapprochement */}
      {rapprochementActif && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Résultat du Rapprochement</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">
                Solde Comptable
              </p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(rapprochementActif.solde_comptable)}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">
                Solde Bancaire
              </p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(rapprochementActif.solde_bancaire)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${
              Math.abs(rapprochementActif.ecart) < 0.01 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">
                Écart
              </p>
              <p className={`text-xl font-bold ${
                Math.abs(rapprochementActif.ecart) < 0.01 
                  ? 'text-green-700' 
                  : 'text-orange-700'
              }`}>
                {formatCurrency(rapprochementActif.ecart)}
              </p>
              {Math.abs(rapprochementActif.ecart) < 0.01 && (
                <div className="flex items-center mt-2 text-green-700">
                  <CheckCircle2 size={16} className="mr-1" />
                  <span className="text-xs font-medium">Rapprochement OK</span>
                </div>
              )}
            </div>
          </div>

          {Math.abs(rapprochementActif.ecart) >= 0.01 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Écart détecté
                </p>
                <p className="text-sm text-yellow-700">
                  Un écart de {formatCurrency(Math.abs(rapprochementActif.ecart))} a été détecté entre le solde comptable et le solde bancaire. 
                  Veuillez vérifier les opérations non rapprochées ci-dessous.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des opérations non rapprochées */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Opérations Non Rapprochées</h3>
          <p className="text-sm text-gray-600 mt-1">
            Ces opérations bancaires n'ont pas encore été rapprochées avec les écritures comptables
          </p>
        </div>

        {operationsNonRapprochees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
            <p className="font-medium">Aucune opération en attente</p>
            <p className="text-sm mt-1">Toutes les opérations ont été rapprochées</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Libellé</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Référence</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Sens</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {operationsNonRapprochees.map((op) => (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(op.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{op.libelle}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{op.reference}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        op.sens === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {op.sens === 'credit' ? 'Crédit' : 'Débit'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(op.montant)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => {/* TODO: Implémenter le rapprochement manuel */}}
                      >
                        Rapprocher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
