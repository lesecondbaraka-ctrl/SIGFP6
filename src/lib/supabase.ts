import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are provided, create real client; otherwise export a safe stub
let supabase: any;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Lightweight stub to prevent import-time crashes in dev when env vars are missing.
  const chainable = () => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
    delete: async () => ({ data: [], error: null }),
    eq: () => chainable(),
    order: () => chainable(),
    single: async () => ({ data: null, error: null }),
  });

  supabase = {
    from: (_: string) => chainable(),
    // minimal auth surface used by the app
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };

  // Log to help debugging when running without Supabase env configured
  console.info('Supabase non configuré: utilisation d\'un client stub (dev/local sans variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).');
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