import { supabase } from '../lib/supabase';
import { FluxTresorerie } from '../types/finance';
import { LigneFluxTresorerie } from '../types/tresorerie';

export class TresorerieService {
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

  static async getResumeMensuel(exerciceId: string): Promise<{
    mois: string;
    encaissements: number;
    decaissements: number;
    solde: number;
  }[]> {
    const flux = await this.getFluxTresorerie(exerciceId);
    const fluxParMois: Record<number, { encaissements: number; decaissements: number }> = {};

    flux.forEach((f) => {
      const date = new Date(f.date);
      const mois = date.getMonth() + 1;

      if (!fluxParMois[mois]) {
        fluxParMois[mois] = { encaissements: 0, decaissements: 0 };
      }
      
      if (f.sens === 'encaissement') {
        fluxParMois[mois].encaissements += f.montant;
      } else {
        fluxParMois[mois].decaissements += f.montant;
      }
    });

    const moisNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    return Object.entries(fluxParMois).map(([mois, totaux]) => ({
      mois: moisNames[parseInt(mois) - 1],
      encaissements: totaux.encaissements,
      decaissements: totaux.decaissements,
      solde: totaux.encaissements - totaux.decaissements
    })).sort((a, b) => moisNames.indexOf(a.mois) - moisNames.indexOf(b.mois));
  }

  static async getPrevisionsFlux(exerciceId: string): Promise<{
    montantPrevu: number;
    montantRealise: number;
    ecart: number;
    pourcentageRealisation: number;
  }> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .select('montant_prevu, montant_paye')
      .eq('exercice_id', exerciceId);

    if (error) {
      console.error('Erreur lors de la récupération des prévisions:', error);
      return {
        montantPrevu: 0,
        montantRealise: 0,
        ecart: 0,
        pourcentageRealisation: 0
      };
    }

    if (!data || data.length === 0) {
      return {
        montantPrevu: 0,
        montantRealise: 0,
        ecart: 0,
        pourcentageRealisation: 0
      };
    }

    const totaux = data.reduce((acc: { montantPrevu: number; montantRealise: number }, flux: { montant_prevu?: number; montant_paye?: number }) => ({
      montantPrevu: acc.montantPrevu + (flux.montant_prevu || 0),
      montantRealise: acc.montantRealise + (flux.montant_paye || 0)
    }), { montantPrevu: 0, montantRealise: 0 });

    // Calcul des indicateurs
    const ecart = totaux.montantRealise - totaux.montantPrevu;
    const pourcentageRealisation = totaux.montantPrevu > 0 
      ? (totaux.montantRealise / totaux.montantPrevu) * 100 
      : 0;

