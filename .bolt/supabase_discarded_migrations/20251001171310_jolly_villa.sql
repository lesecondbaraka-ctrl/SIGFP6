/*
  # Création des utilisateurs et système de rôles

  1. Création des rôles et permissions
  2. Création des utilisateurs avec mots de passe
  3. Attribution des rôles aux utilisateurs
  4. Configuration des permissions par rôle
*/

-- 1. Création des rôles
INSERT INTO utilisateurs_roles (nom_role, description) VALUES
('Administrateur', 'Accès complet à toutes les fonctionnalités du système'),
('IGF', 'Inspecteur Général des Finances - Contrôle et validation'),
('Contrôleur', 'Contrôleur financier - Vérification des opérations'),
('Comptable', 'Comptable - Gestion des écritures comptables'),
('Responsable', 'Responsable d''entité - Gestion locale'),
('Auditeur', 'Auditeur - Contrôle et audit des opérations')
ON CONFLICT (nom_role) DO NOTHING;

-- 2. Création des permissions
INSERT INTO permissions (nom_permission, description) VALUES
('GESTION_BUDGET', 'Accès au module de gestion budgétaire'),
('GESTION_DEPENSES', 'Accès au module de gestion des dépenses'),
('GESTION_RECETTES', 'Accès au module de gestion des recettes'),
('GESTION_TRESORERIE', 'Accès au module de gestion de trésorerie'),
('CONTROLE_INTERNE', 'Accès au module de contrôle interne'),
('AUDIT_REPORTING', 'Accès au module d''audit et reporting'),
('GESTION_RH', 'Accès au module de ressources humaines'),
('VALIDATION_IGF', 'Validation des transactions par l''IGF'),
('ARCHIVAGE', 'Accès au module d''archivage électronique'),
('CONFORMITE', 'Accès au filtre de conformité'),
('JOURNAL_COMPTE', 'Accès au journal de compte'),
('ETATS_FINANCIERS', 'Accès aux états financiers'),
('ADMINISTRATION', 'Administration complète du système')
ON CONFLICT (nom_permission) DO NOTHING;

-- 3. Attribution des permissions aux rôles
-- Administrateur : Toutes les permissions
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Administrateur'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- IGF : Permissions de contrôle et validation
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'IGF' 
AND p.nom_permission IN ('VALIDATION_IGF', 'CONTROLE_INTERNE', 'AUDIT_REPORTING', 'ETATS_FINANCIERS', 'CONFORMITE')
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Contrôleur : Permissions de contrôle
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Contrôleur' 
AND p.nom_permission IN ('CONTROLE_INTERNE', 'GESTION_BUDGET', 'GESTION_DEPENSES', 'CONFORMITE')
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Comptable : Permissions comptables
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Comptable' 
AND p.nom_permission IN ('GESTION_DEPENSES', 'GESTION_RECETTES', 'JOURNAL_COMPTE', 'ETATS_FINANCIERS')
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Responsable : Permissions de gestion locale
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Responsable' 
AND p.nom_permission IN ('GESTION_BUDGET', 'GESTION_DEPENSES', 'GESTION_RECETTES', 'GESTION_RH')
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- Auditeur : Permissions d'audit
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Auditeur' 
AND p.nom_permission IN ('AUDIT_REPORTING', 'CONTROLE_INTERNE', 'ETATS_FINANCIERS', 'ARCHIVAGE')
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- 4. Récupération des IDs d'entités (prendre les premières disponibles)
DO $$
DECLARE
    entite_budget_id uuid;
    entite_sante_id uuid;
    entite_educ_id uuid;
    entite_infra_id uuid;
    entite_mines_id uuid;
