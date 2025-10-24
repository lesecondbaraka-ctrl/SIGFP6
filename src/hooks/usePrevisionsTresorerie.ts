import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PrevisionTresorerie, AuditPrevision, WorkflowResponse, ValidationError } from '../types/tresorerie';
import { useAuth } from './useAuth';

const REGLES_VALIDATION = {
  MONTANT_MIN: 0,
  MONTANT_MAX: 1000000000000, // 1 trillion
  MOIS_MIN: 1,
  MOIS_MAX: 12
};

export function usePrevisionsTresorerie(exerciceId?: string) {
  const [previsions, setPrevisions] = useState<PrevisionTresorerie[]>([]);
  const [audit, setAudit] = useState<AuditPrevision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Validation métier
  const validatePrevision = (prevision: Partial<PrevisionTresorerie>): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!prevision.exercice_id) {
      errors.push({ field: 'exercice_id', message: 'L\'exercice est obligatoire' });
    }

    if (!prevision.montant && prevision.montant !== 0) {
      errors.push({ field: 'montant', message: 'Le montant est obligatoire' });
    } else if (prevision.montant < REGLES_VALIDATION.MONTANT_MIN) {
      errors.push({ field: 'montant', message: 'Le montant ne peut pas être négatif' });
    } else if (prevision.montant > REGLES_VALIDATION.MONTANT_MAX) {
      errors.push({ field: 'montant', message: 'Le montant dépasse la limite autorisée' });
    }

    if (!prevision.mois) {
      errors.push({ field: 'mois', message: 'Le mois est obligatoire' });
    } else if (prevision.mois < REGLES_VALIDATION.MOIS_MIN || prevision.mois > REGLES_VALIDATION.MOIS_MAX) {
      errors.push({ field: 'mois', message: 'Le mois doit être entre 1 et 12' });
    }

    if (!prevision.type) {
      errors.push({ field: 'type', message: 'Le type (recette/dépense) est obligatoire' });
    }

    if (!prevision.categorie) {
      errors.push({ field: 'categorie', message: 'La catégorie est obligatoire' });
    }

    return errors;
  };

  // Créer une entrée d'audit
  const createAuditEntry = async (
    prevision_id: string,
    type_operation: AuditPrevision['type_operation'],
    anciennes_valeurs?: Partial<PrevisionTresorerie>,
    nouvelles_valeurs?: Partial<PrevisionTresorerie>,
    commentaire?: string
  ) => {
    if (!user?.id) throw new Error('Utilisateur non authentifié');

    const auditEntry: Omit<AuditPrevision, 'id'> = {
      prevision_id,
      type_operation,
      date_operation: new Date().toISOString(),
      utilisateur_id: user.id,
      anciennes_valeurs,
      nouvelles_valeurs,
      commentaire
    };

    const { error } = await supabase
      .from('audit_previsions_tresorerie')
      .insert([auditEntry]);

    if (error) throw error;
  };

  // Charger les prévisions
  const fetchPrevisions = useCallback(async () => {
    if (!exerciceId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .select('*')
        .eq('exercice_id', exerciceId)
        .order('mois', { ascending: true });

      if (error) throw error;
      setPrevisions(data || []);

      // Charger l'audit en parallèle
      const { data: auditData, error: auditError } = await supabase
        .from('audit_previsions_tresorerie')
        .select('*')
        .eq('exercice_id', exerciceId)
        .order('date_operation', { ascending: false });

      if (auditError) throw auditError;
      setAudit(auditData || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des prévisions');
    } finally {
      setLoading(false);
    }
  }, [exerciceId]);

  // Créer une nouvelle prévision
  const createPrevision = async (
    newPrevision: Omit<PrevisionTresorerie, 'id' | 'date_creation' | 'date_modification' | 'createur_id' | 'modificateur_id' | 'version'>
  ): Promise<WorkflowResponse> => {
    if (!user?.id) return { success: false, message: 'Utilisateur non authentifié' };

    const errors = validatePrevision(newPrevision);
    if (errors.length > 0) {
      return { success: false, message: 'Validation échouée', errors };
    }

    try {
      const previsionComplete = {
        ...newPrevision,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString(),
        createur_id: user.id,
        modificateur_id: user.id,
        version: 1,
        statut: 'brouillon' as const
      };

      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .insert([previsionComplete])
        .select()
        .single();

      if (error) throw error;

      // Créer l'entrée d'audit
      await createAuditEntry(
        data.id,
        'creation',
        undefined,
        data,
        'Création initiale'
      );

      await fetchPrevisions(); // Recharger la liste

      return {
        success: true,
        message: 'Prévision créée avec succès',
        data
      };

    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors de la création'
      };
    }
  };

  // Mettre à jour une prévision
  const updatePrevision = async (
    id: string,
    updates: Partial<PrevisionTresorerie>
  ): Promise<WorkflowResponse> => {
    if (!user?.id) return { success: false, message: 'Utilisateur non authentifié' };

    try {
      // Récupérer l'ancienne version
      const { data: oldVersion, error: fetchError } = await supabase
        .from('previsions_tresorerie')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Vérifier le statut
      if (oldVersion.statut === 'approuve') {
        return {
          success: false,
          message: 'Impossible de modifier une prévision approuvée'
        };
      }

      const updatedPrevision = {
        ...updates,
        modificateur_id: user.id,
        date_modification: new Date().toISOString(),
        version: (oldVersion.version || 0) + 1
      };

      const errors = validatePrevision({ ...oldVersion, ...updatedPrevision });
      if (errors.length > 0) {
        return { success: false, message: 'Validation échouée', errors };
      }

      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .update(updatedPrevision)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Créer l'entrée d'audit
      await createAuditEntry(
        id,
        'modification',
        oldVersion,
        data,
        'Modification de la prévision'
      );

      await fetchPrevisions(); // Recharger la liste

      return {
        success: true,
        message: 'Prévision mise à jour avec succès',
        data
      };

    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      };
    }
  };

  // Soumettre pour approbation
  const submitForApproval = async (id: string): Promise<WorkflowResponse> => {
    if (!user?.id) return { success: false, message: 'Utilisateur non authentifié' };

    try {
      const { data: prevision, error: fetchError } = await supabase
        .from('previsions_tresorerie')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (prevision.statut !== 'brouillon') {
        return {
          success: false,
          message: 'Seules les prévisions en brouillon peuvent être soumises pour approbation'
        };
      }

      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .update({
          statut: 'en_revue',
          date_modification: new Date().toISOString(),
          modificateur_id: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditEntry(
        id,
        'modification',
        prevision,
        data,
        'Soumission pour approbation'
      );

      await fetchPrevisions();

      return {
        success: true,
        message: 'Prévision soumise pour approbation',
        data
      };

    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors de la soumission'
      };
    }
  };

  // Approuver une prévision
  const approvePrevision = async (id: string): Promise<WorkflowResponse> => {
    if (!user?.id) return { success: false, message: 'Utilisateur non authentifié' };

    try {
      const { data: prevision, error: fetchError } = await supabase
        .from('previsions_tresorerie')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (prevision.statut !== 'en_revue') {
        return {
          success: false,
          message: 'Seules les prévisions en revue peuvent être approuvées'
        };
      }

      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .update({
          statut: 'approuve',
          approbateur_id: user.id,
          date_approbation: new Date().toISOString(),
          date_modification: new Date().toISOString(),
          modificateur_id: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditEntry(
        id,
        'approbation',
        prevision,
        data,
        'Approbation de la prévision'
      );

      await fetchPrevisions();

      return {
        success: true,
        message: 'Prévision approuvée avec succès',
        data
      };

    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors de l\'approbation'
      };
    }
  };

  // Rejeter une prévision
  const rejectPrevision = async (id: string, motif: string): Promise<WorkflowResponse> => {
    if (!user?.id) return { success: false, message: 'Utilisateur non authentifié' };
    if (!motif) return { success: false, message: 'Le motif de rejet est obligatoire' };

    try {
      const { data: prevision, error: fetchError } = await supabase
        .from('previsions_tresorerie')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (prevision.statut !== 'en_revue') {
        return {
          success: false,
          message: 'Seules les prévisions en revue peuvent être rejetées'
        };
      }

      const { data, error } = await supabase
        .from('previsions_tresorerie')
        .update({
          statut: 'rejete',
          motif_rejet: motif,
          date_modification: new Date().toISOString(),
          modificateur_id: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await createAuditEntry(
        id,
        'rejet',
        prevision,
        data,
        `Rejet de la prévision: ${motif}`
      );

      await fetchPrevisions();

      return {
        success: true,
        message: 'Prévision rejetée avec succès',
        data
      };

    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors du rejet'
      };
    }
  };

  return {
    previsions,
    audit,
    loading,
    error,
    createPrevision,
    updatePrevision,
    submitForApproval,
    approvePrevision,
    rejectPrevision,
    fetchPrevisions
  };
}
