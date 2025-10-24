/**
 * Service de gestion du Plan Comptable
 * Gère les comptes, leur hiérarchie et leur structure
 */

import { supabase } from '../lib/supabase';
import type { 
  CompteComptable, 
  PlanComptable, 
  ClasseCompte, 
  NatureCompte,
  TypeCompte 
} from '../types/comptabilite';

export class PlanComptableService {
  
  // ============================================================================
  // GESTION DES PLANS COMPTABLES
  // ============================================================================

  /**
   * Récupère le plan comptable actif
   */
  static async getPlanComptableActif(): Promise<PlanComptable | null> {
    const { data, error } = await supabase
      .from('plans_comptables')
      .select('*')
      .eq('est_actif', true)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du plan comptable:', error);
      return null;
    }

    return data;
  }

  /**
   * Crée un nouveau plan comptable
   */
  static async creerPlanComptable(plan: Omit<PlanComptable, 'id' | 'created_at'>): Promise<PlanComptable | null> {
    const { data, error } = await supabase
      .from('plans_comptables')
      .insert([plan])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du plan comptable:', error);
      return null;
    }

    return data;
  }

  // ============================================================================
  // GESTION DES COMPTES
  // ============================================================================

  /**
   * Récupère tous les comptes d'un exercice
   */
  static async getComptes(exerciceId: string): Promise<CompteComptable[]> {
    const { data, error } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('numero', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Récupère un compte par son numéro
   */
  static async getCompteByNumero(numero: string, exerciceId: string): Promise<CompteComptable | null> {
    const { data, error } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('numero', numero)
      .eq('exercice_id', exerciceId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du compte:', error);
      return null;
    }

    return data;
  }

  /**
   * Récupère les comptes par classe
   */
  static async getComptesByClasse(classe: ClasseCompte, exerciceId: string): Promise<CompteComptable[]> {
    const { data, error } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('classe', classe)
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('numero', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des comptes par classe:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Récupère les comptes par nature
   */
  static async getComptesByNature(nature: NatureCompte, exerciceId: string): Promise<CompteComptable[]> {
    const { data, error } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('nature', nature)
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('numero', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des comptes par nature:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Crée un nouveau compte
   */
  static async creerCompte(compte: Omit<CompteComptable, 'id' | 'created_at' | 'updated_at'>): Promise<CompteComptable | null> {
    // Validation du numéro de compte
    if (!this.validerNumeroCompte(compte.numero)) {
      console.error('Numéro de compte invalide:', compte.numero);
      return null;
    }

    // Vérification de l'unicité
    const existant = await this.getCompteByNumero(compte.numero, compte.exercice_id);
    if (existant) {
      console.error('Un compte avec ce numéro existe déjà');
      return null;
    }

    const { data, error } = await supabase
      .from('comptes_comptables')
      .insert([{
        ...compte,
        solde_debiteur: 0,
        solde_crediteur: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du compte:', error);
      return null;
    }

    return data;
  }

  /**
   * Met à jour un compte
   */
  static async updateCompte(id: string, updates: Partial<CompteComptable>): Promise<CompteComptable | null> {
    const { data, error } = await supabase
      .from('comptes_comptables')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du compte:', error);
      return null;
    }

    return data;
  }

  /**
   * Désactive un compte (soft delete)
   */
  static async desactiverCompte(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('comptes_comptables')
      .update({ 
        est_actif: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur lors de la désactivation du compte:', error);
      return false;
    }

    return true;
  }

  /**
   * Met à jour le solde d'un compte
   */
  static async updateSoldeCompte(
    compteNumero: string, 
    exerciceId: string,
    soldeDebiteur: number,
    soldeCrediteur: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from('comptes_comptables')
      .update({
        solde_debiteur: soldeDebiteur,
        solde_crediteur: soldeCrediteur,
        updated_at: new Date().toISOString()
      })
      .eq('numero', compteNumero)
      .eq('exercice_id', exerciceId);

    if (error) {
      console.error('Erreur lors de la mise à jour du solde:', error);
      return false;
    }

    return true;
  }

  // ============================================================================
  // VALIDATION ET UTILITAIRES
  // ============================================================================

  /**
   * Valide le format d'un numéro de compte
   */
  static validerNumeroCompte(numero: string): boolean {
    // Le numéro doit commencer par un chiffre de 1 à 9
    // et peut contenir des chiffres supplémentaires
    const regex = /^[1-9]\d*$/;
    return regex.test(numero);
  }

  /**
   * Détermine la classe d'un compte à partir de son numéro
   */
  static getClasseFromNumero(numero: string): ClasseCompte | null {
    const premierChiffre = numero.charAt(0);
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(premierChiffre)) {
      return premierChiffre as ClasseCompte;
    }
    return null;
  }

  /**
   * Détermine la nature d'un compte à partir de sa classe
   */
  static getNatureFromClasse(classe: ClasseCompte): NatureCompte {
    const mapping: Record<ClasseCompte, NatureCompte> = {
      '1': 'PASSIF',      // Comptes de capitaux
      '2': 'ACTIF',       // Comptes d'immobilisations
      '3': 'ACTIF',       // Comptes de stocks
      '4': 'ACTIF',       // Comptes de tiers (créances)
      '5': 'ACTIF',       // Comptes financiers
      '6': 'CHARGE',      // Comptes de charges
      '7': 'PRODUIT',     // Comptes de produits
      '8': 'SPECIAL',     // Comptes spéciaux
      '9': 'SPECIAL'      // Comptes analytiques
    };
    return mapping[classe];
  }

  /**
   * Vérifie si un compte est lettrable
   */
  static estCompteLettrable(numero: string): boolean {
    // Les comptes de tiers (classe 4) sont généralement lettrables
    const classe = this.getClasseFromNumero(numero);
    return classe === '4';
  }

  /**
   * Récupère l'arborescence des comptes
   */
  static async getArborescenceComptes(exerciceId: string): Promise<any[]> {
    const comptes = await this.getComptes(exerciceId);
    
    // Construire l'arborescence
    const arborescence: any[] = [];
    const comptesMap = new Map<string, any>();

    // Première passe : créer tous les nœuds
    comptes.forEach(compte => {
      comptesMap.set(compte.numero, {
        ...compte,
        enfants: []
      });
    });

    // Deuxième passe : construire la hiérarchie
    comptes.forEach(compte => {
      const noeud = comptesMap.get(compte.numero);
      if (compte.compte_parent) {
        const parent = comptesMap.get(compte.compte_parent);
        if (parent) {
          parent.enfants.push(noeud);
        } else {
          arborescence.push(noeud);
        }
      } else {
        arborescence.push(noeud);
      }
    });

    return arborescence;
  }

  /**
   * Initialise le plan comptable SYSCOHADA par défaut
   */
  static async initialiserPlanSYSCOHADA(exerciceId: string): Promise<boolean> {
    const comptesBase = [
      // Classe 1 - Comptes de capitaux
      { numero: '10', libelle: 'Capital', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte },
      { numero: '101', libelle: 'Capital social', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte, compte_parent: '10' },
      { numero: '11', libelle: 'Réserves', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte },
      { numero: '12', libelle: 'Report à nouveau', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte },
      { numero: '13', libelle: 'Résultat net de l\'exercice', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte },
      { numero: '16', libelle: 'Emprunts et dettes assimilées', classe: '1' as ClasseCompte, nature: 'PASSIF' as NatureCompte },
      
      // Classe 2 - Comptes d'immobilisations
      { numero: '20', libelle: 'Charges immobilisées', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '21', libelle: 'Immobilisations incorporelles', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '22', libelle: 'Terrains', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '23', libelle: 'Bâtiments', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '24', libelle: 'Matériel', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '26', libelle: 'Titres de participation', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '28', libelle: 'Amortissements', classe: '2' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      
      // Classe 3 - Comptes de stocks
      { numero: '31', libelle: 'Marchandises', classe: '3' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '32', libelle: 'Matières premières', classe: '3' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '33', libelle: 'Autres approvisionnements', classe: '3' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      
      // Classe 4 - Comptes de tiers
      { numero: '40', libelle: 'Fournisseurs et comptes rattachés', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '401', libelle: 'Fournisseurs', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '40' },
      { numero: '41', libelle: 'Clients et comptes rattachés', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '411', libelle: 'Clients', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '41' },
      { numero: '42', libelle: 'Personnel', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '421', libelle: 'Personnel - Rémunérations dues', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '42' },
      { numero: '43', libelle: 'Organismes sociaux', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '44', libelle: 'État et collectivités publiques', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '441', libelle: 'État - Impôts et taxes', classe: '4' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '44' },
      
      // Classe 5 - Comptes financiers
      { numero: '50', libelle: 'Titres de placement', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '52', libelle: 'Banques', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '521', libelle: 'Banques locales', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '52' },
      { numero: '53', libelle: 'Établissements financiers', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '57', libelle: 'Caisse', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte },
      { numero: '571', libelle: 'Caisse siège', classe: '5' as ClasseCompte, nature: 'ACTIF' as NatureCompte, compte_parent: '57' },
      
      // Classe 6 - Comptes de charges
      { numero: '60', libelle: 'Achats', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '601', libelle: 'Achats de marchandises', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte, compte_parent: '60' },
      { numero: '61', libelle: 'Transports', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '62', libelle: 'Services extérieurs A', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '63', libelle: 'Services extérieurs B', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '64', libelle: 'Impôts et taxes', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '65', libelle: 'Autres charges', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '66', libelle: 'Charges de personnel', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '661', libelle: 'Salaires', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte, compte_parent: '66' },
      { numero: '67', libelle: 'Frais financiers', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      { numero: '68', libelle: 'Dotations aux amortissements', classe: '6' as ClasseCompte, nature: 'CHARGE' as NatureCompte },
      
      // Classe 7 - Comptes de produits
      { numero: '70', libelle: 'Ventes', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '701', libelle: 'Ventes de marchandises', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte, compte_parent: '70' },
      { numero: '71', libelle: 'Subventions d\'exploitation', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '72', libelle: 'Production immobilisée', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '73', libelle: 'Variations de stocks', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '75', libelle: 'Autres produits', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '77', libelle: 'Revenus financiers', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte },
      { numero: '78', libelle: 'Transferts de charges', classe: '7' as ClasseCompte, nature: 'PRODUIT' as NatureCompte }
    ];

    try {
      for (const compteBase of comptesBase) {
        await this.creerCompte({
          numero: compteBase.numero,
          libelle: compteBase.libelle,
          classe: compteBase.classe,
          nature: compteBase.nature,
          type: 'GENERAL' as TypeCompte,
          compte_parent: compteBase.compte_parent,
          est_lettrable: this.estCompteLettrable(compteBase.numero),
          est_actif: true,
          solde_debiteur: 0,
          solde_crediteur: 0,
          exercice_id: exerciceId
        });
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du plan comptable:', error);
      return false;
    }
  }
}
