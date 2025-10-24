import { supabase } from '../lib/supabase';
import { TresorerieService } from './TresorerieService';

/**
 * Service d'intégration entre Comptabilité et Trésorerie
 * Assure la cohérence des données et la synchronisation temps réel
 * Conforme SYSCOHADA (comptes classe 5)
 */

export interface ValidationCroisee {
  solde_tresorerie: number;
  solde_comptable: number;
  ecart: number;
  statut: 'OK' | 'ALERTE' | 'ERREUR';
  date_validation: string;
  details_ecarts?: EcartDetail[];
}

export interface EcartDetail {
  compte_id: string;
  compte_numero: string;
  libelle: string;
  solde_tresorerie: number;
  solde_comptable: number;
  ecart: number;
}

export interface MappingCompte {
  compte_tresorerie_id: string;
  compte_comptable: string;  // Ex: "521001" (SYSCOHADA)
  banque: string;
  devise: string;
  type_flux: 'RECETTE' | 'DEPENSE';
  actif: boolean;
}

export interface SynchronisationConfig {
  mode: 'TEMPS_REEL' | 'BATCH';
  frequence?: string;  // Pour mode BATCH: 'HORAIRE' | 'JOURNALIER'
  derniere_synchro?: string;
  prochaine_synchro?: string;
  auto_reconciliation: boolean;
}

export class IntegrationComptaTresoService {
  
  // =============================================
  // Mapping Comptes Trésorerie ↔ Comptabilité
  // =============================================
  
  /**
   * Récupère le mapping entre comptes de trésorerie et comptes comptables
   */
  static async getMappingComptes(): Promise<MappingCompte[]> {
    const { data, error } = await supabase
      .from('mapping_comptes_tresorerie')
      .select('*')
      .eq('actif', true);

    if (error) throw error;
    return data || [];
  }

