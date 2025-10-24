/**
 * Service d'intégration comptable
 * Connecte le système comptable avec tous les autres modules
 */

import { EcritureComptableService } from './EcritureComptableService';
import { ValidationComptableService } from './ValidationComptableService';
import type { LigneEcriture, SensEcriture } from '../types/comptabilite';
import type { DepenseItem, RecetteItem, BudgetItem, Agent } from '../contexts/DataContext';

export class IntegrationComptableService {
  
  // ============================================================================
  // INTÉGRATION MODULE DÉPENSES
  // ============================================================================

  /**
   * Comptabilise une dépense (engagement → liquidation → paiement)
   */
  static async comptabiliserDepense(
    depense: DepenseItem,
    phase: 'ENGAGEMENT' | 'LIQUIDATION' | 'PAIEMENT',
    exerciceId: string,
    userId: string,
    options?: {
      numeroFacture?: string;
      modePaiement?: 'BANQUE' | 'CAISSE';
      reference?: string;
    }
  ) {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [];
    let journalCode = 'AC';
    let montant = 0;
    let libelle = '';
    let reference = options?.reference || `DEP-${depense.code}`;

    switch (phase) {
      case 'ENGAGEMENT':
        montant = depense.montantEngage;
        libelle = `Engagement - ${depense.libelle}`;
        lignes.push(
          {
            numero_ligne: 1,
            compte_numero: depense.code,
            compte_libelle: depense.libelle,
            libelle,
            sens: 'DEBIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference,
            analytique: { centre_cout: depense.entite }
          },
          {
            numero_ligne: 2,
            compte_numero: '408',
            compte_libelle: 'Fournisseurs - Factures non parvenues',
            libelle,
            sens: 'CREDIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference
          }
        );
        break;

      case 'LIQUIDATION':
        montant = depense.montantLiquide;
        libelle = `Liquidation - ${depense.libelle}`;
        reference = options?.numeroFacture || reference;
        lignes.push(
          {
            numero_ligne: 1,
            compte_numero: '408',
            compte_libelle: 'Fournisseurs - Factures non parvenues',
            libelle,
            sens: 'DEBIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference
          },
          {
            numero_ligne: 2,
            compte_numero: '401',
            compte_libelle: 'Fournisseurs',
            libelle,
            sens: 'CREDIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference
          }
        );
        break;

      case 'PAIEMENT':
        montant = depense.montantPaye;
        libelle = `Paiement - ${depense.libelle}`;
        const modePaiement = options?.modePaiement || 'BANQUE';
        journalCode = modePaiement === 'BANQUE' ? 'BQ' : 'CA';
        const compteTresorerie = modePaiement === 'BANQUE' ? '521' : '571';
        lignes.push(
          {
            numero_ligne: 1,
            compte_numero: '401',
            compte_libelle: 'Fournisseurs',
            libelle,
            sens: 'DEBIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference
          },
          {
            numero_ligne: 2,
            compte_numero: compteTresorerie,
            compte_libelle: modePaiement === 'BANQUE' ? 'Banques' : 'Caisse',
            libelle,
            sens: 'CREDIT' as SensEcriture,
            montant,
            devise: 'XAF',
            piece_justificative: reference
          }
        );
        break;
    }

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: journalCode,
        journal_libelle: journalCode === 'AC' ? 'Journal des achats' : 
                        journalCode === 'BQ' ? 'Journal de banque' : 'Journal de caisse',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle,
        reference_piece: reference,
        montant_total: montant,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  // ============================================================================
  // INTÉGRATION MODULE RECETTES
  // ============================================================================

  /**
   * Comptabilise une recette encaissée
   */
  static async comptabiliserRecette(
    recette: RecetteItem,
    montantEncaisse: number,
    exerciceId: string,
    userId: string,
    modePaiement: 'BANQUE' | 'CAISSE',
    reference: string
  ) {
    const compteTresorerie = modePaiement === 'BANQUE' ? '521' : '571';
    const journalCode = modePaiement === 'BANQUE' ? 'BQ' : 'CA';

    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: compteTresorerie,
        compte_libelle: modePaiement === 'BANQUE' ? 'Banques' : 'Caisse',
        libelle: `Encaissement - ${recette.libelle}`,
        sens: 'DEBIT' as SensEcriture,
        montant: montantEncaisse,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: recette.code,
        compte_libelle: recette.libelle,
        libelle: `Encaissement - ${recette.libelle}`,
        sens: 'CREDIT' as SensEcriture,
        montant: montantEncaisse,
        devise: 'XAF',
        piece_justificative: reference,
        analytique: { centre_cout: recette.entite }
      }
    ];

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: journalCode,
        journal_libelle: modePaiement === 'BANQUE' ? 'Journal de banque' : 'Journal de caisse',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: `Encaissement - ${recette.libelle}`,
        reference_piece: reference,
        montant_total: montantEncaisse,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  // ============================================================================
  // INTÉGRATION MODULE RH (PAIE)
  // ============================================================================

