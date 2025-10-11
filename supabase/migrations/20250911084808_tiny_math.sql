/*
  # Schéma Initial SIGFP-RDC

  1. Nouvelles Tables
    - `users` - Utilisateurs du système avec rôles
    - `budget_items` - Postes budgétaires
    - `depenses` - Gestion des dépenses
    - `recettes` - Gestion des recettes
    - `flux_tresorerie` - Flux de trésorerie
    - `agents` - Agents publics
    - `alerts` - Système d'alertes
    - `transactions` - Transactions pour validation IGF
    - `contribuables` - Répertoire des contribuables
    - `documents` - Documents archivés

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques d'accès par rôle et entité

  3. Fonctions
    - Calculs automatiques
    - Triggers pour mise à jour
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('Utilisateur', 'Administrateur', 'IGF', 'Contrôleur')),
  entity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des postes budgétaires
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  intitule text NOT NULL,
  allocation numeric NOT NULL DEFAULT 0,
  execute numeric NOT NULL DEFAULT 0,
  reste numeric GENERATED ALWAYS AS (allocation - execute) STORED,
  pourcentage numeric GENERATED ALWAYS AS (
    CASE 
      WHEN allocation > 0 THEN (execute / allocation) * 100 
      ELSE 0 
    END
  ) STORED,
  statut text NOT NULL DEFAULT 'En cours' CHECK (statut IN ('En cours', 'Approuvé', 'En attente')),
  entity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des dépenses
CREATE TABLE IF NOT EXISTS depenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  beneficiaire text NOT NULL,
  objet text NOT NULL,
  montant numeric NOT NULL,
  date_engagement date NOT NULL,
  id_entite numeric NOT NULL,
  justificatif boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des recettes
CREATE TABLE IF NOT EXISTS recettes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  contribuable text NOT NULL,
  type_recette text NOT NULL CHECK (type_recette IN ('Fiscale', 'Non Fiscale')),
  categorie text NOT NULL,
  montant numeric NOT NULL,
  date_encaissement date NOT NULL,
  statut text NOT NULL DEFAULT 'Encaissé' CHECK (statut IN ('Encaissé', 'En attente', 'Annulé')),
  entity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des flux de trésorerie
CREATE TABLE IF NOT EXISTS flux_tresorerie (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('Encaissement', 'Décaissement')),
  libelle text NOT NULL,
  montant numeric NOT NULL,
  solde numeric NOT NULL,
  entity text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des agents
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule text UNIQUE NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  poste text NOT NULL,
  grade text NOT NULL,
  salaire numeric NOT NULL DEFAULT 0,
  primes numeric NOT NULL DEFAULT 0,
  retenues numeric NOT NULL DEFAULT 0,
  salaire_net numeric GENERATED ALWAYS AS (salaire + primes - retenues) STORED,
  entity text NOT NULL,
  statut text NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'Suspendu')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('warning', 'success', 'info', 'error')),
  title text NOT NULL,
  message text NOT NULL,
  entity text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table des transactions IGF
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('Engagement', 'Liquidation', 'Paiement')),
  entity text NOT NULL,
  montant numeric NOT NULL,
  beneficiaire text NOT NULL,
  date_transaction timestamptz NOT NULL,
  statut text NOT NULL DEFAULT 'En attente validation' CHECK (statut IN ('En attente validation', 'Validé IGF', 'Rejeté IGF', 'Sous surveillance')),
  risque text NOT NULL DEFAULT 'Faible' CHECK (risque IN ('Faible', 'Moyen', 'Élevé')),
  commentaire_igf text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des contribuables
CREATE TABLE IF NOT EXISTS contribuables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('Personne Physique', 'Personne Morale')),
  numero_fiscal text UNIQUE NOT NULL,
  adresse text NOT NULL,
  telephone text,
  statut text NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des documents archivés
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  type text NOT NULL CHECK (type IN ('Budget', 'Dépense', 'Recette', 'Contrat', 'Rapport', 'Autre')),
  taille text NOT NULL,
  date_creation date NOT NULL,
  date_archivage date NOT NULL DEFAULT CURRENT_DATE,
  entity text NOT NULL,
  statut text NOT NULL DEFAULT 'Archivé' CHECK (statut IN ('Archivé', 'En cours', 'Vérifié')),
  confidentialite text NOT NULL DEFAULT 'Public' CHECK (confidentialite IN ('Public', 'Confidentiel', 'Secret')),
  checksum text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flux_tresorerie ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuables ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

-- Politiques RLS pour les postes budgétaires
CREATE POLICY "Budget items accessible by entity" ON budget_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = budget_items.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les dépenses
CREATE POLICY "Depenses accessible by entity" ON depenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = depenses.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les recettes
CREATE POLICY "Recettes accessible by entity" ON recettes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = recettes.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les flux de trésorerie
CREATE POLICY "Flux tresorerie accessible by entity" ON flux_tresorerie
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = flux_tresorerie.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les agents
CREATE POLICY "Agents accessible by entity" ON agents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = agents.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les alertes
CREATE POLICY "Alerts accessible by entity" ON alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = alerts.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les transactions
CREATE POLICY "Transactions accessible by entity or IGF" ON transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = transactions.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Politiques RLS pour les contribuables
CREATE POLICY "Contribuables accessible by all authenticated users" ON contribuables
  FOR ALL TO authenticated
  USING (true);

-- Politiques RLS pour les documents
CREATE POLICY "Documents accessible by entity" ON documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()::text 
      AND (users.entity = documents.entity OR users.role IN ('Administrateur', 'IGF'))
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depenses_updated_at BEFORE UPDATE ON depenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recettes_updated_at BEFORE UPDATE ON recettes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contribuables_updated_at BEFORE UPDATE ON contribuables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();