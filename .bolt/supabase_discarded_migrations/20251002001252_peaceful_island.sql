/*
  # Configuration complète du système RBAC

  1. Création des types d'entités
  2. Création des entités organisationnelles  
  3. Création des rôles utilisateur
  4. Création des permissions système
  5. Attribution des permissions aux rôles
  6. Création des utilisateurs avec mots de passe
  7. Attribution des rôles aux utilisateurs
  8. Configuration de la sécurité RLS
  9. Données de test
*/

-- 1. Création des types d'entités
INSERT INTO type_entites (nom_type, description) 
SELECT 'Ministère', 'Ministère gouvernemental'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Ministère');

INSERT INTO type_entites (nom_type, description) 
SELECT 'Direction', 'Direction générale'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Direction');

INSERT INTO type_entites (nom_type, description) 
SELECT 'Service', 'Service spécialisé'
WHERE NOT EXISTS (SELECT 1 FROM type_entites WHERE nom_type = 'Service');

-- 2. Création des entités organisationnelles
DO $$
DECLARE
    type_ministere_id uuid;
    type_direction_id uuid;
BEGIN
    -- Récupérer les IDs des types
    SELECT id_type INTO type_ministere_id FROM type_entites WHERE nom_type = 'Ministère';
    SELECT id_type INTO type_direction_id FROM type_entites WHERE nom_type = 'Direction';

    -- Insérer les entités si elles n'existent pas
    INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
    SELECT 'Ministère du Budget', type_ministere_id, 'Avenue de la République, Kinshasa', '+243-12-345-0001', 'contact@minbudget.cd', true
    WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère du Budget');

    INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
    SELECT 'Ministère de la Santé', type_ministere_id, 'Boulevard du 30 Juin, Kinshasa', '+243-12-345-0002', 'contact@minsante.cd', true
    WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère de la Santé');

    INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
    SELECT 'Ministère de l''Éducation', type_ministere_id, 'Avenue Kasavubu, Kinshasa', '+243-12-345-0003', 'contact@minedu.cd', true
    WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère de l''Éducation');

    INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
    SELECT 'Ministère des Infrastructures', type_ministere_id, 'Avenue Tombalbaye, Kinshasa', '+243-12-345-0004', 'contact@mininfra.cd', true
    WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Ministère des Infrastructures');

    INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
    SELECT 'Inspection Générale des Finances', type_direction_id, 'Place de l''Indépendance, Kinshasa', '+243-12-345-0005', 'contact@igf.cd', true
    WHERE NOT EXISTS (SELECT 1 FROM entites WHERE nom_entite = 'Inspection Générale des Finances');
END $$;

-- 3. Création des rôles utilisateur
INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Administrateur', 'Accès complet à tous les modules du système'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Administrateur');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'IGF', 'Inspecteur Général des Finances - Validation et contrôle'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'IGF');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Contrôleur', 'Contrôleur interne - Vérification des procédures'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Contrôleur');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Comptable', 'Comptable - Gestion des écritures et états financiers'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Comptable');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Responsable', 'Responsable d''entité - Gestion locale'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Responsable');

INSERT INTO utilisateurs_roles (nom_role, description)
SELECT 'Auditeur', 'Auditeur - Audit et reporting'
WHERE NOT EXISTS (SELECT 1 FROM utilisateurs_roles WHERE nom_role = 'Auditeur');

-- 4. Création des permissions système
INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_BUDGET', 'Accès au module de gestion budgétaire'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_BUDGET');

INSERT INTO permissions (nom_permission, description)
SELECT 'CREATION_BUDGET', 'Création de nouveaux postes budgétaires'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CREATION_BUDGET');

INSERT INTO permissions (nom_permission, description)
SELECT 'MODIFICATION_BUDGET', 'Modification des allocations budgétaires'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'MODIFICATION_BUDGET');

INSERT INTO permissions (nom_permission, description)
SELECT 'VALIDATION_BUDGET', 'Validation des budgets'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'VALIDATION_BUDGET');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_DEPENSES', 'Accès au module de gestion des dépenses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_DEPENSES');

INSERT INTO permissions (nom_permission, description)
SELECT 'CREATION_DEPENSE', 'Création de nouvelles dépenses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CREATION_DEPENSE');

INSERT INTO permissions (nom_permission, description)
SELECT 'VALIDATION_DEPENSE', 'Validation des dépenses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'VALIDATION_DEPENSE');

INSERT INTO permissions (nom_permission, description)
SELECT 'PAIEMENT_DEPENSE', 'Autorisation de paiement des dépenses'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'PAIEMENT_DEPENSE');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_RECETTES', 'Accès au module de gestion des recettes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_RECETTES');

