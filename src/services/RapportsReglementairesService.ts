import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Service de génération des rapports réglementaires
 * Conforme aux standards internationaux (TOFE, PEFA, etc.)
 */

export interface TOFEData {
  recettes: {
    fiscales: number;
    non_fiscales: number;
    dons: number;
    total: number;
  };
  depenses: {
    personnel: number;
    biens_services: number;
    transferts: number;
    investissement: number;
    dette: number;
    total: number;
  };
  solde: {
    primaire: number;
    global: number;
    base_caisse: number;
  };
  financement: {
    interieur: number;
    exterieur: number;
    total: number;
  };
}

export interface RapportPerformanceBudgetaire {
  budget_initial: number;
  budget_revise: number;
  credits_ouverts: number;
  engagements: number;
  liquidations: number;
  ordonnancements: number;
  paiements: number;
  taux_execution: number;
  taux_consommation: number;
}

export interface RapportDettePublique {
  dette_interieure: {
    court_terme: number;
    moyen_terme: number;
    long_terme: number;
    total: number;
  };
  dette_exterieure: {
    bilaterale: number;
    multilaterale: number;
    commerciale: number;
    total: number;
  };
  service_dette: {
    principal: number;
    interets: number;
    total: number;
  };
  ratio_dette_pib: number;
  ratio_service_recettes: number;
}

export class RapportsReglementairesService {
  /**
   * Génère le Tableau des Opérations Financières de l'État (TOFE)
   */
  static async genererTOFE(
    exerciceId: string,
    periode: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL',
    dateDebut: string,
    dateFin: string
  ): Promise<TOFEData> {
    try {
      // Récupérer les recettes
      const { data: recettes } = await supabase
        .from('recettes')
        .select('montant, type_recette')
        .eq('exercice_id', exerciceId)
        .gte('date_recette', dateDebut)
        .lte('date_recette', dateFin)
        .eq('statut', 'Encaissé');

      const recettesFiscales = recettes
        ?.filter(r => r.type_recette === 'Fiscale')
        .reduce((sum, r) => sum + r.montant, 0) || 0;

      const recettesNonFiscales = recettes
        ?.filter(r => r.type_recette === 'Non Fiscale')
        .reduce((sum, r) => sum + r.montant, 0) || 0;

      const dons = recettes
        ?.filter(r => r.type_recette === 'Don')
        .reduce((sum, r) => sum + r.montant, 0) || 0;

      // Récupérer les dépenses
      const { data: depenses } = await supabase
        .from('depenses')
        .select('montant, categorie')
        .eq('exercice_id', exerciceId)
        .gte('date_depense', dateDebut)
        .lte('date_depense', dateFin)
        .eq('statut', 'Payé');

      const depensesPersonnel = depenses
        ?.filter(d => d.categorie === 'Personnel')
        .reduce((sum, d) => sum + d.montant, 0) || 0;

      const depensesBiensServices = depenses
        ?.filter(d => d.categorie === 'Biens et Services')
        .reduce((sum, d) => sum + d.montant, 0) || 0;

      const depensesTransferts = depenses
        ?.filter(d => d.categorie === 'Transferts')
        .reduce((sum, d) => sum + d.montant, 0) || 0;

      const depensesInvestissement = depenses
        ?.filter(d => d.categorie === 'Investissement')
        .reduce((sum, d) => sum + d.montant, 0) || 0;

      const depensesDette = depenses
        ?.filter(d => d.categorie === 'Service de la Dette')
        .reduce((sum, d) => sum + d.montant, 0) || 0;

      const totalRecettes = recettesFiscales + recettesNonFiscales + dons;
      const totalDepenses = depensesPersonnel + depensesBiensServices + 
                           depensesTransferts + depensesInvestissement + depensesDette;

      const soldePrimaire = totalRecettes - (totalDepenses - depensesDette);
      const soldeGlobal = totalRecettes - totalDepenses;

      // Récupérer le financement
      const { data: financements } = await supabase
        .from('financements')
        .select('montant, type_financement')
        .eq('exercice_id', exerciceId)
        .gte('date_financement', dateDebut)
        .lte('date_financement', dateFin);

      const financementInterieur = financements
        ?.filter(f => f.type_financement === 'Intérieur')
        .reduce((sum, f) => sum + f.montant, 0) || 0;

      const financementExterieur = financements
        ?.filter(f => f.type_financement === 'Extérieur')
        .reduce((sum, f) => sum + f.montant, 0) || 0;

      return {
        recettes: {
          fiscales: recettesFiscales,
          non_fiscales: recettesNonFiscales,
          dons,
          total: totalRecettes
        },
        depenses: {
          personnel: depensesPersonnel,
          biens_services: depensesBiensServices,
          transferts: depensesTransferts,
          investissement: depensesInvestissement,
          dette: depensesDette,
          total: totalDepenses
        },
        solde: {
          primaire: soldePrimaire,
          global: soldeGlobal,
          base_caisse: soldeGlobal + financementInterieur + financementExterieur
        },
        financement: {
          interieur: financementInterieur,
          exterieur: financementExterieur,
          total: financementInterieur + financementExterieur
        }
      };
    } catch (error) {
      console.error('Erreur lors de la génération du TOFE:', error);
      throw error;
    }
  }

