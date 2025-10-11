import React from 'react';
import { LigneFluxTresorerie } from '../../types/tresorerie';
import { formatMontant } from '../../services/formatMontant';
import { useDevise } from '../../hooks/useDevise';

interface RecentOperationsTableProps {
  operations: LigneFluxTresorerie[];
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getStatusColor = (statut: string) => {
  const colors = {
    'PREVISION': 'bg-blue-100 text-blue-800',
    'ENGAGEMENT': 'bg-yellow-100 text-yellow-800',
    'ORDONNANCEMENT': 'bg-purple-100 text-purple-800',
    'PAIEMENT': 'bg-green-100 text-green-800'
  };
  return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const RecentOperationsTable: React.FC<RecentOperationsTableProps> = ({ operations }) => {
  const { devise, formatMontantDevise } = useDevise();
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Opérations Récentes
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Libellé
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.map((operation) => (
              <tr key={operation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {operation.code_operation}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={operation.type_operation === 'RECETTE' ? 'text-green-600' : 'text-red-600'}>
                    {operation.type_operation}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {operation.libelle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatMontant(formatMontantDevise(operation.montant_prevu), { devise })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(operation.date_operation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(operation.statut)}`}>
                    {operation.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}