  /**
   * Crée ou met à jour un mapping de compte
   */
  static async saveMappingCompte(mapping: Partial<MappingCompte>): Promise<MappingCompte> {
    const { data, error } = await supabase
      .from('mapping_comptes_tresorerie')
      .upsert({
        ...mapping,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Récupère le compte comptable correspondant à un compte de trésorerie
   */
  static async getCompteComptable(compteTresorerieId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('mapping_comptes_tresorerie')
      .select('compte_comptable')
      .eq('compte_tresorerie_id', compteTresorerieId)
      .eq('actif', true)
      .single();

    if (error || !data) return null;
    return data.compte_comptable;
  }

  // =============================================
  // Validation Croisée des Soldes
  // =============================================
  
  /**
   * Valide la cohérence entre soldes de trésorerie et soldes comptables
   */
  static async validerCoherence(): Promise<ValidationCroisee> {
    try {
      // Récupérer les soldes de trésorerie
      const comptesTresorerie = await TresorerieService.getComptesTresorerie();
      const soldeTresorerie = comptesTresorerie.reduce((sum, c) => sum + c.solde_actuel, 0);

      // Récupérer les soldes comptables (comptes 5xx)
      const { data: comptesComptables, error } = await supabase
        .from('comptes_comptables')
        .select('numero_compte, solde_debiteur, solde_crediteur')
        .like('numero_compte', '5%')  // Classe 5 = Trésorerie
        .eq('actif', true);

      if (error) throw error;

      const soldeComptable = (comptesComptables || []).reduce(
        (sum, c) => sum + (c.solde_debiteur - c.solde_crediteur), 
        0
      );

      const ecart = Math.abs(soldeTresorerie - soldeComptable);
      const tolerance = 1; // 1 CDF de tolérance pour arrondis

      let statut: 'OK' | 'ALERTE' | 'ERREUR' = 'OK';
      if (ecart > tolerance && ecart <= 1000) {
        statut = 'ALERTE';
      } else if (ecart > 1000) {
        statut = 'ERREUR';
      }

      // Détails des écarts par compte
      const detailsEcarts = await this.getDetailsEcarts(comptesTresorerie, comptesComptables || []);

      return {
        solde_tresorerie: soldeTresorerie,
        solde_comptable: soldeComptable,
        ecart,
        statut,
        date_validation: new Date().toISOString(),
        details_ecarts: detailsEcarts
      };
    } catch (error) {
      console.error('Erreur validation cohérence:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails des écarts par compte
   */
  private static async getDetailsEcarts(
    comptesTresorerie: any[],
    comptesComptables: any[]
  ): Promise<EcartDetail[]> {
    const ecarts: EcartDetail[] = [];

    for (const compteTreso of comptesTresorerie) {
      const compteComptable = await this.getCompteComptable(compteTreso.id);
      if (!compteComptable) continue;

      const compteCompta = comptesComptables.find(c => c.numero_compte === compteComptable);
      if (!compteCompta) continue;

      const soldeComptable = compteCompta.solde_debiteur - compteCompta.solde_crediteur;
      const ecart = Math.abs(compteTreso.solde_actuel - soldeComptable);

      if (ecart > 1) {  // Seuil de 1 CDF
        ecarts.push({
          compte_id: compteTreso.id,
          compte_numero: compteComptable,
          libelle: compteTreso.intitule,
          solde_tresorerie: compteTreso.solde_actuel,
          solde_comptable: soldeComptable,
          ecart
        });
      }
    }

    return ecarts;
  }

  // =============================================
  // Synchronisation Temps Réel
  // =============================================
  
  /**
   * Synchronise un flux de trésorerie vers la comptabilité
   */
  static async synchroniserFluxVersCompta(fluxId: string): Promise<void> {
    try {
      // Récupérer le flux de trésorerie
      const { data: flux, error: fluxError } = await supabase
        .from('flux_tresorerie')
        .select('*')
        .eq('id', fluxId)
        .single();

      if (fluxError || !flux) throw new Error('Flux introuvable');

      // Récupérer le mapping du compte
      const compteComptable = await this.getCompteComptable(flux.compte_id);
      if (!compteComptable) {
        throw new Error('Mapping compte introuvable');
      }

      // Créer l'écriture comptable correspondante
      const ecriture = {
        date_operation: flux.date_operation,
        libelle: flux.libelle,
        reference_piece: flux.reference_piece,
        montant: flux.montant_paye,
        type_operation: flux.type_operation,
        compte_tresorerie: compteComptable,
        statut: 'VALIDE',
        source: 'TRESORERIE',
        flux_tresorerie_id: fluxId,
        created_at: new Date().toISOString()
      };

      // Insérer dans la table des écritures comptables
      const { error: ecritureError } = await supabase
        .from('ecritures_comptables')
        .insert(ecriture);

      if (ecritureError) throw ecritureError;

      // Mettre à jour le statut du flux
      await supabase
        .from('flux_tresorerie')
        .update({ 
          synchronise_compta: true,
          date_synchro_compta: new Date().toISOString()
        })
        .eq('id', fluxId);

    } catch (error) {
      console.error('Erreur synchronisation flux:', error);
      throw error;
    }
  }

  /**
   * Synchronise tous les flux non synchronisés
   */
  static async synchroniserTousFlux(): Promise<{ succes: number; echecs: number }> {
    let succes = 0;
    let echecs = 0;

    try {
      // Récupérer tous les flux non synchronisés
      const { data: fluxNonSynchro, error } = await supabase
        .from('flux_tresorerie')
        .select('id')
        .eq('synchronise_compta', false)
        .eq('statut', 'PAIEMENT');  // Seulement les flux payés

      if (error) throw error;

      for (const flux of fluxNonSynchro || []) {
        try {
          await this.synchroniserFluxVersCompta(flux.id);
          succes++;
        } catch (error) {
          console.error(`Erreur flux ${flux.id}:`, error);
          echecs++;
        }
      }

      return { succes, echecs };
    } catch (error) {
      console.error('Erreur synchronisation globale:', error);
      throw error;
    }
  }

  // =============================================
  // Configuration de la Synchronisation
  // =============================================
  
  /**
   * Récupère la configuration de synchronisation
   */
  static async getConfigSynchronisation(): Promise<SynchronisationConfig> {
    const { data, error } = await supabase
      .from('config_integration')
      .select('*')
      .eq('module', 'TRESORERIE_COMPTABILITE')
      .single();

    if (error || !data) {
      // Configuration par défaut
      return {
        mode: 'TEMPS_REEL',
        auto_reconciliation: true
      };
    }

    return data.config as SynchronisationConfig;
  }

  /**
   * Met à jour la configuration de synchronisation
   */
  static async updateConfigSynchronisation(config: SynchronisationConfig): Promise<void> {
    const { error } = await supabase
      .from('config_integration')
      .upsert({
        module: 'TRESORERIE_COMPTABILITE',
        config,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // =============================================
  // Rapports de Synchronisation
  // =============================================
  
  /**
   * Génère un rapport de synchronisation
   */
  static async genererRapportSynchronisation(): Promise<{
    total_flux: number;
    synchronises: number;
    non_synchronises: number;
    taux_synchronisation: number;
    derniere_synchro: string | null;
    validation_croisee: ValidationCroisee;
  }> {
    try {
      // Statistiques de synchronisation
      const { data: stats, error } = await supabase
        .from('flux_tresorerie')
        .select('synchronise_compta, date_synchro_compta')
        .eq('statut', 'PAIEMENT');

      if (error) throw error;

      const total = stats?.length || 0;
      const synchronises = stats?.filter(s => s.synchronise_compta).length || 0;
      const nonSynchronises = total - synchronises;
      const tauxSynchronisation = total > 0 ? (synchronises / total) * 100 : 0;

      const dernieresSynchros = stats
        ?.filter(s => s.date_synchro_compta)
        .map(s => s.date_synchro_compta)
        .sort()
        .reverse();

      const derniereSynchro = dernieresSynchros?.[0] || null;

      // Validation croisée
      const validationCroisee = await this.validerCoherence();

      return {
        total_flux: total,
        synchronises,
        non_synchronises: nonSynchronises,
        taux_synchronisation: tauxSynchronisation,
        derniere_synchro: derniereSynchro,
        validation_croisee: validationCroisee
      };
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  }

  // =============================================
  // Utilitaires SYSCOHADA
  // =============================================
  
  /**
   * Vérifie si un compte comptable appartient à la classe 5 (Trésorerie)
   */
  static isCompteTresorerieSYSCOHADA(numeroCompte: string): boolean {
    return numeroCompte.startsWith('5');
  }

  /**
   * Récupère la nature du compte de trésorerie selon SYSCOHADA
   */
  static getNatureCompteSYSCOHADA(numeroCompte: string): string {
    if (numeroCompte.startsWith('50')) return 'Titres de placement';
    if (numeroCompte.startsWith('51')) return 'Valeurs à encaisser';
    if (numeroCompte.startsWith('52')) return 'Banques';
    if (numeroCompte.startsWith('53')) return 'Établissements financiers';
    if (numeroCompte.startsWith('54')) return 'Instruments de trésorerie';
    if (numeroCompte.startsWith('57')) return 'Caisse';
    if (numeroCompte.startsWith('58')) return 'Régies d\'avances';
    if (numeroCompte.startsWith('59')) return 'Dépréciations';
    return 'Autre';
  }
}
