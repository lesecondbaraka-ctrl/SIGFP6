import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RegleConformite {
  id: string;
  code: string;
  categorie: string;
  titre: string;
  description: string;
  niveau_severite: 'CRITIQUE' | 'MAJEUR' | 'MINEUR' | 'INFO';
  actif: boolean;
  conditions: any;
  actions: any;
  created_at?: string;
  updated_at?: string;
}

export interface ViolationConformite {
  id: string;
  regle_id: string;
  regle?: RegleConformite;
  entite_id: string;
  entite_nom: string;
  type_ressource: string;
  ressource_id: string;
  description: string;
  statut: 'OUVERTE' | 'EN_COURS' | 'RESOLUE' | 'IGNOREE';
  date_detection: string;
  date_resolution?: string;
  resolu_par?: string;
  commentaire_resolution?: string;
}

export const useConformite = () => {
  const [regles, setRegles] = useState<RegleConformite[]>([]);
  const [violations, setViolations] = useState<ViolationConformite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegles = async () => {
    try {
      const { data, error } = await supabase
        .from('regles_conformite')
        .select('*')
        .eq('actif', true)
        .order('niveau_severite', { ascending: false });

      if (error) throw error;
      setRegles(data || []);
    } catch (err: any) {
      console.error('Erreur chargement règles:', err);
      setError(err.message);
    }
  };

  const fetchViolations = async () => {
    try {
      const { data, error } = await supabase
        .from('violations_conformite')
        .select(`
          *,
          regle:regles_conformite(*)
        `)
        .order('date_detection', { ascending: false })
        .limit(100);

      if (error) throw error;
      setViolations(data || []);
    } catch (err: any) {
      console.error('Erreur chargement violations:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRegles(), fetchViolations()]);
      setLoading(false);
    };

    loadData();

    // Écouter les changements en temps réel
    const violationsChannel = supabase
      .channel('violations_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'violations_conformite' },
        () => {
          fetchViolations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(violationsChannel);
    };
  }, []);

  const createRegle = async (regle: Omit<RegleConformite, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('regles_conformite')
        .insert([regle])
        .select()
        .single();

      if (error) throw error;
      await fetchRegles();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur création règle:', err);
      return { success: false, error: err.message };
    }
  };

  const updateRegle = async (id: string, updates: Partial<RegleConformite>) => {
    try {
      const { data, error } = await supabase
        .from('regles_conformite')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchRegles();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur mise à jour règle:', err);
      return { success: false, error: err.message };
    }
  };

  const createViolation = async (violation: Omit<ViolationConformite, 'id' | 'date_detection'>) => {
    try {
      const { data, error } = await supabase
        .from('violations_conformite')
        .insert([{
          ...violation,
          date_detection: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur création violation:', err);
      return { success: false, error: err.message };
    }
  };

  const resolveViolation = async (
    id: string,
    resoluPar: string,
    commentaire: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('violations_conformite')
        .update({
          statut: 'RESOLUE',
          date_resolution: new Date().toISOString(),
          resolu_par: resoluPar,
          commentaire_resolution: commentaire
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchViolations();
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur résolution violation:', err);
      return { success: false, error: err.message };
    }
  };

  const verifierConformite = async (
    typeRessource: string,
    ressourceId: string,
    donnees: any
  ) => {
    // Cette fonction vérifie toutes les règles actives contre une ressource
    const violationsDetectees: Omit<ViolationConformite, 'id' | 'date_detection'>[] = [];

    for (const regle of regles) {
      // Logique de vérification basée sur les conditions de la règle
      // À implémenter selon vos besoins spécifiques
      const estConforme = await evaluerRegle(regle, donnees);
      
      if (!estConforme) {
        violationsDetectees.push({
          regle_id: regle.id,
          entite_id: donnees.entite_id || '',
          entite_nom: donnees.entite_nom || '',
          type_ressource: typeRessource,
          ressource_id: ressourceId,
          description: `Violation de la règle: ${regle.titre}`,
          statut: 'OUVERTE'
        });
      }
    }

    // Créer les violations détectées
    if (violationsDetectees.length > 0) {
      for (const violation of violationsDetectees) {
        await createViolation(violation);
      }
    }

    return {
      conforme: violationsDetectees.length === 0,
      violations: violationsDetectees
    };
  };

  const evaluerRegle = async (regle: RegleConformite, donnees: any): Promise<boolean> => {
    // Logique d'évaluation des règles
    // À personnaliser selon vos besoins
    try {
      const conditions = regle.conditions;
      
      // Exemple de vérifications
      if (conditions.montant_max && donnees.montant > conditions.montant_max) {
        return false;
      }
      
      if (conditions.documents_requis) {
        const documentsManquants = conditions.documents_requis.filter(
          (doc: string) => !donnees.documents?.includes(doc)
        );
        if (documentsManquants.length > 0) {
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Erreur évaluation règle:', err);
      return true; // En cas d'erreur, on considère conforme pour éviter les faux positifs
    }
  };

  return {
    regles,
    violations,
    loading,
    error,
    createRegle,
    updateRegle,
    createViolation,
    resolveViolation,
    verifierConformite,
    refresh: () => Promise.all([fetchRegles(), fetchViolations()])
  };
};
