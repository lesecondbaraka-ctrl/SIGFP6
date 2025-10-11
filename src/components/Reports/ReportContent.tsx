import React from 'react';
import { LigneFluxTresorerie } from '../../types/tresorerie';

interface ReportContentProps {
  fluxFonctionnement: LigneFluxTresorerie[];
  fluxInvestissement: LigneFluxTresorerie[];
  fluxFinancement: LigneFluxTresorerie[];
  titre: string;
  dateDebut?: Date;
  dateFin?: Date;
}

// Composant qui sera imprimé
export const ReportContent = React.forwardRef<HTMLDivElement, ReportContentProps>(
  ({ fluxFonctionnement, fluxInvestissement, fluxFinancement, titre, dateDebut, dateFin }, ref) => {
    const formatMontant = (montant: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'MGA',
        minimumFractionDigits: 2
      }).format(montant);
    };

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    };

    const calculerTotaux = (flux: LigneFluxTresorerie[]) => {
      return flux.reduce(
        (acc, f) => ({
          prevu: acc.prevu + f.montant_prevu,
          engage: acc.engage + f.montant_engage,
          ordonnance: acc.ordonnance + f.montant_ordonnance,
          paye: acc.paye + f.montant_paye
        }),
        { prevu: 0, engage: 0, ordonnance: 0, paye: 0 }
      );
    };

    const genererTableauFlux = (flux: LigneFluxTresorerie[], nature: string) => (
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Flux de {nature}</h3>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Code</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Libellé</th>
              <th className="border p-2">Montant Prévu</th>
              <th className="border p-2">Montant Payé</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {flux.map((f, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border p-2">{f.code_operation}</td>
                <td className="border p-2">{f.type_operation}</td>
                <td className="border p-2">{f.libelle}</td>
                <td className="border p-2 text-right">{formatMontant(f.montant_prevu)}</td>
                <td className="border p-2 text-right">{formatMontant(f.montant_paye)}</td>
                <td className="border p-2">{formatDate(f.date_operation)}</td>
                <td className="border p-2">{f.statut}</td>
              </tr>
            ))}
            {/* Ligne des totaux */}
            {flux.length > 0 && (
              <tr className="bg-gray-100 font-bold">
                <td className="border p-2" colSpan={3}>Total</td>
                <td className="border p-2 text-right">
                  {formatMontant(calculerTotaux(flux).prevu)}
                </td>
                <td className="border p-2 text-right">
                  {formatMontant(calculerTotaux(flux).paye)}
                </td>
                <td className="border p-2" colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );

    return (
      <div ref={ref} className="p-8 bg-white">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{titre}</h1>
          {dateDebut && dateFin && (
            <p className="text-gray-600">
              Période du {formatDate(dateDebut)} au {formatDate(dateFin)}
            </p>
          )}
        </div>

        {/* Synthèse globale */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Synthèse</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { flux: fluxFonctionnement, nature: 'Fonctionnement' },
              { flux: fluxInvestissement, nature: 'Investissement' },
              { flux: fluxFinancement, nature: 'Financement' }
            ].map(({ flux, nature }) => {
              const totaux = calculerTotaux(flux);
              return (
                <div key={nature} className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">{nature}</h3>
                  <div className="space-y-1">
                    <p>Prévu : {formatMontant(totaux.prevu)}</p>
                    <p>Payé : {formatMontant(totaux.paye)}</p>
                    <p>Taux : {((totaux.paye / totaux.prevu) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Détails par nature */}
        {genererTableauFlux(fluxFonctionnement, 'Fonctionnement')}
        {genererTableauFlux(fluxInvestissement, 'Investissement')}
        {genererTableauFlux(fluxFinancement, 'Financement')}
      </div>
    );
  }
);