    return {
      montantPrevu: totaux.montantPrevu,
      montantRealise: totaux.montantRealise,
      ecart,
      pourcentageRealisation
    };
  }
  static async getFluxTresorerie(exerciceId: string): Promise<FluxTresorerie[]> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('date_operation');

    if (error) throw error;
    return data || [];
  }

  static async ajouterFluxTresorerie(flux: Omit<FluxTresorerie, 'id' | 'created_at'>): Promise<FluxTresorerie> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .insert([flux])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async modifierFluxTresorerie(
    id: string,
    updates: Partial<Omit<FluxTresorerie, 'id' | 'created_at'>>
  ): Promise<FluxTresorerie> {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async supprimerFluxTresorerie(id: string): Promise<void> {
    const { error } = await supabase
      .from('flux_tresorerie')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getSoldes(exerciceId: string): Promise<{
    solde_initial: number;
    total_recettes_prevues: number;
    total_recettes_realisees: number;
    total_depenses_prevues: number;
    total_depenses_realisees: number;
    solde_actuel: number;
  }> {
    const { data: flux, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId);

    if (error) throw error;

    const soldes = {
      solde_initial: 0,
      total_recettes_prevues: 0,
      total_recettes_realisees: 0,
      total_depenses_prevues: 0,
      total_depenses_realisees: 0,
      solde_actuel: 0
    };

    flux.forEach((f: { 
      type_operation: 'RECETTE' | 'DEPENSE';
      montant_prevu?: number;
      montant_paye?: number;
    }) => {
      if (f.type_operation === 'RECETTE') {
        soldes.total_recettes_prevues += f.montant_prevu || 0;
        soldes.total_recettes_realisees += f.montant_paye || 0;
      } else {
        soldes.total_depenses_prevues += f.montant_prevu || 0;
        soldes.total_depenses_realisees += f.montant_paye || 0;
      }
    });

    soldes.solde_actuel = soldes.total_recettes_realisees - soldes.total_depenses_realisees;

    return soldes;
  }

  static async creerOperation(operationData: {
    exercice_id: string;
    code_operation: string;
    type_operation: 'RECETTE' | 'DEPENSE';
    nature_flux: 'FONCTIONNEMENT' | 'INVESTISSEMENT' | 'FINANCEMENT';
    libelle: string;
    montant_prevu: number;
    montant_engage?: number;
    montant_ordonnance?: number;
    montant_paye?: number;
    date_operation: Date;
    date_valeur: Date;
    statut: 'PREVISION' | 'ENGAGEMENT' | 'ORDONNANCEMENT' | 'PAIEMENT';
    imputation_id: string; // Changé pour correspondre au schéma de la BD
    source_financement_id?: string; // Changé pour correspondre au schéma de la BD
    beneficiaire?: string;
    reference_piece: string;
    commentaire?: string;
  }): Promise<any> {
    try {
      console.log('Début de création de l\'opération avec les données:', operationData);

      // Vérification des valeurs requises
      if (!operationData.exercice_id) {
        throw new Error('L\'ID de l\'exercice est requis');
      }

      if (!operationData.code_operation) {
        throw new Error('Le code de l\'opération est requis');
      }

      if (!operationData.montant_prevu || operationData.montant_prevu <= 0) {
        throw new Error('Le montant prévu doit être supérieur à 0');
      }

      // Validation des montants selon le statut
      switch (operationData.statut) {
        case 'ENGAGEMENT':
          if (!operationData.montant_engage || operationData.montant_engage > operationData.montant_prevu) {
            throw new Error('Le montant engagé ne peut pas dépasser le montant prévu');
          }
          break;
        case 'ORDONNANCEMENT':
          if (!operationData.montant_ordonnance || !operationData.montant_engage ||
              operationData.montant_ordonnance > operationData.montant_engage) {
            throw new Error('Le montant ordonnancé ne peut pas dépasser le montant engagé');
          }
          break;
        case 'PAIEMENT':
          if (!operationData.montant_paye || !operationData.montant_ordonnance ||
              operationData.montant_paye > operationData.montant_ordonnance) {
            throw new Error('Le montant payé ne peut pas dépasser le montant ordonnancé');
          }
          break;
      }

      // Ajout des valeurs par défaut pour les montants selon le statut
      const finalData = {
        ...operationData,
        montant_engage: operationData.montant_engage || 0,
        montant_ordonnance: operationData.montant_ordonnance || 0,
        montant_paye: operationData.montant_paye || 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      console.log('Données finales avant insertion:', finalData);

      // Tentative d'insertion dans la base de données
      const { data, error } = await supabase
        .from('flux_tresorerie')
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase détaillée:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        if (error.code === '23505') {
          throw new Error('Cette opération existe déjà (code en double)');
        } else if (error.code === '23503') {
          throw new Error('L\'exercice comptable spécifié n\'existe pas ou n\'est pas valide');
        } else if (error.code === '23502') {
          throw new Error('Des champs obligatoires sont manquants');
        } else if (error.message?.includes('violates foreign key constraint')) {
          throw new Error('L\'exercice comptable référencé n\'existe pas');
        } else {
          throw new Error(`Erreur lors de l'enregistrement : ${error.message || 'Erreur inconnue'}`);
        }
      }

      if (!data) {
        throw new Error('Aucune donnée n\'a été retournée après l\'insertion');
      }

      console.log('Opération créée avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'opération:', error);
      throw error;
    }
  }

  static async calculerTotalFlux(exerciceId: string): Promise<{
    totalEncaissements: number;
    totalDecaissements: number;
    soldeNet: number;
    parCategorie: Record<string, { entrees: number; sorties: number; solde: number }>;
  }> {
    const flux = await this.getFluxTresorerie(exerciceId);
    
    const totaux = {
      totalEncaissements: 0,
      totalDecaissements: 0,
      soldeNet: 0,
      parCategorie: {} as Record<string, { entrees: number; sorties: number; solde: number }>,
    };

    flux.forEach((f) => {
      if (f.sens === 'encaissement') {
        totaux.totalEncaissements += f.montant;
        totaux.parCategorie[f.categorie] = totaux.parCategorie[f.categorie] || { entrees: 0, sorties: 0, solde: 0 };
        totaux.parCategorie[f.categorie].entrees += f.montant;
      } else {
        totaux.totalDecaissements += f.montant;
        totaux.parCategorie[f.categorie] = totaux.parCategorie[f.categorie] || { entrees: 0, sorties: 0, solde: 0 };
        totaux.parCategorie[f.categorie].sorties += f.montant;
      }
    });

    totaux.soldeNet = totaux.totalEncaissements - totaux.totalDecaissements;

    Object.keys(totaux.parCategorie).forEach((cat) => {
      totaux.parCategorie[cat].solde = 
        totaux.parCategorie[cat].entrees - totaux.parCategorie[cat].sorties;
    });

    return totaux;
  }
}
