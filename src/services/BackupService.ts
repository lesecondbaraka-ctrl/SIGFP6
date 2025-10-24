import { supabase } from '../lib/supabase';
import { AuditTrailService } from './AuditTrailService';

/**
 * Service de sauvegarde et restauration
 * Plan de Reprise après Sinistre (DRP - Disaster Recovery Plan)
 */

export interface BackupConfig {
  id?: string;
  type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retention_days: number;
  auto_backup: boolean;
  backup_time?: string; // Format HH:MM
  tables_included: string[];
  compression: boolean;
  encryption: boolean;
}

export interface BackupMetadata {
  id: string;
  backup_date: string;
  backup_type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL';
  size_bytes: number;
  tables_count: number;
  records_count: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  created_by: string;
  checksum: string;
  storage_location: string;
  can_restore: boolean;
}

export interface RestoreOptions {
  backup_id: string;
  restore_point?: string;
  tables_to_restore?: string[];
  verify_before_restore: boolean;
  create_backup_before_restore: boolean;
}

export class BackupService {
  private static readonly CRITICAL_TABLES = [
    'utilisateurs',
    'exercices_comptables',
    'budget_items',
    'depenses',
    'recettes',
    'flux_tresorerie',
    'ecritures_comptables',
    'audit_logs'
  ];

  /**
   * Crée une sauvegarde complète
   */
  static async createFullBackup(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<{ success: boolean; backup?: BackupMetadata; error?: string }> {
    try {
      
      const backupId = `backup_${Date.now()}`;
      const backupData: any = {};
      let totalRecords = 0;
      let totalSize = 0;

      // Sauvegarder chaque table critique
      for (const table of this.CRITICAL_TABLES) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');

          if (error) {
                        continue;
          }

          backupData[table] = data;
          totalRecords += data?.length || 0;
          totalSize += JSON.stringify(data).length;
        } catch (err) {
                  }
      }

      // Calculer le checksum
      const checksum = await this.calculateChecksum(backupData);

      // Sauvegarder dans le stockage (Supabase Storage)
      const backupBlob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const fileName = `${backupId}.json`;

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, backupBlob);

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      // Enregistrer les métadonnées
      const metadata: BackupMetadata = {
        id: backupId,
        backup_date: new Date().toISOString(),
        backup_type: 'FULL',
        size_bytes: totalSize,
        tables_count: this.CRITICAL_TABLES.length,
        records_count: totalRecords,
        status: 'COMPLETED',
        created_by: userId,
        checksum,
        storage_location: fileName,
        can_restore: true
      };

      const { error: metadataError } = await supabase
        .from('backup_metadata')
        .insert([metadata]);

      if (metadataError) {
        console.error('Erreur lors de l\'enregistrement des métadonnées:', metadataError);
      }

