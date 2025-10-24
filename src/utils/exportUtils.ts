/**
 * Utilitaires consolidés pour l'export de données en Excel, CSV et PDF
 * Remplace services/exportToExcel.ts (supprimé)
 */

/**
 * Type pour DeviseCode (migré depuis services/formatMontant.ts)
 */
export type DeviseCode = 'USD' | 'CDF' | 'EUR';

/**
 * Prépare les données des états financiers pour l'export Excel
 * Migré depuis services/exportToExcel.ts
 */
export const prepareExcelData = (
  actif: any[],
  passif: any[],
  resultat: any,
  flux: any[]
): Record<string, any[]> => {
  return {
    'Bilan Actif': actif.map(item => ({
      'Poste': item.poste || item.libelle || '',
      'Montant': item.montant || 0,
      'Pourcentage': item.pourcentage || 0
    })),
    'Bilan Passif': passif.map(item => ({
      'Poste': item.poste || item.libelle || '',
      'Montant': item.montant || 0,
      'Pourcentage': item.pourcentage || 0
    })),
    'Compte de Résultat': resultat ? [
      { 'Type': 'Produits', 'Montant': resultat.produits || 0 },
      { 'Type': 'Charges', 'Montant': resultat.charges || 0 },
      { 'Type': 'Résultat Net', 'Montant': resultat.resultat_net || 0 }
    ] : [],
    'Flux de Trésorerie': flux.map(item => ({
      'Nature': item.nature || '',
      'Libellé': item.libelle || '',
      'Montant': item.montant || 0,
      'Date': item.date || ''
    }))
  };
};

/**
 * Exporte des données en format CSV (compatible Excel)
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Générer les en-têtes
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Générer les lignes
  const csvRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Échapper les guillemets et virgules
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  // Combiner en-têtes et lignes
  const csv = [csvHeaders.join(','), ...csvRows].join('\n');

  // Créer le blob et télécharger
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporte des données en format Excel (XLSX)
 * Note: Nécessite la bibliothèque xlsx (npm install xlsx)
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Data') => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  try {
    // Reference unused parameter to satisfy TS (sheetName will be used when xlsx is integrated)
    void sheetName;
    // Pour l'instant, on utilise CSV comme fallback
    // TODO: Implémenter avec la bibliothèque xlsx si nécessaire
    exportToCSV(data, filename);
     console.log('Export Excel réussi:', filename);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    alert('Erreur lors de l\'export');
  }
};

/**
 * Exporte en PDF (version simplifiée)
 * Note: Pour un vrai PDF, utiliser jsPDF ou pdfmake
 */
export const exportToPDF = (title: string, data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  // Version simplifiée: ouvre une fenêtre d'impression
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les pop-ups pour exporter en PDF');
    return;
  }

  // Reference unused parameter to satisfy TS; could be used to set default filename in future
  void filename;

  const headers = Object.keys(data[0]);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #007bff; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br>
      <button onclick="window.print()">Imprimer / Sauvegarder en PDF</button>
      <button onclick="window.close()">Fermer</button>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Formate un montant en devise
 */
export const formatCurrency = (amount: number, currency: string = 'CDF'): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B ${currency}`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  } else {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount).replace(currency, '').trim() + ` ${currency}`;
  }
};

/**
 * Génère un nom de fichier avec timestamp
 */
export const generateFilename = (prefix: string): string => {
  const date = new Date();
  const timestamp = date.toISOString().split('T')[0];
  return `${prefix}_${timestamp}`;
};
