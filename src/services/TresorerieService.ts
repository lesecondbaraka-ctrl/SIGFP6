import { supabase } from '../lib/supabase';
import { 
  CompteTresorerie, 
  ReleveBancaire, 
  RapprochementBancaire, 
  LigneRapprochement,
  TauxChange,
  KpiTresorerie,
  DashboardTresorerie,
  LigneFluxTresorerie,
  PrevisionTresorerie,
  StatutPrevision,
  TypePrevision
} from '../types/tresorerie';

export class TresorerieService {
  // =============================================
  // Gestion des comptes de trésorerie
  // =============================================
  
  /**
   * Récupère tous les comptes de trésorerie actifs
   */
  static async getComptesTresorerie(): Promise<CompteTresorerie[]> {
    const { data, error } = await supabase
      .from('comptes_tresorerie')
      .select('*')
      .eq('actif', true)
      .order('banque');

    if (error) throw error;
    return data || [];
  }

  /**
   * Crée ou met à jour un compte de trésorerie
   */
  static async saveCompte(compte: Partial<CompteTresorerie>): Promise<CompteTresorerie> {
    if (compte.id) {
      const { data, error } = await supabase
        .from('comptes_tresorerie')
        .update({
          ...compte,
          updated_at: new Date().toISOString()
        })
        .eq('id', compte.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('comptes_tresorerie')
        .insert({
          ...compte,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Désactive un compte de trésorerie
   */
  static async deleteCompte(compteId: string): Promise<void> {
    const { error } = await supabase
      .from('comptes_tresorerie')
      .update({ actif: false, updated_at: new Date().toISOString() })
      .eq('id', compteId);

    if (error) throw error;
  }

  // =============================================
  // Gestion des relevés bancaires
  // =============================================
  
  /**
   * Récupère les opérations non rapprochées d'un compte
   */
  static async getOperationsNonRapprochees(compteId: string): Promise<ReleveBancaire[]> {
    const { data, error } = await supabase
      .from('releves_bancaires')
      .select('*')
      .eq('compte_id', compteId)
      .eq('statut', 'a_rapprocher')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // =============================================
  // Gestion des rapprochements bancaires
  // =============================================
  
  /**
   * Crée un nouveau rapprochement bancaire
   */
  static async creerRapprochement(
    compteId: string, 
    dateDebut: string, 
    dateFin: string,
    soldeBancaire: number,
    commentaire?: string
  ): Promise<RapprochementBancaire> {
    // Récupérer le solde comptable à la date de fin
    const soldeComptable = 0; // TODO: Implémenter le calcul du solde comptable

    const ecart = soldeComptable - soldeBancaire;
    
    const { data, error } = await supabase
      .from('rapprochements_bancaires')
      .insert({
        compte_id: compteId,
        date_debut: dateDebut,
        date_fin: dateFin,
        solde_comptable: soldeComptable,
        solde_bancaire: soldeBancaire,
        ecart,
        statut: 'brouillon',
        commentaire,
        created_by: (await supabase.auth.getUser()).data.user?.id || 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Valide un rapprochement bancaire
   */
  static async validerRapprochement(rapprochementId: string): Promise<void> {
    const { error } = await supabase
      .from('rapprochements_bancaires')
      .update({ 
        statut: 'valide',
        updated_at: new Date().toISOString()
      })
      .eq('id', rapprochementId);

    if (error) throw error;
  }

  // =============================================
  // Gestion des taux de change
  // =============================================
  
  /**
   * Récupère le taux de change actuel pour une paire de devises
   */
  static async getTauxChange(deviseSource: string, deviseCible: string): Promise<number> {
    // D'abord essayer de récupérer le taux le plus récent
    const { data, error } = await supabase
      .from('taux_change')
      .select('taux')
      .eq('devise_source', deviseSource)
      .eq('devise_cible', deviseCible)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Si pas de taux en base, utiliser une valeur par défaut
      if (deviseSource === 'USD' && deviseCible === 'CDF') return 2500; // Taux indicatif
      if (deviseSource === 'EUR' && deviseCible === 'CDF') return 2800; // Taux indicatif
      return 1; // Même devise
    }

    return data.taux;
  }

  /**
   * Met à jour le taux de change pour une paire de devises
   */
  static async updateTauxChange(
    deviseSource: string, 
    deviseCible: string, 
    taux: number,
    source: 'banque_centrale' | 'marche' | 'manuel' = 'manuel'
  ): Promise<TauxChange> {
    const { data, error } = await supabase
      .from('taux_change')
      .insert({
        devise_source: deviseSource,
        devise_cible: deviseCible,
        taux,
        source,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // =============================================
  // Tableau de bord et indicateurs
  // =============================================
  
  /**
   * Récupère les indicateurs clés de trésorerie
   */
  static async getKpisTresorerie(exerciceId?: string): Promise<KpiTresorerie> {
    try {
      // 1. Récupérer tous les comptes de trésorerie actifs
      const comptes = await this.getComptesTresorerie();
      
      // 2. Calculer le solde courant total en CDF
      const soldeCourantCDF = comptes
        .filter(c => c.devise === 'CDF')
        .reduce((sum, c) => sum + c.solde_actuel, 0);
      
      // 3. Calculer le solde courant en USD
      const soldeCourantUSD = comptes
        .filter(c => c.devise === 'USD')
        .reduce((sum, c) => sum + c.solde_actuel, 0);
      
      // 4. Calculer le solde moyen sur 30 jours
      const soldeMoyen30j = await this.calculerSoldeMoyen30Jours();
      
      // 5. Calculer les jours d'autonomie
      const joursAutonomie = await this.calculerJoursAutonomie(exerciceId);
      
      // 6. Calculer le ratio de liquidité
      const ratioLiquidite = await this.calculerRatioLiquidite(exerciceId);
      
      // 7. Calculer la trésorerie nette (disponibilités - dettes court terme)
      const tresorerieNette = soldeCourantCDF + (soldeCourantUSD * 2500); // Conversion USD
      
      return {
        solde_courant: soldeCourantCDF,
        solde_courant_usd: soldeCourantUSD,
        solde_moyen_30j: soldeMoyen30j,
        jours_autonomie: joursAutonomie,
        ratio_liquidite: ratioLiquidite,
        tresorerie_nette: tresorerieNette,
        date_calcul: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur calcul KPIs:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        solde_courant: 0,
        solde_courant_usd: 0,
        solde_moyen_30j: 0,
        jours_autonomie: 0,
        ratio_liquidite: 0,
        tresorerie_nette: 0,
        date_calcul: new Date().toISOString()
      };
    }
  }

  /**
   * Calcule le solde moyen sur les 30 derniers jours
   */
  private static async calculerSoldeMoyen30Jours(): Promise<number> {
    try {
      const date30JoursAvant = new Date();
      date30JoursAvant.setDate(date30JoursAvant.getDate() - 30);

      // Récupérer les flux des 30 derniers jours
      const { data: flux, error } = await supabase
        .from('flux_tresorerie')
        .select('montant_paye, type_operation, date_operation')
        .gte('date_operation', date30JoursAvant.toISOString())
        .eq('statut', 'PAIEMENT');

      if (error || !flux) return 0;

      // Calculer le solde moyen
      const comptes = await this.getComptesTresorerie();
      const soldeActuel = comptes.reduce((sum, c) => sum + c.solde_actuel, 0);
      
      const totalFlux = flux.reduce((sum: number, f: any) => {
        return sum + (f.type_operation === 'RECETTE' ? f.montant_paye : -f.montant_paye);
      }, 0);

      const soldeDebut = soldeActuel - totalFlux;
      return (soldeDebut + soldeActuel) / 2;
    } catch (error) {
      console.error('Erreur calcul solde moyen:', error);
      return 0;
    }
  }

  /**
   * Calcule le nombre de jours d'autonomie
   * Jours d'autonomie = Solde actuel / (Dépenses mensuelles moyennes / 30)
   */
  private static async calculerJoursAutonomie(exerciceId?: string): Promise<number> {
    try {
      if (!exerciceId) return 0;

      // Récupérer les dépenses des 3 derniers mois
      const date3MoisAvant = new Date();
      date3MoisAvant.setMonth(date3MoisAvant.getMonth() - 3);

      const { data: depenses, error } = await supabase
        .from('flux_tresorerie')
        .select('montant_paye')
        .eq('exercice_id', exerciceId)
        .eq('type_operation', 'DEPENSE')
        .eq('statut', 'PAIEMENT')
        .gte('date_operation', date3MoisAvant.toISOString());

      if (error || !depenses || depenses.length === 0) return 0;

      const totalDepenses = depenses.reduce((sum: number, d: any) => sum + d.montant_paye, 0);
      const depensesMoyennesJournalieres = totalDepenses / 90; // 3 mois = 90 jours

      const comptes = await this.getComptesTresorerie();
      const soldeActuel = comptes.reduce((sum, c) => sum + c.solde_actuel, 0);

      if (depensesMoyennesJournalieres === 0) return 999; // Autonomie infinie si pas de dépenses

      return Math.round(soldeActuel / depensesMoyennesJournalieres);
    } catch (error) {
      console.error('Erreur calcul jours autonomie:', error);
      return 0;
    }
  }

  /**
   * Calcule le ratio de liquidité
   * Ratio de liquidité = Recettes / Dépenses
   */
  private static async calculerRatioLiquidite(exerciceId?: string): Promise<number> {
    try {
      if (!exerciceId) return 0;

      // Récupérer les flux de l'exercice
      const { data: flux, error } = await supabase
        .from('flux_tresorerie')
        .select('montant_paye, type_operation')
        .eq('exercice_id', exerciceId)
        .eq('statut', 'PAIEMENT');

      if (error || !flux || flux.length === 0) return 0;

      const totalRecettes = flux
        .filter((f: any) => f.type_operation === 'RECETTE')
        .reduce((sum: number, f: any) => sum + f.montant_paye, 0);

      const totalDepenses = flux
        .filter((f: any) => f.type_operation === 'DEPENSE')
        .reduce((sum: number, f: any) => sum + f.montant_paye, 0);

      if (totalDepenses === 0) return 0;

      return totalRecettes / totalDepenses;
    } catch (error) {
      console.error('Erreur calcul ratio liquidité:', error);
      return 0;
    }
  }

  /**
   * Récupère les données pour le tableau de bord de trésorerie
   */
  static async getDashboardTresorerie(exerciceId: string): Promise<DashboardTresorerie> {
    try {
      // Récupérer les KPIs
      const kpis = await this.getKpisTresorerie(exerciceId);

      // Récupérer les soldes par compte
      const soldesParCompte = await this.getSoldesParCompte();

      // Récupérer les flux mensuels
      const fluxMensuels = await this.getFluxMensuels(exerciceId);

      // Récupérer les prévisions vs réalisé
      const previsionsVsRealise = await this.getPrevisionsVsRealise(exerciceId);

      return {
        kpis,
        soldes_par_compte: soldesParCompte,
        flux_mensuels: fluxMensuels,
        previsions_vs_realise: previsionsVsRealise
      };
    } catch (error) {
      console.error('Erreur getDashboardTresorerie:', error);
      const kpis = await this.getKpisTresorerie(exerciceId);
      return {
        kpis,
        soldes_par_compte: [],
        flux_mensuels: [],
        previsions_vs_realise: []
      };
    }
  }

  // =============================================
  // Méthodes utilitaires
  // =============================================
  
  /**
   * Convertit un montant d'une devise à une autre
   */
  static async convertirMontant(
    montant: number, 
    deviseSource: string, 
    deviseCible: string
  ): Promise<number> {
    if (deviseSource === deviseCible) return montant;
    
    const taux = await this.getTauxChange(deviseSource, deviseCible);
    return montant * taux;
  }

  /**
   * Formate un montant selon la devise
   */
  static formaterMontant(montant: number, devise: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: devise,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  // =============================================
  // Méthodes existantes (à conserver)
  // =============================================
  
  static async getFluxParNature(exerciceId: string, nature: string): Promise<LigneFluxTresorerie[]> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('nature_flux', nature)
      .order('date_operation');

    if (error) throw error;
    return data || [];
  }

  static async getResumeMensuel(exerciceId: string) {
    const flux = await this.getFluxTresorerie(exerciceId);
    const fluxParMois: Record<number, { encaissements: number; decaissements: number }> = {};

    flux.forEach((f) => {
      const date = new Date(f.date_operation);
      const mois = date.getMonth();

      if (!fluxParMois[mois]) {
        fluxParMois[mois] = { encaissements: 0, decaissements: 0 };
      }
      
      if (f.type_operation === 'RECETTE') {
        fluxParMois[mois].encaissements += f.montant_paye || 0;
      } else {
        fluxParMois[mois].decaissements += f.montant_paye || 0;
      }
    });

    const moisNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return Object.entries(fluxParMois).map(([mois, totaux]) => ({
      mois: moisNames[parseInt(mois)],
      encaissements: totaux.encaissements,
      decaissements: totaux.decaissements,
      solde: totaux.encaissements - totaux.decaissements
    })).sort((a, b) => moisNames.indexOf(a.mois) - moisNames.indexOf(b.mois));
  }

  // =============================================
  // Méthodes privées - Utilisation des fonctions RPC
  // =============================================
  
  private static async getFluxTresorerie(exerciceId: string): Promise<LigneFluxTresorerie[]> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('date_operation');

    if (error) throw error;
    return data || [];
  }
  
  /**
   * Récupère les soldes par compte via fonction RPC
   * Performance optimisée avec calcul côté serveur
   */
  private static async getSoldesParCompte() {
    try {
      const { data, error } = await supabase
        .rpc('get_soldes_par_compte');
      
      if (error) {
        console.error('Erreur RPC get_soldes_par_compte:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception getSoldesParCompte:', error);
      return [];
    }
  }
  
  /**
   * Récupère les flux mensuels via fonction RPC
   * Agrégation optimisée côté serveur
   */
  private static async getFluxMensuels(exerciceId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_flux_mensuels', { p_exercice_id: exerciceId });
      
      if (error) {
        console.error('Erreur RPC get_flux_mensuels:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception getFluxMensuels:', error);
      return [];
    }
  }
  
  /**
   * Récupère les prévisions vs réalisé via fonction RPC
   * Comparaison optimisée côté serveur
   */
  private static async getPrevisionsVsRealise(exerciceId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_previsions_vs_realise', { p_exercice_id: exerciceId });
      
      if (error) {
        console.error('Erreur RPC get_previsions_vs_realise:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception getPrevisionsVsRealise:', error);
      return [];
    }
  }

  // =============================================
  // Méthodes publiques supplémentaires - Fonctions RPC
  // =============================================

  /**
   * Récupère les statistiques globales de trésorerie
   */
  static async getStatistiquesTresorerie(exerciceId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_statistiques_tresorerie', { p_exercice_id: exerciceId });
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Erreur getStatistiquesTresorerie:', error);
      return null;
    }
  }

  /**
   * Récupère la répartition agrégée des flux par nature (IPSAS)
   * Version optimisée avec fonction RPC
   */
  static async getRepartitionFluxParNature(exerciceId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_flux_par_nature', { p_exercice_id: exerciceId });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getRepartitionFluxParNature:', error);
      return [];
    }
  }

  /**
   * Récupère l'évolution de la trésorerie
   */
  static async getEvolutionTresorerie(
    exerciceId: string, 
    periode: 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL' | 'TRIMESTRIEL' = 'MENSUEL'
  ) {
    try {
      const { data, error } = await supabase
        .rpc('get_evolution_tresorerie', { 
          p_exercice_id: exerciceId,
          p_periode: periode
        });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur getEvolutionTresorerie:', error);
      return [];
    }
  }
}
