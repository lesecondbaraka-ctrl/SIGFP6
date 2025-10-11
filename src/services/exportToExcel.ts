import * as XLSX from 'xlsx';
import { LigneFluxTresorerie } from '../types/tresorerie';

interface DonneesExport {
  fluxFonctionnement: LigneFluxTresorerie[];
  fluxInvestissement: LigneFluxTresorerie[];
  fluxFinancement: LigneFluxTresorerie[];
}

export const exportToExcel = (donnees: DonneesExport, nomFichier: string = 'tresorerie.xlsx') => {
  // Formater les données pour l'export
  const formatData = (flux: LigneFluxTresorerie[], nature: string) => {
    return flux.map(f => ({
      'Nature': nature,
      'Type': f.type_operation,
      'Code': f.code_operation,
      'Libellé': f.libelle,
      'Montant Prévu': f.montant_prevu,
      'Montant Engagé': f.montant_engage,
      'Montant Ordonnancé': f.montant_ordonnance,
      'Montant Payé': f.montant_paye,
      'Date Opération': new Date(f.date_operation).toLocaleDateString(),
      'Date Valeur': new Date(f.date_valeur).toLocaleDateString(),
      'Statut': f.statut,
      'Imputation': f.imputation,
      'Source/Bénéficiaire': f.type_operation === 'RECETTE' ? f.source_financement : f.beneficiaire,
      'Référence': f.reference_piece,
      'Commentaire': f.commentaire || ''
    }));
  };

  // Combiner toutes les données
  const toutesLesDonnees = [
    ...formatData(donnees.fluxFonctionnement, 'Fonctionnement'),
    ...formatData(donnees.fluxInvestissement, 'Investissement'),
    ...formatData(donnees.fluxFinancement, 'Financement')
  ];

  // Créer une feuille de calcul
  const ws = XLSX.utils.json_to_sheet(toutesLesDonnees);

  // Définir la largeur des colonnes
  const wscols = [
    { wch: 15 }, // Nature
    { wch: 10 }, // Type
    { wch: 15 }, // Code
    { wch: 30 }, // Libellé
    { wch: 15 }, // Montant Prévu
    { wch: 15 }, // Montant Engagé
    { wch: 15 }, // Montant Ordonnancé
    { wch: 15 }, // Montant Payé
    { wch: 12 }, // Date Opération
    { wch: 12 }, // Date Valeur
    { wch: 12 }, // Statut
    { wch: 15 }, // Imputation
    { wch: 20 }, // Source/Bénéficiaire
    { wch: 15 }, // Référence
    { wch: 30 }  // Commentaire
  ];
  ws['!cols'] = wscols;

  // Créer un classeur
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trésorerie');

  // Exporter le fichier
  XLSX.writeFile(wb, nomFichier);
};