INSERT INTO permissions (nom_permission, description)
SELECT 'CREATION_RECETTE', 'Création de nouvelles recettes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CREATION_RECETTE');

INSERT INTO permissions (nom_permission, description)
SELECT 'VALIDATION_RECETTE', 'Validation des recettes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'VALIDATION_RECETTE');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_TRESORERIE', 'Accès au module de trésorerie'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_TRESORERIE');

INSERT INTO permissions (nom_permission, description)
SELECT 'CONSULTATION_SOLDES', 'Consultation des soldes de trésorerie'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CONSULTATION_SOLDES');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_FLUX', 'Gestion des flux de trésorerie'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_FLUX');

INSERT INTO permissions (nom_permission, description)
SELECT 'CONTROLE_INTERNE', 'Accès au module de contrôle interne'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'CONTROLE_INTERNE');

INSERT INTO permissions (nom_permission, description)
SELECT 'VALIDATION_TRANSACTIONS', 'Validation des transactions'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'VALIDATION_TRANSACTIONS');

INSERT INTO permissions (nom_permission, description)
SELECT 'REJET_TRANSACTIONS', 'Rejet des transactions non conformes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'REJET_TRANSACTIONS');

INSERT INTO permissions (nom_permission, description)
SELECT 'ACCES_IGF', 'Accès au module IGF'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'ACCES_IGF');

INSERT INTO permissions (nom_permission, description)
SELECT 'VALIDATION_IGF', 'Validation IGF des transactions importantes'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'VALIDATION_IGF');

INSERT INTO permissions (nom_permission, description)
SELECT 'SURVEILLANCE_TEMPS_REEL', 'Surveillance en temps réel'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'SURVEILLANCE_TEMPS_REEL');

INSERT INTO permissions (nom_permission, description)
SELECT 'AUDIT_REPORTING', 'Accès au module d''audit et reporting'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'AUDIT_REPORTING');

INSERT INTO permissions (nom_permission, description)
SELECT 'GENERATION_RAPPORTS', 'Génération de rapports'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GENERATION_RAPPORTS');

INSERT INTO permissions (nom_permission, description)
SELECT 'GESTION_RH', 'Accès au module RH'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'GESTION_RH');

INSERT INTO permissions (nom_permission, description)
SELECT 'ARCHIVAGE', 'Accès au module d''archivage'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'ARCHIVAGE');

INSERT INTO permissions (nom_permission, description)
SELECT 'ETATS_FINANCIERS', 'Accès aux états financiers'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE nom_permission = 'ETATS_FINANCIERS');

-- 5. Attribution des permissions aux rôles
DO $$
DECLARE
    role_admin_id uuid;
    role_igf_id uuid;
    role_controleur_id uuid;
    role_comptable_id uuid;
    role_responsable_id uuid;
    role_auditeur_id uuid;
    perm_id uuid;
BEGIN
    -- Récupérer les IDs des rôles
    SELECT id_role INTO role_admin_id FROM utilisateurs_roles WHERE nom_role = 'Administrateur';
    SELECT id_role INTO role_igf_id FROM utilisateurs_roles WHERE nom_role = 'IGF';
    SELECT id_role INTO role_controleur_id FROM utilisateurs_roles WHERE nom_role = 'Contrôleur';
    SELECT id_role INTO role_comptable_id FROM utilisateurs_roles WHERE nom_role = 'Comptable';
    SELECT id_role INTO role_responsable_id FROM utilisateurs_roles WHERE nom_role = 'Responsable';
    SELECT id_role INTO role_auditeur_id FROM utilisateurs_roles WHERE nom_role = 'Auditeur';

    -- ADMINISTRATEUR : Toutes les permissions
    FOR perm_id IN SELECT id_permission FROM permissions LOOP
        INSERT INTO role_permissions (id_role, id_permission)
        SELECT role_admin_id, perm_id
        WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_admin_id AND id_permission = perm_id);
    END LOOP;

    -- IGF : Permissions de validation et contrôle
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT role_igf_id, id_permission FROM permissions 
    WHERE nom_permission IN ('ACCES_IGF', 'VALIDATION_IGF', 'SURVEILLANCE_TEMPS_REEL', 'VALIDATION_TRANSACTIONS', 'REJET_TRANSACTIONS', 'CONTROLE_INTERNE', 'AUDIT_REPORTING', 'ETATS_FINANCIERS')
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_igf_id AND id_permission = permissions.id_permission);

    -- CONTRÔLEUR : Permissions de contrôle
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT role_controleur_id, id_permission FROM permissions 
    WHERE nom_permission IN ('CONTROLE_INTERNE', 'GESTION_BUDGET', 'GESTION_DEPENSES', 'VALIDATION_DEPENSE', 'VALIDATION_BUDGET')
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_controleur_id AND id_permission = permissions.id_permission);

    -- COMPTABLE : Permissions comptables
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT role_comptable_id, id_permission FROM permissions 
    WHERE nom_permission IN ('GESTION_DEPENSES', 'CREATION_DEPENSE', 'GESTION_RECETTES', 'CREATION_RECETTE', 'ETATS_FINANCIERS', 'GESTION_TRESORERIE', 'CONSULTATION_SOLDES')
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_comptable_id AND id_permission = permissions.id_permission);

    -- RESPONSABLE : Permissions de gestion locale
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT role_responsable_id, id_permission FROM permissions 
    WHERE nom_permission IN ('GESTION_BUDGET', 'CREATION_BUDGET', 'GESTION_DEPENSES', 'CREATION_DEPENSE', 'GESTION_RECETTES', 'CREATION_RECETTE', 'GESTION_RH', 'CONSULTATION_SOLDES')
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_responsable_id AND id_permission = permissions.id_permission);

    -- AUDITEUR : Permissions d'audit
    INSERT INTO role_permissions (id_role, id_permission)
    SELECT role_auditeur_id, id_permission FROM permissions 
    WHERE nom_permission IN ('AUDIT_REPORTING', 'GENERATION_RAPPORTS', 'CONTROLE_INTERNE', 'ETATS_FINANCIERS', 'ARCHIVAGE', 'CONSULTATION_SOLDES')
    AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE id_role = role_auditeur_id AND id_permission = permissions.id_permission);
