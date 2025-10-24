/**
 * Service d'Intégration Financière
 * 
 * Assure la cohérence et l'interconnexion entre tous les modules financiers et comptables
 * selon les normes internationales de gestion des finances publiques
 * 
 * NORMES RESPECTÉES:
 * - IPSAS 1: États financiers
 * - IPSAS 2: Tableau des flux de trésorerie
 * - IPSAS 23: Produits des transactions sans contrepartie directe (Recettes)
 * - IPSAS 24: Présentation de l'information budgétaire
 * - SYSCOHADA: Plan comptable OHADA
 * - COSO: Contrôle interne
 * 
 * PRINCIPES FONDAMENTAUX:
 * 1. Partie double comptable (Débit = Crédit)
 * 2. Séparation ordonnateur/comptable (OHADA)
 * 3. Traçabilité complète des opérations
 * 4. Cohérence temporelle (exercice comptable)
 * 5. Principe de prudence
 */

// import { supabase } from '../lib/supabase'; // À utiliser pour les vraies requêtes

// ============================================================================
// INTERFACES
// ============================================================================

export interface DonneesConsolidees {
  exercice: string;
  dateConsolidation: string;
  
  // Budget (IPSAS 24)
  budget: {
    budgetInitial: number;
    budgetRevise: number;
    engagements: number;
    realisations: number;
    disponible: number;
    tauxEngagement: number;
    tauxRealisation: number;
  };
  
  // Recettes (IPSAS 23)
  recettes: {
    previsions: number;
    constatations: number;
    liquidations: number;
    encaissements: number;
    tauxRecouvrement: number;
    creancesDouteuses: number;
  };
  
  // Dépenses (OHADA - 4 phases)
  depenses: {
    credits: number;
    engagements: number;
    liquidations: number;
    ordonnancements: number;
    paiements: number;
    restesAPayer: number;
  };
  
  // Trésorerie (IPSAS 2)
  tresorerie: {
    soldeInitial: number;
    encaissements: number;
    decaissements: number;
    soldeFinal: number;
    ratioLiquidite: number;
    joursAutonomie: number;
  };
  
  // Comptabilité (SYSCOHADA)
  comptabilite: {
    totalActif: number;
    totalPassif: number;
    resultatExercice: number;
    capitauxPropres: number;
    equilibreComptable: boolean;
  };
  
  // Contrôles de cohérence
  controles: {
    equilibreBudgetaire: boolean;
    equilibreComptable: boolean;
    coherenceRecettesTresorerie: boolean;
    coherenceDepensesTresorerie: boolean;
    coherenceBudgetComptabilite: boolean;
    alertes: string[];
  };
}

export interface FluxComptable {
  date: string;
  module: 'Budget' | 'Recettes' | 'Depenses' | 'Tresorerie';
  operation: string;
  montant: number;
  compteDebit: string;
  compteCredit: string;
  reference: string;
  statut: 'Brouillon' | 'Validé' | 'Comptabilisé';
}

// ============================================================================
// SERVICE D'INTÉGRATION
// ============================================================================

export class IntegrationFinanciereService {
  
  /**
   * Consolide toutes les données financières pour un exercice
   * Vérifie la cohérence entre modules selon normes IPSAS/SYSCOHADA
   */
  static async consoliderDonnees(exercice: string): Promise<DonneesConsolidees> {
    try {
      // Récupérer les données de chaque module
      const [budget, recettes, depenses, tresorerie, comptabilite] = await Promise.all([
        this.getDonneesBudget(exercice),
        this.getDonneesRecettes(exercice),
        this.getDonneesDepenses(exercice),
        this.getDonneesTresorerie(exercice),
        this.getDonneesComptabilite(exercice)
      ]);

      // Effectuer les contrôles de cohérence
      const controles = this.verifierCoherence(budget, recettes, depenses, tresorerie, comptabilite);

      return {
        exercice,
        dateConsolidation: new Date().toISOString(),
        budget,
        recettes,
        depenses,
        tresorerie,
        comptabilite,
        controles
      };
    } catch (error) {
      console.error('Erreur consolidation:', error);
      throw new Error('Impossible de consolider les données financières');
    }
  }

