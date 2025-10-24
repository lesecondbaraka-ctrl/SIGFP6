import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ControlCheck {
  id: string;
  type: 'automatic' | 'manual';
  category: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  entity: string;
  entity_id?: string;
  timestamp: string;
  details?: string;
  created_by?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export const useControles = () => {
  const [controles, setControles] = useState<ControlCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchControles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('controles')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setControles(data || []);
    } catch (err: any) {
      console.error('Erreur chargement contrôles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControles();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('controles_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'controles' },
        () => {
          fetchControles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createControle = async (controle: Omit<ControlCheck, 'id' | 'timestamp'>) => {
    try {
      const { data, error } = await supabase
        .from('controles')
        .insert([{
          ...controle,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur création contrôle:', err);
      return { success: false, error: err.message };
    }
  };

  const updateControle = async (id: string, updates: Partial<ControlCheck>) => {
    try {
      const { data, error } = await supabase
        .from('controles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur mise à jour contrôle:', err);
      return { success: false, error: err.message };
    }
  };

  const resolveControle = async (id: string, resolvedBy: string, resolution: string) => {
    try {
      const { data, error } = await supabase
        .from('controles')
        .update({
          status: 'passed',
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          details: resolution
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error('Erreur résolution contrôle:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    controles,
    loading,
    error,
    createControle,
    updateControle,
    resolveControle,
    refresh: fetchControles
  };
};
