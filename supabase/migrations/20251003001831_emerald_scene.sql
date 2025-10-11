/*
  # Correction structure authentification

  1. Vérification et correction des tables
    - Vérification de la structure des utilisateurs
    - Correction des relations FK si nécessaire
    - Ajout d'utilisateurs de test avec mots de passe

  2. Sécurité
    - Mise à jour des politiques RLS
    - Configuration des permissions d'accès
*/

-- Vérifier et corriger la structure de la table utilisateurs
DO $$
BEGIN
  -- Vérifier si la colonne mot_de_passe existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' AND column_name = 'mot_de_passe'
  ) THEN
    ALTER TABLE utilisateurs ADD COLUMN mot_de_passe VARCHAR(255) NOT NULL DEFAULT 'temp123';
  END IF;
END $$;

-- Créer les types d'entités s'ils n'existent pas
INSERT INTO type_entites (nom_type, description)
SELECT 'Ministère', 'Ministère gouvernemental'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Ministère');

INSERT INTO type_entites (nom_type, description)
SELECT 'Direction', 'Direction générale'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Direction');

INSERT INTO type_entites (nom_type, description)
SELECT 'Service', 'Service spécialisé'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Service');

-- Créer les entités de base
DO $$
DECLARE
  type_ministere_id UUID;
  type_direction_id UUID;
BEGIN
  -- Récupérer les IDs des types
  SELECT id_type INTO type_ministere_id FROM type_entites WHERE nom_type = 'Ministère' LIMIT 1;
  SELECT id_type INTO type_direction_id FROM type_entites WHERE nom_type = 'Direction' LIMIT 1;

  -- Insérer les entités
  INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
  SELECT 'Ministère du Budget', type_ministere_id, 'Kinshasa, RDC', '+243123456789', 'contact@budget.cd', true
  WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère du Budget');

  INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
  SELECT 'Ministère de la Santé', type_ministere_id, 'Kinshasa, RDC', '+243123456790', 'contact@sante.cd', true
  WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère de la Santé');

  INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
  SELECT 'Ministère de l''Éducation', type_ministere_id, 'Kinshasa, RDC', '+243123456791', 'contact@education.cd', true
  WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère de l''Éducation');

  INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
  SELECT 'Ministère des Infrastructures', type_ministere_id, 'Kinshasa, RDC', '+243123456792', 'contact@infrastructure.cd', true
  WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère des Infrastructures');

  INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
  SELECT 'Inspection Générale des Finances', type_direction_id, 'Kinshasa, RDC', '+243123456793', 'contact@igf.cd', true
  WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Inspection Générale des Finances');
END $$;

-- Créer les rôles utilisateurs
INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Administrateur', 'Accès complet au système'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Administrateur');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'IGF', 'Inspecteur Général des Finances'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'IGF');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Contrôleur', 'Contrôleur de gestion'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Contrôleur');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Comptable', 'Comptable public'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Comptable');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Responsable', 'Responsable d''entité'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Responsable');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Auditeur', 'Auditeur interne'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Auditeur');

-- Créer les permissions
INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_BUDGET', 'Gestion du budget'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_BUDGET');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_DEPENSES', 'Gestion des dépenses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_DEPENSES');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_RECETTES', 'Gestion des recettes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_RECETTES');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_TRESORERIE', 'Gestion de la trésorerie'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_TRESORERIE');

INSERT INTO permissions (nom_permission, description)
SELECT 'CONTROLE_INTERNE', 'Contrôle interne'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CONTROLE_INTERNE');

INSERT INTO permissions (nom_permission, description)
SELECT 'AUDIT_REPORTING', 'Audit et reporting'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'AUDIT_REPORTING');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_RH', 'Gestion des ressources humaines'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_RH');

INSERT INTO permissions (nom_permission, description)
SELECT 'ACCES_IGF', 'Accès module IGF'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'ACCES_IGF');

-- Attribuer les permissions aux rôles
DO $$
DECLARE
  admin_role_id UUID;
  igf_role_id UUID;
  controleur_role_id UUID;
  comptable_role_id UUID;
  responsable_role_id UUID;
  auditeur_role_id UUID;
  perm_id UUID;
