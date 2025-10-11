import { useState, useEffect} from 'react';
import { supabase } from '../lib/supabase';
import { ExerciceComptable } from '../types/exercice';

export const useExercicesComptables = () => {
  const [data, setData] = useState<ExerciceComptable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('exercices_comptables')
        .select('*')
        .order('annee', { ascending: false });

      if (error) console.error(error);
      setData((data as ExerciceComptable[]) || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading };
};