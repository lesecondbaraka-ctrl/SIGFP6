import { supabase } from '../lib/supabase';

export class ExerciceComptableService {
  static async verifierCoherence(_exerciceId: string) {
    // Implémentation de la vérification de cohérence
    // TODO: Ajouter la logique métier réelle
    return {
      messages: [
        {
          type: 'info' as 'error' | 'warning' | 'info',
          message: 'Vérification de cohérence effectuée',
        },
      ],
    };
  }

  static async cloturerExercice(exerciceId: string, commentaire: string) {
    const { data, error } = await supabase
      .from('exercices_comptables')
      .update({
        est_cloture: true,
        date_cloture: new Date().toISOString(),
        commentaire_cloture: commentaire,
      })
      .eq('id', exerciceId);

    if (error) throw error;
    return data;
  }

  static async validerReports(exerciceId: string) {
    const { data, error } = await supabase
      .from('exercices_comptables')
      .update({
        reports_valides: true,
      })
      .eq('id', exerciceId);

    if (error) throw error;
    return data;
  }
}