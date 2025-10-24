import { supabase } from '../lib/supabase';

/**
 * Service de Transparence Publique
 * Permet aux citoyens de consulter les dépenses publiques et signaler des irrégularités
 */

export interface PublicExpense {
  id: string;
  date: string;
  entity: string;
  category: string;
  description: string;
  amount: number;
  beneficiary: string;
  status: string;
  published: boolean;
}

export interface CitizenAlert {
  id?: string;
  reporter_name?: string; // Optionnel pour anonymat
  reporter_email?: string;
  reporter_phone?: string;
  alert_type: 'IRREGULARITE' | 'CORRUPTION' | 'DETOURNEMENT' | 'SURFACTURATION' | 'AUTRE';
  description: string;
  entity: string;
  transaction_reference?: string;
  amount?: number;
  evidence_files?: string[];
  submission_date: string;
  status: 'NOUVELLE' | 'EN_COURS' | 'VERIFIEE' | 'REJETEE' | 'TRAITEE';
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
  assigned_to?: string;
  follow_up_notes?: string;
  is_anonymous: boolean;
}

export interface PublicDashboardStats {
  total_budget: number;
  total_spent: number;
  execution_rate: number;
  by_entity: Record<string, number>;
  by_category: Record<string, number>;
  recent_expenses: PublicExpense[];
  citizen_alerts_count: number;
}