  /**
   * Récupère les données budgétaires (IPSAS 24)
   */
  private static async getDonneesBudget(_exercice: string) {
    // Simulé - à remplacer par vraies requêtes Supabase
    return {
      budgetInitial: 25000000,
      budgetRevise: 25000000,
      engagements: 20000000,
      realisations: 9200000,
      disponible: 5000000,
      tauxEngagement: 80,
      tauxRealisation: 46
    };
  }

  /**
   * Récupère les données de recettes (IPSAS 23)
   * Principe: Constatation → Liquidation → Encaissement
   */
  private static async getDonneesRecettes(_exercice: string) {
    return {
      previsions: 5250000,
      constatations: 5250000,
      liquidations: 4500000,
      encaissements: 3770000,
      tauxRecouvrement: 71.8,
      creancesDouteuses: 381000
    };
  }

  /**
   * Récupère les données de dépenses (OHADA - 4 phases)
   * Principe: Engagement → Liquidation → Ordonnancement → Paiement
   */
  private static async getDonneesDepenses(_exercice: string) {
    return {
      credits: 25000000,
      engagements: 20000000,
      liquidations: 15250000,
      ordonnancements: 9450000,
      paiements: 8000000,
      restesAPayer: 1450000
    };
  }

  /**
   * Récupère les données de trésorerie (IPSAS 2)
   * Flux: Exploitation + Investissement + Financement
   */
  private static async getDonneesTresorerie(_exercice: string) {
    return {
      soldeInitial: 10000000,
      encaissements: 3770000,
      decaissements: 8000000,
      soldeFinal: 5770000,
      ratioLiquidite: 0.47,
      joursAutonomie: 20
    };
  }

  /**
   * Récupère les données comptables (SYSCOHADA)
   * Principe: Actif = Passif (équilibre comptable)
   */
  private static async getDonneesComptabilite(_exercice: string) {
    return {
      totalActif: 50000000,
      totalPassif: 50000000,
      resultatExercice: -4230000, // Déficit
      capitauxPropres: 25000000,
      equilibreComptable: true
    };
  }

  /**
   * Vérifie la cohérence entre tous les modules
   * Selon principes IPSAS et SYSCOHADA
   */
  private static verifierCoherence(
    budget: any,
    recettes: any,
    depenses: any,
    tresorerie: any,
    comptabilite: any
  ) {
    const alertes: string[] = [];

    // 1. Équilibre budgétaire (IPSAS 24)
    const equilibreBudgetaire = Math.abs(
      (recettes.encaissements - depenses.paiements) - 
      (tresorerie.soldeFinal - tresorerie.soldeInitial)
    ) < 1000; // Tolérance 1000 CDF

    if (!equilibreBudgetaire) {
      alertes.push('⚠️ Incohérence entre budget et trésorerie');
    }

    // 2. Équilibre comptable (SYSCOHADA)
    const equilibreComptable = comptabilite.totalActif === comptabilite.totalPassif;
    
    if (!equilibreComptable) {
      alertes.push('❌ Déséquilibre comptable: Actif ≠ Passif');
    }

    // 3. Cohérence Recettes ↔ Trésorerie
    const coherenceRecettesTresorerie = Math.abs(
      recettes.encaissements - tresorerie.encaissements
    ) < 1000;

    if (!coherenceRecettesTresorerie) {
      alertes.push('⚠️ Écart entre recettes encaissées et flux de trésorerie entrants');
    }

    // 4. Cohérence Dépenses ↔ Trésorerie
    const coherenceDepensesTresorerie = Math.abs(
      depenses.paiements - tresorerie.decaissements
    ) < 1000;

    if (!coherenceDepensesTresorerie) {
      alertes.push('⚠️ Écart entre dépenses payées et flux de trésorerie sortants');
    }

    // 5. Cohérence Budget ↔ Comptabilité
    const coherenceBudgetComptabilite = Math.abs(
      (recettes.encaissements - depenses.paiements) - comptabilite.resultatExercice
    ) < 10000; // Tolérance plus large

    if (!coherenceBudgetComptabilite) {
      alertes.push('⚠️ Écart entre résultat budgétaire et résultat comptable');
    }

    // 6. Vérifications supplémentaires
    if (budget.engagements > budget.budgetRevise) {
      alertes.push('❌ Dépassement budgétaire: Engagements > Budget révisé');
    }

    if (depenses.paiements > depenses.engagements) {
      alertes.push('❌ Anomalie: Paiements > Engagements (violation OHADA)');
    }

    if (tresorerie.ratioLiquidite < 0.5) {
      alertes.push('⚠️ Ratio de liquidité faible: Risque de trésorerie');
    }

    if (recettes.creancesDouteuses / recettes.previsions > 0.15) {
      alertes.push('⚠️ Créances douteuses élevées (>15%)');
    }

    return {
      equilibreBudgetaire,
      equilibreComptable,
      coherenceRecettesTresorerie,
      coherenceDepensesTresorerie,
      coherenceBudgetComptabilite,
      alertes
    };
  }

