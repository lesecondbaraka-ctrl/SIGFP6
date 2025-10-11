import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FluxTresorerie } from '../types/finance';

export const useFluxTresorerie = (exerciceId: string) => {
  const [flux, setFlux] = useState<FluxTresorerie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('flux_tresorerie')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('ordre')
      .then(({ data, error }) => {
        if (error) console.error(error);
        setFlux(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { flux, loading };
};
