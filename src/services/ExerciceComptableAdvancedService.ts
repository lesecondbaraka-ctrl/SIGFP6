import { supabase } from '../lib/supabase';
import { AuditTrailService } from './AuditTrailService';

/**
 * Service avancé de gestion des exercices comptables
 * Conforme aux standards IPSAS et IFRS
 */

export interface ExerciceComptable {
  id: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  statut: 'OUVERT' | 'EN_CLOTURE' | 'CLOTURE' | 'ARCHIVE';
  date_cloture?: string;
  cloture_par?: string;
  verrouille: boolean;
  date_verrouillage?: string;
  verrouille_par?: string;
  reports_nouveau_effectues: boolean;
  date_reports?: string;
  metadata?: Record<string, any>;
}

export interface ClotureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

export interface ReportsANouveau {
  compte: string;
  libelle: string;
  solde_debiteur: number;
  solde_crediteur: number;
  solde_net: number;
  type: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
}

export class ExerciceComptableAdvancedService {
  /**
   * Crée un nouvel exercice comptable
   */
  static async createExercice(
    annee: number,
    dateDebut: string,
    dateFin: string,
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<{ success: boolean; exercice?: ExerciceComptable; error?: string }> {
    try {
      // Vérifier qu'il n'existe pas déjà un exercice pour cette année
      const { data: existing } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('annee', annee)
        .single();

      if (existing) {
        return {
          success: false,
          error: `Un exercice existe déjà pour l'année ${annee}`
        };
      }

      // Créer l'exercice
      const newExercice: Partial<ExerciceComptable> = {
        annee,
        date_debut: dateDebut,
        date_fin: dateFin,
        statut: 'OUVERT',
        verrouille: false,
        reports_nouveau_effectues: false,
      };

      const { data, error } = await supabase
        .from('exercices_comptables')
        .insert([newExercice])
        .select()
        .single();

      if (error) throw error;

      // Logger l'action
      await AuditTrailService.logCreate(
        userId,
        userName,
        userRole,
        userEntity,
        'exercice_comptable',
        data.id,
        newExercice,
        'EXERCICE_CREATE'
      );

      return { success: true, exercice: data };
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de l\'exercice'
      };
    }
  }

  /**
   * Valide qu'un exercice peut être clôturé
   */
  static async validateCloture(exerciceId: string): Promise<ClotureValidation> {
    const result: ClotureValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      checks: []
    };

