import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { NoteAnnexe } from '../types/finance';

export const useNotesAnnexes = (exerciceId: string) => {
  const [notes, setNotes] = useState<NoteAnnexe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('notes_annexes')
      .select('*')
      .eq('exercice_id', exerciceId)
      .order('numero')
      .then(({ data, error }) => {
        if (error) console.error(error);
        setNotes(data || []);
        setLoading(false);
      });
  }, [exerciceId]);

  return { notes, loading };
};
