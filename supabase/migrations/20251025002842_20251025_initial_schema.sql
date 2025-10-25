/*
  # Migration Initiale - Schéma de Base SIGFP

  1. Nouvelles Tables
    - `entites` - Entités administratives
    - `utilisateurs_roles` - Rôles utilisateurs
    - `permissions` - Permissions du système
    - `role_permissions` - Association rôles-permissions
    - `utilisateurs` - Utilisateurs du système
    - `logs` - Journal des actions utilisateurs
    - `notifications` - Notifications utilisateurs

  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques restrictives par défaut
    - Permissions basées sur les rôles
*/

-- Activer l'extension UUID si pas déjà activée
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: entites
-- =============================================

CREATE TABLE IF NOT EXISTS entites (
  id_entite UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_entite VARCHAR(200) NOT NULL,
  code_entite VARCHAR(50) UNIQUE NOT NULL,
  type_entite VARCHAR(100) NOT NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  email VARCHAR(100),
  responsable VARCHAR(200),
  statut VARCHAR(20) DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE entites IS 'Entités administratives et organisationnelles du système';

-- Index
CREATE INDEX IF NOT EXISTS idx_entites_code ON entites(code_entite);
CREATE INDEX IF NOT EXISTS idx_entites_statut ON entites(statut);

-- =============================================
-- TABLE: utilisateurs_roles
-- =============================================

CREATE TABLE IF NOT EXISTS utilisateurs_roles (
  id_role UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_role VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  niveau_acces INTEGER DEFAULT 1 CHECK (niveau_acces BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE utilisateurs_roles IS 'Rôles du système avec niveaux d''accès hiérarchiques';

-- Index
CREATE INDEX IF NOT EXISTS idx_roles_nom ON utilisateurs_roles(nom_role);

-- =============================================
-- TABLE: permissions
-- =============================================

CREATE TABLE IF NOT EXISTS permissions (
  id_permission UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom_permission VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE permissions IS 'Permissions granulaires du système organisées par module';

-- Index
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_nom ON permissions(nom_permission);

-- =============================================
-- TABLE: role_permissions
-- =============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_role UUID NOT NULL REFERENCES utilisateurs_roles(id_role) ON DELETE CASCADE,
  id_permission UUID NOT NULL REFERENCES permissions(id_permission) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_role, id_permission)
);

COMMENT ON TABLE role_permissions IS 'Association entre rôles et permissions';

-- Index
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(id_role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(id_permission);

-- =============================================
-- TABLE: utilisateurs
-- =============================================

CREATE TABLE IF NOT EXISTS utilisateurs (
  id_utilisateur UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  id_entite UUID REFERENCES entites(id_entite) ON DELETE SET NULL,
  adresse TEXT,
  telephone VARCHAR(20),
  statut VARCHAR(20) DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Inactif', 'Suspendu')),
  derniere_connexion TIMESTAMP WITH TIME ZONE,
  tentatives_connexion INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE utilisateurs IS 'Utilisateurs du système avec informations d''authentification';

-- Index
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_entite ON utilisateurs(id_entite);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut);

-- =============================================
-- TABLE: logs
-- =============================================

CREATE TABLE IF NOT EXISTS logs (
  id_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL,
  action VARCHAR(200) NOT NULL,
  module VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  date_action TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE logs IS 'Journal d''audit des actions utilisateurs';

-- Index pour performance des requêtes de logs
CREATE INDEX IF NOT EXISTS idx_logs_utilisateur ON logs(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_logs_date ON logs(date_action DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_module ON logs(module);

-- =============================================
-- TABLE: notifications
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id_notification UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  titre VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  lu BOOLEAN DEFAULT FALSE,
  date_notification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_lecture TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE notifications IS 'Notifications utilisateurs avec suivi de lecture';

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(date_notification DESC);

-- =============================================
-- DONNÉES INITIALES
-- =============================================

-- Insertion d'une entité par défaut
INSERT INTO entites (nom_entite, code_entite, type_entite, statut)
VALUES ('Administration Centrale', 'ADMIN-CENTRAL', 'Direction Générale', 'Actif')
ON CONFLICT (code_entite) DO NOTHING;

-- Insertion des rôles
INSERT INTO utilisateurs_roles (nom_role, description, niveau_acces) VALUES
  ('Administrateur', 'Accès complet au système', 10),
  ('IGF', 'Inspection Générale des Finances', 8),
  ('Contrôleur', 'Contrôle et validation des opérations', 6),
  ('Utilisateur', 'Accès standard aux fonctionnalités', 3)
ON CONFLICT (nom_role) DO NOTHING;

-- Insertion des permissions de base
INSERT INTO permissions (nom_permission, description, module, action) VALUES
  ('budget.create', 'Créer des lignes budgétaires', 'Budget', 'create'),
  ('budget.read', 'Consulter le budget', 'Budget', 'read'),
  ('budget.update', 'Modifier le budget', 'Budget', 'update'),
  ('budget.delete', 'Supprimer des lignes budgétaires', 'Budget', 'delete'),
  ('recettes.create', 'Créer des recettes', 'Recettes', 'create'),
  ('recettes.read', 'Consulter les recettes', 'Recettes', 'read'),
  ('recettes.validate', 'Valider les recettes', 'Recettes', 'validate'),
  ('depenses.create', 'Créer des dépenses', 'Dépenses', 'create'),
  ('depenses.read', 'Consulter les dépenses', 'Dépenses', 'read'),
  ('depenses.validate', 'Valider les dépenses', 'Dépenses', 'validate'),
  ('tresorerie.read', 'Consulter la trésorerie', 'Trésorerie', 'read'),
  ('tresorerie.manage', 'Gérer la trésorerie', 'Trésorerie', 'manage'),
  ('admin.users', 'Gérer les utilisateurs', 'Administration', 'users'),
  ('admin.roles', 'Gérer les rôles', 'Administration', 'roles'),
  ('admin.settings', 'Gérer les paramètres', 'Administration', 'settings')
ON CONFLICT (nom_permission) DO NOTHING;

-- Insertion d'un utilisateur administrateur par défaut
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, statut)
SELECT
  'Admin',
  'Système',
  'admin@sigfp.cd',
  'admin123',
  'Administrateur',
  id_entite,
  'Actif'
FROM entites
WHERE code_entite = 'ADMIN-CENTRAL'
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE entites ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs authentifiés peuvent lire les entités"
  ON entites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seuls les administrateurs peuvent modifier les entités"
  ON entites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE utilisateurs.id_utilisateur = auth.uid()
      AND utilisateurs.role = 'Administrateur'
    )
  );

CREATE POLICY "Les utilisateurs peuvent lire leur propre profil"
  ON utilisateurs FOR SELECT
  TO authenticated
  USING (
    id_utilisateur = auth.uid()
    OR EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id_utilisateur = auth.uid()
      AND u.role = 'Administrateur'
    )
  );

CREATE POLICY "Seuls les administrateurs peuvent gérer les utilisateurs"
  ON utilisateurs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE utilisateurs.id_utilisateur = auth.uid()
      AND utilisateurs.role = 'Administrateur'
    )
  );

CREATE POLICY "Tous peuvent écrire des logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Seuls les administrateurs et IGF peuvent lire les logs"
  ON logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE utilisateurs.id_utilisateur = auth.uid()
      AND utilisateurs.role IN ('Administrateur', 'IGF')
    )
  );

CREATE POLICY "Les utilisateurs peuvent lire leurs notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (id_utilisateur = auth.uid());

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (id_utilisateur = auth.uid())
  WITH CHECK (id_utilisateur = auth.uid());

CREATE POLICY "Lecture publique des rôles"
  ON utilisateurs_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lecture publique des permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lecture publique des associations rôle-permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);