export class TransparencePubliqueService {
  /**
   * Récupère les dépenses publiques pour le portail citoyen
   */
  static async getPublicExpenses(filters?: {
    entity?: string;
    category?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    limit?: number;
  }): Promise<PublicExpense[]> {
    try {
      let query = supabase
        .from('depenses')
        .select('*')
        .eq('published', true) // Seulement les dépenses publiées
        .order('date_creation', { ascending: false });

      if (filters?.entity) query = query.eq('entite', filters.entity);
      if (filters?.category) query = query.eq('categorie', filters.category);
      if (filters?.date_from) query = query.gte('date_creation', filters.date_from);
      if (filters?.date_to) query = query.lte('date_creation', filters.date_to);
      if (filters?.min_amount) query = query.gte('montant', filters.min_amount);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        date: d.date_creation,
        entity: d.entite,
        category: d.categorie || 'Non catégorisé',
        description: d.objet,
        amount: d.montant,
        beneficiary: d.beneficiaire,
        status: d.statut,
        published: d.published
      }));
    } catch (error) {
      console.error('Erreur récupération dépenses publiques:', error);
      return [];
    }
  }

  /**
   * Récupère les statistiques pour le tableau de bord public
   */
  static async getPublicDashboardStats(year?: number): Promise<PublicDashboardStats> {
    try {
      const currentYear = year || new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      // Budget total
      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('montant_initial')
        .gte('date_debut', startDate)
        .lte('date_fin', endDate);

      const total_budget = (budgets || []).reduce((sum, b) => sum + (b.montant_initial || 0), 0);

      // Dépenses totales
      const { data: depenses, error: depensesError } = await supabase
        .from('depenses')
        .select('*')
        .eq('published', true)
        .gte('date_creation', startDate)
        .lte('date_creation', endDate);

      const total_spent = (depenses || []).reduce((sum, d) => sum + (d.montant || 0), 0);

      // Par entité
      const by_entity: Record<string, number> = {};
      (depenses || []).forEach(d => {
        by_entity[d.entite] = (by_entity[d.entite] || 0) + d.montant;
      });

      // Par catégorie
      const by_category: Record<string, number> = {};
      (depenses || []).forEach(d => {
        const cat = d.categorie || 'Non catégorisé';
        by_category[cat] = (by_category[cat] || 0) + d.montant;
      });

      // Dépenses récentes
      const recent_expenses = await this.getPublicExpenses({ limit: 10 });

      // Nombre d'alertes citoyennes
      const { count: alertsCount } = await supabase
        .from('citizen_alerts')
        .select('*', { count: 'exact', head: true });

      return {
        total_budget,
        total_spent,
        execution_rate: total_budget > 0 ? (total_spent / total_budget) * 100 : 0,
        by_entity,
        by_category,
        recent_expenses,
        citizen_alerts_count: alertsCount || 0
      };
    } catch (error) {
      console.error('Erreur récupération stats publiques:', error);
      return {
        total_budget: 0,
        total_spent: 0,
        execution_rate: 0,
        by_entity: {},
        by_category: {},
        recent_expenses: [],
        citizen_alerts_count: 0
      };
    }
  }

  /**
   * Soumet une alerte citoyenne
   */
  static async submitCitizenAlert(alert: Omit<CitizenAlert, 'id' | 'submission_date' | 'status'>): Promise<{
    success: boolean;
    alert_id?: string;
    message: string;
  }> {
    try {
      const newAlert: CitizenAlert = {
        ...alert,
        submission_date: new Date().toISOString(),
        status: 'NOUVELLE',
        priority: this.calculateAlertPriority(alert)
      };

      const { data, error } = await supabase
        .from('citizen_alerts')
        .insert([newAlert])
        .select()
        .single();

      if (error) throw error;

      // Créer une notification pour les administrateurs
      await supabase.from('notifications').insert([{
        message: `Nouvelle alerte citoyenne: ${alert.alert_type} - ${alert.entity}`,
        severity: newAlert.priority === 'URGENTE' ? 'CRITICAL' : 'HIGH',
        type: 'CITIZEN_ALERT',
        metadata: {
          alert_id: data.id,
          alert_type: alert.alert_type,
          entity: alert.entity
        },
        date_notification: new Date().toISOString(),
        lu: false
      }]);

      return {
        success: true,
        alert_id: data.id,
        message: 'Votre alerte a été enregistrée avec succès. Elle sera examinée par nos services.'
      };
    } catch (error) {
      console.error('Erreur soumission alerte citoyenne:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement de votre alerte. Veuillez réessayer.'
      };
    }
  }

  /**
   * Récupère toutes les alertes citoyennes (admin)
   */
  static async getCitizenAlerts(filters?: {
    status?: string;
    priority?: string;
    entity?: string;
    alert_type?: string;
  }): Promise<CitizenAlert[]> {
    try {
      let query = supabase
        .from('citizen_alerts')
        .select('*')
        .order('submission_date', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.priority) query = query.eq('priority', filters.priority);
      if (filters?.entity) query = query.eq('entity', filters.entity);
      if (filters?.alert_type) query = query.eq('alert_type', filters.alert_type);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur récupération alertes citoyennes:', error);
      return [];
    }
  }

  /**
   * Met à jour le statut d'une alerte citoyenne
   */
  static async updateCitizenAlertStatus(
    alertId: string,
    status: CitizenAlert['status'],
    followUpNotes?: string,
    assignedTo?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('citizen_alerts')
        .update({
          status,
          follow_up_notes: followUpNotes,
          assigned_to: assignedTo,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      console.error('Erreur mise à jour alerte citoyenne:', error);
      return false;
    }
  }

  /**
   * Publie une dépense pour la rendre visible au public
   */
  static async publishExpense(expenseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('depenses')
        .update({ published: true, published_date: new Date().toISOString() })
        .eq('id', expenseId);

      return !error;
    } catch (error) {
      console.error('Erreur publication dépense:', error);
      return false;
    }
  }

  /**
   * Dépublie une dépense
   */
  static async unpublishExpense(expenseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('depenses')
        .update({ published: false })
        .eq('id', expenseId);

      return !error;
    } catch (error) {
      console.error('Erreur dépublication dépense:', error);
      return false;
    }
  }

  /**
   * Publication automatique des dépenses selon les critères
   */
  static async autoPublishExpenses(criteria?: {
    min_amount?: number;
    entities?: string[];
    exclude_sensitive?: boolean;
  }): Promise<{ published_count: number }> {
    try {
      let query = supabase
        .from('depenses')
        .select('id')
        .eq('published', false)
        .eq('statut', 'Payé'); // Seulement les dépenses payées

      if (criteria?.min_amount) {
        query = query.gte('montant', criteria.min_amount);
      }

      if (criteria?.entities && criteria.entities.length > 0) {
        query = query.in('entite', criteria.entities);
      }

      const { data: expenses, error } = await query;
      if (error) throw error;

      let published_count = 0;
      for (const expense of expenses || []) {
        const success = await this.publishExpense(expense.id);
        if (success) published_count++;
      }

      return { published_count };
    } catch (error) {
      console.error('Erreur publication automatique:', error);
      return { published_count: 0 };
    }
  }

  /**
   * Génère un rapport de transparence
   */
  static async generateTransparencyReport(period: {
    start_date: string;
    end_date: string;
  }): Promise<{
    total_expenses: number;
    total_amount: number;
    by_entity: Record<string, { count: number; amount: number }>;
    by_category: Record<string, { count: number; amount: number }>;
    citizen_alerts: {
      total: number;
      by_type: Record<string, number>;
      by_status: Record<string, number>;
    };
  }> {
    try {
      const { data: expenses, error } = await supabase
        .from('depenses')
        .select('*')
        .eq('published', true)
        .gte('date_creation', period.start_date)
        .lte('date_creation', period.end_date);

      if (error) throw error;

      const by_entity: Record<string, { count: number; amount: number }> = {};
      const by_category: Record<string, { count: number; amount: number }> = {};

      (expenses || []).forEach(exp => {
        // Par entité
        if (!by_entity[exp.entite]) {
          by_entity[exp.entite] = { count: 0, amount: 0 };
        }
        by_entity[exp.entite].count++;
        by_entity[exp.entite].amount += exp.montant;

        // Par catégorie
        const cat = exp.categorie || 'Non catégorisé';
        if (!by_category[cat]) {
          by_category[cat] = { count: 0, amount: 0 };
        }
        by_category[cat].count++;
        by_category[cat].amount += exp.montant;
      });

      // Alertes citoyennes
      const { data: alerts } = await supabase
        .from('citizen_alerts')
        .select('*')
        .gte('submission_date', period.start_date)
        .lte('submission_date', period.end_date);

      const citizen_alerts = {
        total: alerts?.length || 0,
        by_type: {} as Record<string, number>,
        by_status: {} as Record<string, number>
      };

      (alerts || []).forEach(alert => {
        citizen_alerts.by_type[alert.alert_type] = (citizen_alerts.by_type[alert.alert_type] || 0) + 1;
        citizen_alerts.by_status[alert.status] = (citizen_alerts.by_status[alert.status] || 0) + 1;
      });

      return {
        total_expenses: expenses?.length || 0,
        total_amount: (expenses || []).reduce((sum, e) => sum + e.montant, 0),
        by_entity,
        by_category,
        citizen_alerts
      };
    } catch (error) {
      console.error('Erreur génération rapport transparence:', error);
      return {
        total_expenses: 0,
        total_amount: 0,
        by_entity: {},
        by_category: {},
        citizen_alerts: { total: 0, by_type: {}, by_status: {} }
      };
    }
  }

  /**
   * Calcule la priorité d'une alerte citoyenne
   */
  private static calculateAlertPriority(alert: Partial<CitizenAlert>): CitizenAlert['priority'] {
    let score = 0;

    // Type d'alerte
    if (alert.alert_type === 'CORRUPTION' || alert.alert_type === 'DETOURNEMENT') {
      score += 3;
    } else if (alert.alert_type === 'SURFACTURATION') {
      score += 2;
    } else {
      score += 1;
    }

    // Montant
    if (alert.amount) {
      if (alert.amount > 100000000) score += 3; // > 100M CDF
      else if (alert.amount > 50000000) score += 2; // > 50M CDF
      else if (alert.amount > 10000000) score += 1; // > 10M CDF
    }

    // Preuves fournies
    if (alert.evidence_files && alert.evidence_files.length > 0) {
      score += 1;
    }

    // Déterminer la priorité
    if (score >= 6) return 'URGENTE';
    if (score >= 4) return 'HAUTE';
    if (score >= 2) return 'MOYENNE';
    return 'BASSE';
  }
}
