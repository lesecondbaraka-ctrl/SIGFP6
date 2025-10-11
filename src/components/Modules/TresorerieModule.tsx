import React, { useState, useEffect } from 'react';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';
import SaisieFluxTresorerie from './SaisieFluxTresorerie';
import TableauDeBordTresorerie from './TableauDeBordTresorerie';
import { NotificationProvider } from '../Layout/NotificationProvider';
import { useModuleTresorerie } from '../../hooks/useModuleTresorerie';

type TresorerieTab = 'saisie' | 'tableau-de-bord';

const TresorerieModule: React.FC = () => {
  const { data: exercices, loading } = useExercicesComptables();
  const [selectedExercice, setSelectedExercice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TresorerieTab>('tableau-de-bord');

  const { error: moduleError, loadData } = useModuleTresorerie({
    exerciceId: selectedExercice,
  });

  useEffect(() => {
    if (selectedExercice) {
      loadData();
    }
  }, [selectedExercice, loadData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6">Gestion de la Trésorerie</h1>
        {moduleError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{moduleError}</p>
              </div>
            </div>
          </div>
        )}
        <div className="w-full md:w-1/3 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exercice Comptable
          </label>
          <select
            value={selectedExercice}
            onChange={(e) => setSelectedExercice(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Sélectionner un exercice</option>
            {exercices?.map((exercice) => (
              <option key={exercice.id} value={exercice.id}>
                {exercice.annee}
              </option>
            ))}
          </select>
        </div>
        {selectedExercice && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tableau-de-bord')}
                className={`${
                  activeTab === 'tableau-de-bord'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Tableau de Bord
                </span>
              </button>
              <button
                onClick={() => setActiveTab('saisie')}
                className={`${
                  activeTab === 'saisie'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Saisie des Flux
                </span>
              </button>
            </nav>
          </div>
        )}
        {selectedExercice ? (
          <div className="mt-6">
            {activeTab === 'tableau-de-bord' ? (
              <TableauDeBordTresorerie 
                exerciceId={selectedExercice} 
                key={`dashboard-${selectedExercice}`}
              />
            ) : (
              <SaisieFluxTresorerie 
                exerciceId={selectedExercice} 
                key={`saisie-${selectedExercice}`}
              />
            )}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun exercice sélectionné</h3>
            <p className="mt-1 text-sm text-gray-500">
              Veuillez sélectionner un exercice comptable pour commencer
            </p>
          </div>
        )}
      </div>
    </NotificationProvider>
  );
};

export default TresorerieModule;
