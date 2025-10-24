import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';
import { useFluxTresorerie } from '../../hooks/useFluxTresorerie';
import { exportToExcel, generateFilename } from '../../utils/exportUtils';

/**
 * Composant de liste des flux de trésorerie
 * Affiche les opérations de trésorerie avec filtres et export
 * Conforme aux normes IPSAS/IFRS pour la présentation des flux
 */
export default function FluxTresorerieList(): React.ReactElement {
  const { data: exercices = [] } = useExercicesComptables();
  const [exerciceId, setExerciceId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'RECETTE' | 'DEPENSE'>('all');
  const [natureFilter, setNatureFilter] = useState<string>('all');

  useEffect(() => {
    const actif = exercices[0]?.id;
    if (actif) setExerciceId(actif);
  }, [exercices]);

  const { flux = [], loading } = useFluxTresorerie(exerciceId || '');

  const filtered = useMemo(() => {
    return (flux || []).filter((f: any) => {
      const okType = typeFilter === 'all' || f.type_operation === typeFilter;
      const okNature = natureFilter === 'all' || f.nature_flux === natureFilter;
      const okSearch = !search || 
        f.libelle?.toLowerCase().includes(search.toLowerCase()) ||
        f.code_operation?.toLowerCase().includes(search.toLowerCase());
      return okType && okNature && okSearch;
    });
  }, [flux, typeFilter, natureFilter, search]);

  const totaux = useMemo(() => {
    const recettes = filtered
      .filter((f: any) => f.type_operation === 'RECETTE')
      .reduce((sum: number, f: any) => sum + (f.montant_paye || 0), 0);
    const depenses = filtered
      .filter((f: any) => f.type_operation === 'DEPENSE')
      .reduce((sum: number, f: any) => sum + (f.montant_paye || 0), 0);
    return { recettes, depenses, solde: recettes - depenses };
  }, [filtered]);

  const handleExport = () => {
    const data = filtered.map((f: any) => ({
      Code: f.code_operation,
      Date: new Date(f.date_operation).toLocaleDateString('fr-FR'),
      Type: f.type_operation,
      Nature: f.nature_flux,
      Libellé: f.libelle,
      'Montant Prévu': f.montant_prevu || 0,
      'Montant Payé': f.montant_paye || 0,
      Statut: f.statut,
      Bénéficiaire: f.beneficiaire || '-',
      Référence: f.reference_piece
    }));
    exportToExcel(data, generateFilename(`flux_tresorerie_${exerciceId}`));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal',
      minimumFractionDigits: 2 
    }).format(value) + ' CDF';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Flux de Trésorerie</h2>
        <button 
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} className="mr-2" />
          Exporter ({filtered.length})
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par type d'opération"
            >
              <option value="all">Tous les types</option>
              <option value="RECETTE">Recettes</option>
              <option value="DEPENSE">Dépenses</option>
            </select>
          </div>

          {/* Filtre Nature */}
          <div>
            <select
              value={natureFilter}
              onChange={(e) => setNatureFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par nature de flux"
            >
              <option value="all">Toutes les natures</option>
              <option value="FONCTIONNEMENT">Fonctionnement</option>
              <option value="INVESTISSEMENT">Investissement</option>
              <option value="FINANCEMENT">Financement</option>
            </select>
          </div>

          {/* Exercice */}
          <div>
            <select
              value={exerciceId}
              onChange={(e) => setExerciceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Sélectionner l'exercice comptable"
            >
              {exercices.map((ex: any) => (
                <option key={ex.id} value={ex.id}>
                  {ex.libelle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border-2 border-green-300">
          <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Recettes</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totaux.recettes)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-300">
          <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Dépenses</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totaux.depenses)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-300">
          <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Solde Net</p>
          <p className={`text-2xl font-bold ${totaux.solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(totaux.solde)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun flux trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Libellé</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Nature</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Montant Prévu</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Montant Payé</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((f: any) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(f.date_operation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{f.code_operation}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{f.libelle}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        f.type_operation === 'RECETTE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {f.type_operation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{f.nature_flux}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(f.montant_prevu || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(f.montant_paye || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        f.statut === 'PAIEMENT' ? 'bg-blue-100 text-blue-800' :
                        f.statut === 'ORDONNANCEMENT' ? 'bg-yellow-100 text-yellow-800' :
                        f.statut === 'ENGAGEMENT' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {f.statut}
                      </span>
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
