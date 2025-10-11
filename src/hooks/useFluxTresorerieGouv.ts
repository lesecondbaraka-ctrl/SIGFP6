import { useState, useEffect } from 'react';
import { TresorerieService } from '../services/TresorerieService';
import { LigneFluxTresorerie, RapportTresorerie, SoldesTresorerie, StatutOperation } from '../types/tresorerie';

export const useFluxTresorerieGouv = (exerciceId: string) => {
  const [fluxFonctionnement, setFluxFonctionnement] = useState<LigneFluxTresorerie[]>([]);
  const [fluxInvestissement, setFluxInvestissement] = useState<LigneFluxTresorerie[]>([]);
  const [fluxFinancement, setFluxFinancement] = useState<LigneFluxTresorerie[]>([]);
  const [soldes, setSoldes] = useState<SoldesTresorerie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données initiales
  useEffect(() => {
    const chargerDonnees = async () => {
      try {
        setLoading(true);
        
        // Charger les flux par nature
        const [fonctionnement, investissement, financement, soldesData] = await Promise.all([
          TresorerieService.getFluxParNature(exerciceId, 'FONCTIONNEMENT'),
          TresorerieService.getFluxParNature(exerciceId, 'INVESTISSEMENT'),
          TresorerieService.getFluxParNature(exerciceId, 'FINANCEMENT'),
          TresorerieService.getSoldes(exerciceId)
        ]);

        setFluxFonctionnement(fonctionnement);
        setFluxInvestissement(investissement);
        setFluxFinancement(financement);
        setSoldes(soldesData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (exerciceId) {
      chargerDonnees();
    }
  }, [exerciceId]);

  // Créer une nouvelle opération
  const creerOperation = async (operation: Omit<LigneFluxTresorerie, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      
      // Créer l'opération avec conversion des dates en string
      const operationPourService = {
        ...operation,
        date_operation: operation.date_operation.toISOString(),
        date_valeur: operation.date_valeur.toISOString()
      };
      
      const nouvelleOperation = await TresorerieService.creerOperation(operationPourService);
      
      // Mettre à jour l'état local
      switch (operation.nature_flux) {
        case 'FONCTIONNEMENT':
          setFluxFonctionnement(prev => [...prev, nouvelleOperation]);
          break;
        case 'INVESTISSEMENT':
          setFluxInvestissement(prev => [...prev, nouvelleOperation]);
          break;
        case 'FINANCEMENT':
          setFluxFinancement(prev => [...prev, nouvelleOperation]);
          break;
      }

      // Mettre à jour les soldes
      const nouveauxSoldes = await TresorerieService.getSoldes(exerciceId);
      setSoldes(nouveauxSoldes);

      return nouvelleOperation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    }
  };

  // Mettre à jour le statut d'une opération
  const mettreAJourStatut = async (
    id: string,
    nouveauStatut: StatutOperation
  ) => {
    try {
      setLoading(true);
      await TresorerieService.mettreAJourStatut(id, nouveauStatut);
      
      // Recharger les données pour mettre à jour l'état local
      const [fonctionnement, investissement, financement, soldesData] = await Promise.all([
        TresorerieService.getFluxParNature(exerciceId, 'FONCTIONNEMENT'),
        TresorerieService.getFluxParNature(exerciceId, 'INVESTISSEMENT'),
        TresorerieService.getFluxParNature(exerciceId, 'FINANCEMENT'),
        TresorerieService.getSoldes(exerciceId)
      ]);

      setFluxFonctionnement(fonctionnement);
      setFluxInvestissement(investissement);
      setFluxFinancement(financement);
      setSoldes(soldesData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Générer un rapport de trésorerie
  const genererRapport = async (dateDebut: Date, dateFin: Date): Promise<RapportTresorerie> => {
    try {
      setLoading(true);
      return await TresorerieService.genererRapport(exerciceId, dateDebut, dateFin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    fluxFonctionnement,
    fluxInvestissement,
    fluxFinancement,
    soldes,
    loading,
    error,
    creerOperation,
    mettreAJourStatut,
    genererRapport
  };
};