  /**
   * Génère les écritures comptables à partir des opérations budgétaires
   * Assure la traçabilité Budget → Comptabilité
   */
  static async genererEcrituresComptables(
    module: 'Budget' | 'Recettes' | 'Depenses',
    operation: any
  ): Promise<FluxComptable> {
    // Mapping selon SYSCOHADA (à utiliser pour génération automatique)
    /* const mappingComptes = {
      // Recettes (Classe 7)
      'Recettes-Fiscales': { debit: '512', credit: '701' }, // Banque / Ventes
      'Recettes-NonFiscales': { debit: '512', credit: '706' }, // Banque / Prestations
      'Recettes-Exceptionnelles': { debit: '512', credit: '771' }, // Banque / Produits exceptionnels
      
      // Dépenses (Classe 6)
      'Depenses-Personnel': { debit: '661', credit: '512' }, // Salaires / Banque
      'Depenses-Fonctionnement': { debit: '604', credit: '512' }, // Achats / Banque
      'Depenses-Investissement': { debit: '241', credit: '512' }, // Immobilisations / Banque
      
      // Budget
      'Budget-Engagement': { debit: '409', credit: '512' }, // Fournisseurs / Banque
      'Budget-Realisation': { debit: '604', credit: '401' } // Achats / Fournisseurs
    }; */

    // Générer le flux comptable
    const flux: FluxComptable = {
      date: new Date().toISOString(),
      module,
      operation: operation.type || 'Operation',
      montant: operation.montant || 0,
      compteDebit: '512', // Par défaut
      compteCredit: '401', // Par défaut
      reference: operation.reference || `${module}-${Date.now()}`,
      statut: 'Brouillon'
    };

    return flux;
  }

  /**
   * Vérifie la conformité aux normes IPSAS/SYSCOHADA
   */
  static async verifierConformite(exercice: string): Promise<{
    conforme: boolean;
    score: number;
    details: {
      ipsas1: boolean; // États financiers
      ipsas2: boolean; // Flux de trésorerie
      ipsas23: boolean; // Recettes
      ipsas24: boolean; // Budget
      syscohada: boolean; // Plan comptable
      coso: boolean; // Contrôle interne
    };
    recommandations: string[];
  }> {
    const donnees = await this.consoliderDonnees(exercice);
    
    const details = {
      ipsas1: donnees.comptabilite.equilibreComptable,
      ipsas2: donnees.tresorerie.ratioLiquidite > 0.3,
      ipsas23: donnees.recettes.tauxRecouvrement > 60,
      ipsas24: donnees.budget.tauxEngagement <= 100,
      syscohada: donnees.comptabilite.equilibreComptable,
      coso: donnees.controles.alertes.length < 3
    };

    const score = Object.values(details).filter(Boolean).length / Object.keys(details).length * 100;
    const conforme = score >= 80;

    const recommandations: string[] = [];
    
    if (!details.ipsas1) recommandations.push('Rétablir l\'équilibre comptable (Actif = Passif)');
    if (!details.ipsas2) recommandations.push('Améliorer le ratio de liquidité (objectif > 0.5)');
    if (!details.ipsas23) recommandations.push('Renforcer le recouvrement des recettes');
    if (!details.ipsas24) recommandations.push('Contrôler les engagements budgétaires');
    if (!details.syscohada) recommandations.push('Vérifier le plan comptable SYSCOHADA');
    if (!details.coso) recommandations.push('Résoudre les alertes de contrôle interne');

    return {
      conforme,
      score,
      details,
      recommandations
    };
  }

