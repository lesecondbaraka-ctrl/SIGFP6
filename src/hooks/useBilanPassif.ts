
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BilanPassif } from '../types/finance';

export const useBilanPassif = (exerciceId: string) => {
  const [passif, setPassif] = useState<BilanPassif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('bilan_passif')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('ordre')
      .then(({ data, error }) => {
        if (error) console.error(error);
        setPassif(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { passif, loading };
};