/**
 * Service de validation et contrôle comptable
 * Vérifie la conformité et la cohérence des données comptables
 */

import { supabase } from '../lib/supabase';
import type { 
  EcritureComptable,
  AnomalieComptable,
  RegleControle
} from '../types/comptabilite';
import { GrandLivreService } from './GrandLivreService';

export class ValidationComptableService {
  
  // ============================================================================
  // RÈGLES DE CONTRÔLE
  // ============================================================================

  /**
   * Récupère toutes les règles de contrôle actives
   */
  static async getReglesControle(): Promise<RegleControle[]> {
    const { data, error } = await supabase
      .from('regles_controle')
      .select('*')
      .eq('est_active', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des règles:', error);
      return [];
    }

    return data || [];
  }

  // ============================================================================
  // VALIDATION DES ÉCRITURES
  // ============================================================================

  /**
   * Valide une écriture comptable
   */
  static async validerEcriture(ecritureId: string): Promise<{
    estValide: boolean;
    anomalies: AnomalieComptable[];
  }> {
    const { data: ecriture } = await supabase
      .from('ecritures_comptables')
      .select('*, lignes:lignes_ecritures(*)')
      .eq('id', ecritureId)
      .single();

    if (!ecriture) {
      return { estValide: false, anomalies: [] };
    }

    const anomalies: AnomalieComptable[] = [];

    // Contrôle 1: Équilibre débit/crédit
    const equilibre = this.controlerEquilibre(ecriture);
    if (equilibre) {
      anomalies.push(equilibre);
    }

    // Contrôle 2: Existence des comptes
    const comptesInvalides = await this.controlerExistenceComptes(ecriture);
    anomalies.push(...comptesInvalides);

    // Contrôle 3: Cohérence des dates
    const dateInvalide = this.controlerDates(ecriture);
    if (dateInvalide) {
      anomalies.push(dateInvalide);
    }

    // Contrôle 4: Montants positifs
    const montantsInvalides = this.controlerMontants(ecriture);
    anomalies.push(...montantsInvalides);

    // Contrôle 5: Libellés renseignés
    const libellesManquants = this.controlerLibelles(ecriture);
    anomalies.push(...libellesManquants);

    // Contrôle 7: Multi-devise
    const multiDeviseAnomalie = this.controlerMultiDevise(ecriture);
    if (multiDeviseAnomalie) {
      anomalies.push(multiDeviseAnomalie);
    }

    // Enregistrer les anomalies
    if (anomalies.length > 0) {
      await this.enregistrerAnomalies(anomalies);
    }

    const estValide = !anomalies.some(a => a.severite === 'BLOQUANT' || a.severite === 'ERREUR');

    return { estValide, anomalies };
  }

