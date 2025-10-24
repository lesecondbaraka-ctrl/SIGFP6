import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types pour éviter les doublons et conflits
export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  grade: string;
  salaireBrut: number;
  primes: number;
  salaireImposable: number;
  ipr: number;
  inss: number;
  autresRetenues: number;
  salaireNet: number;
  entite: string;
  statut: 'Actif' | 'Inactif' | 'Suspendu';
  numeroINSS: string;
  numeroImpot: string;
  created_at: string;
  updated_at: string;
}

export interface RecetteItem {
  id: string;
  code: string;
  libelle: string;
  previsionAnnuelle: number;
  realiseADate: number;
  tauxExecution: number;
  entite: string;
  type: 'Fiscale' | 'Non-Fiscale' | 'Exceptionnelle';
  created_at: string;
  updated_at: string;
}

export interface DepenseItem {
  id: string;
  code: string;
  libelle: string;
  montantBudget: number;
  montantEngage: number;
  montantLiquide: number;
  montantPaye: number;
  entite: string;
  statut: 'Prévu' | 'Engagé' | 'Liquidé' | 'Payé';
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  code: string;
  libelle: string;
  type: 'fonctionnement' | 'investissement' | 'tresorerie';
  classe: string;
  allocation: number;
  execute: number;
  disponible: number;
  entite: string;
  exercice: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  numero: string;
  type: 'Engagement' | 'Liquidation' | 'Paiement';
  id_entite: string;
  montant: number;
  beneficiaire: string;
  date_transaction: string;
  statut: 'En attente validation' | 'Validé IGF' | 'Rejeté IGF' | 'Sous surveillance';
  risque: 'Faible' | 'Moyen' | 'Élevé';
  commentaire_igf?: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info' | 'error';
  title: string;
  message: string;
  entity: string;
  is_read: boolean;
  created_at: string;
}

// État global de l'application
interface AppState {
  agents: Agent[];
  recettes: RecetteItem[];
  depenses: DepenseItem[];
  budgetItems: BudgetItem[];
  transactions: Transaction[];
  alerts: Alert[];
  loading: {
    agents: boolean;
    recettes: boolean;
    depenses: boolean;
    budget: boolean;
    transactions: boolean;
    alerts: boolean;
  };
  errors: {
    agents: string | null;
    recettes: string | null;
    depenses: string | null;
    budget: string | null;
    transactions: string | null;
    alerts: string | null;
  };
}

// Actions pour le reducer
type DataAction =
  | { type: 'SET_LOADING'; module: keyof AppState['loading']; loading: boolean }
  | { type: 'SET_ERROR'; module: keyof AppState['errors']; error: string | null }
  | { type: 'SET_AGENTS'; agents: Agent[] }
  | { type: 'ADD_AGENT'; agent: Agent }
  | { type: 'UPDATE_AGENT'; id: string; agent: Partial<Agent> }
  | { type: 'DELETE_AGENT'; id: string }
  | { type: 'SET_RECETTES'; recettes: RecetteItem[] }
  | { type: 'ADD_RECETTE'; recette: RecetteItem }
  | { type: 'UPDATE_RECETTE'; id: string; recette: Partial<RecetteItem> }
  | { type: 'DELETE_RECETTE'; id: string }
  | { type: 'SET_DEPENSES'; depenses: DepenseItem[] }
  | { type: 'ADD_DEPENSE'; depense: DepenseItem }
  | { type: 'UPDATE_DEPENSE'; id: string; depense: Partial<DepenseItem> }
  | { type: 'DELETE_DEPENSE'; id: string }
  | { type: 'SET_BUDGET_ITEMS'; budgetItems: BudgetItem[] }
  | { type: 'ADD_BUDGET_ITEM'; budgetItem: BudgetItem }
  | { type: 'UPDATE_BUDGET_ITEM'; id: string; budgetItem: Partial<BudgetItem> }
  | { type: 'DELETE_BUDGET_ITEM'; id: string }
  | { type: 'SET_TRANSACTIONS'; transactions: Transaction[] }
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'UPDATE_TRANSACTION'; id: string; transaction: Partial<Transaction> }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'SET_ALERTS'; alerts: Alert[] }
  | { type: 'ADD_ALERT'; alert: Alert }
  | { type: 'DISMISS_ALERT'; id: string }
  | { type: 'CLEAR_ALL_DATA' };

// État initial
const initialState: AppState = {
  agents: [],
  recettes: [],
  depenses: [],
  budgetItems: [],
  transactions: [],
  alerts: [],
  loading: {
    agents: false,
    recettes: false,
    depenses: false,
    budget: false,
    transactions: false,
    alerts: false,
  },
  errors: {
    agents: null,
    recettes: null,
    depenses: null,
    budget: null,
    transactions: null,
    alerts: null,
  },
};

