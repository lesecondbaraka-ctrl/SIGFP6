import { supabase } from '../lib/supabase';

/**
 * Service Budget Avancé
 * Gestion complète du budget conforme IPSAS 24
 */

export interface LigneBudgetaire {
  id: string;
  code: string;
  libelle: string;
  categorie: 'Fonctionnement' | 'Personnel' | 'Investissement' | 'Transfert';
  budgetInitial: number;
  budgetRevise: number;
  engagement: number;
  realisation: number;
  disponible: number;
  ecartBudget: number;
  ecartEngagement: number;
  tauxRealisation: number;
  tauxEngagement: number;
  statut: 'Normal' | 'Alerte' | 'Dépassement';
  exercice: string;
  departement?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VirementBudgetaire {
  id: string;
  reference: string;
  date: string;
  ligneSourceId: string;
  ligneDestinationId: string;
  montant: number;
  motif: string;
  statut: 'En attente' | 'Approuvé' | 'Rejeté';
  demandeur: string;
  approbateur?: string;
  dateApprobation?: string;
  commentaire?: string;
  exercice: string;
}

export interface RevisionBudgetaire {
  id: string;
  reference: string;
  date: string;
  type: 'Augmentation' | 'Diminution' | 'Réaffectation';
  lignesBudgetaires: string[];
  montantTotal: number;
  motif: string;
  justification: string;
  statut: 'Brouillon' | 'Soumis' | 'Approuvé' | 'Rejeté';
  documents: string[];
  demandeur: string;
  approbateur?: string;
  dateApprobation?: string;
  exercice: string;
}

export interface KPIsBudgetaires {
  totalBudgetInitial: number;
  totalBudgetRevise: number;
  totalEngagement: number;
  totalRealisation: number;
  totalDisponible: number;
  tauxEngagement: number;
  tauxRealisation: number;
  tauxDisponibilite: number;
  lignesAlerte: number;
  lignesDepassement: number;
  revisionBudgetaire: number;
}

export class BudgetAdvancedService {
  
  // =============================================
  // Gestion des Lignes Budgétaires
  // =============================================
  
  /**
   * Récupère toutes les lignes budgétaires d'un exercice
   */
  static async getLignesBudgetaires(exercice: string): Promise<LigneBudgetaire[]> {
    const { data, error } = await supabase
      .from('lignes_budgetaires')
      .select('*')
      .eq('exercice', exercice)
      .order('code');

    if (error) throw error;
    return data || [];
  }