BEGIN
    -- Récupérer les IDs des entités existantes
    SELECT id_entite INTO entite_budget_id FROM entites WHERE nom_entite ILIKE '%budget%' LIMIT 1;
    SELECT id_entite INTO entite_sante_id FROM entites WHERE nom_entite ILIKE '%sante%' LIMIT 1;
    SELECT id_entite INTO entite_educ_id FROM entites WHERE nom_entite ILIKE '%educ%' LIMIT 1;
    SELECT id_entite INTO entite_infra_id FROM entites WHERE nom_entite ILIKE '%infra%' LIMIT 1;
    SELECT id_entite INTO entite_mines_id FROM entites WHERE nom_entite ILIKE '%mines%' LIMIT 1;
    
    -- Si aucune entité trouvée, prendre la première disponible
    IF entite_budget_id IS NULL THEN
        SELECT id_entite INTO entite_budget_id FROM entites LIMIT 1;
    END IF;
    IF entite_sante_id IS NULL THEN
        SELECT id_entite INTO entite_sante_id FROM entites LIMIT 1 OFFSET 1;
    END IF;
    IF entite_educ_id IS NULL THEN
        SELECT id_entite INTO entite_educ_id FROM entites LIMIT 1 OFFSET 2;
    END IF;
    IF entite_infra_id IS NULL THEN
        SELECT id_entite INTO entite_infra_id FROM entites LIMIT 1 OFFSET 3;
    END IF;
    IF entite_mines_id IS NULL THEN
        SELECT id_entite INTO entite_mines_id FROM entites LIMIT 1 OFFSET 4;
    END IF;

    -- 5. Création des utilisateurs avec mots de passe
    INSERT INTO utilisateurs (id_utilisateur, nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone) VALUES
    -- ADMINISTRATEUR (Accès complet)
    (gen_random_uuid(), 'ADMIN', 'Système', 'admin@sigfp.cd', 'Admin2024!', 'Administrateur', entite_budget_id, 'Kinshasa, RDC', '+243900000001'),
    
    -- IGF (Inspecteur Général des Finances)
    (gen_random_uuid(), 'TSHISEKEDI', 'Joseph', 'igf@sigfp.cd', 'IGF2024!', 'IGF', entite_budget_id, 'Kinshasa, RDC', '+243900000002'),
    
    -- CONTRÔLEURS
    (gen_random_uuid(), 'MUKENDI', 'Jean-Pierre', 'controleur1@sigfp.cd', 'Ctrl2024!', 'Contrôleur', entite_budget_id, 'Kinshasa, RDC', '+243900000003'),
    (gen_random_uuid(), 'KABILA', 'Marie-Claire', 'controleur2@sigfp.cd', 'Ctrl2024!', 'Contrôleur', entite_sante_id, 'Kinshasa, RDC', '+243900000004'),
    
    -- COMPTABLES
    (gen_random_uuid(), 'LUMUMBA', 'Patrice', 'comptable1@sigfp.cd', 'Cmpt2024!', 'Comptable', entite_budget_id, 'Kinshasa, RDC', '+243900000005'),
    (gen_random_uuid(), 'MOBUTU', 'Françoise', 'comptable2@sigfp.cd', 'Cmpt2024!', 'Comptable', entite_sante_id, 'Kinshasa, RDC', '+243900000006'),
    
    -- RESPONSABLES D'ENTITÉ
    (gen_random_uuid(), 'NGOZI', 'Albert', 'resp.budget@sigfp.cd', 'Resp2024!', 'Responsable', entite_budget_id, 'Kinshasa, RDC', '+243900000007'),
    (gen_random_uuid(), 'MBUYI', 'Christine', 'resp.sante@sigfp.cd', 'Resp2024!', 'Responsable', entite_sante_id, 'Kinshasa, RDC', '+243900000008'),
    (gen_random_uuid(), 'KASONGO', 'Paul', 'resp.education@sigfp.cd', 'Resp2024!', 'Responsable', entite_educ_id, 'Kinshasa, RDC', '+243900000009'),
    (gen_random_uuid(), 'ILUNGA', 'Sophie', 'resp.infrastructure@sigfp.cd', 'Resp2024!', 'Responsable', entite_infra_id, 'Kinshasa, RDC', '+243900000010'),
    
    -- AUDITEURS
    (gen_random_uuid(), 'KATANGA', 'Michel', 'auditeur1@sigfp.cd', 'Audit2024!', 'Auditeur', entite_budget_id, 'Kinshasa, RDC', '+243900000011'),
    (gen_random_uuid(), 'BANDUNDU', 'Jeanne', 'auditeur2@sigfp.cd', 'Audit2024!', 'Auditeur', entite_sante_id, 'Kinshasa, RDC', '+243900000012')
    ON CONFLICT (email) DO NOTHING;

END $$;

-- 6. Création de notifications de bienvenue pour tous les utilisateurs
INSERT INTO notifications (id_utilisateur, message, lu)
SELECT id_utilisateur, 
       'Bienvenue dans le Système Intégré de Gestion Financière Publique (SIGFP-RDC). Votre compte a été créé avec succès.', 
       false
FROM utilisateurs
WHERE email LIKE '%@sigfp.cd'
ON CONFLICT DO NOTHING;