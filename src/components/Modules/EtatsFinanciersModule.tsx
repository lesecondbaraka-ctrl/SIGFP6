import { useState, useEffect, useRef } from 'react';
import { useExercicesComptables } from '../../hooks/useExercicesComptables';
import { useBilanActif } from '../../hooks/useBilanActif';
import { useBilanPassif } from '../../hooks/useBilanPassif';
import { useCompteResultat } from '../../hooks/useCompteResultat';
import { useFluxTresorerie } from '../../hooks/useFluxTresorerie';
import { useRatiosFinanciers } from '../../hooks/useRatiosFinanciers';
import { prepareExcelData } from '../../hooks/services/exportToExcel';
import { RatioFinancier } from '../../types/finance';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const tabs = ['Bilan', 'Compte de Résultat', 'Flux de Trésorerie', 'Analyse Financière'];

const getColor = (val: number, seuil: number = 1) => {
  if (val >= seuil) return 'bg-green-500';
  if (val >= seuil * 0.75) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default function EtatsFinanciersModule() {
  const { data: exercices } = useExercicesComptables();
  const [selectedExercice, setSelectedExercice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const printRef = useRef<HTMLDivElement>(null);

  const { actif } = useBilanActif(selectedExercice ?? '');
  const { passif } = useBilanPassif(selectedExercice ?? '');
  const { resultat } = useCompteResultat(selectedExercice ?? '');
  const { flux } = useFluxTresorerie(selectedExercice ?? '');
  const { ratios } = useRatiosFinanciers(selectedExercice ?? '');

  useEffect(() => {
    if (exercices.length > 0) {
      setSelectedExercice(exercices[0].id);
    }
  }, [exercices]);

  const groupedRatios: Record<RatioFinancier['categorie'], RatioFinancier[]> = {
    liquidité: [],
    rentabilité: [],
    endettement: [],
    activité: [],
  };

  ratios.forEach((r) => {
    groupedRatios[r.categorie].push(r);
  });

  const handleExportExcel = () => {
    const sheets = prepareExcelData(actif, passif, resultat, flux);
    const workbook = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([sheetName, rows]) => {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Etats_Financiers_${selectedExercice}.xlsx`);
  };

  type ReactToPrintProps = {
    content: () => HTMLElement | null;
    documentTitle?: string;
  };

  const handlePrint = useReactToPrint({
    documentTitle: `Etats_Financiers_${selectedExercice}`,
    content: () => printRef.current
  } as ReactToPrintProps);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">États Financiers</h1>

      {/* Sélecteur + Export */}
      <div className="flex items-center gap-4">
        <label className="font-medium">Exercice :</label>
        <select
          className="border px-3 py-1 rounded"
          value={selectedExercice ?? ''}
          onChange={(e) => setSelectedExercice(e.target.value)}
        >
          {exercices.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.annee}</option>
          ))}
        </select>
        <button
          onClick={handleExportExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exporter Excel
        </button>
        <button
          onClick={handlePrint}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Exporter PDF
        </button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <KPI 
          label="Total Actif" 
          value={actif.length > 0 
            ? actif.reduce((sum, item) => sum + (item.net || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Total Passif" 
          value={passif.length > 0 
            ? passif.reduce((sum, item) => sum + (item.montant || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Résultat Net" 
          value={resultat.length > 0 
            ? resultat.reduce((sum, item) => sum + (item.montant || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
        <KPI 
          label="Trésorerie Nette" 
          value={flux.length > 0 
            ? flux.reduce((sum, item) => sum + (item.montant * (item.sens === 'encaissement' ? 1 : -1) || 0), 0).toLocaleString() + ' Ar'
            : '0 Ar'
          } 
        />
      </div>

      {/* Navigation par onglets */}
      <div className="flex gap-4 border-b pb-2 mt-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 font-medium ${
              activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenu dynamique */}
      {selectedExercice && (
        <div ref={printRef} className="mt-4 space-y-6">
          {activeTab === 'Bilan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="ACTIF" data={actif} columns={['libelle', 'net']} />
              <Section title="PASSIF" data={passif} columns={['libelle', 'montant']} />
            </div>
          )}

          {activeTab === 'Compte de Résultat' && (
            <Section title="Compte de Résultat" data={resultat} columns={['type', 'libelle', 'montant']} />
          )}

          {activeTab === 'Flux de Trésorerie' && (
            <Section title="Flux de Trésorerie" data={flux} columns={['categorie', 'libelle', 'sens', 'montant']} />
          )}

          {activeTab === 'Analyse Financière' && (
            <>
              <h2 className="text-lg font-semibold">Analyse Financière</h2>
              {Object.entries(groupedRatios).map(([categorie, items]) => (
                <div key={categorie}>
                  <h3 className="text-md font-medium capitalize mb-2">{categorie}</h3>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{item.libelle}</span>
                          <span>{item.valeur?.toFixed(2)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded">
                          <div
                            className={`h-2 rounded ${getColor(item.valeur)}`}
                            style={{ width: `${Math.min(item.valeur * 10, 100)}%` }}
                          />
                        </div>
                        {item.commentaire && (
                          <p className="text-xs text-gray-500 italic">{item.commentaire}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Composant KPI
const KPI = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white shadow rounded p-4 text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

// Composant Section générique
const Section = ({
  title,
  data,
  columns,
}: {
  title: string;
  data: any[];
  columns: string[];
}) => (
  <div>
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <table className="table-auto w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          {columns.map((col) => (
            <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            {columns.map((col) => (
                <td key={col}>
                {typeof item[col] === 'number'
                  ? item[col].toLocaleString()
                  : item[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