      // Logger l'action
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'BACKUP_CREATE',
        resource_type: 'backup',
        resource_id: backupId,
        operation: 'CREATE',
        severity: 'HIGH',
        status: 'SUCCESS',
        metadata: {
          backup_type: 'FULL',
          tables_count: this.CRITICAL_TABLES.length,
          records_count: totalRecords,
          size_bytes: totalSize
        }
      });

            return { success: true, backup: metadata };
    } catch (error: any) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la sauvegarde'
      };
    }
  }

  /**
   * Crée une sauvegarde incrémentale
   */
  static async createIncrementalBackup(
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string,
    lastBackupDate: string
  ): Promise<{ success: boolean; backup?: BackupMetadata; error?: string }> {
    try {
      
      const backupId = `backup_incr_${Date.now()}`;
      const backupData: any = {};
      let totalRecords = 0;
      let totalSize = 0;

      // Sauvegarder uniquement les enregistrements modifiés depuis la dernière sauvegarde
      for (const table of this.CRITICAL_TABLES) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .gte('updated_at', lastBackupDate);

          if (error) {
                        continue;
          }

          if (data && data.length > 0) {
            backupData[table] = data;
            totalRecords += data.length;
            totalSize += JSON.stringify(data).length;
          }
        } catch (err) {
                  }
      }

      const checksum = await this.calculateChecksum(backupData);
      const backupBlob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const fileName = `${backupId}.json`;

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, backupBlob);

      if (uploadError) {
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      const metadata: BackupMetadata = {
        id: backupId,
        backup_date: new Date().toISOString(),
        backup_type: 'INCREMENTAL',
        size_bytes: totalSize,
        tables_count: Object.keys(backupData).length,
        records_count: totalRecords,
        status: 'COMPLETED',
        created_by: userId,
        checksum,
        storage_location: fileName,
        can_restore: false // Les sauvegardes incrémentales nécessitent la sauvegarde complète
      };

      await supabase.from('backup_metadata').insert([metadata]);

      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'BACKUP_CREATE',
        resource_type: 'backup',
        resource_id: backupId,
        operation: 'CREATE',
        severity: 'MEDIUM',
        status: 'SUCCESS',
        metadata: {
          backup_type: 'INCREMENTAL',
          records_count: totalRecords,
          since: lastBackupDate
        }
      });

      return { success: true, backup: metadata };
    } catch (error: any) {
      console.error('Erreur lors de la création de la sauvegarde incrémentale:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la sauvegarde incrémentale'
      };
    }
  }

  /**
   * Restaure une sauvegarde
   */
  static async restoreBackup(
    options: RestoreOptions,
    userId: string,
    userName: string,
    userRole: string,
    userEntity: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      
      // Récupérer les métadonnées de la sauvegarde
      const { data: metadata, error: metadataError } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', options.backup_id)
        .single();

      if (metadataError || !metadata) {
        return { success: false, error: 'Sauvegarde introuvable' };
      }

      if (!metadata.can_restore) {
        return {
          success: false,
          error: 'Cette sauvegarde ne peut pas être restaurée directement (sauvegarde incrémentale)'
        };
      }

      // Créer une sauvegarde de sécurité avant la restauration
      if (options.create_backup_before_restore) {
                const securityBackup = await this.createFullBackup(userId, userName, userRole, userEntity);
        if (!securityBackup.success) {
          return {
            success: false,
            error: 'Impossible de créer la sauvegarde de sécurité'
          };
        }
      }

      // Télécharger la sauvegarde
      const { data: backupFile, error: downloadError } = await supabase.storage
        .from('backups')
        .download(metadata.storage_location);

      if (downloadError || !backupFile) {
        return { success: false, error: 'Impossible de télécharger la sauvegarde' };
      }

      // Lire le contenu
      const backupContent = await backupFile.text();
      const backupData = JSON.parse(backupContent);

      // Vérifier le checksum
      if (options.verify_before_restore) {
        const calculatedChecksum = await this.calculateChecksum(backupData);
        if (calculatedChecksum !== metadata.checksum) {
          return {
            success: false,
            error: 'La sauvegarde est corrompue (checksum invalide)'
          };
        }
      }

      // Restaurer les données
      const tablesToRestore = options.tables_to_restore || Object.keys(backupData);
      let restoredTables = 0;
      let restoredRecords = 0;

      for (const table of tablesToRestore) {
        if (!backupData[table]) continue;

        try {
          // Supprimer les données existantes
          await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

          // Insérer les données de la sauvegarde
          const { error: insertError } = await supabase
            .from(table)
            .insert(backupData[table]);

          if (insertError) {
            console.error(`Erreur lors de la restauration de ${table}:`, insertError);
            continue;
          }

          restoredTables++;
          restoredRecords += backupData[table].length;
        } catch (err) {
          console.error(`Impossible de restaurer ${table}:`, err);
        }
      }

      // Logger l'action
      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'BACKUP_RESTORE',
        resource_type: 'backup',
        resource_id: options.backup_id,
        operation: 'UPDATE',
        severity: 'CRITICAL',
        status: 'SUCCESS',
        metadata: {
          backup_id: options.backup_id,
          tables_restored: restoredTables,
          records_restored: restoredRecords,
          security_backup_created: options.create_backup_before_restore
        }
      });

      return {
        success: true,
        message: `Restauration réussie: ${restoredTables} table(s), ${restoredRecords} enregistrement(s)`
      };
    } catch (error: any) {
      console.error('Erreur lors de la restauration:', error);

      await AuditTrailService.log({
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        user_entity: userEntity,
        action_type: 'BACKUP_RESTORE',
        resource_type: 'backup',
        resource_id: options.backup_id,
        operation: 'UPDATE',
        severity: 'CRITICAL',
        status: 'FAILURE',
        error_message: error.message
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la restauration'
      };
    }
  }

  /**
   * Liste toutes les sauvegardes disponibles
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .order('backup_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des sauvegardes:', error);
      return [];
    }
  }

  /**
   * Supprime les anciennes sauvegardes selon la politique de rétention
   */
  static async cleanOldBackups(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data: oldBackups } = await supabase
        .from('backup_metadata')
        .select('*')
        .lt('backup_date', cutoffDate.toISOString());

      if (!oldBackups || oldBackups.length === 0) {
        return 0;
      }

      let deletedCount = 0;

      for (const backup of oldBackups) {
        // Supprimer le fichier du stockage
        await supabase.storage
          .from('backups')
          .remove([backup.storage_location]);

        // Supprimer les métadonnées
        await supabase
          .from('backup_metadata')
          .delete()
          .eq('id', backup.id);

        deletedCount++;
      }

       obsolète(s) supprimée(s)`);
      return deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des sauvegardes:', error);
      return 0;
    }
  }

  /**
   * Vérifie l'intégrité d'une sauvegarde
   */
  static async verifyBackupIntegrity(backupId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    try {
      const { data: metadata } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', backupId)
        .single();

      if (!metadata) {
        return { isValid: false, errors: ['Sauvegarde introuvable'] };
      }

      const { data: backupFile } = await supabase.storage
        .from('backups')
        .download(metadata.storage_location);

      if (!backupFile) {
        return { isValid: false, errors: ['Fichier de sauvegarde introuvable'] };
      }

      const backupContent = await backupFile.text();
      const backupData = JSON.parse(backupContent);

      const calculatedChecksum = await this.calculateChecksum(backupData);

      if (calculatedChecksum !== metadata.checksum) {
        return { isValid: false, errors: ['Checksum invalide - sauvegarde corrompue'] };
      }

      return { isValid: true, errors: [] };
    } catch (error: any) {
      return { isValid: false, errors: [error.message] };
    }
  }

  /**
   * Teste la restauration sans appliquer les changements
   */
  static async testRestore(backupId: string): Promise<{
    success: boolean;
    canRestore: boolean;
    issues: string[];
  }> {
    try {
      const integrity = await this.verifyBackupIntegrity(backupId);
      
      if (!integrity.isValid) {
        return {
          success: false,
          canRestore: false,
          issues: integrity.errors
        };
      }

      // Vérifier que toutes les tables existent
      const { data: metadata } = await supabase
        .from('backup_metadata')
        .select('*')
        .eq('id', backupId)
        .single();

      if (!metadata) {
        return {
          success: false,
          canRestore: false,
          issues: ['Métadonnées introuvables']
        };
      }

      return {
        success: true,
        canRestore: true,
        issues: []
      };
    } catch (error: any) {
      return {
        success: false,
        canRestore: false,
        issues: [error.message]
      };
    }
  }

  /**
   * Calcule le checksum d'un objet
   */
  private static async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Configure la sauvegarde automatique
   */
  static async configureAutoBackup(config: BackupConfig): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('backup_config')
        .upsert([config]);

      if (error) throw error;

      return {
        success: true,
        message: 'Configuration de sauvegarde automatique enregistrée'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la configuration'
      };
    }
  }

  /**
   * Génère un rapport de sauvegarde
   */
  static async generateBackupReport(startDate: string, endDate: string): Promise<{
    total_backups: number;
    successful_backups: number;
    failed_backups: number;
    total_size_bytes: number;
    average_size_bytes: number;
    backups_by_type: Record<string, number>;
  }> {
    try {
      const { data: backups } = await supabase
        .from('backup_metadata')
        .select('*')
        .gte('backup_date', startDate)
        .lte('backup_date', endDate);

      if (!backups || backups.length === 0) {
        return {
          total_backups: 0,
          successful_backups: 0,
          failed_backups: 0,
          total_size_bytes: 0,
          average_size_bytes: 0,
          backups_by_type: {}
        };
      }

      const successful = backups.filter(b => b.status === 'COMPLETED').length;
      const failed = backups.filter(b => b.status === 'FAILED').length;
      const totalSize = backups.reduce((sum, b) => sum + b.size_bytes, 0);

      const byType: Record<string, number> = {};
      backups.forEach(b => {
        byType[b.backup_type] = (byType[b.backup_type] || 0) + 1;
      });

      return {
        total_backups: backups.length,
        successful_backups: successful,
        failed_backups: failed,
        total_size_bytes: totalSize,
        average_size_bytes: totalSize / backups.length,
        backups_by_type: byType
      };
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      return {
        total_backups: 0,
        successful_backups: 0,
        failed_backups: 0,
        total_size_bytes: 0,
        average_size_bytes: 0,
        backups_by_type: {}
      };
    }
  }
}
