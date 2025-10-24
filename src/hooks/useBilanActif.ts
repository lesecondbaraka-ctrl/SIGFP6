import { useState, useEffect} from 'react';
import { supabase } from '../lib/supabase';
import type { BilanActif } from '../types/finance';
export const useBilanActif = (exerciceId: string) => {
  const [actif, setActif] = useState<BilanActif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('bilan_actif')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('ordre')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) console.error(error);
        setActif(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { actif, loading };
};
