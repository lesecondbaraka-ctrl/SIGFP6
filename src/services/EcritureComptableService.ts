/**
 * Service de gestion des Écritures Comptables
 * Gère la création, validation et comptabilisation des écritures
 */

import { supabase } from '../lib/supabase';
import type { 
  EcritureComptable,
  EcritureComptableInput,
  LigneEcriture,
  JournalComptable,
  StatutEcriture
} from '../types/comptabilite';
import { PlanComptableService } from './PlanComptableService';

export class EcritureComptableService {
  
  // ============================================================================
  // GESTION DES JOURNAUX
  // ============================================================================

  /**
   * Récupère tous les journaux d'un exercice
   */
  static async getJournaux(exerciceId: string): Promise<JournalComptable[]> {
    const { data, error } = await supabase
      .from('journaux_comptables')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('est_actif', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des journaux:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Crée un nouveau journal
   */
  static async creerJournal(journal: Omit<JournalComptable, 'id' | 'created_at'>): Promise<JournalComptable | null> {
    const { data, error } = await supabase
      .from('journaux_comptables')
      .insert([{
        ...journal,
        numero_dernier: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création du journal:', error);
      return null;
    }

    return data;
  }

  // ============================================================================
  // GESTION DES ÉCRITURES
  // ============================================================================

  /**
   * Récupère les écritures d'un exercice
   */
  static async getEcritures(
    exerciceId: string,
    filters?: {
      journalCode?: string;
      statut?: StatutEcriture;
      dateDebut?: string;
      dateFin?: string;
    }
  ): Promise<EcritureComptable[]> {
    let query = supabase
      .from('ecritures_comptables')
      .select(`
        *,
        lignes:lignes_ecritures(*)
      `)
      .eq('exercice_id', exerciceId);

    if (filters?.journalCode) {
      query = query.eq('journal_code', filters.journalCode);
    }
    if (filters?.statut) {
      query = query.eq('statut', filters.statut);
    }
    if (filters?.dateDebut) {
      query = query.gte('date_ecriture', filters.dateDebut);
    }
    if (filters?.dateFin) {
      query = query.lte('date_ecriture', filters.dateFin);
    }

    query = query.order('date_ecriture', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération des écritures:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Génère le prochain numéro d'écriture pour un journal
   */
  static async genererNumeroEcriture(journalCode: string, exerciceId: string): Promise<string> {
    const { data: journal } = await supabase
      .from('journaux_comptables')
      .select('numero_dernier')
      .eq('code', journalCode)
      .eq('exercice_id', exerciceId)
      .single();

    if (!journal) {
      return `${journalCode}-0001`;
    }

    const nouveauNumero = journal.numero_dernier + 1;

    await supabase
      .from('journaux_comptables')
      .update({ numero_dernier: nouveauNumero })
      .eq('code', journalCode)
      .eq('exercice_id', exerciceId);

    return `${journalCode}-${String(nouveauNumero).padStart(4, '0')}`;
  }

  /**
   * Crée une nouvelle écriture comptable
   */
  static async creerEcriture(
    ecriture: EcritureComptableInput,
    lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[]
  ): Promise<EcritureComptable | null> {
    const equilibre = this.verifierEquilibre(lignes);
    if (!equilibre.estEquilibre) {
      console.error('Écriture non équilibrée:', equilibre);
      return null;
    }

    // Pré-validation: existence des comptes et gestion devise de base
    for (const ligne of lignes) {
      const compte = await PlanComptableService.getCompteByNumero(
        ligne.compte_numero,
        ecriture.exercice_id
      );
      if (!compte) {
        console.error(`Compte inexistant: ${ligne.compte_numero}`);
        return null;
      }
      // Enforce base amount when multi-devise utilisée
      if (ligne.devise && ligne.devise !== 'XAF') {
        if (!ligne.taux_change || ligne.taux_change <= 0) {
          console.error(`Taux de change manquant ou invalide pour ${ligne.compte_numero}`);
          return null;
        }
      }
    }

    const numero = await this.genererNumeroEcriture(ecriture.journal_code, ecriture.exercice_id);
    const montantTotal = lignes
      .filter(l => l.sens === 'DEBIT')
      .reduce((sum, l) => sum + l.montant, 0);

    const { data: ecritureData, error: ecritureError } = await supabase
      .from('ecritures_comptables')
      .insert([{
        ...ecriture,
        numero,
        montant_total: montantTotal,
        est_equilibree: true,
        statut: ecriture.statut || 'BROUILLON',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (ecritureError || !ecritureData) {
      console.error('Erreur lors de la création de l\'écriture:', ecritureError);
      return null;
    }

    const lignesAvecEcritureId = lignes.map((ligne, index) => ({
      ...ligne,
      montant_devise_base:
        ligne.devise && ligne.devise !== 'XAF'
          ? (ligne.taux_change || 0) * ligne.montant
          : ligne.montant,
      ecriture_id: ecritureData.id,
      numero_ligne: index + 1,
      created_at: new Date().toISOString()
    }));

    const { data: lignesData, error: lignesError } = await supabase
      .from('lignes_ecritures')
      .insert(lignesAvecEcritureId)
      .select();

    if (lignesError) {
      console.error('Erreur lors de la création des lignes:', lignesError);
      await supabase.from('ecritures_comptables').delete().eq('id', ecritureData.id);
      return null;
    }

    return {
      ...ecritureData,
      lignes: lignesData || []
    };
  }

  /**
   * Valide une écriture
   */
  static async validerEcriture(id: string, validateurId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ecritures_comptables')
      .update({
        statut: 'VALIDEE',
        validee_par: validateurId,
        date_validation: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('statut', 'BROUILLON');

    return !error;
  }

  /**
   * Comptabilise une écriture
   */
  static async comptabiliserEcriture(id: string, comptabilisateurId: string): Promise<boolean> {
    const { data: ecriture } = await supabase
      .from('ecritures_comptables')
      .select('*, lignes:lignes_ecritures(*)')
      .eq('id', id)
      .single();

    if (!ecriture || ecriture.statut !== 'VALIDEE') {
      return false;
    }

    // Mettre à jour les soldes des comptes
    for (const ligne of ecriture.lignes) {
      const compte = await PlanComptableService.getCompteByNumero(
        ligne.compte_numero,
        ecriture.exercice_id
      );

      if (compte) {
        let nouveauSoldeDebiteur = compte.solde_debiteur;
        let nouveauSoldeCrediteur = compte.solde_crediteur;

        if (ligne.sens === 'DEBIT') {
          nouveauSoldeDebiteur += ligne.montant;
        } else {
          nouveauSoldeCrediteur += ligne.montant;
        }

        await PlanComptableService.updateSoldeCompte(
          ligne.compte_numero,
          ecriture.exercice_id,
          nouveauSoldeDebiteur,
          nouveauSoldeCrediteur
        );
      }
    }

    const { error } = await supabase
      .from('ecritures_comptables')
      .update({
        statut: 'COMPTABILISEE',
        comptabilisee_par: comptabilisateurId,
        date_comptabilisation: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return !error;
  }

  /**
   * Vérifie l'équilibre d'une écriture
   */
  static verifierEquilibre(lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[]): {
    estEquilibre: boolean;
    totalDebit: number;
    totalCredit: number;
    ecart: number;
  } {
    const totalDebit = lignes
      .filter(l => l.sens === 'DEBIT')
      .reduce((sum, l) => sum + l.montant, 0);

    const totalCredit = lignes
      .filter(l => l.sens === 'CREDIT')
      .reduce((sum, l) => sum + l.montant, 0);

    const ecart = Math.abs(totalDebit - totalCredit);
    const estEquilibre = ecart < 0.01;

    return {
      estEquilibre,
      totalDebit,
      totalCredit,
      ecart
    };
  }

  /**
   * Crée une écriture d'achat
   */
  static async creerEcritureAchat(
    exerciceId: string,
    montantHT: number,
    montantTVA: number,
    fournisseur: string,
    reference: string,
    userId: string
  ): Promise<EcritureComptable | null> {
    const montantTTC = montantHT + montantTVA;

    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: '601',
        compte_libelle: 'Achats de marchandises',
        libelle: `Achat ${fournisseur}`,
        sens: 'DEBIT',
        montant: montantHT,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: '445',
        compte_libelle: 'TVA récupérable',
        libelle: 'TVA sur achat',
        sens: 'DEBIT',
        montant: montantTVA,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 3,
        compte_numero: '401',
        compte_libelle: 'Fournisseurs',
        libelle: fournisseur,
        sens: 'CREDIT',
        montant: montantTTC,
        devise: 'XAF',
        piece_justificative: reference
      }
    ];

    return this.creerEcriture(
      {
        journal_code: 'AC',
        journal_libelle: 'Journal des achats',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: `Achat ${fournisseur}`,
        reference_piece: reference,
        montant_total: montantTTC,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  /**
   * Crée une écriture de vente
   */
  static async creerEcritureVente(
    exerciceId: string,
    montantHT: number,
    montantTVA: number,
    client: string,
    reference: string,
    userId: string
  ): Promise<EcritureComptable | null> {
    const montantTTC = montantHT + montantTVA;

    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: '411',
        compte_libelle: 'Clients',
        libelle: client,
        sens: 'DEBIT',
        montant: montantTTC,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: '701',
        compte_libelle: 'Ventes de marchandises',
        libelle: `Vente ${client}`,
        sens: 'CREDIT',
        montant: montantHT,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 3,
        compte_numero: '443',
        compte_libelle: 'TVA collectée',
        libelle: 'TVA sur vente',
        sens: 'CREDIT',
        montant: montantTVA,
        devise: 'XAF',
        piece_justificative: reference
      }
    ];

    return this.creerEcriture(
      {
        journal_code: 'VE',
        journal_libelle: 'Journal des ventes',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: `Vente ${client}`,
        reference_piece: reference,
        montant_total: montantTTC,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }

  /**
   * Crée une écriture de paiement
   */
  static async creerEcriturePaiement(
    exerciceId: string,
    montant: number,
    compteTiers: string,
    libelleTiers: string,
    compteTresorerie: string,
    libelleTresorerie: string,
    reference: string,
    userId: string
  ): Promise<EcritureComptable | null> {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [
      {
        numero_ligne: 1,
        compte_numero: compteTiers,
        compte_libelle: libelleTiers,
        libelle: `Paiement ${reference}`,
        sens: 'DEBIT',
        montant: montant,
        devise: 'XAF',
        piece_justificative: reference
      },
      {
        numero_ligne: 2,
        compte_numero: compteTresorerie,
        compte_libelle: libelleTresorerie,
        libelle: `Paiement ${reference}`,
        sens: 'CREDIT',
        montant: montant,
        devise: 'XAF',
        piece_justificative: reference
      }
    ];

    return this.creerEcriture(
      {
        journal_code: 'BQ',
        journal_libelle: 'Journal de banque',
        type: 'OPERATION',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: `Paiement ${reference}`,
        reference_piece: reference,
        montant_total: montant,
        statut: 'BROUILLON',
        created_by: userId
      },
      lignes
    );
  }
}
