import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CompteResultat } from '../types/finance';

export const useCompteResultat = (exerciceId: string) => {
  const [resultat, setResultat] = useState<CompteResultat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('compte_resultat')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('ordre')
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) console.error(error);
        setResultat(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { resultat, loading };
};