  /**
   * Contrôle l'équilibre débit/crédit
   */
  private static controlerEquilibre(ecriture: EcritureComptable): AnomalieComptable | null {
    const totalDebit = ecriture.lignes
      .filter(l => l.sens === 'DEBIT')
      .reduce((sum, l) => sum + l.montant, 0);

    const totalCredit = ecriture.lignes
      .filter(l => l.sens === 'CREDIT')
      .reduce((sum, l) => sum + l.montant, 0);

    const ecart = Math.abs(totalDebit - totalCredit);

    if (ecart >= 0.01) {
      return {
        id: crypto.randomUUID(),
        ecriture_id: ecriture.id,
        regle_id: 'CTRL_001',
        type: 'EQUILIBRE',
        severite: 'BLOQUANT',
        description: 'Écriture non équilibrée',
        details: {
          totalDebit,
          totalCredit,
          ecart
        },
        statut: 'DETECTEE',
        date_detection: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Contrôle l'existence des comptes
   */
  private static async controlerExistenceComptes(
    ecriture: EcritureComptable
  ): Promise<AnomalieComptable[]> {
    const anomalies: AnomalieComptable[] = [];

    for (const ligne of ecriture.lignes) {
      const { data: compte } = await supabase
        .from('comptes_comptables')
        .select('id')
        .eq('numero', ligne.compte_numero)
        .eq('exercice_id', ecriture.exercice_id)
        .single();

      if (!compte) {
        anomalies.push({
          id: crypto.randomUUID(),
          ecriture_id: ecriture.id,
          regle_id: 'CTRL_002',
          type: 'COHERENCE',
          severite: 'BLOQUANT',
          description: `Compte inexistant: ${ligne.compte_numero}`,
          details: { compte_numero: ligne.compte_numero },
          statut: 'DETECTEE',
          date_detection: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return anomalies;
  }

  /**
   * Contrôle la cohérence des dates
   */
  private static controlerDates(ecriture: EcritureComptable): AnomalieComptable | null {
    const dateEcriture = new Date(ecriture.date_ecriture);
    const datePiece = new Date(ecriture.date_piece);

    if (datePiece > dateEcriture) {
      return {
        id: crypto.randomUUID(),
        ecriture_id: ecriture.id,
        regle_id: 'CTRL_003',
        type: 'COHERENCE',
        severite: 'AVERTISSEMENT',
        description: 'La date de la pièce est postérieure à la date d\'écriture',
        details: {
          date_ecriture: ecriture.date_ecriture,
          date_piece: ecriture.date_piece
        },
        statut: 'DETECTEE',
        date_detection: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Contrôle les montants
   */
  private static controlerMontants(ecriture: EcritureComptable): AnomalieComptable[] {
    const anomalies: AnomalieComptable[] = [];

    for (const ligne of ecriture.lignes) {
      if (ligne.montant <= 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          ecriture_id: ecriture.id,
          regle_id: 'CTRL_004',
          type: 'COHERENCE',
          severite: 'ERREUR',
          description: `Montant invalide pour le compte ${ligne.compte_numero}`,
          details: { 
            compte: ligne.compte_numero,
            montant: ligne.montant 
          },
          statut: 'DETECTEE',
          date_detection: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return anomalies;
  }

  /**
   * Contrôle les libellés
   */
  private static controlerLibelles(ecriture: EcritureComptable): AnomalieComptable[] {
    const anomalies: AnomalieComptable[] = [];

    if (!ecriture.libelle || ecriture.libelle.trim() === '') {
      anomalies.push({
        id: crypto.randomUUID(),
        ecriture_id: ecriture.id,
        regle_id: 'CTRL_005',
        type: 'EXHAUSTIVITE',
        severite: 'AVERTISSEMENT',
        description: 'Libellé de l\'écriture manquant',
        details: {},
        statut: 'DETECTEE',
        date_detection: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    for (const ligne of ecriture.lignes) {
      if (!ligne.libelle || ligne.libelle.trim() === '') {
        anomalies.push({
          id: crypto.randomUUID(),
          ecriture_id: ecriture.id,
          regle_id: 'CTRL_005',
          type: 'EXHAUSTIVITE',
          severite: 'AVERTISSEMENT',
          description: `Libellé manquant pour le compte ${ligne.compte_numero}`,
          details: { compte: ligne.compte_numero },
          statut: 'DETECTEE',
          date_detection: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return anomalies;
  }

  /**
   * Vérifie la cohérence multi-devise
   */
  private static controlerMultiDevise(ecriture: EcritureComptable): AnomalieComptable | null {
    for (const ligne of ecriture.lignes) {
      if (ligne.devise && ligne.devise !== 'XAF') {
        if (!ligne.taux_change || ligne.taux_change <= 0) {
          return {
            id: crypto.randomUUID(),
            ecriture_id: ecriture.id,
            regle_id: 'CTRL_007',
            type: 'COHERENCE',
            severite: 'BLOQUANT',
            description: `Taux de change manquant pour devise ${ligne.devise}`,
            details: { compte: ligne.compte_numero, devise: ligne.devise },
            statut: 'DETECTEE',
            date_detection: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
        }
        if (typeof ligne.montant_devise_base !== 'number' || isNaN(ligne.montant_devise_base)) {
          return {
            id: crypto.randomUUID(),
            ecriture_id: ecriture.id,
            regle_id: 'CTRL_008',
            type: 'COHERENCE',
            severite: 'BLOQUANT',
            description: `Montant devise base manquant ou invalide pour ${ligne.compte_numero}`,
            details: { compte: ligne.compte_numero, montant_devise_base: ligne.montant_devise_base },
            statut: 'DETECTEE',
            date_detection: new Date().toISOString(),
            created_at: new Date().toISOString()
          };
        }
      }
    }
    return null;
  }

  /**
   * Enregistre les anomalies détectées
   */
  private static async enregistrerAnomalies(anomalies: AnomalieComptable[]): Promise<void> {
    const { error } = await supabase
      .from('anomalies_comptables')
      .insert(anomalies);

    if (error) {
      console.error('Erreur lors de l\'enregistrement des anomalies:', error);
    }
  }

  // ============================================================================
  // VALIDATION DE LA BALANCE
  // ============================================================================

  /**
   * Valide la balance comptable
   */
  static async validerBalance(exerciceId: string): Promise<{
    estValide: boolean;
    anomalies: string[];
  }> {
    const balance = await GrandLivreService.genererBalance(exerciceId);

    if (!balance) {
      return { estValide: false, anomalies: ['Impossible de générer la balance'] };
    }

    const anomalies: string[] = [];

    // Vérifier l'équilibre
    const verification = GrandLivreService.verifierEquilibreBalance(balance);

    if (!verification.estEquilibre) {
      anomalies.push(`Balance non équilibrée:`);
      if (verification.ecarts.solde_initial > 0.01) {
        anomalies.push(`  - Écart solde initial: ${verification.ecarts.solde_initial.toFixed(2)}`);
      }
      if (verification.ecarts.mouvements > 0.01) {
        anomalies.push(`  - Écart mouvements: ${verification.ecarts.mouvements.toFixed(2)}`);
      }
      if (verification.ecarts.solde_final > 0.01) {
        anomalies.push(`  - Écart solde final: ${verification.ecarts.solde_final.toFixed(2)}`);
      }
    }

    // Vérifier les comptes avec soldes anormaux
    for (const ligne of balance.lignes) {
      const classe = ligne.compte_numero.charAt(0);
      const solde = ligne.solde_final_debit - ligne.solde_final_credit;

      // Les comptes de passif (classe 1) doivent avoir un solde créditeur
      if (classe === '1' && solde > 0) {
        anomalies.push(`Compte ${ligne.compte_numero} (${ligne.compte_libelle}): solde débiteur anormal`);
      }

      // Les comptes d'actif (classes 2, 3, 4, 5) doivent avoir un solde débiteur
      if (['2', '3', '4', '5'].includes(classe) && solde < 0) {
        anomalies.push(`Compte ${ligne.compte_numero} (${ligne.compte_libelle}): solde créditeur anormal`);
      }
    }

    return {
      estValide: anomalies.length === 0,
      anomalies
    };
  }

  // ============================================================================
  // CONTRÔLES BUDGÉTAIRES
  // ============================================================================

  /**
   * Vérifie le dépassement budgétaire
   */
  static async controlerDepassementBudgetaire(
    compteNumero: string,
    montant: number,
    exerciceId: string
  ): Promise<{
    estAutorise: boolean;
    message?: string;
    disponible?: number;
  }> {
    const { data: ligneBudget } = await supabase
      .from('lignes_budgetaires')
      .select('*')
      .eq('compte_numero', compteNumero)
      .eq('exercice_id', exerciceId)
      .single();

    if (!ligneBudget) {
      return {
        estAutorise: false,
        message: 'Aucune ligne budgétaire trouvée pour ce compte'
      };
    }

    const disponible = ligneBudget.disponible;

    if (montant > disponible) {
      return {
        estAutorise: false,
        message: `Dépassement budgétaire: ${montant.toFixed(2)} > ${disponible.toFixed(2)}`,
        disponible
      };
    }

    return {
      estAutorise: true,
      disponible
    };
  }

  /**
   * Vérifie la disponibilité budgétaire pour un engagement
   */
  static async verifierDisponibiliteBudgetaire(
    ligneBudgetaireId: string,
    montant: number
  ): Promise<boolean> {
    const { data: ligneBudget } = await supabase
      .from('lignes_budgetaires')
      .select('disponible')
      .eq('id', ligneBudgetaireId)
      .single();

    if (!ligneBudget) {
      return false;
    }

    return montant <= ligneBudget.disponible;
  }

  // ============================================================================
  // CONTRÔLES DE COHÉRENCE
  // ============================================================================

  /**
   * Vérifie la cohérence entre les écritures et les engagements
   */
  static async verifierCoherenceEngagements(exerciceId: string): Promise<{
    estCoherent: boolean;
    ecarts: Array<{
      engagement_id: string;
      montant_engage: number;
      montant_comptabilise: number;
      ecart: number;
    }>;
  }> {
    const { data: engagements } = await supabase
      .from('engagements')
      .select('*')
      .eq('exercice_id', exerciceId)
      .in('statut', ['ENGAGE', 'LIQUIDE', 'ORDONNANCE', 'PAYE']);

    if (!engagements) {
      return { estCoherent: true, ecarts: [] };
    }

    const ecarts = [];

    for (const engagement of engagements) {
      // Calculer le montant comptabilisé
      const { data: ecritures } = await supabase
        .from('ecritures_comptables')
        .select('montant_total')
        .eq('reference_piece', engagement.numero)
        .eq('statut', 'COMPTABILISEE');

      const montantComptabilise = ecritures?.reduce((sum, e) => sum + e.montant_total, 0) || 0;
      const ecart = Math.abs(engagement.montant - montantComptabilise);

      if (ecart > 0.01) {
        ecarts.push({
          engagement_id: engagement.id,
          montant_engage: engagement.montant,
          montant_comptabilise: montantComptabilise,
          ecart
        });
      }
    }

    return {
      estCoherent: ecarts.length === 0,
      ecarts
    };
  }

  /**
   * Génère un rapport de contrôle complet
   */
  static async genererRapportControle(exerciceId: string): Promise<{
    date_rapport: string;
    exercice_id: string;
    balance_valide: boolean;
    anomalies_balance: string[];
    ecritures_invalides: number;
    engagements_incoherents: number;
    details: any;
  }> {
    // Valider la balance
    const validationBalance = await this.validerBalance(exerciceId);

    // Compter les écritures invalides
    const { data: ecritures } = await supabase
      .from('ecritures_comptables')
      .select('id')
      .eq('exercice_id', exerciceId)
      .eq('statut', 'BROUILLON');

    let ecrituresInvalides = 0;
    if (ecritures) {
      for (const ecriture of ecritures) {
        const validation = await this.validerEcriture(ecriture.id);
        if (!validation.estValide) {
          ecrituresInvalides++;
        }
      }
    }

    // Vérifier la cohérence des engagements
    const coherenceEngagements = await this.verifierCoherenceEngagements(exerciceId);

    return {
      date_rapport: new Date().toISOString(),
      exercice_id: exerciceId,
      balance_valide: validationBalance.estValide,
      anomalies_balance: validationBalance.anomalies,
      ecritures_invalides: ecrituresInvalides,
      engagements_incoherents: coherenceEngagements.ecarts.length,
      details: {
        ecarts_engagements: coherenceEngagements.ecarts
      }
    };
  }
}
