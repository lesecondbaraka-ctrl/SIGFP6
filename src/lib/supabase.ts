import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are provided, create real client; otherwise export a safe stub
let supabase: any;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.info('Supabase client initialisé avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation du client Supabase:', error);
    supabase = createStubClient();
  }
} else {
  console.warn('Variables d\'environnement Supabase manquantes. Utilisation d\'un client stub.');
  supabase = createStubClient();
}

function createStubClient() {
  const chainable: any = () => {
    const chain = {
      select: (columns?: string) => chain,
      insert: (data: any) => chain,
      update: (data: any) => chain,
      delete: () => chain,
      eq: (column: string, value: any) => chain,
      neq: (column: string, value: any) => chain,
      gt: (column: string, value: any) => chain,
      gte: (column: string, value: any) => chain,
      lt: (column: string, value: any) => chain,
      lte: (column: string, value: any) => chain,
      like: (column: string, pattern: string) => chain,
      ilike: (column: string, pattern: string) => chain,
      is: (column: string, value: any) => chain,
      in: (column: string, values: any[]) => chain,
      contains: (column: string, value: any) => chain,
      order: (column: string, options?: any) => chain,
      limit: (count: number) => chain,
      range: (from: number, to: number) => chain,
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase stub: no data' } }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
      catch: (reject: any) => reject({ data: null, error: { message: 'Supabase stub' } }),
    };
    return chain;
  };

  return {
    from: (table: string) => chainable(),
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase stub' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase stub' } }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (callback: any) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: null, error: { message: 'Supabase stub' } }),
        download: async () => ({ data: null, error: { message: 'Supabase stub' } }),
        remove: async () => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
      }),
    },
  };
}

export { supabase };

// Types pour la base de données (déclarations d'interfaces)
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Utilisateur' | 'Administrateur' | 'IGF' | 'Contrôleur';
  entity: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  poste: string;
  grade: string;
  salaire: number;
  primes: number;
  retenues: number;
  salaire_net: number;
  entity: string;
  statut: 'Actif' | 'Inactif' | 'Suspendu';
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