END $$;

-- 6. Création des utilisateurs avec mots de passe
DO $$
DECLARE
    entite_budget_id uuid;
    entite_sante_id uuid;
    entite_education_id uuid;
    entite_infra_id uuid;
    entite_igf_id uuid;
BEGIN
    -- Récupérer les IDs des entités
    SELECT id_entite INTO entite_budget_id FROM entites WHERE nom_entite = 'Ministère du Budget';
    SELECT id_entite INTO entite_sante_id FROM entites WHERE nom_entite = 'Ministère de la Santé';
    SELECT id_entite INTO entite_education_id FROM entites WHERE nom_entite = 'Ministère de l''Éducation';
    SELECT id_entite INTO entite_infra_id FROM entites WHERE nom_entite = 'Ministère des Infrastructures';
    SELECT id_entite INTO entite_igf_id FROM entites WHERE nom_entite = 'Inspection Générale des Finances';

    -- ADMINISTRATEUR
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'ADMIN', 'Système', 'admin@sigfp.cd', 'Admin2024!', 'Administrateur', entite_budget_id, 'Kinshasa, RDC', '+243-12-000-0001'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'admin@sigfp.cd');

    -- IGF
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'INSPECTEUR', 'Général', 'igf@sigfp.cd', 'IGF2024!', 'IGF', entite_igf_id, 'Kinshasa, RDC', '+243-12-000-0002'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'igf@sigfp.cd');

    -- CONTRÔLEURS
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'MUKENDI', 'Jean-Pierre', 'controleur1@sigfp.cd', 'Ctrl2024!', 'Contrôleur', entite_budget_id, 'Kinshasa, RDC', '+243-12-000-0003'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'controleur1@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'KABILA', 'Marie-Claire', 'controleur2@sigfp.cd', 'Ctrl2024!', 'Contrôleur', entite_sante_id, 'Kinshasa, RDC', '+243-12-000-0004'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'controleur2@sigfp.cd');

    -- COMPTABLES
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'LUMUMBA', 'Patrice', 'comptable1@sigfp.cd', 'Cmpt2024!', 'Comptable', entite_budget_id, 'Kinshasa, RDC', '+243-12-000-0005'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'comptable1@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'MOBUTU', 'Françoise', 'comptable2@sigfp.cd', 'Cmpt2024!', 'Comptable', entite_sante_id, 'Kinshasa, RDC', '+243-12-000-0006'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'comptable2@sigfp.cd');

    -- RESPONSABLES
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'NGOZI', 'Albert', 'resp.budget@sigfp.cd', 'Resp2024!', 'Responsable', entite_budget_id, 'Kinshasa, RDC', '+243-12-000-0007'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.budget@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'MBUYI', 'Christine', 'resp.sante@sigfp.cd', 'Resp2024!', 'Responsable', entite_sante_id, 'Kinshasa, RDC', '+243-12-000-0008'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.sante@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'KASONGO', 'Paul', 'resp.education@sigfp.cd', 'Resp2024!', 'Responsable', entite_education_id, 'Kinshasa, RDC', '+243-12-000-0009'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.education@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'ILUNGA', 'Sophie', 'resp.infrastructure@sigfp.cd', 'Resp2024!', 'Responsable', entite_infra_id, 'Kinshasa, RDC', '+243-12-000-0010'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'resp.infrastructure@sigfp.cd');

    -- AUDITEURS
    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'KATANGA', 'Michel', 'auditeur1@sigfp.cd', 'Audit2024!', 'Auditeur', entite_igf_id, 'Kinshasa, RDC', '+243-12-000-0011'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'auditeur1@sigfp.cd');

    INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, id_entite, adresse, telephone)
    SELECT 'BANDUNDU', 'Jeanne', 'auditeur2@sigfp.cd', 'Audit2024!', 'Auditeur', entite_igf_id, 'Kinshasa, RDC', '+243-12-000-0012'
    WHERE NOT EXISTS (SELECT 1 FROM utilisateurs WHERE email = 'auditeur2@sigfp.cd');
