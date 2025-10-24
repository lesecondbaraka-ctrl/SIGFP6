import { supabase } from '../lib/supabase';
import { AuditTrailService } from './AuditTrailService';

/**
 * Service de Détection de Fraude et Détournement de Fonds
 * Conforme aux standards internationaux de lutte contre la corruption
 */

export interface FraudAlert {
  id?: string;
  type: FraudType;
  severity: 'CRITIQUE' | 'ELEVEE' | 'MOYENNE' | 'FAIBLE';
  description: string;
  entity: string;
  amount?: number;
  transaction_id?: string;
  beneficiary?: string;
  detection_date: string;
  status: 'NOUVELLE' | 'EN_COURS' | 'CONFIRMEE' | 'FAUSSE_ALERTE' | 'RESOLUE';
  evidence: Record<string, any>;
  risk_score: number; // 0-100
  assigned_to?: string;
  resolution_notes?: string;
}

export type FraudType =
  | 'DOUBLE_PAIEMENT'
  | 'BENEFICIAIRE_FICTIF'
  | 'SURFACTURATION'
  | 'FACTURE_FRAUDULEUSE'
  | 'CONFLIT_INTERET'
  | 'DEPASSEMENT_SEUIL'
  | 'FRACTIONNEMENT_SUSPECT'
  | 'FOURNISSEUR_SUSPECT'
  | 'ENRICHISSEMENT_ILLICITE'
  | 'DETOURNEMENT_FONDS'
  | 'CORRUPTION'
  | 'FRAUDE_FISCALE'
  | 'BLANCHIMENT_ARGENT';

export interface FraudPattern {
  pattern_name: string;
  description: string;
  indicators: string[];
  risk_level: number;
}

export interface SuspiciousBeneficiary {
  beneficiary_name: string;
  total_amount: number;
  transaction_count: number;
  risk_indicators: string[];
  risk_score: number;
}