  /**
   * Crée ou met à jour une ligne budgétaire
   */
  static async saveLigneBudgetaire(ligne: Partial<LigneBudgetaire>): Promise<LigneBudgetaire> {
    // Calculer les champs dérivés
    const disponible = (ligne.budgetRevise || 0) - (ligne.engagement || 0);
    const ecartBudget = (ligne.budgetRevise || 0) - (ligne.realisation || 0);
    const ecartEngagement = (ligne.engagement || 0) - (ligne.realisation || 0);
    const tauxRealisation = ligne.budgetRevise && ligne.budgetRevise > 0 
      ? ((ligne.realisation || 0) / ligne.budgetRevise) * 100 
      : 0;
    const tauxEngagement = ligne.budgetRevise && ligne.budgetRevise > 0 
      ? ((ligne.engagement || 0) / ligne.budgetRevise) * 100 
      : 0;
    
    // Déterminer le statut
    let statut: 'Normal' | 'Alerte' | 'Dépassement' = 'Normal';
    if (tauxEngagement > 100 || tauxRealisation > 100) {
      statut = 'Dépassement';
    } else if (tauxEngagement > 95 || tauxRealisation > 95) {
      statut = 'Alerte';
    }

    const ligneComplete = {
      ...ligne,
      disponible,
      ecartBudget,
      ecartEngagement,
      tauxRealisation,
      tauxEngagement,
      statut,
      updated_at: new Date().toISOString()
    };

    if (ligne.id) {
      const { data, error } = await supabase
        .from('lignes_budgetaires')
        .update(ligneComplete)
        .eq('id', ligne.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('lignes_budgetaires')
        .insert({
          ...ligneComplete,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Calcule les KPIs budgétaires
   */
  static async getKPIsBudgetaires(exercice: string): Promise<KPIsBudgetaires> {
    const lignes = await this.getLignesBudgetaires(exercice);

    const totalBudgetInitial = lignes.reduce((sum, l) => sum + l.budgetInitial, 0);
    const totalBudgetRevise = lignes.reduce((sum, l) => sum + l.budgetRevise, 0);
    const totalEngagement = lignes.reduce((sum, l) => sum + l.engagement, 0);
    const totalRealisation = lignes.reduce((sum, l) => sum + l.realisation, 0);
    const totalDisponible = lignes.reduce((sum, l) => sum + l.disponible, 0);
    
    const tauxEngagement = totalBudgetRevise > 0 ? (totalEngagement / totalBudgetRevise) * 100 : 0;
    const tauxRealisation = totalBudgetRevise > 0 ? (totalRealisation / totalBudgetRevise) * 100 : 0;
    const tauxDisponibilite = totalBudgetRevise > 0 ? (totalDisponible / totalBudgetRevise) * 100 : 0;
    
    const lignesAlerte = lignes.filter(l => l.statut === 'Alerte').length;
    const lignesDepassement = lignes.filter(l => l.statut === 'Dépassement').length;
    const revisionBudgetaire = totalBudgetRevise - totalBudgetInitial;

    return {
      totalBudgetInitial,
      totalBudgetRevise,
      totalEngagement,
      totalRealisation,
      totalDisponible,
      tauxEngagement,
      tauxRealisation,
      tauxDisponibilite,
      lignesAlerte,
      lignesDepassement,
      revisionBudgetaire
    };
  }

  // =============================================
  // Gestion des Virements Budgétaires
  // =============================================
  
  /**
   * Récupère tous les virements d'un exercice
   */
  static async getVirements(exercice: string): Promise<VirementBudgetaire[]> {
    const { data, error } = await supabase
      .from('virements_budgetaires')
      .select('*')
      .eq('exercice', exercice)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crée un virement budgétaire
   */
  static async createVirement(virement: Omit<VirementBudgetaire, 'id'>): Promise<VirementBudgetaire> {
    const { data, error } = await supabase
      .from('virements_budgetaires')
      .insert(virement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Approuve un virement budgétaire
   */
  static async approuverVirement(
    virementId: string,
    approbateur: string,
    commentaire?: string
  ): Promise<VirementBudgetaire> {
    const { data: virement, error: virementError } = await supabase
      .from('virements_budgetaires')
      .select('*')
      .eq('id', virementId)
      .single();

    if (virementError) throw virementError;

    // Mettre à jour les lignes budgétaires
    const { data: ligneSource } = await supabase
      .from('lignes_budgetaires')
      .select('*')
      .eq('id', virement.ligneSourceId)
      .single();

    const { data: ligneDestination } = await supabase
      .from('lignes_budgetaires')
      .select('*')
      .eq('id', virement.ligneDestinationId)
      .single();

    if (!ligneSource || !ligneDestination) {
      throw new Error('Lignes budgétaires introuvables');
    }

    // Vérifier disponibilité
    if (ligneSource.disponible < virement.montant) {
      throw new Error('Crédit disponible insuffisant sur la ligne source');
    }

    // Effectuer le virement
    await this.saveLigneBudgetaire({
      ...ligneSource,
      budgetRevise: ligneSource.budgetRevise - virement.montant
    });

    await this.saveLigneBudgetaire({
      ...ligneDestination,
      budgetRevise: ligneDestination.budgetRevise + virement.montant
    });

    // Mettre à jour le virement
    const { data, error } = await supabase
      .from('virements_budgetaires')
      .update({
        statut: 'Approuvé',
        approbateur,
        dateApprobation: new Date().toISOString(),
        commentaire
      })
      .eq('id', virementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Rejette un virement budgétaire
   */
  static async rejeterVirement(
    virementId: string,
    approbateur: string,
    commentaire: string
  ): Promise<VirementBudgetaire> {
    const { data, error } = await supabase
      .from('virements_budgetaires')
      .update({
        statut: 'Rejeté',
        approbateur,
        dateApprobation: new Date().toISOString(),
        commentaire
      })
      .eq('id', virementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =============================================
  // Gestion des Révisions Budgétaires
  // =============================================
  
  /**
   * Récupère toutes les révisions d'un exercice
   */
  static async getRevisions(exercice: string): Promise<RevisionBudgetaire[]> {
    const { data, error } = await supabase
      .from('revisions_budgetaires')
      .select('*')
      .eq('exercice', exercice)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Crée une révision budgétaire
   */
  static async createRevision(revision: Omit<RevisionBudgetaire, 'id'>): Promise<RevisionBudgetaire> {
    const { data, error } = await supabase
      .from('revisions_budgetaires')
      .insert(revision)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Approuve une révision budgétaire
   */
  static async approuverRevision(
    revisionId: string,
    approbateur: string
  ): Promise<RevisionBudgetaire> {
    const { data, error } = await supabase
      .from('revisions_budgetaires')
      .update({
        statut: 'Approuvé',
        approbateur,
        dateApprobation: new Date().toISOString()
      })
      .eq('id', revisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =============================================
  // Analyses et Rapports
  // =============================================
  
  /**
   * Analyse des écarts budgétaires
   */
  static async analyseEcarts(exercice: string): Promise<{
    ecartsDefavorables: LigneBudgetaire[];
    ecartsFavorables: LigneBudgetaire[];
    totalEcartDefavorable: number;
    totalEcartFavorable: number;
  }> {
    const lignes = await this.getLignesBudgetaires(exercice);

    const ecartsDefavorables = lignes.filter(l => l.ecartBudget < 0);
    const ecartsFavorables = lignes.filter(l => l.ecartBudget > 0);

    const totalEcartDefavorable = ecartsDefavorables.reduce((sum, l) => sum + Math.abs(l.ecartBudget), 0);
    const totalEcartFavorable = ecartsFavorables.reduce((sum, l) => sum + l.ecartBudget, 0);

    return {
      ecartsDefavorables,
      ecartsFavorables,
      totalEcartDefavorable,
      totalEcartFavorable
    };
  }

  /**
   * Statistiques par catégorie
   */
  static async getStatsByCategorie(exercice: string): Promise<{
    categorie: string;
    budget: number;
    engagement: number;
    realisation: number;
    disponible: number;
    tauxRealisation: number;
  }[]> {
    const lignes = await this.getLignesBudgetaires(exercice);
    const categories = ['Personnel', 'Fonctionnement', 'Investissement', 'Transfert'];

    return categories.map(cat => {
      const lignesCategorie = lignes.filter(l => l.categorie === cat);
      const budget = lignesCategorie.reduce((sum, l) => sum + l.budgetRevise, 0);
      const engagement = lignesCategorie.reduce((sum, l) => sum + l.engagement, 0);
      const realisation = lignesCategorie.reduce((sum, l) => sum + l.realisation, 0);
      const disponible = lignesCategorie.reduce((sum, l) => sum + l.disponible, 0);
      const tauxRealisation = budget > 0 ? (realisation / budget) * 100 : 0;

      return {
        categorie: cat,
        budget,
        engagement,
        realisation,
        disponible,
        tauxRealisation
      };
    });
  }
}
