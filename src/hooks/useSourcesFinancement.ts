import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SourceFinancement {
  id: string;
  code: string;
  libelle: string;
}

export function useSourcesFinancement() {
  const [sourcesFinancement, setSourcesFinancement] = useState<SourceFinancement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourcesFinancement = async () => {
      try {
        const { data, error } = await supabase
          .from('sources_financement')
          .select('id, code, libelle')
          .order('code');

        if (error) throw error;
        setSourcesFinancement(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sources de financement');
      } finally {
        setLoading(false);
      }
    };

    fetchSourcesFinancement();
  }, []);

  return { sourcesFinancement, loading, error };
}