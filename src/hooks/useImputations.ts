import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Imputation {
  id: string;
  code: string;
  libelle: string;
}

export function useImputations() {
  const [imputations, setImputations] = useState<Imputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImputations = async () => {
      try {
        const { data, error } = await supabase
          .from('imputations_budgetaires')
          .select('id, code, libelle')
          .order('code');

        if (error) throw error;
        setImputations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des imputations');
      } finally {
        setLoading(false);
      }
    };

    fetchImputations();
  }, []);

  return { imputations, loading, error };
}