BEGIN
  -- Récupérer les IDs des rôles
  SELECT id_role INTO admin_role_id FROM utilisateurs_roles WHERE nom_role = 'Administrateur';
  SELECT id_role INTO igf_role_id FROM utilisateurs_roles WHERE nom_role = 'IGF';
  SELECT id_role INTO controleur_role_id FROM utilisateurs_roles WHERE nom_role = 'Contrôleur';
  SELECT id_role INTO comptable_role_id FROM utilisateurs_roles WHERE nom_role = 'Comptable';
  SELECT id_role INTO responsable_role_id FROM utilisateurs_roles WHERE nom_role = 'Responsable';
  SELECT id_role INTO auditeur_role_id FROM utilisateurs_roles WHERE nom_role = 'Auditeur';

  -- Administrateur : toutes les permissions
  FOR perm_id IN SELECT id_permission FROM permissions LOOP
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT admin_role_id, perm_id
    WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = admin_role_id AND id_permission = perm_id);
  END LOOP;

  -- IGF : permissions spécifiques
  INSERT INTO role_permissions (id_role, id_permission)
  SELECT igf_role_id, id_permission FROM permissions WHERE nom_permission = 'ACCES_IGF'
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = igf_role_id AND id_permission = permissions.id_permission);

  INSERT INTO role_permissions (id_role, id_permission)
  SELECT igf_role_id, id_permission FROM permissions WHERE nom_permission = 'CONTROLE_INTERNE'
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = igf_role_id AND id_permission = permissions.id_permission);

  -- Contrôleur : permissions de contrôle
  INSERT INTO role_permissions (id_role, id_permission)
  SELECT controleur_role_id, id_permission FROM permissions WHERE nom_permission IN ('CONTROLE_INTERNE', 'GESTION_BUDGET', 'GESTION_DEPENSES')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = controleur_role_id AND id_permission = permissions.id_permission);

  -- Comptable : permissions comptables
  INSERT INTO role_permissions (id_role, id_permission)
  SELECT comptable_role_id, id_permission FROM permissions WHERE nom_permission IN ('GESTION_DEPENSES', 'GESTION_RECETTES', 'GESTION_TRESORERIE')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = comptable_role_id AND id_permission = permissions.id_permission);

  -- Responsable : permissions de gestion
  INSERT INTO role_permissions (id_role, id_permission)
  SELECT responsable_role_id, id_permission FROM permissions WHERE nom_permission IN ('GESTION_BUDGET', 'GESTION_DEPENSES', 'GESTION_RECETTES', 'GESTION_RH')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = responsable_role_id AND id_permission = permissions.id_permission);

  -- Auditeur : permissions d'audit
  INSERT INTO role_permissions (id_role, id_permission)
  SELECT auditeur_role_id, id_permission FROM permissions WHERE nom_permission IN ('AUDIT_REPORTING', 'CONTROLE_INTERNE')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = auditeur_role_id AND id_permission = permissions.id_permission);
END $$;

-- Créer les utilisateurs de test
DO $$
DECLARE
  budget_entite_id UUID;
  sante_entite_id UUID;
  education_entite_id UUID;
  infra_entite_id UUID;
  igf_entite_id UUID;
BEGIN
  -- Récupérer les IDs des entités
  SELECT id_entite INTO budget_entite_id FROM entites WHERE nom_entite = 'Ministère du Budget' LIMIT 1;
  SELECT id_entite INTO sante_entite_id FROM entites WHERE nom_entite = 'Ministère de la Santé' LIMIT 1;
  SELECT id_entite INTO education_entite_id FROM entites WHERE nom_entite = 'Ministère de l''Éducation' LIMIT 1;
  SELECT id_entite INTO infra_entite_id FROM entites WHERE nom_entite = 'Ministère des Infrastructures' LIMIT 1;
  SELECT id_entite INTO igf_entite_id FROM entites WHERE nom_entite = 'Inspection Générale des Finances' LIMIT 1;

  -- Administrateur
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'ADMIN', 'Système', 'admin@sigfp.cd', 'Admin2024!', 'Administrateur', budget_entite_id, 'Kinshasa', '+243999000001'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@sigfp.cd');

  -- IGF
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'INSPECTEUR', 'Général', 'igf@sigfp.cd', 'IGF2024!', 'IGF', igf_entite_id, 'Kinshasa', '+243999000002'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'igf@sigfp.cd');

  -- Contrôleur
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'MUKENDI', 'Jean-Pierre', 'controleur1@sigfp.cd', 'Ctrl2024!', 'Contrôleur', budget_entite_id, 'Kinshasa', '+243999000003'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'controleur1@sigfp.cd');

  -- Comptable
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'KABILA', 'Marie-Claire', 'comptable1@sigfp.cd', 'Cmpt2024!', 'Comptable', sante_entite_id, 'Kinshasa', '+243999000004'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'comptable1@sigfp.cd');

  -- Responsable Budget
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'NGOZI', 'Albert', 'resp.budget@sigfp.cd', 'Resp2024!', 'Responsable', budget_entite_id, 'Kinshasa', '+243999000005'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.budget@sigfp.cd');

  -- Responsable Santé
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'MBUYI', 'Christine', 'resp.sante@sigfp.cd', 'Resp2024!', 'Responsable', sante_entite_id, 'Kinshasa', '+243999000006'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.sante@sigfp.cd');

  -- Auditeur
  INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
  SELECT 'KATANGA', 'Michel', 'auditeur1@sigfp.cd', 'Audit2024!', 'Auditeur', igf_entite_id, 'Kinshasa', '+243999000007'
  WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'auditeur1@sigfp.cd');
END $$;

-- Mettre à jour les politiques RLS pour les entités
DROP POLICY IF EXISTS "Users can access their own entity" ON entites;
CREATE POLICY "Users can access their own entity" ON entites
  FOR SELECT USING (
    id_entite = (
      SELECT id_entite FROM utilisateurs 
      WHERE id_utilisateur = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM utilisateurs 
      WHERE id_utilisateur = auth.uid() 
      AND role = 'Administrateur'
    )
  );

DROP POLICY IF EXISTS "Administrators can access all entities" ON entites;
CREATE POLICY "Administrators can access all entities" ON entites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM utilisateurs 
      WHERE id_utilisateur = auth.uid() 
      AND role = 'Administrateur'
    )
  );