import { useState, useCallback } from 'react';
import { TresorerieService } from '../services/TresorerieService';
import { TresorerieValidationService } from '../services/TresorerieValidationService';
import { FluxTresorerie } from '../types/finance';
import { TypeOperation, NatureFlux } from '../types/tresorerie';

interface UseModuleTresorerieProps {
  exerciceId: string;
}

interface TresorerieState {
  loading: boolean;
  error: string | null;
  flux: FluxTresorerie[];
  totaux: {
    totalEncaissements: number;
    totalDecaissements: number;
    soldeNet: number;
    parCategorie: Record<string, { entrees: number; sorties: number; solde: number }>;
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function useModuleTresorerie({ exerciceId }: UseModuleTresorerieProps) {
  const [state, setState] = useState<TresorerieState>({
    loading: true,
    error: null,
    flux: [],
    totaux: {
      totalEncaissements: 0,
      totalDecaissements: 0,
      soldeNet: 0,
      parCategorie: {},
    },
  });

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const totaux = await TresorerieService.calculerTotalFlux(exerciceId);
      const flux = await TresorerieService.getFluxTresorerie(exerciceId);
      setState(prev => ({ ...prev, loading: false, flux, totaux }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Erreur lors du chargement des données',
      }));
    }
  }, [exerciceId]);

  const validateFlux = useCallback((data: {
    montant: number;
    date: string;
    reference: string;
    imputation: string;
    nature: NatureFlux;
    type: TypeOperation;
  }): ValidationResult => {
    return TresorerieValidationService.validateAll(data);
  }, []);

  const ajouterFlux = useCallback(async (data: Omit<FluxTresorerie, 'id' | 'created_at'>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await TresorerieService.ajouterFluxTresorerie(data);
      await loadData();
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du flux';
      setState(prev => ({ ...prev, loading: false, error }));
      return { success: false, error };
    }
  }, [loadData]);

  const modifierFlux = useCallback(async (id: string, updates: Partial<Omit<FluxTresorerie, 'id' | 'created_at'>>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await TresorerieService.modifierFluxTresorerie(id, updates);
      await loadData();
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la modification du flux';
      setState(prev => ({ ...prev, loading: false, error }));
      return { success: false, error };
    }
  }, [loadData]);

  const supprimerFlux = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await TresorerieService.supprimerFluxTresorerie(id);
      await loadData();
      return { success: true, error: null };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erreur lors de la suppression du flux';
      setState(prev => ({ ...prev, loading: false, error }));
      return { success: false, error };
    }
  }, [loadData]);

  return {
    ...state,
    loadData,
    validateFlux,
    ajouterFlux,
    modifierFlux,
    supprimerFlux,
  };
}