  /**
   * Génère un rapport d'intégration complet
   */
  static async genererRapportIntegration(exercice: string): Promise<string> {
    const donnees = await this.consoliderDonnees(exercice);
    const conformite = await this.verifierConformite(exercice);

    let rapport = `
╔═══════════════════════════════════════════════════════════════╗
║     RAPPORT D'INTÉGRATION FINANCIÈRE ET COMPTABLE            ║
║     Exercice: ${exercice}                                     ║
║     Date: ${new Date().toLocaleDateString('fr-FR')}          ║
╚═══════════════════════════════════════════════════════════════╝

📊 SYNTHÈSE CONSOLIDÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Budget (IPSAS 24):
  • Budget révisé:     ${donnees.budget.budgetRevise.toLocaleString()} CDF
  • Engagements:       ${donnees.budget.engagements.toLocaleString()} CDF (${donnees.budget.tauxEngagement}%)
  • Réalisations:      ${donnees.budget.realisations.toLocaleString()} CDF (${donnees.budget.tauxRealisation}%)
  • Disponible:        ${donnees.budget.disponible.toLocaleString()} CDF

Recettes (IPSAS 23):
  • Prévisions:        ${donnees.recettes.previsions.toLocaleString()} CDF
  • Encaissements:     ${donnees.recettes.encaissements.toLocaleString()} CDF
  • Taux recouvrement: ${donnees.recettes.tauxRecouvrement.toFixed(1)}%
  • Créances douteuses: ${donnees.recettes.creancesDouteuses.toLocaleString()} CDF

Dépenses (OHADA):
  • Crédits:           ${donnees.depenses.credits.toLocaleString()} CDF
  • Engagements:       ${donnees.depenses.engagements.toLocaleString()} CDF
  • Paiements:         ${donnees.depenses.paiements.toLocaleString()} CDF
  • Restes à payer:    ${donnees.depenses.restesAPayer.toLocaleString()} CDF

Trésorerie (IPSAS 2):
  • Solde initial:     ${donnees.tresorerie.soldeInitial.toLocaleString()} CDF
  • Solde final:       ${donnees.tresorerie.soldeFinal.toLocaleString()} CDF
  • Ratio liquidité:   ${donnees.tresorerie.ratioLiquidite.toFixed(2)}
  • Autonomie:         ${donnees.tresorerie.joursAutonomie} jours

Comptabilité (SYSCOHADA):
  • Total Actif:       ${donnees.comptabilite.totalActif.toLocaleString()} CDF
  • Total Passif:      ${donnees.comptabilite.totalPassif.toLocaleString()} CDF
  • Résultat:          ${donnees.comptabilite.resultatExercice.toLocaleString()} CDF
  • Équilibre:         ${donnees.comptabilite.equilibreComptable ? '✅ OUI' : '❌ NON'}

✅ CONTRÔLES DE COHÉRENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${donnees.controles.equilibreBudgetaire ? '✅' : '❌'} Équilibre budgétaire
${donnees.controles.equilibreComptable ? '✅' : '❌'} Équilibre comptable
${donnees.controles.coherenceRecettesTresorerie ? '✅' : '❌'} Cohérence Recettes ↔ Trésorerie
${donnees.controles.coherenceDepensesTresorerie ? '✅' : '❌'} Cohérence Dépenses ↔ Trésorerie
${donnees.controles.coherenceBudgetComptabilite ? '✅' : '❌'} Cohérence Budget ↔ Comptabilité

${donnees.controles.alertes.length > 0 ? `
⚠️  ALERTES (${donnees.controles.alertes.length}):
${donnees.controles.alertes.map(a => `  • ${a}`).join('\n')}
` : '✅ Aucune alerte'}

📋 CONFORMITÉ NORMES INTERNATIONALES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Score global: ${conformite.score.toFixed(1)}% ${conformite.conforme ? '✅ CONFORME' : '⚠️ NON CONFORME'}

${conformite.details.ipsas1 ? '✅' : '❌'} IPSAS 1  - États financiers
${conformite.details.ipsas2 ? '✅' : '❌'} IPSAS 2  - Flux de trésorerie
${conformite.details.ipsas23 ? '✅' : '❌'} IPSAS 23 - Recettes
${conformite.details.ipsas24 ? '✅' : '❌'} IPSAS 24 - Budget
${conformite.details.syscohada ? '✅' : '❌'} SYSCOHADA - Plan comptable
${conformite.details.coso ? '✅' : '❌'} COSO - Contrôle interne

${conformite.recommandations.length > 0 ? `
💡 RECOMMANDATIONS:
${conformite.recommandations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rapport généré par IntegrationFinanciereService
Système Intégré de Gestion des Finances Publiques (SIGFP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    return rapport.trim();
  }
}
