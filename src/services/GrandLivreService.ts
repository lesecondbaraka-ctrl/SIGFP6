/**
 * Service de gestion du Grand Livre et de la Balance
 * Génère les états comptables de synthèse
 */

import { supabase } from '../lib/supabase';
import type { 
  GrandLivre, 
  LigneGrandLivre,
  Balance,
  LigneBalance
} from '../types/comptabilite';

export class GrandLivreService {
  
  // ============================================================================
  // GRAND LIVRE
  // ============================================================================

  /**
   * Génère le grand livre pour un compte
   */
  static async genererGrandLivreCompte(
    compteNumero: string,
    exerciceId: string,
    dateDebut?: string,
    dateFin?: string
  ): Promise<GrandLivre | null> {
    // Récupérer le compte
    const { data: compte } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('numero', compteNumero)
      .eq('exercice_id', exerciceId)
      .single();

    if (!compte) {
      console.error('Compte introuvable');
      return null;
    }

    // Récupérer toutes les lignes d'écriture pour ce compte
    let query = supabase
      .from('lignes_ecritures')
      .select(`
        *,
        ecriture:ecritures_comptables(
          numero,
          journal_code,
          date_ecriture,
          reference_piece,
          statut
        )
      `)
      .eq('compte_numero', compteNumero);

    if (dateDebut) {
      query = query.gte('ecriture.date_ecriture', dateDebut);
    }
    if (dateFin) {
      query = query.lte('ecriture.date_ecriture', dateFin);
    }

    const { data: lignes, error } = await query.order('ecriture.date_ecriture', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des lignes:', error);
      return null;
    }

    // Calculer le solde initial
    let soldeInitial = 0;
    if (dateDebut) {
      const { data: lignesAnterieures } = await supabase
        .from('lignes_ecritures')
        .select('sens, montant, ecriture:ecritures_comptables(date_ecriture, statut)')
        .eq('compte_numero', compteNumero)
        .lt('ecriture.date_ecriture', dateDebut)
        .eq('ecriture.statut', 'COMPTABILISEE');

      if (lignesAnterieures) {
        for (const ligne of lignesAnterieures) {
          if (ligne.sens === 'DEBIT') {
            soldeInitial += ligne.montant;
          } else {
            soldeInitial -= ligne.montant;
          }
        }
      }
    }

    // Construire les lignes du grand livre
    let soldeCourant = soldeInitial;
    let totalDebit = 0;
    let totalCredit = 0;

    const lignesGrandLivre: LigneGrandLivre[] = (lignes || [])
      .filter((l: any) => l.ecriture?.statut === 'COMPTABILISEE')
      .map((ligne: any) => {
        const baseAmount = typeof ligne.montant_devise_base === 'number' && !isNaN(ligne.montant_devise_base)
          ? ligne.montant_devise_base
          : ligne.montant;
        const debit = ligne.sens === 'DEBIT' ? baseAmount : 0;
        const credit = ligne.sens === 'CREDIT' ? baseAmount : 0;

        totalDebit += debit;
        totalCredit += credit;
        soldeCourant += debit - credit;

        return {
          date: ligne.ecriture.date_ecriture,
          numero_ecriture: ligne.ecriture.numero,
          journal_code: ligne.ecriture.journal_code,
          libelle: ligne.libelle,
          piece_reference: ligne.piece_justificative || ligne.ecriture.reference_piece,
          debit,
          credit,
          solde: soldeCourant,
          lettrage: ligne.lettrage
        };
      });

    return {
      compte_numero: compteNumero,
      compte_libelle: compte.libelle,
      solde_initial: soldeInitial,
      total_debit: totalDebit,
      total_credit: totalCredit,
      solde_final: soldeCourant,
      lignes: lignesGrandLivre
    };
  }

  /**
   * Génère le grand livre complet
   */
  static async genererGrandLivreComplet(
    exerciceId: string,
    dateDebut?: string,
    dateFin?: string
  ): Promise<GrandLivre[]> {
    // Récupérer tous les comptes
    const { data: comptes } = await supabase
      .from('comptes_comptables')
      .select('numero')
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('numero', { ascending: true });

    if (!comptes) {
      return [];
    }

    const grandLivres: GrandLivre[] = [];

    for (const compte of comptes) {
      const grandLivre = await this.genererGrandLivreCompte(
        compte.numero,
        exerciceId,
        dateDebut,
        dateFin
      );

      if (grandLivre && (grandLivre.total_debit > 0 || grandLivre.total_credit > 0)) {
        grandLivres.push(grandLivre);
      }
    }

    return grandLivres;
  }

  // ============================================================================
  // BALANCE
  // ============================================================================

