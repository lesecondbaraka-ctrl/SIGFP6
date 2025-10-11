import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { formatMontant } from '../../services/formatMontant';
import { useFluxTresorerieGouv } from '../../hooks/useFluxTresorerieGouv';
import { NatureFlux, LigneFluxTresorerie } from '../../types/tresorerie';
import { ReportContent } from '../Reports/ReportContent';
import { exportToExcel } from '../../services/exportToExcel';
import TresorerieTabs from './TresorerieTabs';
import { TresorerieDashboard } from '../Dashboard/TresorerieDashboard';

interface SyntheseFlux {
  nature: NatureFlux;
  recettes: number;
  depenses: number;
  solde: number;
}

const TableauDeBordTresorerie: React.FC<{ exerciceId: string }> = ({ exerciceId }) => {
  const { fluxFonctionnement, fluxInvestissement, fluxFinancement, loading } = useFluxTresorerieGouv(exerciceId);
  const [synthese, setSynthese] = useState<SyntheseFlux[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculerSynthese = () => {
      const calculerTotaux = (flux: LigneFluxTresorerie[]) => {
        return flux.reduce(
          (acc, f) => ({
            recettes: acc.recettes + (f.type_operation === 'RECETTE' ? f.montant_paye : 0),
            depenses: acc.depenses + (f.type_operation === 'DEPENSE' ? f.montant_paye : 0),
          }),
          { recettes: 0, depenses: 0 }
        );
      };

      const nouvelleSynthese: SyntheseFlux[] = [
        {
          nature: 'FONCTIONNEMENT',
          ...calculerTotaux(fluxFonctionnement),
          solde: 0,
        },
        {
          nature: 'INVESTISSEMENT',
          ...calculerTotaux(fluxInvestissement),
          solde: 0,
        },
        {
          nature: 'FINANCEMENT',
          ...calculerTotaux(fluxFinancement),
          solde: 0,
        },
      ];

      // Calcul des soldes
      nouvelleSynthese.forEach(s => {
        s.solde = s.recettes - s.depenses;
      });

      setSynthese(nouvelleSynthese);
    };

    calculerSynthese();
  }, [fluxFonctionnement, fluxInvestissement, fluxFinancement]);

  // Configuration de l'impression
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Rapport de Trésorerie',
  });

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  const totalRecettes = synthese.reduce((sum, s) => sum + s.recettes, 0);
  const totalDepenses = synthese.reduce((sum, s) => sum + s.depenses, 0);
  const soldeGlobal = totalRecettes - totalDepenses;

  // Gestion de l'export Excel
  const handleExportExcel = () => {
    exportToExcel({
      fluxFonctionnement,
      fluxInvestissement,
      fluxFinancement
    }, 'tresorerie.xlsx');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Tableau de Bord de la Trésorerie</h2>
        
        <div className="flex space-x-4">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimer PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Recettes</h3>
          <p className="text-2xl font-bold text-blue-600">{formatMontant(totalRecettes, { devise: 'USD' })}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Total Dépenses</h3>
          <p className="text-2xl font-bold text-red-600">{formatMontant(totalDepenses, { devise: 'USD' })}</p>
        </div>
        <div className={`p-4 rounded-lg ${soldeGlobal >= 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <h3 className={`text-sm font-medium ${soldeGlobal >= 0 ? 'text-green-800' : 'text-yellow-800'}`}>
            Solde Global
          </h3>
          <p className={`text-2xl font-bold ${soldeGlobal >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
            {formatMontant(soldeGlobal, { devise: 'USD' })}
          </p>
        </div>
      </div>

      {/* Tableau de synthèse */}
      {/* Tableau de bord de trésorerie */}
      <div className="bg-white shadow rounded-lg p-6">
        <TresorerieDashboard 
          fluxFonctionnement={fluxFonctionnement}
          fluxInvestissement={fluxInvestissement}
          fluxFinancement={fluxFinancement}
        />
      </div>

      {/* Onglets d'analyse détaillée */}
      <div className="bg-white shadow rounded-lg p-6">
        <TresorerieTabs exerciceId={exerciceId} />
      </div>

      {/* Tableau de synthèse */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nature
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recettes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dépenses
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Solde
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {synthese.map((ligne) => (
              <tr key={ligne.nature}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ligne.nature}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                  {formatMontant(ligne.recettes, { devise: 'USD' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  {formatMontant(ligne.depenses, { devise: 'USD' })}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                  ligne.solde >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatMontant(ligne.solde, { devise: 'USD' })}
                </td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                TOTAL
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                {formatMontant(totalRecettes, { devise: 'USD' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                {formatMontant(totalDepenses, { devise: 'USD' })}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                soldeGlobal >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatMontant(soldeGlobal, { devise: 'USD' })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Version imprimable (cachée) */}
      <div style={{ display: 'none' }}>
        <ReportContent
          ref={componentRef}
          titre="Rapport de Trésorerie"
          fluxFonctionnement={fluxFonctionnement}
          fluxInvestissement={fluxInvestissement}
          fluxFinancement={fluxFinancement}
        />
      </div>
    </div>
  );
};

export default TableauDeBordTresorerie;