// Reducer pour gérer les actions
function dataReducer(state: AppState, action: DataAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.module]: action.loading },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.module]: action.error },
      };

    case 'SET_AGENTS':
      return { ...state, agents: action.agents };

    case 'ADD_AGENT':
      // Éviter les doublons par ID
      if (state.agents.find(a => a.id === action.agent.id)) {
        return state;
      }
      return { ...state, agents: [...state.agents, action.agent] };

    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.id ? { ...agent, ...action.agent } : agent
        ),
      };

    case 'DELETE_AGENT':
      return {
        ...state,
        agents: state.agents.filter(agent => agent.id !== action.id),
      };

    case 'SET_RECETTES':
      return { ...state, recettes: action.recettes };

    case 'ADD_RECETTE':
      if (state.recettes.find(r => r.id === action.recette.id)) {
        return state;
      }
      return { ...state, recettes: [...state.recettes, action.recette] };

    case 'UPDATE_RECETTE':
      return {
        ...state,
        recettes: state.recettes.map(recette =>
          recette.id === action.id ? { ...recette, ...action.recette } : recette
        ),
      };

    case 'DELETE_RECETTE':
      return {
        ...state,
        recettes: state.recettes.filter(recette => recette.id !== action.id),
      };

    case 'SET_DEPENSES':
      return { ...state, depenses: action.depenses };

    case 'ADD_DEPENSE':
      if (state.depenses.find(d => d.id === action.depense.id)) {
        return state;
      }
      return { ...state, depenses: [...state.depenses, action.depense] };

    case 'UPDATE_DEPENSE':
      return {
        ...state,
        depenses: state.depenses.map(depense =>
          depense.id === action.id ? { ...depense, ...action.depense } : depense
        ),
      };

    case 'DELETE_DEPENSE':
      return {
        ...state,
        depenses: state.depenses.filter(depense => depense.id !== action.id),
      };

    case 'SET_BUDGET_ITEMS':
      return { ...state, budgetItems: action.budgetItems };

    case 'ADD_BUDGET_ITEM':
      if (state.budgetItems.find(b => b.id === action.budgetItem.id)) {
        return state;
      }
      return { ...state, budgetItems: [...state.budgetItems, action.budgetItem] };

    case 'UPDATE_BUDGET_ITEM':
      return {
        ...state,
        budgetItems: state.budgetItems.map(item =>
          item.id === action.id ? { ...item, ...action.budgetItem } : item
        ),
      };

    case 'DELETE_BUDGET_ITEM':
      return {
        ...state,
        budgetItems: state.budgetItems.filter(item => item.id !== action.id),
      };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.transactions };

    case 'ADD_TRANSACTION':
      if (state.transactions.find(t => t.id === action.transaction.id)) {
        return state;
      }
      return { ...state, transactions: [...state.transactions, action.transaction] };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.id ? { ...transaction, ...action.transaction } : transaction
        ),
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.id),
      };

    case 'SET_ALERTS':
      return { ...state, alerts: action.alerts };

    case 'ADD_ALERT':
      if (state.alerts.find(a => a.id === action.alert.id)) {
        return state;
      }
      return { ...state, alerts: [...state.alerts, action.alert] };

    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.id),
      };

    case 'CLEAR_ALL_DATA':
      return initialState;

    default:
      return state;
  }
}

