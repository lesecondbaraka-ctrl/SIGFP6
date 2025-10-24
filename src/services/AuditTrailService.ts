import { supabase } from '../lib/supabase';

/**
 * Service de gestion de la piste d'audit (Audit Trail)
 * Conforme aux standards internationaux de traçabilité
 */

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_entity: string;
  action_type: AuditActionType;
  resource_type: string;
  resource_id: string;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT' | 'PRINT';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changes_summary?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  error_message?: string;
  metadata?: Record<string, any>;
  hash?: string; // Hash cryptographique pour l'immuabilité
  previous_hash?: string; // Chaînage des logs (blockchain-like)
}

export type AuditActionType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_FAILED_LOGIN'
  | 'USER_PASSWORD_CHANGE'
  | 'USER_PERMISSION_CHANGE'
  | 'BUDGET_CREATE'
  | 'BUDGET_UPDATE'
  | 'BUDGET_DELETE'
  | 'BUDGET_APPROVE'
  | 'BUDGET_REJECT'
  | 'DEPENSE_CREATE'
  | 'DEPENSE_UPDATE'
  | 'DEPENSE_DELETE'
  | 'DEPENSE_VALIDATE'
  | 'DEPENSE_REJECT'
  | 'DEPENSE_PAYMENT'
  | 'RECETTE_CREATE'
  | 'RECETTE_UPDATE'
  | 'RECETTE_DELETE'
  | 'RECETTE_ENCAISSEMENT'
  | 'TRESORERIE_FLUX_CREATE'
  | 'TRESORERIE_FLUX_UPDATE'
  | 'TRESORERIE_FLUX_DELETE'
  | 'TRESORERIE_RAPPROCHEMENT'
  | 'COMPTABILITE_ECRITURE_CREATE'
  | 'COMPTABILITE_ECRITURE_UPDATE'
  | 'COMPTABILITE_ECRITURE_DELETE'
  | 'COMPTABILITE_ECRITURE_VALIDATE'
  | 'EXERCICE_CREATE'
  | 'EXERCICE_CLOTURE'
  | 'EXERCICE_REOUVERTURE'
  | 'REPORT_GENERATE'
  | 'REPORT_EXPORT'
  | 'REPORT_PRINT'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'BACKUP_CREATE'
  | 'BACKUP_RESTORE'
  | 'CONFIG_CHANGE'
  | 'SECURITY_ALERT'
  | 'COMPLIANCE_VIOLATION'
  | 'SYSTEM_ERROR';

