
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Depense, Tresorerie, Alert, BudgetItem, Agent, Transaction, FluxTresorerie, PrevisionTresorerie, AnalyseTresorerie } from '../lib/supabase';

export type Categorie = {
  id_categorie: string;
  nom_categorie: string;
};

export type SousCategorie = {
  id_sous_categorie: string;
  nom_sous_categorie: string;
  id_categorie: string;
};

export type Unite = {
  id_unite: string;
  nom_unite: string;
};

export type LigneRecette = {
  id_ligne: string;
  ref_ligne: string;
  libelle: string;
  id_categorie: string;
  id_sous_categorie: string;
  id_unite: string | null;
  quantite: number;
  prix_unitaire: number;
  pourcentage?: number;
  frequence?: string;
  total: number;
};


// Définir le type Recette
export type Recette = {
    id_recette: string;
    code: string;
    intitule: string;
    montant_allocation: number;
    montant_total: number;
    annee: number;
    id_statut: string;
    id_sous_category: string;
    id_entite: string;
    frequence: string;
};

const useRecettes = () => {
    const [recettes, setRecettes] = useState<Recette[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecette, setSelectedRecette] = useState<Recette | null>(null);

    const fetchRecettes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('recettes')
            .select('*');

        if (error) {
            setError(error.message);
        } else {
            setRecettes(data as Recette[]);
        }
        setLoading(false);
    };

    const addRecette = async (recette: Recette) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('recettes')
            .insert([recette]);

        if (error) {
            setError(error.message);
        } else {
            setRecettes((prevRecettes) => [...prevRecettes, ...data as Recette[]]);
        }
        setLoading(false);
    };

    const updateRecette = async (id: string, updatedRecette: Partial<Recette>) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('recettes')
            .update(updatedRecette)
            .eq('id_recette', id);

        if (error) {
            setError(error.message);
        } else {
            setRecettes((prevRecettes) =>
                prevRecettes.map((recette) => (recette.id_recette === id ? { ...recette, ...data[0] } : recette))
            );
        }
        setLoading(false);
    };

    const deleteRecette = async (id: string) => {
        setLoading(true);
        const { error } = await supabase
            .from('recettes')
            .delete()
            .eq('id_recette', id);

        if (error) {
            setError(error.message);
        } else {
            setRecettes((prevRecettes) => prevRecettes.filter((recette) => recette.id_recette !== id));
        }
        setLoading(false);
    };

    const selectRecette = (recette: Recette) => {
        setSelectedRecette(recette);
    };

    const clearSelectedRecette = () => {
        setSelectedRecette(null);
    };

    useEffect(() => {
        fetchRecettes();
    }, []);

    return {
        recettes,
        addRecette,
        updateRecette,
        deleteRecette,
        selectRecette,
        clearSelectedRecette,
        selectedRecette,
        loading,
        error
    };
};

export { useRecettes };
export default useRecettes;

export function useBudgetItems() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetItems = useCallback(async () => {
    setBudgetItems([]);
  }, []);

  const addBudgetItem = async (newItem: Omit<BudgetItem, 'id_budget' | 'created_at'>) => {
    setError("La table budgets n'existe pas encore");
  };

  const updateBudgetItem = async (id: string, updatedItem: Partial<BudgetItem>) => {
    setError("La table budgets n'existe pas encore");
  };

  const deleteBudgetItem = async (id: string) => {
    setError("La table budgets n'existe pas encore");
  };

  return {
    budgetItems,
    loading,
    error,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    refetchBudgetItems: fetchBudgetItems,
  };
}

export type Depense = {
  id: number;
  numero: string;
  beneficiaire: string;
  objet: string;
  montant: number;
  date_engagement: string;
  id_entite: string | null;
  justificatif: boolean;
  statut: "Engagé" | "Liquidé" | "Payé" | "Rejeté";
  date_liquidation?: string;
  date_paiement?: string;
  created_at?: string;
};

