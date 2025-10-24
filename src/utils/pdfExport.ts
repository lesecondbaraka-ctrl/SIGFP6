/**
 * Utilitaire d'export PDF pour tous les modules
 * Utilise jsPDF pour générer des rapports professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { header: string; dataKey: string }[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
  footer?: string;
}

/**
 * Exporte des données en PDF avec formatage professionnel
 */
export const exportToPDF = (options: PDFExportOptions) => {
  const {
    title,
    subtitle,
    data,
    columns,
    filename,
    orientation = 'portrait',
    footer
  } = options;

  // Créer le document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // En-tête du document
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 28);
  }

  // Date de génération
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le: ${dateGeneration}`, 14, subtitle ? 35 : 28);

  // Tableau de données
  autoTable(doc, {
    startY: subtitle ? 40 : 33,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94], // Vert
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: 40, left: 14, right: 14 }
  });

  // Pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    
    if (footer) {
      doc.text(footer, 14, doc.internal.pageSize.height - 10);
    }
    
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Sauvegarder le PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Exporte un rapport budgétaire en PDF
 */
export const exportBudgetReportToPDF = (data: {
  lignes: any[];
  totaux: {
    budgetInitial: number;
    budgetRevise: number;
    realisation: number;
    engagement: number;
    disponible: number;
  };
  exercice: string;
}) => {
  const columns = [
    { header: 'Code', dataKey: 'code' },
    { header: 'Libellé', dataKey: 'libelle' },
    { header: 'Budget Révisé', dataKey: 'budgetRevise' },
    { header: 'Engagement', dataKey: 'engagement' },
    { header: 'Réalisation', dataKey: 'realisation' },
    { header: 'Disponible', dataKey: 'disponible' },
    { header: 'Taux (%)', dataKey: 'tauxRealisation' }
  ];

  exportToPDF({
    title: 'Rapport d\'Exécution Budgétaire',
    subtitle: `Exercice ${data.exercice} - Conforme IPSAS 24`,
    data: data.lignes,
    columns,
    filename: `rapport_budget_${data.exercice}`,
    orientation: 'landscape',
    footer: 'SIGFP - Système Intégré de Gestion des Finances Publiques'
  });
};

/**
 * Exporte un rapport de trésorerie en PDF
 */
export const exportTresorerieReportToPDF = (data: {
  flux: any[];
  soldes: {
    soldeInitial: number;
    recettes: number;
    depenses: number;
    soldeFinal: number;
  };
  periode: string;
}) => {
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Libellé', dataKey: 'libelle' },
    { header: 'Nature', dataKey: 'nature' },
    { header: 'Recettes', dataKey: 'recettes' },
    { header: 'Dépenses', dataKey: 'depenses' },
    { header: 'Solde', dataKey: 'solde' }
  ];

  exportToPDF({
    title: 'Rapport de Trésorerie',
    subtitle: `Période: ${data.periode} - Conforme IPSAS 2`,
    data: data.flux,
    columns,
    filename: `rapport_tresorerie_${data.periode}`,
    orientation: 'landscape',
    footer: 'SIGFP - Conforme IPSAS 2 et SYSCOHADA'
  });
};

/**
 * Exporte un grand livre comptable en PDF
 */
export const exportGrandLivreToPDF = (data: {
  compte: string;
  libelle: string;
  mouvements: any[];
  soldeInitial: number;
  soldeFinal: number;
  periode: string;
}) => {
  const columns = [
    { header: 'Date', dataKey: 'date' },
    { header: 'N° Écriture', dataKey: 'numero' },
    { header: 'Libellé', dataKey: 'libelle' },
    { header: 'Débit', dataKey: 'debit' },
    { header: 'Crédit', dataKey: 'credit' },
    { header: 'Solde', dataKey: 'solde' }
  ];

  exportToPDF({
    title: `Grand Livre - Compte ${data.compte}`,
    subtitle: `${data.libelle} - Période: ${data.periode}`,
    data: data.mouvements,
    columns,
    filename: `grand_livre_${data.compte}_${data.periode}`,
    orientation: 'landscape',
    footer: 'SIGFP - Conforme SYSCOHADA Article 17'
  });
};
