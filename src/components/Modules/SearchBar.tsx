import React, { useState } from 'react';
import { NatureFlux, TypeOperation, StatutOperation } from '../../types/tresorerie';

interface SearchFilters {
  searchTerm: string;
  dateDebut: string;
  dateFin: string;
  natureFlux: NatureFlux | 'TOUS';
  typeOperation: TypeOperation | 'TOUS';
  statut: StatutOperation | 'TOUS';
  montantMin: number;
  montantMax: number;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
}

const initialFilters: SearchFilters = {
  searchTerm: '',
  dateDebut: '',
  dateFin: '',
  natureFlux: 'TOUS',
  typeOperation: 'TOUS',
  statut: 'TOUS',
  montantMin: 0,
  montantMax: 0
};

export default function SearchBar({ onSearch, onReset }: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: name.includes('montant') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    onReset();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <form onSubmit={handleSubmit}>
        {/* Barre de recherche principale */}
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder="Rechercher par code, libellé, bénéficiaire..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            {isAdvancedSearch ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Réinitialiser
          </button>
        </div>

        {/* Filtres avancés */}
        {isAdvancedSearch && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date début
              </label>
              <input
                type="date"
                name="dateDebut"
                value={filters.dateDebut}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date fin
              </label>
              <input
                type="date"
                name="dateFin"
                value={filters.dateFin}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nature du flux
              </label>
              <select
                name="natureFlux"
                value={filters.natureFlux}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="TOUS">Tous</option>
                <option value="FONCTIONNEMENT">Fonctionnement</option>
                <option value="INVESTISSEMENT">Investissement</option>
                <option value="FINANCEMENT">Financement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type d'opération
              </label>
              <select
                name="typeOperation"
                value={filters.typeOperation}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="TOUS">Tous</option>
                <option value="RECETTE">Recette</option>
                <option value="DEPENSE">Dépense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                name="statut"
                value={filters.statut}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="TOUS">Tous</option>
                <option value="PREVISION">Prévision</option>
                <option value="ENGAGEMENT">Engagement</option>
                <option value="ORDONNANCEMENT">Ordonnancement</option>
                <option value="PAIEMENT">Paiement</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Montant minimum
              </label>
              <input
                type="number"
                name="montantMin"
                value={filters.montantMin}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Montant maximum
              </label>
              <input
                type="number"
                name="montantMax"
                value={filters.montantMax}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}