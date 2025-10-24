import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RatioFinancier } from '../types/finance';

export const useRatiosFinanciers = (exerciceId: string) => {
  const [ratios, setRatios] = useState<RatioFinancier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchRatios = async () => {
      const { data, error } = await supabase
        .from('ratios_financiers')
        .select('*')
        .eq('exercice_id', exerciceId);
      if (error) {
        console.error(error);
      }
      if (!isCancelled) {
        setRatios(data || []);
        setLoading(false);
      }
    };

    setLoading(true);
    fetchRatios();

    // Realtime updates
    const channel = supabase
      .channel('ratios_financiers_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ratios_financiers', filter: `exercice_id=eq.${exerciceId}` },
        () => {
          fetchRatios();
        }
      )
      .subscribe();

    return () => {
      isCancelled = true;
      try {
        supabase.removeChannel(channel);
      } catch (_e) {
        // ignore cleanup errors
      }
    };
  }, [exerciceId]);

  return { ratios, loading };
};