END $$;

-- 7. Données de test - Contribuables
INSERT INTO contribuables (nom, type, numero_fiscal, adresse, telephone, statut)
SELECT 'ENTREPRISE GENERALE DU CONGO SARL', 'Personne Morale', 'A0123456789', 'Avenue Kasa-Vubu, Kinshasa', '+243-81-234-5678', 'Actif'
WHERE NOT EXISTS (SELECT 1 FROM contribuables WHERE numero_fiscal = 'A0123456789');

INSERT INTO contribuables (nom, type, numero_fiscal, adresse, telephone, statut)
SELECT 'MUKENDI Jean-Baptiste', 'Personne Physique', 'N0987654321', 'Commune de Gombe, Kinshasa', '+243-99-876-5432', 'Actif'
WHERE NOT EXISTS (SELECT 1 FROM contribuables WHERE numero_fiscal = 'N0987654321');

INSERT INTO contribuables (nom, type, numero_fiscal, adresse, telephone, statut)
SELECT 'SOCIETE MINIERE DU KATANGA', 'Personne Morale', 'A0555666777', 'Lubumbashi, Katanga', '+243-97-555-6667', 'Actif'
WHERE NOT EXISTS (SELECT 1 FROM contribuables WHERE numero_fiscal = 'A0555666777');

-- 8. Données de test - Postes budgétaires
DO $$
DECLARE
    entite_budget_id uuid;
    entite_sante_id uuid;
    entite_education_id uuid;
BEGIN
    SELECT id_entite INTO entite_budget_id FROM entites WHERE nom_entite = 'Ministère du Budget';
    SELECT id_entite INTO entite_sante_id FROM entites WHERE nom_entite = 'Ministère de la Santé';
    SELECT id_entite INTO entite_education_id FROM entites WHERE nom_entite = 'Ministère de l''Éducation';

    INSERT INTO budgets (id_entite, annee, montant_total, statut, allocation, code, intitule)
    SELECT entite_sante_id, 2024, 500000000, 'Approuvé', 500000000, '611001', 'Médicaments essentiels'
    WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE code = '611001' AND annee = 2024);

    INSERT INTO budgets (id_entite, annee, montant_total, statut, allocation, code, intitule)
    SELECT entite_education_id, 2024, 300000000, 'Approuvé', 300000000, '621001', 'Matériel scolaire'
    WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE code = '621001' AND annee = 2024);

    INSERT INTO budgets (id_entite, annee, montant_total, statut, allocation, code, intitule)
    SELECT entite_budget_id, 2024, 1000000000, 'En cours', 1000000000, '631001', 'Salaires fonctionnaires'
    WHERE NOT EXISTS (SELECT 1 FROM budgets WHERE code = '631001' AND annee = 2024);
END $$;

-- 9. Configuration de la sécurité RLS
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (peuvent voir leur propre profil)
DROP POLICY IF EXISTS "Users can view own profile" ON utilisateurs;
CREATE POLICY "Users can view own profile" ON utilisateurs
    FOR SELECT USING (id_utilisateur = auth.uid()::text::uuid);

-- Politique pour les logs (peuvent voir leurs propres logs)
DROP POLICY IF EXISTS "Users can view own logs" ON logs;
CREATE POLICY "Users can view own logs" ON logs
    FOR SELECT USING (id_utilisateur = auth.uid()::text::uuid);

-- Politique pour les notifications (peuvent voir leurs propres notifications)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (id_utilisateur = auth.uid()::text::uuid);

-- Fonction pour vérifier les permissions
CREATE OR REPLACE FUNCTION has_permission(user_role text, permission_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM utilisateurs_roles ur
        JOIN role_permissions rp ON ur.id_role = rp.id_role
        JOIN permissions p ON rp.id_permission = p.id_permission
        WHERE ur.nom_role = user_role 
        AND p.nom_permission = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;