  /**
   * Génère la balance générale
   */
  static async genererBalance(
    exerciceId: string,
    dateDebut?: string,
    dateFin?: string
  ): Promise<Balance | null> {
    // Récupérer tous les comptes
    const { data: comptes } = await supabase
      .from('comptes_comptables')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('numero', { ascending: true });

    if (!comptes) {
      return null;
    }

    const lignesBalance: LigneBalance[] = [];
    let totaux = {
      solde_initial_debit: 0,
      solde_initial_credit: 0,
      mouvement_debit: 0,
      mouvement_credit: 0,
      solde_final_debit: 0,
      solde_final_credit: 0
    };

    for (const compte of comptes) {
      const grandLivre = await this.genererGrandLivreCompte(
        compte.numero,
        exerciceId,
        dateDebut,
        dateFin
      );

      if (grandLivre) {
        const soldeInitialDebit = grandLivre.solde_initial > 0 ? grandLivre.solde_initial : 0;
        const soldeInitialCredit = grandLivre.solde_initial < 0 ? Math.abs(grandLivre.solde_initial) : 0;
        const soldeFinalDebit = grandLivre.solde_final > 0 ? grandLivre.solde_final : 0;
        const soldeFinalCredit = grandLivre.solde_final < 0 ? Math.abs(grandLivre.solde_final) : 0;

        // Ne garder que les comptes avec des mouvements ou des soldes
        if (grandLivre.total_debit > 0 || grandLivre.total_credit > 0 || 
            soldeInitialDebit > 0 || soldeInitialCredit > 0) {
          
          lignesBalance.push({
            compte_numero: compte.numero,
            compte_libelle: compte.libelle,
            solde_initial_debit: soldeInitialDebit,
            solde_initial_credit: soldeInitialCredit,
            mouvement_debit: grandLivre.total_debit,
            mouvement_credit: grandLivre.total_credit,
            solde_final_debit: soldeFinalDebit,
            solde_final_credit: soldeFinalCredit
          });

          // Cumuler les totaux
          totaux.solde_initial_debit += soldeInitialDebit;
          totaux.solde_initial_credit += soldeInitialCredit;
          totaux.mouvement_debit += grandLivre.total_debit;
          totaux.mouvement_credit += grandLivre.total_credit;
          totaux.solde_final_debit += soldeFinalDebit;
          totaux.solde_final_credit += soldeFinalCredit;
        }
      }
    }

    // Récupérer les dates de l'exercice
    const { data: exercice } = await supabase
      .from('exercices_comptables')
      .select('date_debut, date_fin')
      .eq('id', exerciceId)
      .single();

    return {
      exercice_id: exerciceId,
      date_debut: dateDebut || exercice?.date_debut || '',
      date_fin: dateFin || exercice?.date_fin || '',
      lignes: lignesBalance,
      totaux
    };
  }

  /**
   * Génère la balance par classe de comptes
   */
  static async genererBalanceParClasse(
    exerciceId: string,
    classe: string,
    dateDebut?: string,
    dateFin?: string
  ): Promise<Balance | null> {
    const balanceComplete = await this.genererBalance(exerciceId, dateDebut, dateFin);

    if (!balanceComplete) {
      return null;
    }

    // Filtrer les lignes par classe
    const lignesFiltrees = balanceComplete.lignes.filter(
      ligne => ligne.compte_numero.startsWith(classe)
    );

    // Recalculer les totaux
    const totaux = {
      solde_initial_debit: 0,
      solde_initial_credit: 0,
      mouvement_debit: 0,
      mouvement_credit: 0,
      solde_final_debit: 0,
      solde_final_credit: 0
    };

    for (const ligne of lignesFiltrees) {
      totaux.solde_initial_debit += ligne.solde_initial_debit;
      totaux.solde_initial_credit += ligne.solde_initial_credit;
      totaux.mouvement_debit += ligne.mouvement_debit;
      totaux.mouvement_credit += ligne.mouvement_credit;
      totaux.solde_final_debit += ligne.solde_final_debit;
      totaux.solde_final_credit += ligne.solde_final_credit;
    }

    return {
      ...balanceComplete,
      lignes: lignesFiltrees,
      totaux
    };
  }