export interface AuditSearchCriteria {
  user_id?: string;
  action_type?: AuditActionType;
  resource_type?: string;
  resource_id?: string;
  operation?: string;
  severity?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export class AuditTrailService {
  /**
   * Enregistre une entrée dans la piste d'audit
   */
  static async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'previous_hash'>): Promise<void> {
    try {
      // Récupérer le dernier hash pour le chaînage
      const previousHash = await this.getLastHash();

      // Créer l'entrée complète
      const fullEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        previous_hash: previousHash,
      };

      // Calculer le hash de l'entrée
      fullEntry.hash = await this.calculateHash(fullEntry);

      // Enregistrer dans la base de données
      const { error } = await supabase
        .from('audit_logs')
        .insert([fullEntry]);

      if (error) {
        console.error('Erreur lors de l\'enregistrement du log d\'audit:', error);
        // En cas d'erreur, logger localement pour ne pas perdre la trace
        this.logToLocalStorage(fullEntry);
      }

      // Vérifier si une alerte doit être déclenchée
      if (entry.severity === 'CRITICAL' || entry.severity === 'HIGH') {
        await this.triggerAlert(fullEntry);
      }
    } catch (error) {
      console.error('Erreur critique dans AuditTrailService.log:', error);
      // Fallback: logger localement
      this.logToLocalStorage(entry as AuditLogEntry);
    }
  }

  /**
   * Enregistre une connexion utilisateur
   */
  static async logLogin(userId: string, userName: string, userRole: string, userEntity: string, success: boolean, ipAddress?: string): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: success ? 'USER_LOGIN' : 'USER_FAILED_LOGIN',
      resource_type: 'user',
      resource_id: userId,
      operation: 'READ',
      ip_address: ipAddress,
      severity: success ? 'LOW' : 'MEDIUM',
      status: success ? 'SUCCESS' : 'FAILURE',
      metadata: {
        login_time: new Date().toISOString(),
        success
      }
    });
  }

  /**
   * Enregistre une déconnexion utilisateur
   */
  static async logLogout(userId: string, userName: string, userRole: string, userEntity: string): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: 'USER_LOGOUT',
      resource_type: 'user',
      resource_id: userId,
      operation: 'READ',
      severity: 'LOW',
      status: 'SUCCESS',
      metadata: {
        logout_time: new Date().toISOString()
      }
    });
  }

  /**
   * Enregistre une création de ressource
   */
  static async logCreate(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    newValues: Record<string, any>,
    actionType: AuditActionType
  ): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'CREATE',
      new_values: newValues,
      changes_summary: `Création de ${resourceType} #${resourceId}`,
      severity: 'MEDIUM',
      status: 'SUCCESS'
    });
  }

  /**
   * Enregistre une modification de ressource
   */
  static async logUpdate(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    actionType: AuditActionType
  ): Promise<void> {
    const changes = this.calculateChanges(oldValues, newValues);
    
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'UPDATE',
      old_values: oldValues,
      new_values: newValues,
      changes_summary: changes.summary,
      severity: changes.severity,
      status: 'SUCCESS',
      metadata: {
        fields_changed: changes.fields
      }
    });
  }

  /**
   * Enregistre une suppression de ressource
   */
  static async logDelete(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    oldValues: Record<string, any>,
    actionType: AuditActionType
  ): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'DELETE',
      old_values: oldValues,
      changes_summary: `Suppression de ${resourceType} #${resourceId}`,
      severity: 'HIGH',
      status: 'SUCCESS'
    });
  }

  /**
   * Enregistre une approbation
   */
  static async logApproval(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    actionType: AuditActionType,
    comment?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'APPROVE',
      changes_summary: `Approbation de ${resourceType} #${resourceId}`,
      severity: 'MEDIUM',
      status: 'SUCCESS',
      metadata: {
        comment,
        approval_time: new Date().toISOString()
      }
    });
  }

  /**
   * Enregistre un rejet
   */
  static async logRejection(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    actionType: AuditActionType,
    reason: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'REJECT',
      changes_summary: `Rejet de ${resourceType} #${resourceId}`,
      severity: 'MEDIUM',
      status: 'SUCCESS',
      metadata: {
        reason,
        rejection_time: new Date().toISOString()
      }
    });
  }

  /**
   * Enregistre une violation de conformité
   */
  static async logComplianceViolation(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    resourceType: string,
    resourceId: string,
    violationType: string,
    details: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      user_entity: userEntity,
      action_type: 'COMPLIANCE_VIOLATION',
      resource_type: resourceType,
      resource_id: resourceId,
      operation: 'READ',
      changes_summary: `Violation de conformité: ${violationType}`,
      severity: 'CRITICAL',
      status: 'FAILURE',
      metadata: {
        violation_type: violationType,
        details,
        detection_time: new Date().toISOString()
      }
    });
  }

  /**
   * Recherche dans les logs d'audit
   */
  static async search(criteria: AuditSearchCriteria): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (criteria.user_id) {
        query = query.eq('user_id', criteria.user_id);
      }
      if (criteria.action_type) {
        query = query.eq('action_type', criteria.action_type);
      }
      if (criteria.resource_type) {
        query = query.eq('resource_type', criteria.resource_type);
      }
      if (criteria.resource_id) {
        query = query.eq('resource_id', criteria.resource_id);
      }
      if (criteria.operation) {
        query = query.eq('operation', criteria.operation);
      }
      if (criteria.severity) {
        query = query.eq('severity', criteria.severity);
      }
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      if (criteria.date_from) {
        query = query.gte('timestamp', criteria.date_from);
      }
      if (criteria.date_to) {
        query = query.lte('timestamp', criteria.date_to);
      }

      const limit = criteria.limit || 100;
      const offset = criteria.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche dans les logs d\'audit:', error);
      return [];
    }
  }

  /**
   * Vérifie l'intégrité de la chaîne de logs
   */
  static async verifyIntegrity(startDate?: string, endDate?: string): Promise<{
    isValid: boolean;
    errors: string[];
    totalChecked: number;
  }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: true });

      if (startDate) query = query.gte('timestamp', startDate);
      if (endDate) query = query.lte('timestamp', endDate);

      const { data: logs, error } = await query;

      if (error) throw error;
      if (!logs || logs.length === 0) {
        return { isValid: true, errors: [], totalChecked: 0 };
      }

      const errors: string[] = [];
      let previousHash: string | null = null;

      for (const log of logs) {
        // Vérifier le chaînage
        if (previousHash && log.previous_hash !== previousHash) {
          errors.push(`Chaînage rompu au log ${log.id} (timestamp: ${log.timestamp})`);
        }

        // Vérifier le hash
        const calculatedHash = await this.calculateHash(log);
        if (log.hash !== calculatedHash) {
          errors.push(`Hash invalide au log ${log.id} (timestamp: ${log.timestamp})`);
        }

        previousHash = log.hash;
      }

      return {
        isValid: errors.length === 0,
        errors,
        totalChecked: logs.length
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'intégrité:', error);
      return {
        isValid: false,
        errors: ['Erreur lors de la vérification'],
        totalChecked: 0
      };
    }
  }

  /**
   * Génère un rapport d'audit
   */
  static async generateReport(criteria: AuditSearchCriteria): Promise<{
    logs: AuditLogEntry[];
    statistics: {
      total: number;
      by_action: Record<string, number>;
      by_user: Record<string, number>;
      by_severity: Record<string, number>;
      by_status: Record<string, number>;
    };
  }> {
    const logs = await this.search(criteria);

    const statistics = {
      total: logs.length,
      by_action: {} as Record<string, number>,
      by_user: {} as Record<string, number>,
      by_severity: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
    };

    logs.forEach(log => {
      // Par action
      statistics.by_action[log.action_type] = (statistics.by_action[log.action_type] || 0) + 1;
      // Par utilisateur
      statistics.by_user[log.user_name] = (statistics.by_user[log.user_name] || 0) + 1;
      // Par sévérité
      statistics.by_severity[log.severity] = (statistics.by_severity[log.severity] || 0) + 1;
      // Par statut
      statistics.by_status[log.status] = (statistics.by_status[log.status] || 0) + 1;
    });

    return { logs, statistics };
  }

  /**
   * Calcule le hash d'une entrée de log
   */
  private static async calculateHash(entry: AuditLogEntry): Promise<string> {
    const data = JSON.stringify({
      timestamp: entry.timestamp,
      user_id: entry.user_id,
      action_type: entry.action_type,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      operation: entry.operation,
      old_values: entry.old_values,
      new_values: entry.new_values,
      previous_hash: entry.previous_hash,
    });

    // Utiliser l'API Web Crypto pour le hashing
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Récupère le dernier hash
   */
  private static async getLastHash(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('hash')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.hash;
    } catch {
      return null;
    }
  }

  /**
   * Calcule les changements entre deux objets
   */
  private static calculateChanges(oldValues: Record<string, any>, newValues: Record<string, any>): {
    fields: string[];
    summary: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const fields: string[] = [];
    const criticalFields = ['montant', 'statut', 'id_utilisateur', 'role'];

    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        fields.push(key);
      }
    }

    const hasCriticalChange = fields.some(f => criticalFields.includes(f));
    const severity = hasCriticalChange ? 'HIGH' : fields.length > 5 ? 'MEDIUM' : 'LOW';

    const summary = `${fields.length} champ(s) modifié(s): ${fields.join(', ')}`;

    return { fields, summary, severity };
  }

  /**
   * Déclenche une alerte pour les événements critiques
   */
  private static async triggerAlert(entry: AuditLogEntry): Promise<void> {
    try {
      // Créer une notification pour les administrateurs
      const { error } = await supabase
        .from('notifications')
        .insert([{
          message: `Alerte de sécurité: ${entry.action_type} - ${entry.changes_summary}`,
          severity: entry.severity,
          type: 'SECURITY_ALERT',
          metadata: {
            audit_log_id: entry.id,
            user_id: entry.user_id,
            action_type: entry.action_type,
            timestamp: entry.timestamp
          },
          date_notification: new Date().toISOString(),
          lu: false
        }]);

      if (error) {
        console.error('Erreur lors de la création de l\'alerte:', error);
      }
    } catch (error) {
      console.error('Erreur lors du déclenchement de l\'alerte:', error);
    }
  }

  /**
   * Fallback: enregistre localement en cas d'échec
   */
  private static logToLocalStorage(entry: AuditLogEntry): void {
    try {
      const key = `audit_log_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(entry));
          } catch (error) {
      console.error('Impossible d\'enregistrer le log localement:', error);
    }
  }
}
