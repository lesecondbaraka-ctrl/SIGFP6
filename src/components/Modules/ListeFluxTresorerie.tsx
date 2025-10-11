import { useState, useMemo } from 'react';
import { useFluxTresorerieGouv } from '../../hooks/useFluxTresorerieGouv';
import { LigneFluxTresorerie } from '../../types/tresorerie';
import SearchBar from './SearchBar';

interface ListeFluxTresorerieProps {
  exerciceId: string;
}

export default function ListeFluxTresorerie({ exerciceId }: ListeFluxTresorerieProps) {
  const { fluxFonctionnement, fluxInvestissement, fluxFinancement, loading } = useFluxTresorerieGouv(exerciceId);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof LigneFluxTresorerie;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Combiner tous les flux
  const allFlux = useMemo(() => {
    return [...fluxFonctionnement, ...fluxInvestissement, ...fluxFinancement];
  }, [fluxFonctionnement, fluxInvestissement, fluxFinancement]);

  // État pour les filtres de recherche
  const [filteredFlux, setFilteredFlux] = useState(allFlux);

  // Fonction de tri
  const handleSort = (key: keyof LigneFluxTresorerie) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Appliquer le tri
  const sortedFlux = useMemo(() => {
    if (!sortConfig) return filteredFlux;

    return [...filteredFlux].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredFlux, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedFlux.length / itemsPerPage);
  const paginatedFlux = sortedFlux.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Formatage des montants
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 2
    }).format(montant);
  };

  // Gestion de la recherche
  const handleSearch = (filters: any) => {
    let results = allFlux;

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      results = results.filter(flux =>
        flux.libelle.toLowerCase().includes(searchTerm) ||
        flux.code_operation.toLowerCase().includes(searchTerm) ||
        (flux.beneficiaire && flux.beneficiaire.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.dateDebut) {
      results = results.filter(flux => 
        new Date(flux.date_operation) >= new Date(filters.dateDebut)
      );
    }

    if (filters.dateFin) {
      results = results.filter(flux => 
        new Date(flux.date_operation) <= new Date(filters.dateFin)
      );
    }

    if (filters.natureFlux !== 'TOUS') {
      results = results.filter(flux => 
        flux.nature_flux === filters.natureFlux
      );
    }

    if (filters.typeOperation !== 'TOUS') {
      results = results.filter(flux => 
        flux.type_operation === filters.typeOperation
      );
    }

    if (filters.statut !== 'TOUS') {
      results = results.filter(flux => 
        flux.statut === filters.statut
      );
    }

    if (filters.montantMin > 0) {
      results = results.filter(flux => 
        flux.montant_paye >= filters.montantMin
      );
    }

    if (filters.montantMax > 0) {
      results = results.filter(flux => 
        flux.montant_paye <= filters.montantMax
      );
    }

    setFilteredFlux(results);
    setCurrentPage(1); // Réinitialiser la pagination
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setFilteredFlux(allFlux);
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-6">
      <SearchBar onSearch={handleSearch} onReset={handleReset} />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('code_operation')}
              >
                Code
                {sortConfig?.key === 'code_operation' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('date_operation')}
              >
                Date
                {sortConfig?.key === 'date_operation' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Libellé
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nature_flux')}
              >
                Nature
                {sortConfig?.key === 'nature_flux' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('montant_paye')}
              >
                Montant
                {sortConfig?.key === 'montant_paye' && (
                  <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedFlux.map((flux) => (
              <tr key={flux.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flux.code_operation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(flux.date_operation).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {flux.libelle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flux.nature_flux}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                  flux.type_operation === 'RECETTE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatMontant(flux.montant_paye)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    flux.statut === 'PAIEMENT' 
                      ? 'bg-green-100 text-green-800'
                      : flux.statut === 'ORDONNANCEMENT'
                      ? 'bg-blue-100 text-blue-800'
                      : flux.statut === 'ENGAGEMENT'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {flux.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, sortedFlux.length)} sur {sortedFlux.length} résultats
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Précédent
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}