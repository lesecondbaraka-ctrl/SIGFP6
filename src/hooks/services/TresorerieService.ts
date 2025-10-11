import { supabase } from '../../lib/supabase';
import { LigneFluxTresorerie, StatutOperation, NatureFlux } from '../../types/tresorerie';

export class TresorerieService {
  // Créer une nouvelle opération de trésorerie
  static async creerOperation(operation: Omit<LigneFluxTresorerie, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .insert([{
        ...operation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  // Mettre à jour le statut d'une opération
  static async mettreAJourStatut(id: string, nouveauStatut: StatutOperation, montant?: number) {
    const updates: any = {
      statut: nouveauStatut,
      updated_at: new Date().toISOString()
    };

    // Mettre à jour le montant correspondant au statut
    if (montant !== undefined) {
      switch (nouveauStatut) {
        case 'ENGAGEMENT':
          updates.montant_engage = montant;
          break;
        case 'ORDONNANCEMENT':
          updates.montant_ordonnance = montant;
          break;
        case 'PAIEMENT':
          updates.montant_paye = montant;
          break;
      }
    }

    const { data, error } = await supabase
      .from('flux_tresorerie')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  // Récupérer les flux de trésorerie par exercice et nature
  static async getFluxParNature(exerciceId: string, nature: NatureFlux) {
    const { data, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .eq('nature_flux', nature)
      .order('date_operation', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Récupérer les soldes de trésorerie
  static async getSoldes(exerciceId: string) {
    const { data: fluxData, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId);

    if (error) throw error;

    const soldes = {
      solde_initial: 0, // À récupérer depuis la table des soldes initiaux
      total_recettes_prevues: 0,
      total_recettes_realisees: 0,
      total_depenses_prevues: 0,
      total_depenses_realisees: 0,
      solde_actuel: 0
    };

    fluxData.forEach((flux: LigneFluxTresorerie) => {
      if (flux.type_operation === 'RECETTE') {
        soldes.total_recettes_prevues += flux.montant_prevu;
        soldes.total_recettes_realisees += flux.montant_paye;
      } else {
        soldes.total_depenses_prevues += flux.montant_prevu;
        soldes.total_depenses_realisees += flux.montant_paye;
      }
    });

    soldes.solde_actuel = soldes.solde_initial + 
      soldes.total_recettes_realisees - 
      soldes.total_depenses_realisees;

    return soldes;
  }

  // Générer un rapport de trésorerie
  static async genererRapport(exerciceId: string, dateDebut: Date, dateFin: Date) {
    // Récupérer tous les flux de la période
    const { data: fluxData, error } = await supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .gte('date_operation', dateDebut.toISOString())
      .lte('date_operation', dateFin.toISOString());

    if (error) throw error;

    // Organiser les données par nature et type
    const rapport = {
      periode: { debut: dateDebut, fin: dateFin },
      soldes: await this.getSoldes(exerciceId),
      flux_fonctionnement: {
        recettes: [] as LigneFluxTresorerie[],
        depenses: [] as LigneFluxTresorerie[],
        solde: 0
      },
      flux_investissement: {
        recettes: [] as LigneFluxTresorerie[],
        depenses: [] as LigneFluxTresorerie[],
        solde: 0
      },
      flux_financement: {
        recettes: [] as LigneFluxTresorerie[],
        depenses: [] as LigneFluxTresorerie[],
        solde: 0
      }
    };

    // Classer les flux
    fluxData.forEach((flux: LigneFluxTresorerie) => {
      const categorie = `flux_${flux.nature_flux.toLowerCase()}` as keyof typeof rapport;
      const type = flux.type_operation.toLowerCase() === 'recette' ? 'recettes' : 'depenses';
      
      if (rapport[categorie]) {
        (rapport[categorie] as any)[type].push(flux);
      }
    });

    // Calculer les soldes par nature
    ['fonctionnement', 'investissement', 'financement'].forEach(nature => {
      const categorie = `flux_${nature}` as keyof typeof rapport;
      if (rapport[categorie]) {
        const recettes = (rapport[categorie] as any).recettes.reduce(
          (sum: number, flux: LigneFluxTresorerie) => sum + flux.montant_paye, 0
        );
        const depenses = (rapport[categorie] as any).depenses.reduce(
          (sum: number, flux: LigneFluxTresorerie) => sum + flux.montant_paye, 0
        );
        (rapport[categorie] as any).solde = recettes - depenses;
      }
    });

    return rapport;
  }

  // Vérifier la disponibilité budgétaire
  static async verifierDisponibiliteBudgetaire(imputation: string, montant: number) {
    const { data: budget, error } = await supabase
      .from('budget')
      .select('montant_disponible')
      .eq('code_imputation', imputation)
      .single();

    if (error) throw error;

    return {
      disponible: (budget?.montant_disponible || 0) >= montant,
      montant_disponible: budget?.montant_disponible || 0
    };
  }

  // Valider une opération selon les règles de gestion
  static async validerOperation(operation: Partial<LigneFluxTresorerie>) {
    const erreurs = [];

    // Vérifier la disponibilité budgétaire pour les dépenses
    if (operation.type_operation === 'DEPENSE') {
      const { disponible } = await this.verifierDisponibiliteBudgetaire(
        operation.imputation!,
        operation.montant_prevu!
      );
      if (!disponible) {
        erreurs.push('Crédit budgétaire insuffisant');
      }
    }

    // Vérifier la cohérence des montants
    if (operation.montant_paye! > operation.montant_ordonnance!) {
      erreurs.push('Le montant payé ne peut pas dépasser le montant ordonnancé');
    }
    if (operation.montant_ordonnance! > operation.montant_engage!) {
      erreurs.push('Le montant ordonnancé ne peut pas dépasser le montant engagé');
    }
    if (operation.montant_engage! > operation.montant_prevu!) {
      erreurs.push('Le montant engagé ne peut pas dépasser le montant prévu');
    }

    return {
      valide: erreurs.length === 0,
      erreurs
    };
  }
}