    try {
      // 1. Vérifier que l'exercice existe et est ouvert
      const { data: exercice, error: exerciceError } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('id', exerciceId)
        .single();

      if (exerciceError || !exercice) {
        result.isValid = false;
        result.errors.push('Exercice introuvable');
        return result;
      }

      if (exercice.statut !== 'OUVERT') {
        result.isValid = false;
        result.errors.push(`L'exercice est déjà ${exercice.statut}`);
        return result;
      }

      result.checks.push({
        name: 'Statut de l\'exercice',
        passed: true,
        message: 'L\'exercice est ouvert'
      });

      // 2. Vérifier que toutes les écritures sont validées
      const { data: ecrituresNonValidees, error: ecrituresError } = await supabase
        .from('ecritures_comptables')
        .select('count')
        .eq('exercice_id', exerciceId)
        .neq('statut', 'Validée');

      if (ecrituresError) throw ecrituresError;

      const countNonValidees = (ecrituresNonValidees as any)?.[0]?.count || 0;
      if (countNonValidees > 0) {
        result.isValid = false;
        result.errors.push(`${countNonValidees} écriture(s) non validée(s)`);
        result.checks.push({
          name: 'Écritures comptables',
          passed: false,
          message: `${countNonValidees} écriture(s) en attente de validation`
        });
      } else {
        result.checks.push({
          name: 'Écritures comptables',
          passed: true,
          message: 'Toutes les écritures sont validées'
        });
      }

      // 3. Vérifier que toutes les dépenses sont payées ou annulées
      const { data: depensesEnCours, error: depensesError } = await supabase
        .from('depenses')
        .select('count')
        .eq('exercice_id', exerciceId)
        .in('statut', ['En attente', 'Validé', 'En cours']);

      if (depensesError) throw depensesError;

      const countDepensesEnCours = (depensesEnCours as any)?.[0]?.count || 0;
      if (countDepensesEnCours > 0) {
        result.warnings.push(`${countDepensesEnCours} dépense(s) en cours de traitement`);
        result.checks.push({
          name: 'Dépenses',
          passed: false,
          message: `${countDepensesEnCours} dépense(s) non finalisée(s)`
        });
      } else {
        result.checks.push({
          name: 'Dépenses',
          passed: true,
          message: 'Toutes les dépenses sont finalisées'
        });
      }

      // 4. Vérifier que toutes les recettes sont encaissées ou annulées
      const { data: recettesEnCours, error: recettesError } = await supabase
        .from('recettes')
        .select('count')
        .eq('exercice_id', exerciceId)
        .in('statut', ['En attente', 'Validé']);

      if (recettesError) throw recettesError;

      const countRecettesEnCours = (recettesEnCours as any)?.[0]?.count || 0;
      if (countRecettesEnCours > 0) {
        result.warnings.push(`${countRecettesEnCours} recette(s) en attente d'encaissement`);
        result.checks.push({
          name: 'Recettes',
          passed: false,
          message: `${countRecettesEnCours} recette(s) non encaissée(s)`
        });
      } else {
        result.checks.push({
          name: 'Recettes',
          passed: true,
          message: 'Toutes les recettes sont encaissées'
        });
      }

      // 5. Vérifier l'équilibre comptable (débit = crédit)
      const { data: balance, error: balanceError } = await supabase
        .from('ecritures_comptables')
        .select('montant_debit, montant_credit')
        .eq('exercice_id', exerciceId)
        .eq('statut', 'Validée');

      if (balanceError) throw balanceError;

      let totalDebit = 0;
      let totalCredit = 0;
      balance?.forEach((ecriture: any) => {
        totalDebit += ecriture.montant_debit || 0;
        totalCredit += ecriture.montant_credit || 0;
      });

      const difference = Math.abs(totalDebit - totalCredit);
      if (difference > 0.01) { // Tolérance de 0.01 pour les arrondis
        result.isValid = false;
        result.errors.push(`Déséquilibre comptable: ${difference.toFixed(2)} CDF`);
        result.checks.push({
          name: 'Équilibre comptable',
          passed: false,
          message: `Déséquilibre de ${difference.toFixed(2)} CDF`
        });
      } else {
        result.checks.push({
          name: 'Équilibre comptable',
          passed: true,
          message: 'Les comptes sont équilibrés'
        });
      }

      // 6. Vérifier que les rapprochements bancaires sont à jour
      const { data: rapprochementsEnCours, error: rapprochementsError } = await supabase
        .from('rapprochements_bancaires')
        .select('count')
        .eq('exercice_id', exerciceId)
        .eq('statut', 'En cours');

      if (rapprochementsError) throw rapprochementsError;

      const countRapprochementsEnCours = (rapprochementsEnCours as any)?.[0]?.count || 0;
      if (countRapprochementsEnCours > 0) {
        result.warnings.push(`${countRapprochementsEnCours} rapprochement(s) bancaire(s) en cours`);
        result.checks.push({
          name: 'Rapprochements bancaires',
          passed: false,
          message: `${countRapprochementsEnCours} rapprochement(s) non finalisé(s)`
        });
      } else {
        result.checks.push({
          name: 'Rapprochements bancaires',
          passed: true,
          message: 'Tous les rapprochements sont finalisés'
        });
      }

    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Erreur lors de la validation: ${error.message}`);
    }

    return result;
  }

  /**
   * Clôture un exercice comptable
   */
  static async clotureExercice(
    exerciceId: string,
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    forceClose: boolean = false
  ): Promise<{ success: boolean; message?: string; validation?: ClotureValidation }> {
    try {
      // Valider la clôture
      const validation = await this.validateCloture(exerciceId);

      if (!validation.isValid && !forceClose) {
        return {
          success: false,
          message: 'La clôture ne peut pas être effectuée. Veuillez corriger les erreurs.',
          validation
        };
      }

      // Récupérer l'exercice
      const { data: exercice, error: exerciceError } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('id', exerciceId)
        .single();

      if (exerciceError || !exercice) {
        return { success: false, message: 'Exercice introuvable' };
      }

      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('exercices_comptables')
        .update({
          statut: 'EN_CLOTURE',
          date_cloture: new Date().toISOString(),
          cloture_par: userId,
          metadata: {
            ...exercice.metadata,
            cloture_validation: validation,
            cloture_forcee: forceClose
          }
        })
        .eq('id', exerciceId);

      if (updateError) throw updateError;

      // Calculer les reports à nouveau
      const reports = await this.calculateReportsANouveau(exerciceId);

      // Créer les écritures de reports à nouveau
      await this.createEcrituresReportsANouveau(exerciceId, reports, userId);

      // Finaliser la clôture
      const { error: finalError } = await supabase
        .from('exercices_comptables')
        .update({
          statut: 'CLOTURE',
          reports_nouveau_effectues: true,
          date_reports: new Date().toISOString()
        })
        .eq('id', exerciceId);

      if (finalError) throw finalError;

      // Logger l'action
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'EXERCICE_CLOTURE',
        resource_type: 'exercice_comptable',
        resource_id: exerciceId,
        operation: 'UPDATE',
        old_values: { statut: exercice.statut },
        new_values: { statut: 'CLOTURE' },
        changes_summary: `Clôture de l'exercice ${exercice.annee}`,
        severity: 'HIGH',
        status: 'SUCCESS',
        metadata: {
          validation,
          force_close: forceClose,
          reports_count: reports.length
        }
      });

      return {
        success: true,
        message: `L'exercice ${exercice.annee} a été clôturé avec succès`,
        validation
      };
    } catch (error: any) {
      console.error('Erreur lors de la clôture de l\'exercice:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la clôture de l\'exercice'
      };
    }
  }

  /**
   * Verrouille un exercice (empêche toute modification)
   */
  static async verrouillerExercice(
    exerciceId: string,
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { data: exercice, error: exerciceError } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('id', exerciceId)
        .single();

      if (exerciceError || !exercice) {
        return { success: false, message: 'Exercice introuvable' };
      }

      if (exercice.statut !== 'CLOTURE') {
        return { success: false, message: 'Seul un exercice clôturé peut être verrouillé' };
      }

      const { error: updateError } = await supabase
        .from('exercices_comptables')
        .update({
          verrouille: true,
          date_verrouillage: new Date().toISOString(),
          verrouille_par: userId
        })
        .eq('id', exerciceId);

      if (updateError) throw updateError;

      // Logger l'action
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'EXERCICE_CREATE',
        resource_type: 'exercice_comptable',
        resource_id: exerciceId,
        operation: 'UPDATE',
        old_values: { verrouille: false },
        new_values: { verrouille: true },
        changes_summary: `Verrouillage de l'exercice ${exercice.annee}`,
        severity: 'HIGH',
        status: 'SUCCESS'
      });

      return {
        success: true,
        message: `L'exercice ${exercice.annee} a été verrouillé`
      };
    } catch (error: any) {
      console.error('Erreur lors du verrouillage de l\'exercice:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors du verrouillage de l\'exercice'
      };
    }
  }

  /**
   * Calcule les reports à nouveau
   */
  private static async calculateReportsANouveau(exerciceId: string): Promise<ReportsANouveau[]> {
    try {
      // Récupérer toutes les écritures de l'exercice
      const { data: ecritures, error } = await supabase
        .from('ecritures_comptables')
        .select('*')
        .eq('exercice_id', exerciceId)
        .eq('statut', 'Validée');

      if (error) throw error;

      // Calculer les soldes par compte
      const soldesParCompte: Record<string, {
        debit: number;
        credit: number;
        libelle: string;
        type: 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT';
      }> = {};

      ecritures?.forEach((ecriture: any) => {
        const compte = ecriture.compte;
        if (!soldesParCompte[compte]) {
          soldesParCompte[compte] = {
            debit: 0,
            credit: 0,
            libelle: ecriture.libelle_compte || compte,
            type: this.determineTypeCompte(compte)
          };
        }
        soldesParCompte[compte].debit += ecriture.montant_debit || 0;
        soldesParCompte[compte].credit += ecriture.montant_credit || 0;
      });

      // Créer les reports à nouveau (uniquement pour les comptes de bilan)
      const reports: ReportsANouveau[] = [];
      for (const [compte, soldes] of Object.entries(soldesParCompte)) {
        if (soldes.type === 'ACTIF' || soldes.type === 'PASSIF') {
          const soldeNet = soldes.debit - soldes.credit;
          reports.push({
            compte,
            libelle: soldes.libelle,
            solde_debiteur: soldeNet > 0 ? soldeNet : 0,
            solde_crediteur: soldeNet < 0 ? Math.abs(soldeNet) : 0,
            solde_net: soldeNet,
            type: soldes.type
          });
        }
      }

      return reports;
    } catch (error) {
      console.error('Erreur lors du calcul des reports à nouveau:', error);
      return [];
    }
  }

  /**
   * Crée les écritures de reports à nouveau
   */
  private static async createEcrituresReportsANouveau(
    exerciceId: string,
    reports: ReportsANouveau[],
    userId: string
  ): Promise<void> {
    try {
      // Récupérer l'exercice suivant
      const { data: exercice } = await supabase
        .from('exercices_comptables')
        .select('annee')
        .eq('id', exerciceId)
        .single();

      if (!exercice) return;

      const { data: exerciceSuivant } = await supabase
        .from('exercices_comptables')
        .select('id')
        .eq('annee', exercice.annee + 1)
        .single();

      if (!exerciceSuivant) {
                return;
      }

      // Créer les écritures de reports
      const ecritures = reports.map(report => ({
        exercice_id: exerciceSuivant.id,
        date_ecriture: new Date().toISOString(),
        compte: report.compte,
        libelle: `Report à nouveau - ${report.libelle}`,
        montant_debit: report.solde_debiteur,
        montant_credit: report.solde_crediteur,
        type_ecriture: 'REPORT_A_NOUVEAU',
        statut: 'Validée',
        cree_par: userId,
        metadata: {
          exercice_origine: exerciceId,
          report_automatique: true
        }
      }));

      const { error } = await supabase
        .from('ecritures_comptables')
        .insert(ecritures);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la création des écritures de reports:', error);
    }
  }

  /**
   * Détermine le type de compte à partir de son numéro
   */
  private static determineTypeCompte(compte: string): 'ACTIF' | 'PASSIF' | 'CHARGE' | 'PRODUIT' {
    const firstDigit = compte.charAt(0);
    switch (firstDigit) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        return compte.charAt(0) <= '3' ? 'ACTIF' : 'PASSIF';
      case '6':
        return 'CHARGE';
      case '7':
        return 'PRODUIT';
      default:
        return 'ACTIF';
    }
  }

  /**
   * Rouvre un exercice clôturé (action exceptionnelle)
   */
  static async rouvrirExercice(
    exerciceId: string,
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    motif: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { data: exercice, error: exerciceError } = await supabase
        .from('exercices_comptables')
        .select('*')
        .eq('id', exerciceId)
        .single();

      if (exerciceError || !exercice) {
        return { success: false, message: 'Exercice introuvable' };
      }

      if (exercice.verrouille) {
        return { success: false, message: 'Impossible de rouvrir un exercice verrouillé' };
      }

      const { error: updateError } = await supabase
        .from('exercices_comptables')
        .update({
          statut: 'OUVERT',
          metadata: {
            ...exercice.metadata,
            reouverture: {
              date: new Date().toISOString(),
              par: userId,
              motif
            }
          }
        })
        .eq('id', exerciceId);

      if (updateError) throw updateError;

      // Logger l'action
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'EXERCICE_REOUVERTURE',
        resource_type: 'exercice_comptable',
        resource_id: exerciceId,
        operation: 'UPDATE',
        old_values: { statut: exercice.statut },
        new_values: { statut: 'OUVERT' },
        changes_summary: `Réouverture de l'exercice ${exercice.annee}`,
        severity: 'CRITICAL',
        status: 'SUCCESS',
        metadata: { motif }
      });

      return {
        success: true,
        message: `L'exercice ${exercice.annee} a été rouvert`
      };
    } catch (error: any) {
      console.error('Erreur lors de la réouverture de l\'exercice:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la réouverture de l\'exercice'
      };
    }
  }
}