  /**
   * Comptabilise la paie d'un agent
   */
  static async comptabiliserPaie(
    agent: Agent,
    exerciceId: string,
    userId: string,
    periode: string
  ) {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: '661',
        compte_libelle: 'Salaires',
        libelle: `Salaire - ${agent.nom} ${agent.prenom}`,
        sens: 'DEBIT' as SensEcriture,
        montant: agent.salaireBrut + agent.primes,
        devise: 'XAF',
        piece_justificative: `PAIE-${periode}-${agent.matricule}`,
        analytique: { centre_cout: agent.entite }
      },
      {
        numero_ligne: 2,
        compte_numero: '442',
        compte_libelle: 'État - IPR',
        libelle: `IPR - ${agent.nom}`,
        sens: 'CREDIT' as SensEcriture,
        montant: agent.ipr,
        devise: 'XAF',
        piece_justificative: `PAIE-${periode}-${agent.matricule}`
      },
      {
        numero_ligne: 3,
        compte_numero: '431',
        compte_libelle: 'INSS',
        libelle: `INSS - ${agent.nom}`,
        sens: 'CREDIT' as SensEcriture,
        montant: agent.inss,
        devise: 'XAF',
        piece_justificative: `PAIE-${periode}-${agent.matricule}`
      },
      {
        numero_ligne: 4,
        compte_numero: '421',
        compte_libelle: 'Personnel - Rémunérations dues',
        libelle: `Net à payer - ${agent.nom}`,
        sens: 'CREDIT' as SensEcriture,
        montant: agent.salaireNet,
        devise: 'XAF',
        piece_justificative: `PAIE-${periode}-${agent.matricule}`
      }
    ];

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: 'OD',
        journal_libelle: 'Opérations diverses',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: periode,
        exercice_id: exerciceId,
        libelle: `Paie ${periode} - ${agent.nom} ${agent.prenom}`,
        reference_piece: `PAIE-${periode}-${agent.matricule}`,
        montant_total: agent.salaireBrut + agent.primes,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  /**
   * Comptabilise le paiement des salaires
   */
  static async comptabiliserPaiementSalaires(
    totalSalaires: number,
    exerciceId: string,
    userId: string,
    periode: string,
    reference: string
  ) {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: '421',
        compte_libelle: 'Personnel - Rémunérations dues',
        libelle: `Paiement salaires ${periode}`,
        sens: 'DEBIT' as SensEcriture,
        montant: totalSalaires,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: '521',
        compte_libelle: 'Banques',
        libelle: `Virement salaires ${periode}`,
        sens: 'CREDIT' as SensEcriture,
        montant: totalSalaires,
        devise: 'XAF',
        piece_justificative: reference
      }
    ];

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: 'BQ',
        journal_libelle: 'Journal de banque',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: periode,
        exercice_id: exerciceId,
        libelle: `Paiement des salaires ${periode}`,
        reference_piece: reference,
        montant_total: totalSalaires,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  // ============================================================================
  // INTÉGRATION MODULE BUDGET
  // ============================================================================

  /**
   * Comptabilise un engagement budgétaire
   */
  static async comptabiliserEngagementBudget(
    budgetItem: BudgetItem,
    montantEngage: number,
    exerciceId: string,
    userId: string
  ) {
    const disponible = await ValidationComptableService.verifierDisponibiliteBudgetaire(
      budgetItem.id,
      montantEngage
    );

    if (!disponible) {
      throw new Error('Budget insuffisant');
    }

    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: budgetItem.code,
        compte_libelle: budgetItem.libelle,
        libelle: `Engagement - ${budgetItem.libelle}`,
        sens: 'DEBIT' as SensEcriture,
        montant: montantEngage,
        devise: 'XAF',
        piece_justificative: `ENG-${budgetItem.code}`,
        analytique: { centre_cout: budgetItem.entite, projet: budgetItem.exercice }
      },
      {
        numero_ligne: 2,
        compte_numero: '4091',
        compte_libelle: 'Engagements budgétaires',
        libelle: `Engagement - ${budgetItem.libelle}`,
        sens: 'CREDIT' as SensEcriture,
        montant: montantEngage,
        devise: 'XAF',
        piece_justificative: `ENG-${budgetItem.code}`
      }
    ];

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: 'OD',
        journal_libelle: 'Opérations diverses',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: `Engagement budgétaire - ${budgetItem.libelle}`,
        reference_piece: `ENG-${budgetItem.code}`,
        montant_total: montantEngage,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  // ============================================================================
  // INTÉGRATION MODULE TRÉSORERIE
  // ============================================================================

  /**
   * Comptabilise un virement bancaire
   */
  static async comptabiliserVirement(
    montant: number,
    compteSource: string,
    compteDestination: string,
    libelle: string,
    exerciceId: string,
    userId: string,
    reference: string
  ) {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: compteDestination,
        compte_libelle: 'Compte destination',
        libelle,
        sens: 'DEBIT' as SensEcriture,
        montant,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: compteSource,
        compte_libelle: 'Compte source',
        libelle,
        sens: 'CREDIT' as SensEcriture,
        montant,
        devise: 'XAF',
        piece_justificative: reference
      }
    ];

    return await EcritureComptableService.creerEcriture(
      {
        journal_code: 'BQ',
        journal_libelle: 'Journal de banque',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle,
        reference_piece: reference,
        montant_total: montant,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  /**
   * Valide et comptabilise automatiquement
   */
  static async validerEtComptabiliser(
    ecritureId: string,
    validateurId: string,
    comptabilisateurId: string
  ) {
    const valide = await EcritureComptableService.validerEcriture(ecritureId, validateurId);
    if (!valide) throw new Error('Échec validation');

    const comptabilise = await EcritureComptableService.comptabiliserEcriture(
      ecritureId,
      comptabilisateurId
    );
    if (!comptabilise) throw new Error('Échec comptabilisation');

    return true;
  }
}