export class FraudDetectionService {
  /**
   * Détecte les doubles paiements
   */
  static async detectDoublePaiements(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<FraudAlert[]> {
    try {
      const { data: paiements, error } = await supabase
        .from('paiements')
        .select('*')
        .order('date_paiement', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const alerts: FraudAlert[] = [];
      const seen = new Map<string, any>();

      for (const paiement of paiements || []) {
        const key = `${paiement.beneficiaire}_${paiement.montant}_${paiement.objet}`;
        
        if (seen.has(key)) {
          const duplicate = seen.get(key);
          const daysDiff = Math.abs(
            new Date(paiement.date_paiement).getTime() - 
            new Date(duplicate.date_paiement).getTime()
          ) / (1000 * 60 * 60 * 24);

          // Alerte si moins de 30 jours entre les paiements identiques
          if (daysDiff < 30) {
            alerts.push({
              type: 'DOUBLE_PAIEMENT',
              severity: 'CRITIQUE',
              description: `Double paiement détecté: ${paiement.montant} CDF à ${paiement.beneficiaire}`,
              entity: paiement.entite || userEntity,
              amount: paiement.montant,
              transaction_id: paiement.id,
              beneficiary: paiement.beneficiaire,
              detection_date: new Date().toISOString(),
              status: 'NOUVELLE',
              evidence: {
                paiement_1: duplicate,
                paiement_2: paiement,
                days_between: daysDiff
              },
              risk_score: 95
            });
          }
        } else {
          seen.set(key, paiement);
        }
      }

      // Enregistrer dans l'audit trail
      if (alerts.length > 0) {
        await AuditTrailService.log({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          user_entity: userEntity,
          action_type: 'SECURITY_ALERT',
          resource_type: 'fraud_detection',
          resource_id: 'double_paiement_scan',
          operation: 'READ',
          severity: 'CRITICAL',
          status: 'SUCCESS',
          metadata: {
            alerts_found: alerts.length,
            scan_type: 'DOUBLE_PAIEMENT'
          }
        });
      }

      return alerts;
    } catch (error) {
      console.error('Erreur détection doubles paiements:', error);
      return [];
    }
  }

  /**
   * Détecte les bénéficiaires fictifs ou suspects
   */
  static async detectBeneficiairesFictifs(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<FraudAlert[]> {
    try {
      const { data: paiements, error } = await supabase
        .from('paiements')
        .select('*')
        .order('date_paiement', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const beneficiaryStats = new Map<string, any>();

      // Analyser les patterns de paiements par bénéficiaire
      for (const paiement of paiements || []) {
        const beneficiary = paiement.beneficiaire;
        if (!beneficiaryStats.has(beneficiary)) {
          beneficiaryStats.set(beneficiary, {
            name: beneficiary,
            total_amount: 0,
            count: 0,
            amounts: [],
            dates: [],
            entities: new Set()
          });
        }

        const stats = beneficiaryStats.get(beneficiary);
        stats.total_amount += paiement.montant;
        stats.count += 1;
        stats.amounts.push(paiement.montant);
        stats.dates.push(paiement.date_paiement);
        stats.entities.add(paiement.entite);
      }

      const alerts: FraudAlert[] = [];

      // Détecter les patterns suspects
      for (const [beneficiary, stats] of beneficiaryStats) {
        const riskIndicators: string[] = [];
        let riskScore = 0;

        // 1. Montants toujours identiques (suspect)
        const uniqueAmounts = new Set(stats.amounts);
        if (stats.count > 5 && uniqueAmounts.size === 1) {
          riskIndicators.push('Montants toujours identiques');
          riskScore += 30;
        }

        // 2. Montants juste en dessous des seuils de contrôle
        const nearThreshold = stats.amounts.filter(
          (amt: number) => amt >= 9000000 && amt <= 10000000
        );
        if (nearThreshold.length > 3) {
          riskIndicators.push('Fractionnement suspect (montants près du seuil)');
          riskScore += 40;
        }

        // 3. Trop de paiements en peu de temps
        if (stats.count > 20) {
          const firstDate = new Date(Math.min(...stats.dates.map((d: string) => new Date(d).getTime())));
          const lastDate = new Date(Math.max(...stats.dates.map((d: string) => new Date(d).getTime())));
          const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 90) {
            riskIndicators.push(`${stats.count} paiements en ${Math.round(daysDiff)} jours`);
            riskScore += 25;
          }
        }

        // 4. Montant total très élevé
        if (stats.total_amount > 500000000) {
          riskIndicators.push(`Montant total: ${stats.total_amount.toLocaleString()} CDF`);
          riskScore += 20;
        }

        // 5. Paiements depuis plusieurs entités (suspect)
        if (stats.entities.size > 3) {
          riskIndicators.push(`Paiements depuis ${stats.entities.size} entités différentes`);
          riskScore += 15;
        }

        // Créer une alerte si le score de risque est élevé
        if (riskScore >= 50) {
          alerts.push({
            type: 'BENEFICIAIRE_FICTIF',
            severity: riskScore >= 80 ? 'CRITIQUE' : riskScore >= 65 ? 'ELEVEE' : 'MOYENNE',
            description: `Bénéficiaire suspect: ${beneficiary}`,
            entity: userEntity,
            amount: stats.total_amount,
            beneficiary: beneficiary,
            detection_date: new Date().toISOString(),
            status: 'NOUVELLE',
            evidence: {
              total_amount: stats.total_amount,
              transaction_count: stats.count,
              risk_indicators: riskIndicators,
              entities: Array.from(stats.entities)
            },
            risk_score: riskScore
          });
        }
      }

      // Enregistrer dans l'audit trail
      if (alerts.length > 0) {
        await AuditTrailService.log({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          user_entity: userEntity,
          action_type: 'SECURITY_ALERT',
          resource_type: 'fraud_detection',
          resource_id: 'beneficiaire_fictif_scan',
          operation: 'READ',
          severity: 'HIGH',
          status: 'SUCCESS',
          metadata: {
            alerts_found: alerts.length,
            scan_type: 'BENEFICIAIRE_FICTIF'
          }
        });
      }

      return alerts;
    } catch (error) {
      console.error('Erreur détection bénéficiaires fictifs:', error);
      return [];
    }
  }

  /**
   * Détecte les surfacturations
   */
  static async detectSurfacturations(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<FraudAlert[]> {
    try {
      const { data: depenses, error } = await supabase
        .from('depenses')
        .select('*')
        .order('date_creation', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const alerts: FraudAlert[] = [];

      // Analyser les prix par type de produit/service
      const pricesByCategory = new Map<string, number[]>();

      for (const depense of depenses || []) {
        const category = depense.objet || 'Autre';
        if (!pricesByCategory.has(category)) {
          pricesByCategory.set(category, []);
        }
        pricesByCategory.get(category)!.push(depense.montant);
      }

      // Détecter les outliers (prix anormalement élevés)
      for (const depense of depenses || []) {
        const category = depense.objet || 'Autre';
        const prices = pricesByCategory.get(category) || [];
        
        if (prices.length < 5) continue;

        // Calculer la moyenne et l'écart-type
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);

        // Alerte si le prix est > moyenne + 2 écarts-types
        if (depense.montant > mean + (2 * stdDev) && stdDev > 0) {
          const deviation = ((depense.montant - mean) / mean) * 100;
          
          alerts.push({
            type: 'SURFACTURATION',
            severity: deviation > 200 ? 'CRITIQUE' : deviation > 100 ? 'ELEVEE' : 'MOYENNE',
            description: `Surfacturation potentielle: ${depense.objet} - ${deviation.toFixed(0)}% au-dessus de la moyenne`,
            entity: depense.entite || userEntity,
            amount: depense.montant,
            transaction_id: depense.id,
            beneficiary: depense.beneficiaire,
            detection_date: new Date().toISOString(),
            status: 'NOUVELLE',
            evidence: {
              amount: depense.montant,
              category_mean: mean,
              deviation_percent: deviation,
              category: category,
              sample_size: prices.length
            },
            risk_score: Math.min(95, 50 + (deviation / 4))
          });
        }
      }

      // Enregistrer dans l'audit trail
      if (alerts.length > 0) {
        await AuditTrailService.log({
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          user_entity: userEntity,
          action_type: 'SECURITY_ALERT',
          resource_type: 'fraud_detection',
          resource_id: 'surfacturation_scan',
          operation: 'READ',
          severity: 'HIGH',
          status: 'SUCCESS',
          metadata: {
            alerts_found: alerts.length,
            scan_type: 'SURFACTURATION'
          }
        });
      }

      return alerts;
    } catch (error) {
      console.error('Erreur détection surfacturations:', error);
      return [];
    }
  }

  /**
   * Détecte les conflits d'intérêts
   */
  static async detectConflitsInteret(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<FraudAlert[]> {
    try {
      const alerts: FraudAlert[] = [];

      // Récupérer les utilisateurs et leurs transactions
      const { data: users, error: usersError } = await supabase
        .from('utilisateurs')
        .select('*');

      const { data: paiements, error: paiementsError } = await supabase
        .from('paiements')
        .select('*')
        .limit(1000);

      if (usersError || paiementsError) throw usersError || paiementsError;

      // Détecter si un utilisateur approuve des paiements à un bénéficiaire avec un nom similaire
      for (const user of users || []) {
        const userName = user.nom_complet?.toLowerCase() || '';
        const userPayments = (paiements || []).filter(
          (p: any) => p.validateur_id === user.id_utilisateur
        );

        for (const payment of userPayments) {
          const beneficiary = payment.beneficiaire?.toLowerCase() || '';
          
          // Vérifier similarité de noms (simple check)
          if (this.calculateSimilarity(userName, beneficiary) > 0.6) {
            alerts.push({
              type: 'CONFLIT_INTERET',
              severity: 'CRITIQUE',
              description: `Conflit d'intérêt potentiel: ${user.nom_complet} a validé un paiement à ${payment.beneficiaire}`,
              entity: payment.entite || userEntity,
              amount: payment.montant,
              transaction_id: payment.id,
              beneficiary: payment.beneficiaire,
              detection_date: new Date().toISOString(),
              status: 'NOUVELLE',
              evidence: {
                validator: user.nom_complet,
                beneficiary: payment.beneficiaire,
                similarity_score: this.calculateSimilarity(userName, beneficiary),
                amount: payment.montant
              },
              risk_score: 90
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Erreur détection conflits d\'intérêt:', error);
      return [];
    }
  }

  /**
   * Analyse complète de détection de fraude
   */
  static async runFullFraudScan(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<{
    alerts: FraudAlert[];
    summary: {
      total_alerts: number;
      by_type: Record<string, number>;
      by_severity: Record<string, number>;
      high_risk_count: number;
    };
  }> {
    try {
      // Exécuter toutes les détections en parallèle
      const [
        doublePaiements,
        beneficiairesFictifs,
        surfacturations,
        conflitsInteret
      ] = await Promise.all([
        this.detectDoublePaiements(userId, userName, userRole, userEntity),
        this.detectBeneficiairesFictifs(userId, userName, userRole, userEntity),
        this.detectSurfacturations(userId, userName, userRole, userEntity),
        this.detectConflitsInteret(userId, userName, userRole, userEntity)
      ]);

      const allAlerts = [
        ...doublePaiements,
        ...beneficiairesFictifs,
        ...surfacturations,
        ...conflitsInteret
      ];

      // Sauvegarder les alertes dans la base de données
      for (const alert of allAlerts) {
        await supabase.from('fraud_alerts').insert([alert]);
      }

      // Calculer les statistiques
      const summary = {
        total_alerts: allAlerts.length,
        by_type: {} as Record<string, number>,
        by_severity: {} as Record<string, number>,
        high_risk_count: allAlerts.filter(a => a.risk_score >= 70).length
      };

      allAlerts.forEach(alert => {
        summary.by_type[alert.type] = (summary.by_type[alert.type] || 0) + 1;
        summary.by_severity[alert.severity] = (summary.by_severity[alert.severity] || 0) + 1;
      });

      // Enregistrer le scan complet dans l'audit trail
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'SECURITY_ALERT',
        resource_type: 'fraud_detection',
        resource_id: 'full_fraud_scan',
        operation: 'READ',
        severity: allAlerts.length > 0 ? 'CRITICAL' : 'LOW',
        status: 'SUCCESS',
        metadata: {
          scan_summary: summary,
          scan_timestamp: new Date().toISOString()
        }
      });

      return { alerts: allAlerts, summary };
    } catch (error) {
      console.error('Erreur scan complet de fraude:', error);
      return {
        alerts: [],
        summary: {
          total_alerts: 0,
          by_type: {},
          by_severity: {},
          high_risk_count: 0
        }
      };
    }
  }

  /**
   * Calcule la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Récupère toutes les alertes de fraude
   */
  static async getAllAlerts(filters?: {
    status?: string;
    severity?: string;
    type?: string;
    entity?: string;
  }): Promise<FraudAlert[]> {
    try {
      let query = supabase
        .from('fraud_alerts')
        .select('*')
        .order('detection_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.entity) query = query.eq('entity', filters.entity);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur récupération alertes:', error);
      return [];
    }
  }

  /**
   * Met à jour le statut d'une alerte
   */
  static async updateAlertStatus(
    alertId: string,
    status: FraudAlert['status'],
    resolutionNotes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({
          status,
          resolution_notes: resolutionNotes,
          resolved_date: status === 'RESOLUE' ? new Date().toISOString() : null
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      console.error('Erreur mise à jour alerte:', error);
      return false;
    }
  }
}
