/**
 * Service de clôture et réouverture comptable
 * Gère les opérations de fin d'exercice et de début d'exercice
 */

import { supabase } from '../lib/supabase';
import type { 
  CloturePeriode,
  EcritureANouveau,
  EcritureComptable,
  LigneEcriture
} from '../types/comptabilite';
import { GrandLivreService } from './GrandLivreService';
import { ValidationComptableService } from './ValidationComptableService';
import { EcritureComptableService } from './EcritureComptableService';

export class ClotureComptableService {
  
  // ============================================================================
  // CLÔTURE DE PÉRIODE
  // ============================================================================

  /**
   * Clôture une période comptable
   */
  static async cloturerPeriode(
    exerciceId: string,
    periode: string,
    type: 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE',
    utilisateurId: string
  ): Promise<{ succes: boolean; message: string; cloture?: CloturePeriode }> {
    // Vérifier que la période n'est pas déjà clôturée
    const { data: cloturExistante } = await supabase
      .from('clotures_periodes')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('periode', periode)
      .eq('statut', 'CLOTUREE')
      .single();

    if (cloturExistante) {
      return { succes: false, message: 'Cette période est déjà clôturée' };
    }

    // Effectuer les contrôles de clôture
    const controles = await this.effectuerControlesCloture(exerciceId, periode);

    if (!controles.tousValides) {
      return { 
        succes: false, 
        message: `Contrôles échoués: ${controles.erreursBloquantes.join(', ')}` 
      };
    }

    // Créer l'enregistrement de clôture
    const cloture: Omit<CloturePeriode, 'id' | 'created_at'> = {
      exercice_id: exerciceId,
      periode,
      type,
      date_cloture: new Date().toISOString(),
      cloturee_par: utilisateurId,
      statut: 'CLOTUREE',
      controles_effectues: {
        equilibre_ecritures: controles.equilibreEcritures,
        coherence_balance: controles.coherenceBalance,
        lettrage_complet: controles.lettrageComplet,
        rapprochements_valides: controles.rapprochementsValides
      },
      anomalies_detectees: controles.anomalies.length
    };

    const { data, error } = await supabase
      .from('clotures_periodes')
      .insert([{
        ...cloture,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la clôture:', error);
      return { succes: false, message: 'Erreur lors de la clôture' };
    }

    return { 
      succes: true, 
      message: 'Période clôturée avec succès', 
      cloture: data 
    };
  }

  /**
   * Effectue les contrôles de clôture
   */
  private static async effectuerControlesCloture(
    exerciceId: string,
    periode: string
  ): Promise<{
    tousValides: boolean;
    equilibreEcritures: boolean;
    coherenceBalance: boolean;
    lettrageComplet: boolean;
    rapprochementsValides: boolean;
    anomalies: string[];
    erreursBloquantes: string[];
  }> {
    const anomalies: string[] = [];
    const erreursBloquantes: string[] = [];

    // Contrôle 1: Équilibre des écritures
    const { data: ecritures } = await supabase
      .from('ecritures_comptables')
      .select('*, lignes:lignes_ecritures(*)')
      .eq('exercice_id', exerciceId)
      .eq('periode', periode)
      .neq('statut', 'ANNULEE');

    let equilibreEcritures = true;
    if (ecritures) {
      for (const ecriture of ecritures) {
        const equilibre = EcritureComptableService.verifierEquilibre(ecriture.lignes);
        if (!equilibre.estEquilibre) {
          equilibreEcritures = false;
          erreursBloquantes.push(`Écriture ${ecriture.numero} non équilibrée`);
        }
      }
    }

    // Contrôle 2: Cohérence de la balance
    const validationBalance = await ValidationComptableService.validerBalance(exerciceId);
    const coherenceBalance = validationBalance.estValide;
    if (!coherenceBalance) {
      anomalies.push(...validationBalance.anomalies);
    }

    // Contrôle 3: Lettrage complet (optionnel, avertissement seulement)
    const { data: lignesNonLettrees } = await supabase
      .from('lignes_ecritures')
      .select('count')
      .eq('ecriture.exercice_id', exerciceId)
      .is('lettrage', null)
      .in('compte_numero', ['401', '411']); // Comptes lettrables

    const lettrageComplet = !lignesNonLettrees || lignesNonLettrees.length === 0;
    if (!lettrageComplet) {
      anomalies.push('Certains comptes lettrables ne sont pas entièrement lettrés');
    }

    // Contrôle 4: Rapprochements bancaires (optionnel)
    const { data: rapprochements } = await supabase
      .from('rapprochements_bancaires')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('statut', 'VALIDE');

    const rapprochementsValides = rapprochements && rapprochements.length > 0;
    if (!rapprochementsValides) {
      anomalies.push('Aucun rapprochement bancaire validé pour cette période');
    }

    const tousValides = equilibreEcritures && coherenceBalance && erreursBloquantes.length === 0;

    return {
      tousValides,
      equilibreEcritures,
      coherenceBalance,
      lettrageComplet,
      rapprochementsValides,
      anomalies,
      erreursBloquantes
    };
  }

  /**
   * Rouvre une période clôturée
   */
  static async rouvrirPeriode(
    clotureId: string,
    motif: string,
    utilisateurId: string
  ): Promise<{ succes: boolean; message: string }> {
    const { data: cloture } = await supabase
      .from('clotures_periodes')
      .select('*')
      .eq('id', clotureId)
      .single();

    if (!cloture) {
      return { succes: false, message: 'Clôture introuvable' };
    }

    if (cloture.statut !== 'CLOTUREE') {
      return { succes: false, message: 'Cette période n\'est pas clôturée' };
    }

    const { error } = await supabase
      .from('clotures_periodes')
      .update({
        statut: 'ROUVERTE',
        commentaire: `Réouverture par ${utilisateurId}: ${motif}`
      })
      .eq('id', clotureId);

    if (error) {
      console.error('Erreur lors de la réouverture:', error);
      return { succes: false, message: 'Erreur lors de la réouverture' };
    }

    return { succes: true, message: 'Période rouverte avec succès' };
  }

  // ============================================================================
  // CLÔTURE ANNUELLE
  // ============================================================================

  /**
   * Clôture un exercice comptable
   */
  static async cloturerExercice(
    exerciceId: string,
    utilisateurId: string
  ): Promise<{ succes: boolean; message: string }> {
    // Vérifier que toutes les périodes sont clôturées
    const { data: periodesNonCloturees } = await supabase
      .from('clotures_periodes')
      .select('periode')
      .eq('exercice_id', exerciceId)
      .neq('statut', 'CLOTUREE');

    if (periodesNonCloturees && periodesNonCloturees.length > 0) {
      return { 
        succes: false, 
        message: `Périodes non clôturées: ${periodesNonCloturees.map(p => p.periode).join(', ')}` 
      };
    }

    // Générer le compte de résultat
    const { data: exercice } = await supabase
      .from('exercices_comptables')
      .select('date_debut, date_fin')
      .eq('id', exerciceId)
      .single();

    if (!exercice) {
      return { succes: false, message: 'Exercice introuvable' };
    }

    const compteResultat = await GrandLivreService.genererCompteResultat(
      exerciceId,
      exercice.date_debut,
      exercice.date_fin
    );

    if (!compteResultat) {
      return { succes: false, message: 'Impossible de générer le compte de résultat' };
    }

    // Créer l'écriture de détermination du résultat
    await this.creerEcritureResultat(exerciceId, compteResultat.resultat.net, utilisateurId);

    // Marquer l'exercice comme clôturé
    const { error } = await supabase
      .from('exercices_comptables')
      .update({
        est_cloture: true,
        date_cloture: new Date().toISOString(),
        commentaire_cloture: `Clôturé par ${utilisateurId}`
      })
      .eq('id', exerciceId);

    if (error) {
      console.error('Erreur lors de la clôture de l\'exercice:', error);
      return { succes: false, message: 'Erreur lors de la clôture de l\'exercice' };
    }

    return { succes: true, message: 'Exercice clôturé avec succès' };
  }

  /**
   * Crée l'écriture de détermination du résultat
   */
  private static async creerEcritureResultat(
    exerciceId: string,
    resultatNet: number,
    utilisateurId: string
  ): Promise<void> {
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [];

    // Solder les comptes de charges (classe 6)
    const { data: comptesCharges } = await supabase
      .from('comptes_comptables')
      .select('numero, libelle, solde_debiteur, solde_crediteur')
      .eq('exercice_id', exerciceId)
      .eq('classe', '6')
      .gt('solde_debiteur', 0);

    if (comptesCharges) {
      for (const compte of comptesCharges) {
        lignes.push({
          numero_ligne: lignes.length + 1,
          compte_numero: compte.numero,
          compte_libelle: compte.libelle,
          libelle: 'Solde des charges',
          sens: 'CREDIT',
          montant: compte.solde_debiteur,
          devise: 'XAF',
          piece_justificative: 'CLOTURE'
        });
      }
    }

    // Solder les comptes de produits (classe 7)
    const { data: comptesProduits } = await supabase
      .from('comptes_comptables')
      .select('numero, libelle, solde_debiteur, solde_crediteur')
      .eq('exercice_id', exerciceId)
      .eq('classe', '7')
      .gt('solde_crediteur', 0);

    if (comptesProduits) {
      for (const compte of comptesProduits) {
        lignes.push({
          numero_ligne: lignes.length + 1,
          compte_numero: compte.numero,
          compte_libelle: compte.libelle,
          libelle: 'Solde des produits',
          sens: 'DEBIT',
          montant: compte.solde_crediteur,
          devise: 'XAF',
          piece_justificative: 'CLOTURE'
        });
      }
    }

    // Enregistrer le résultat au compte 13
    lignes.push({
      numero_ligne: lignes.length + 1,
      compte_numero: '13',
      compte_libelle: 'Résultat net de l\'exercice',
      libelle: 'Résultat de l\'exercice',
      sens: resultatNet >= 0 ? 'CREDIT' : 'DEBIT',
      montant: Math.abs(resultatNet),
      devise: 'XAF',
      piece_justificative: 'CLOTURE'
    });

    await EcritureComptableService.creerEcriture(
      {
        journal_code: 'OD',
        journal_libelle: 'Opérations diverses',
        type: 'CLOTURE',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceId,
        libelle: 'Détermination du résultat de l\'exercice',
        reference_piece: 'CLOTURE-RESULTAT',
        montant_total: 0,
        statut: 'VALIDEE',
        created_by: utilisateurId
      },
      lignes
    );
  }

  // ============================================================================
  // À-NOUVEAUX
  // ============================================================================

  /**
   * Génère les écritures à-nouveaux pour le nouvel exercice
   */
  static async genererANouveaux(
    exercicePrecedentId: string,
    exerciceNouveauId: string,
    utilisateurId: string
  ): Promise<{ succes: boolean; message: string; ecriture?: EcritureComptable }> {
    // Vérifier que l'exercice précédent est clôturé
    const { data: exercicePrecedent } = await supabase
      .from('exercices_comptables')
      .select('est_cloture')
      .eq('id', exercicePrecedentId)
      .single();

    if (!exercicePrecedent?.est_cloture) {
      return { succes: false, message: 'L\'exercice précédent n\'est pas clôturé' };
    }

    // Récupérer les soldes des comptes de bilan (classes 1 à 5)
    const { data: comptesBilan } = await supabase
      .from('comptes_comptables')
      .select('numero, libelle, solde_debiteur, solde_crediteur')
      .eq('exercice_id', exercicePrecedentId)
      .in('classe', ['1', '2', '3', '4', '5'])
      .or('solde_debiteur.gt.0,solde_crediteur.gt.0');

    if (!comptesBilan || comptesBilan.length === 0) {
      return { succes: false, message: 'Aucun solde à reporter' };
    }

    // Créer les lignes d'écriture à-nouveaux
    const lignes: Omit<LigneEcriture, 'id' | 'ecriture_id' | 'created_at'>[] = [];
    const comptesReportes: { compte_numero: string; solde_debiteur: number; solde_crediteur: number }[] = [];

    for (const compte of comptesBilan) {
      const soldeDebiteur = compte.solde_debiteur || 0;
      const soldeCrediteur = compte.solde_crediteur || 0;
      const soldeNet = soldeDebiteur - soldeCrediteur;

      if (Math.abs(soldeNet) > 0.01) {
        lignes.push({
          numero_ligne: lignes.length + 1,
          compte_numero: compte.numero,
          compte_libelle: compte.libelle,
          libelle: 'Report à nouveau',
          sens: soldeNet > 0 ? 'DEBIT' : 'CREDIT',
          montant: Math.abs(soldeNet),
          devise: 'XAF',
          piece_justificative: 'A-NOUVEAUX'
        });

        comptesReportes.push({
          compte_numero: compte.numero,
          solde_debiteur: soldeNet > 0 ? soldeNet : 0,
          solde_crediteur: soldeNet < 0 ? Math.abs(soldeNet) : 0
        });
      }
    }

    // Créer l'écriture à-nouveaux
    const ecriture = await EcritureComptableService.creerEcriture(
      {
        journal_code: 'AN',
        journal_libelle: 'À-nouveaux',
        type: 'A_NOUVEAU',
        date_ecriture: new Date().toISOString(),
        date_piece: new Date().toISOString(),
        periode: new Date().toISOString().substring(0, 7),
        exercice_id: exerciceNouveauId,
        libelle: 'Report des soldes de l\'exercice précédent',
        reference_piece: 'A-NOUVEAUX',
        montant_total: 0,
        statut: 'VALIDEE',
        created_by: utilisateurId
      },
      lignes
    );

    if (!ecriture) {
      return { succes: false, message: 'Erreur lors de la création de l\'écriture à-nouveaux' };
    }

    // Enregistrer l'à-nouveaux
    await supabase
      .from('ecritures_a_nouveaux')
      .insert([{
        exercice_precedent_id: exercicePrecedentId,
        exercice_nouveau_id: exerciceNouveauId,
        date_generation: new Date().toISOString(),
        ecriture_id: ecriture.id,
        comptes_reportes: comptesReportes,
        statut: 'VALIDEE',
        created_at: new Date().toISOString()
      }]);

    // Marquer l'exercice comme ayant les reports validés
    await supabase
      .from('exercices_comptables')
      .update({ reports_valides: true })
      .eq('id', exerciceNouveauId);

    return { 
      succes: true, 
      message: 'À-nouveaux générés avec succès', 
      ecriture 
    };
  }
}