export function useDepenses() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepenses = useCallback(async () => {
    setDepenses([]);
  }, []);

  const addDepense = async (depense: Omit<Depense, "id" | "created_at">) => {
    setError("La table depenses n'existe pas encore");
  };

  const updateDepense = async (id: number, updates: Partial<Depense>) => {
    setError("La table depenses n'existe pas encore");
  };

  const deleteDepense = async (id: number) => {
    setError("La table depenses n'existe pas encore");
  };

  return {
    depenses,
    loading,
    error,
    addDepense,
    updateDepense,
    deleteDepense,
    refetchDepenses: fetchDepenses,
  };
}

export function useFluxTresorerie() {
    const [fluxData, setFluxData] = useState<FluxTresorerie[]>([]);
    const [previsionsData, setPrevisionsData] = useState<PrevisionTresorerie[]>([]);
    const [analysesData, setAnalysesData] = useState<AnalyseTresorerie[]>([]);
    const [entitesData, setEntitesData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEntites = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('entites')
                .select('*');

            if (error) throw error;
            setEntitesData(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement des entités');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchFluxTresorerie = useCallback(async () => {
        setFluxData([]);
    }, []);

    const fetchPrevisionsTresorerie = useCallback(async () => {
        setPrevisionsData([]);
    }, []);

    const fetchAnalysesTresorerie = useCallback(async () => {
        setAnalysesData([]);
    }, []);

    const createFluxTresorerie = useCallback(async (flux: Partial<FluxTresorerie>) => {
        setError('La table flux_tresorerie n\'existe pas encore');
        return null;
    }, []);

    const updateFluxTresorerie = useCallback(async (flux: FluxTresorerie) => {
        setError('La table flux_tresorerie n\'existe pas encore');
        return null;
    }, []);

    const deleteFluxTresorerie = useCallback(async (id_flux: string) => {
        setError('La table flux_tresorerie n\'existe pas encore');
        return null;
    }, []);

    useEffect(() => {
        fetchEntites();
    }, [fetchEntites]);

    return {
        fluxData,
        previsionsData,
        analysesData,
        entitesData,
        loading,
        error,
        createFluxTresorerie,
        updateFluxTresorerie,
        deleteFluxTresorerie,
        fetchFluxTresorerie,
        fetchPrevisionsTresorerie,
        fetchAnalysesTresorerie,
        fetchEntites,
    };
}


// Hook pour les alertes
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Générer des alertes basées sur les données existantes
      const alertsData: Alert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Budget en cours d\'exécution',
          message: 'Plusieurs postes budgétaires sont en cours d\'exécution',
          entity: 'Système',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'info',
          title: 'Contrôles internes',
          message: 'Des contrôles internes sont en cours de traitement',
          entity: 'Système',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ];
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const dismissAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
      await fetchAlerts();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  return {
    alerts,
    loading,
    error,
    dismissAlert,
    refetchAlerts: fetchAlerts,
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('id_utilisateur', { ascending: false });
      if (error) throw error;

      const agentsData = (data || []).map(user => ({
        id: user.id_utilisateur.toString(),
        matricule: `MAT${user.id_utilisateur.toString().padStart(4, '0')}`,
        nom: user.nom,
        prenom: user.prenom,
        poste: user.role,
        grade: user.role === 'IGF' ? 'Inspecteur' : user.role === 'Contrôleur' ? 'Contrôleur' : 'Agent',
        salaire: user.role === 'IGF' ? 2500000 : user.role === 'Contrôleur' ? 1800000 : 1200000,
        primes: user.role === 'IGF' ? 500000 : user.role === 'Contrôleur' ? 300000 : 200000,
        retenues: user.role === 'IGF' ? 300000 : user.role === 'Contrôleur' ? 210000 : 140000,
        salaire_net: user.role === 'IGF' ? 2700000 : user.role === 'Contrôleur' ? 1890000 : 1260000,
        entity: user.id_entite ? `Entité ${user.id_entite}` : 'Non assigné',
        statut: 'Actif' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setAgents(agentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, refetchAgents: fetchAgents };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setTransactions([]);
  }, []);

  return { transactions, loading, error, refetchTransactions: fetchTransactions };
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
