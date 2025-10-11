import { useState, useEffect } from 'react';
import { TresorerieService } from '../services/TresorerieService';
import { FluxParNature, ResumeMensuel, PrevisionsFlux } from '../types/tresorerie';

export function useTableauBordTresorerie(exerciceId: string) {
  const [fluxParNature, setFluxParNature] = useState<FluxParNature[]>([]);
  const [resumeMensuel, setResumeMensuel] = useState<ResumeMensuel[]>([]);
  const [previsionsFlux, setPrevisionsFlux] = useState<PrevisionsFlux | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger toutes les données en parallèle
        const [
          fluxParNatureData,
          resumeMensuelData,
          previsionsFluxData
        ] = await Promise.all([
          TresorerieService.getFluxParNature(exerciceId),
          TresorerieService.getResumeMensuel(exerciceId),
          TresorerieService.getPrevisionsFlux(exerciceId)
        ]);

        setFluxParNature(fluxParNatureData);
        setResumeMensuel(resumeMensuelData);
        setPrevisionsFlux(previsionsFluxData);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exerciceId]);

  return {
    fluxParNature,
    resumeMensuel,
    previsionsFlux,
    loading,
    error
  };
}