// Context
interface DataContextType {
  state: AppState;
  dispatch: React.Dispatch<DataAction>;
  // Fonctions utilitaires
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  addRecette: (recette: RecetteItem) => void;
  updateRecette: (id: string, recette: Partial<RecetteItem>) => void;
  deleteRecette: (id: string) => void;
  addDepense: (depense: DepenseItem) => void;
  updateDepense: (id: string, depense: Partial<DepenseItem>) => void;
  deleteDepense: (id: string) => void;
  addBudgetItem: (budgetItem: BudgetItem) => void;
  updateBudgetItem: (id: string, budgetItem: Partial<BudgetItem>) => void;
  deleteBudgetItem: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  setLoading: (module: keyof AppState['loading'], loading: boolean) => void;
  setError: (module: keyof AppState['errors'], error: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Fonctions utilitaires
  const addAgent = (agent: Agent) => dispatch({ type: 'ADD_AGENT', agent });
  const updateAgent = (id: string, agent: Partial<Agent>) => dispatch({ type: 'UPDATE_AGENT', id, agent });
  const deleteAgent = (id: string) => dispatch({ type: 'DELETE_AGENT', id });

  const addRecette = (recette: RecetteItem) => dispatch({ type: 'ADD_RECETTE', recette });
  const updateRecette = (id: string, recette: Partial<RecetteItem>) => dispatch({ type: 'UPDATE_RECETTE', id, recette });
  const deleteRecette = (id: string) => dispatch({ type: 'DELETE_RECETTE', id });

  const addDepense = (depense: DepenseItem) => dispatch({ type: 'ADD_DEPENSE', depense });
  const updateDepense = (id: string, depense: Partial<DepenseItem>) => dispatch({ type: 'UPDATE_DEPENSE', id, depense });
  const deleteDepense = (id: string) => dispatch({ type: 'DELETE_DEPENSE', id });

  const addBudgetItem = (budgetItem: BudgetItem) => dispatch({ type: 'ADD_BUDGET_ITEM', budgetItem });
  const updateBudgetItem = (id: string, budgetItem: Partial<BudgetItem>) => dispatch({ type: 'UPDATE_BUDGET_ITEM', id, budgetItem });
  const deleteBudgetItem = (id: string) => dispatch({ type: 'DELETE_BUDGET_ITEM', id });

  const addTransaction = (transaction: Transaction) => dispatch({ type: 'ADD_TRANSACTION', transaction });
  const updateTransaction = (id: string, transaction: Partial<Transaction>) => dispatch({ type: 'UPDATE_TRANSACTION', id, transaction });
  const deleteTransaction = (id: string) => dispatch({ type: 'DELETE_TRANSACTION', id });

  const addAlert = (alert: Alert) => dispatch({ type: 'ADD_ALERT', alert });
  const dismissAlert = (id: string) => dispatch({ type: 'DISMISS_ALERT', id });

  const setLoading = (module: keyof AppState['loading'], loading: boolean) => 
    dispatch({ type: 'SET_LOADING', module, loading });
  const setError = (module: keyof AppState['errors'], error: string | null) => 
    dispatch({ type: 'SET_ERROR', module, error });

  const value: DataContextType = {
    state,
    dispatch,
    addAgent,
    updateAgent,
    deleteAgent,
    addRecette,
    updateRecette,
    deleteRecette,
    addDepense,
    updateDepense,
    deleteDepense,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAlert,
    dismissAlert,
    setLoading,
    setError,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Hook pour utiliser le contexte
export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

// Hooks spécialisés pour chaque module
export function useAgents() {
  const { state, addAgent, updateAgent, deleteAgent, setLoading, setError } = useDataContext();
  return {
    agents: state.agents,
    loading: state.loading.agents,
    error: state.errors.agents,
    addAgent,
    updateAgent,
    deleteAgent,
    setLoading: (loading: boolean) => setLoading('agents', loading),
    setError: (error: string | null) => setError('agents', error),
  };
}

export function useRecettes() {
  const { state, addRecette, updateRecette, deleteRecette, setLoading, setError } = useDataContext();
  return {
    recettes: state.recettes,
    loading: state.loading.recettes,
    error: state.errors.recettes,
    addRecette,
    updateRecette,
    deleteRecette,
    setLoading: (loading: boolean) => setLoading('recettes', loading),
    setError: (error: string | null) => setError('recettes', error),
  };
}

export function useDepenses() {
  const { state, addDepense, updateDepense, deleteDepense, setLoading, setError } = useDataContext();
  return {
    depenses: state.depenses,
    loading: state.loading.depenses,
    error: state.errors.depenses,
    addDepense,
    updateDepense,
    deleteDepense,
    setLoading: (loading: boolean) => setLoading('depenses', loading),
    setError: (error: string | null) => setError('depenses', error),
  };
}

export function useBudget() {
  const { state, addBudgetItem, updateBudgetItem, deleteBudgetItem, setLoading, setError } = useDataContext();
  return {
    budgetItems: state.budgetItems,
    loading: state.loading.budget,
    error: state.errors.budget,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    setLoading: (loading: boolean) => setLoading('budget', loading),
    setError: (error: string | null) => setError('budget', error),
  };
}

export function useTransactions() {
  const { state, addTransaction, updateTransaction, deleteTransaction, setLoading, setError } = useDataContext();
  return {
    transactions: state.transactions,
    loading: state.loading.transactions,
    error: state.errors.transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setLoading: (loading: boolean) => setLoading('transactions', loading),
    setError: (error: string | null) => setError('transactions', error),
  };
}

export function useAlerts() {
  const { state, addAlert, dismissAlert, setLoading, setError } = useDataContext();
  return {
    alerts: state.alerts,
    loading: state.loading.alerts,
    error: state.errors.alerts,
    addAlert,
    dismissAlert,
    setLoading: (loading: boolean) => setLoading('alerts', loading),
    setError: (error: string | null) => setError('alerts', error),
  };
}
