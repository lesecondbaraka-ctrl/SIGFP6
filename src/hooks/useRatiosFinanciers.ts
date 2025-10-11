import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RatioFinancier } from '../types/finance';

export const useRatiosFinanciers = (exerciceId: string) => {
  const [ratios, setRatios] = useState<RatioFinancier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('ratios_financiers')
      .select('*')
      .eq('exercice_id', exerciceId)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setRatios(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { ratios, loading };
};