  /**
   * Vérifie l'équilibre de la balance
   */
  static verifierEquilibreBalance(balance: Balance): {
    estEquilibre: boolean;
    ecarts: {
      solde_initial: number;
      mouvements: number;
      solde_final: number;
    };
  } {
    const ecartSoldeInitial = Math.abs(
      balance.totaux.solde_initial_debit - balance.totaux.solde_initial_credit
    );
    const ecartMouvements = Math.abs(
      balance.totaux.mouvement_debit - balance.totaux.mouvement_credit
    );
    const ecartSoldeFinal = Math.abs(
      balance.totaux.solde_final_debit - balance.totaux.solde_final_credit
    );

    const estEquilibre = ecartSoldeInitial < 0.01 && 
                         ecartMouvements < 0.01 && 
                         ecartSoldeFinal < 0.01;

    return {
      estEquilibre,
      ecarts: {
        solde_initial: ecartSoldeInitial,
        mouvements: ecartMouvements,
        solde_final: ecartSoldeFinal
      }
    };
  }

  // ============================================================================
  // ÉTATS FINANCIERS
  // ============================================================================

  /**
   * Génère le bilan comptable
   */
  static async genererBilan(exerciceId: string, dateArrete: string) {
    const balance = await this.genererBalance(exerciceId, undefined, dateArrete);

    if (!balance) {
      return null;
    }

    // Calculer l'actif
    const actif = {
      immobilisations: {
        incorporelles: this.calculerSoldeClasse(balance, '21'),
        corporelles: this.calculerSoldeClasse(balance, '22') + 
                     this.calculerSoldeClasse(balance, '23') + 
                     this.calculerSoldeClasse(balance, '24'),
        financieres: this.calculerSoldeClasse(balance, '26')
      },
      actif_circulant: {
        stocks: this.calculerSoldeClasse(balance, '3'),
        creances: this.calculerSoldeClasse(balance, '41'),
        disponibilites: this.calculerSoldeClasse(balance, '5')
      },
      total_actif: 0
    };

    actif.total_actif = 
      actif.immobilisations.incorporelles +
      actif.immobilisations.corporelles +
      actif.immobilisations.financieres +
      actif.actif_circulant.stocks +
      actif.actif_circulant.creances +
      actif.actif_circulant.disponibilites;

    // Calculer le passif
    const passif = {
      capitaux_propres: {
        capital: this.calculerSoldeClasse(balance, '10'),
        reserves: this.calculerSoldeClasse(balance, '11'),
        resultat: this.calculerSoldeClasse(balance, '13')
      },
      dettes: {
        financieres: this.calculerSoldeClasse(balance, '16'),
        fournisseurs: this.calculerSoldeClasse(balance, '40'),
        autres: this.calculerSoldeClasse(balance, '42') + 
                this.calculerSoldeClasse(balance, '43') + 
                this.calculerSoldeClasse(balance, '44')
      },
      total_passif: 0
    };

    passif.total_passif = 
      passif.capitaux_propres.capital +
      passif.capitaux_propres.reserves +
      passif.capitaux_propres.resultat +
      passif.dettes.financieres +
      passif.dettes.fournisseurs +
      passif.dettes.autres;

    return {
      exercice_id: exerciceId,
      date_arrete: dateArrete,
      actif,
      passif
    };
  }

  /**
   * Génère le compte de résultat
   */
  static async genererCompteResultat(
    exerciceId: string,
    dateDebut: string,
    dateFin: string
  ) {
    const balance = await this.genererBalance(exerciceId, dateDebut, dateFin);

    if (!balance) {
      return null;
    }

    const charges = {
      exploitation: this.calculerSoldeClasse(balance, '6'),
      financieres: this.calculerSoldeClasse(balance, '67'),
      exceptionnelles: 0,
      total: 0
    };

    charges.total = charges.exploitation + charges.financieres + charges.exceptionnelles;

    const produits = {
      exploitation: this.calculerSoldeClasse(balance, '7'),
      financiers: this.calculerSoldeClasse(balance, '77'),
      exceptionnels: 0,
      total: 0
    };

    produits.total = produits.exploitation + produits.financiers + produits.exceptionnels;

    const resultat = {
      exploitation: produits.exploitation - charges.exploitation,
      financier: produits.financiers - charges.financieres,
      courant: 0,
      exceptionnel: produits.exceptionnels - charges.exceptionnelles,
      net: 0
    };

    resultat.courant = resultat.exploitation + resultat.financier;
    resultat.net = resultat.courant + resultat.exceptionnel;

    return {
      exercice_id: exerciceId,
      date_debut: dateDebut,
      date_fin: dateFin,
      charges,
      produits,
      resultat
    };
  }

  /**
   * Calcule le solde d'une classe de comptes
   */
  private static calculerSoldeClasse(balance: Balance, classe: string): number {
    return balance.lignes
      .filter(ligne => ligne.compte_numero.startsWith(classe))
      .reduce((sum, ligne) => {
        return sum + ligne.solde_final_debit - ligne.solde_final_credit;
      }, 0);
  }
}