  /**
   * Génère le rapport de performance budgétaire
   */
  static async genererRapportPerformance(
    exerciceId: string,
    entiteId?: string
  ): Promise<RapportPerformanceBudgetaire> {
    try {
      let query = supabase
        .from('budget_items')
        .select('*')
        .eq('exercice_id', exerciceId);

      if (entiteId) {
        query = query.eq('entite_id', entiteId);
      }

      const { data: budgetItems } = await query;

      const budgetInitial = budgetItems?.reduce((sum, item) => sum + (item.budget_initial || 0), 0) || 0;
      const budgetRevise = budgetItems?.reduce((sum, item) => sum + (item.budget_revise || 0), 0) || 0;
      const creditsOuverts = budgetItems?.reduce((sum, item) => sum + (item.credits_ouverts || 0), 0) || 0;
      const engagements = budgetItems?.reduce((sum, item) => sum + (item.engagements || 0), 0) || 0;
      const liquidations = budgetItems?.reduce((sum, item) => sum + (item.liquidations || 0), 0) || 0;
      const ordonnancements = budgetItems?.reduce((sum, item) => sum + (item.ordonnancements || 0), 0) || 0;
      const paiements = budgetItems?.reduce((sum, item) => sum + (item.paiements || 0), 0) || 0;

      const tauxExecution = budgetRevise > 0 ? (paiements / budgetRevise) * 100 : 0;
      const tauxConsommation = creditsOuverts > 0 ? (engagements / creditsOuverts) * 100 : 0;

      return {
        budget_initial: budgetInitial,
        budget_revise: budgetRevise,
        credits_ouverts: creditsOuverts,
        engagements,
        liquidations,
        ordonnancements,
        paiements,
        taux_execution: tauxExecution,
        taux_consommation: tauxConsommation
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de performance:', error);
      throw error;
    }
  }

  /**
   * Génère le rapport de la dette publique
   */
  static async genererRapportDette(exerciceId: string): Promise<RapportDettePublique> {
    try {
      const { data: dettes } = await supabase
        .from('dette_publique')
        .select('*')
        .eq('exercice_id', exerciceId);

      const detteInterieureCT = dettes
        ?.filter(d => d.type === 'Intérieure' && d.echeance === 'Court Terme')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const detteInterieureMT = dettes
        ?.filter(d => d.type === 'Intérieure' && d.echeance === 'Moyen Terme')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const detteInterieureLT = dettes
        ?.filter(d => d.type === 'Intérieure' && d.echeance === 'Long Terme')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const detteExterieureBilaterale = dettes
        ?.filter(d => d.type === 'Extérieure' && d.categorie === 'Bilatérale')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const detteExterieureMultilaterale = dettes
        ?.filter(d => d.type === 'Extérieure' && d.categorie === 'Multilatérale')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const detteExterieureCommerciale = dettes
        ?.filter(d => d.type === 'Extérieure' && d.categorie === 'Commerciale')
        .reduce((sum, d) => sum + d.montant_principal, 0) || 0;

      const servicePrincipal = dettes?.reduce((sum, d) => sum + (d.remboursement_principal || 0), 0) || 0;
      const serviceInterets = dettes?.reduce((sum, d) => sum + (d.paiement_interets || 0), 0) || 0;

      // Récupérer le PIB (à stocker dans une table de paramètres)
      const { data: parametres } = await supabase
        .from('parametres_economiques')
        .select('pib')
        .eq('exercice_id', exerciceId)
        .single();

      const pib = parametres?.pib || 1;

      // Récupérer les recettes totales
      const { data: recettes } = await supabase
        .from('recettes')
        .select('montant')
        .eq('exercice_id', exerciceId)
        .eq('statut', 'Encaissé');

      const totalRecettes = recettes?.reduce((sum, r) => sum + r.montant, 0) || 1;

      const totalDetteInterieure = detteInterieureCT + detteInterieureMT + detteInterieureLT;
      const totalDetteExterieure = detteExterieureBilaterale + detteExterieureMultilaterale + detteExterieureCommerciale;
      const totalDette = totalDetteInterieure + totalDetteExterieure;

      return {
        dette_interieure: {
          court_terme: detteInterieureCT,
          moyen_terme: detteInterieureMT,
          long_terme: detteInterieureLT,
          total: totalDetteInterieure
        },
        dette_exterieure: {
          bilaterale: detteExterieureBilaterale,
          multilaterale: detteExterieureMultilaterale,
          commerciale: detteExterieureCommerciale,
          total: totalDetteExterieure
        },
        service_dette: {
          principal: servicePrincipal,
          interets: serviceInterets,
          total: servicePrincipal + serviceInterets
        },
        ratio_dette_pib: (totalDette / pib) * 100,
        ratio_service_recettes: ((servicePrincipal + serviceInterets) / totalRecettes) * 100
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport de dette:', error);
      throw error;
    }
  }

  /**
   * Exporte le TOFE en Excel
   */
  static async exporterTOFEExcel(tofe: TOFEData, exercice: string, periode: string): Promise<void> {
    const data = [
      ['TABLEAU DES OPERATIONS FINANCIERES DE L\'ETAT (TOFE)'],
      [`Exercice: ${exercice}`, `Période: ${periode}`],
      [],
      ['I. RECETTES'],
      ['Recettes fiscales', tofe.recettes.fiscales],
      ['Recettes non fiscales', tofe.recettes.non_fiscales],
      ['Dons', tofe.recettes.dons],
      ['TOTAL RECETTES', tofe.recettes.total],
      [],
      ['II. DEPENSES'],
      ['Personnel', tofe.depenses.personnel],
      ['Biens et services', tofe.depenses.biens_services],
      ['Transferts', tofe.depenses.transferts],
      ['Investissement', tofe.depenses.investissement],
      ['Service de la dette', tofe.depenses.dette],
      ['TOTAL DEPENSES', tofe.depenses.total],
      [],
      ['III. SOLDES'],
      ['Solde primaire', tofe.solde.primaire],
      ['Solde global', tofe.solde.global],
      ['Solde base caisse', tofe.solde.base_caisse],
      [],
      ['IV. FINANCEMENT'],
      ['Financement intérieur', tofe.financement.interieur],
      ['Financement extérieur', tofe.financement.exterieur],
      ['TOTAL FINANCEMENT', tofe.financement.total]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TOFE');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `TOFE_${exercice}_${periode}.xlsx`);
  }

  /**
   * Exporte le rapport de performance en Excel
   */
  static async exporterPerformanceExcel(
    rapport: RapportPerformanceBudgetaire,
    exercice: string,
    entite: string
  ): Promise<void> {
    const data = [
      ['RAPPORT DE PERFORMANCE BUDGETAIRE'],
      [`Exercice: ${exercice}`, `Entité: ${entite}`],
      [],
      ['Indicateur', 'Montant (CDF)', 'Taux (%)'],
      ['Budget initial', rapport.budget_initial, ''],
      ['Budget révisé', rapport.budget_revise, ''],
      ['Crédits ouverts', rapport.credits_ouverts, ''],
      ['Engagements', rapport.engagements, rapport.taux_consommation.toFixed(2)],
      ['Liquidations', rapport.liquidations, ''],
      ['Ordonnancements', rapport.ordonnancements, ''],
      ['Paiements', rapport.paiements, rapport.taux_execution.toFixed(2)],
      [],
      ['INDICATEURS DE PERFORMANCE'],
      ['Taux d\'exécution budgétaire', '', rapport.taux_execution.toFixed(2) + '%'],
      ['Taux de consommation des crédits', '', rapport.taux_consommation.toFixed(2) + '%']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performance');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Performance_Budgetaire_${exercice}_${entite}.xlsx`);
  }

  /**
   * Exporte le rapport de dette en Excel
   */
  static async exporterDetteExcel(dette: RapportDettePublique, exercice: string): Promise<void> {
    const data = [
      ['RAPPORT DE LA DETTE PUBLIQUE'],
      [`Exercice: ${exercice}`],
      [],
      ['I. DETTE INTERIEURE'],
      ['Court terme', dette.dette_interieure.court_terme],
      ['Moyen terme', dette.dette_interieure.moyen_terme],
      ['Long terme', dette.dette_interieure.long_terme],
      ['TOTAL DETTE INTERIEURE', dette.dette_interieure.total],
      [],
      ['II. DETTE EXTERIEURE'],
      ['Bilatérale', dette.dette_exterieure.bilaterale],
      ['Multilatérale', dette.dette_exterieure.multilaterale],
      ['Commerciale', dette.dette_exterieure.commerciale],
      ['TOTAL DETTE EXTERIEURE', dette.dette_exterieure.total],
      [],
      ['III. SERVICE DE LA DETTE'],
      ['Principal', dette.service_dette.principal],
      ['Intérêts', dette.service_dette.interets],
      ['TOTAL SERVICE', dette.service_dette.total],
      [],
      ['IV. RATIOS'],
      ['Dette / PIB (%)', dette.ratio_dette_pib.toFixed(2)],
      ['Service dette / Recettes (%)', dette.ratio_service_recettes.toFixed(2)]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dette Publique');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Dette_Publique_${exercice}.xlsx`);
  }

  /**
   * Génère un rapport consolidé pour les organismes internationaux (FMI, Banque Mondiale)
   */
  static async genererRapportInternational(
    exerciceId: string,
    format: 'GFS' | 'COFOG' | 'GFSM2014'
  ): Promise<any> {
    // Implémentation selon le format demandé
    // GFS: Government Finance Statistics
    // COFOG: Classification of the Functions of Government
    // GFSM2014: Government Finance Statistics Manual 2014
    
        
    // À implémenter selon les besoins spécifiques
    return {
      format,
      exercice_id: exerciceId,
      date_generation: new Date().toISOString(),
      status: 'EN_COURS'
    };
  }
}
