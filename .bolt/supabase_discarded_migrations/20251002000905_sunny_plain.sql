/*
  # Configuration complète du système RBAC (Role-Based Access Control)

  1. Création des rôles système
  2. Création des permissions par module
  3. Attribution des permissions aux rôles
  4. Création des entités organisationnelles
  5. Création des utilisateurs avec mots de passe
  6. Attribution des rôles aux utilisateurs
  7. Configuration des politiques de sécurité RLS
*/

-- =====================================================
-- 1. CRÉATION DES RÔLES SYSTÈME
-- =====================================================

INSERT INTO utilisateurs_roles (nom_role, description) VALUES
('Administrateur', 'Accès complet à tous les modules du système'),
('IGF', 'Inspecteur Général des Finances - Validation et contrôle'),
('Contrôleur', 'Contrôle interne et vérification des procédures'),
('Comptable', 'Gestion comptable et états financiers'),
('Responsable', 'Responsable d''entité - gestion locale'),
('Auditeur', 'Audit et reporting financier')
ON CONFLICT (nom_role) DO NOTHING;

-- =====================================================
-- 2. CRÉATION DES PERMISSIONS PAR MODULE
-- =====================================================

INSERT INTO permissions (nom_permission, description) VALUES
-- Permissions Budget
('GESTION_BUDGET', 'Accès au module de gestion budgétaire'),
('CREATION_BUDGET', 'Création de nouveaux postes budgétaires'),
('MODIFICATION_BUDGET', 'Modification des allocations budgétaires'),
('VALIDATION_BUDGET', 'Validation des budgets'),

-- Permissions Dépenses
('GESTION_DEPENSES', 'Accès au module de gestion des dépenses'),
('CREATION_DEPENSE', 'Création de nouvelles dépenses'),
('VALIDATION_DEPENSE', 'Validation des dépenses'),
('PAIEMENT_DEPENSE', 'Autorisation de paiement'),

-- Permissions Recettes
('GESTION_RECETTES', 'Accès au module de gestion des recettes'),
('CREATION_RECETTE', 'Enregistrement de nouvelles recettes'),
('VALIDATION_RECETTE', 'Validation des recettes'),

-- Permissions Trésorerie
('GESTION_TRESORERIE', 'Accès au module de trésorerie'),
('CONSULTATION_SOLDES', 'Consultation des soldes de trésorerie'),
('GESTION_FLUX', 'Gestion des flux de trésorerie'),

-- Permissions Contrôle
('CONTROLE_INTERNE', 'Accès au module de contrôle interne'),
('VALIDATION_TRANSACTIONS', 'Validation des transactions'),
('REJET_TRANSACTIONS', 'Rejet des transactions non conformes'),

-- Permissions IGF
('ACCES_IGF', 'Accès privilégié IGF'),
('VALIDATION_IGF', 'Validation niveau IGF'),
('SURVEILLANCE_TEMPS_REEL', 'Surveillance en temps réel'),

-- Permissions Audit
('AUDIT_REPORTING', 'Accès au module audit et reporting'),
('GENERATION_RAPPORTS', 'Génération de rapports'),
('CONSULTATION_HISTORIQUE', 'Consultation de l''historique'),

-- Permissions RH
('GESTION_RH', 'Accès au module ressources humaines'),
('GESTION_PAIE', 'Gestion de la paie'),
('CONSULTATION_AGENTS', 'Consultation des agents'),

-- Permissions Archivage
('GESTION_ARCHIVAGE', 'Accès au module d''archivage'),
('ARCHIVAGE_DOCUMENTS', 'Archivage de documents'),
('CONSULTATION_ARCHIVES', 'Consultation des archives'),

-- Permissions Validation
('VALIDATION_DEMATERIALISEE', 'Validation dématérialisée'),
('SIGNATURE_ELECTRONIQUE', 'Signature électronique'),

-- Permissions Conformité
('FILTRE_CONFORMITE', 'Accès au filtre de conformité'),
('CONFIGURATION_REGLES', 'Configuration des règles'),

-- Permissions Journal
('JOURNAL_COMPTE', 'Accès au journal de compte'),
('ECRITURE_COMPTABLE', 'Saisie d''écritures comptables'),

-- Permissions États Financiers
('ETATS_FINANCIERS', 'Accès aux états financiers'),
('GENERATION_BILANS', 'Génération de bilans'),
('ANALYSE_FINANCIERE', 'Analyse financière')
ON CONFLICT (nom_permission) DO NOTHING;

-- =====================================================
-- 3. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- =====================================================

-- ADMINISTRATEUR : Toutes les permissions
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Administrateur'
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- IGF : Permissions de validation et contrôle
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'IGF' 
AND p.nom_permission IN (
    'ACCES_IGF', 'VALIDATION_IGF', 'SURVEILLANCE_TEMPS_REEL',
    'CONTROLE_INTERNE', 'VALIDATION_TRANSACTIONS', 'REJET_TRANSACTIONS',
    'AUDIT_REPORTING', 'GENERATION_RAPPORTS', 'CONSULTATION_HISTORIQUE',
    'ETATS_FINANCIERS', 'ANALYSE_FINANCIERE',
    'VALIDATION_DEMATERIALISEE', 'SIGNATURE_ELECTRONIQUE',
    'FILTRE_CONFORMITE'
)
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- CONTRÔLEUR : Permissions de contrôle et budget
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Contrôleur'
AND p.nom_permission IN (
    'CONTROLE_INTERNE', 'VALIDATION_TRANSACTIONS',
    'GESTION_BUDGET', 'CONSULTATION_SOLDES',
    'GESTION_DEPENSES', 'VALIDATION_DEPENSE',
    'CONSULTATION_ARCHIVES', 'FILTRE_CONFORMITE'
)
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- COMPTABLE : Permissions comptables et financières
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Comptable'
AND p.nom_permission IN (
    'GESTION_DEPENSES', 'CREATION_DEPENSE', 'VALIDATION_DEPENSE',
    'GESTION_RECETTES', 'CREATION_RECETTE', 'VALIDATION_RECETTE',
    'JOURNAL_COMPTE', 'ECRITURE_COMPTABLE',
    'ETATS_FINANCIERS', 'GENERATION_BILANS',
    'GESTION_TRESORERIE', 'CONSULTATION_SOLDES',
    'CONSULTATION_ARCHIVES'
)
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- RESPONSABLE : Permissions de gestion d'entité
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Responsable'
AND p.nom_permission IN (
    'GESTION_BUDGET', 'CREATION_BUDGET', 'MODIFICATION_BUDGET',
    'GESTION_DEPENSES', 'CREATION_DEPENSE',
    'GESTION_RECETTES', 'CREATION_RECETTE',
    'GESTION_RH', 'GESTION_PAIE', 'CONSULTATION_AGENTS',
    'CONSULTATION_SOLDES', 'CONSULTATION_ARCHIVES'
)
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- AUDITEUR : Permissions d'audit et contrôle
INSERT INTO role_permissions (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM utilisateurs_roles r, permissions p
WHERE r.nom_role = 'Auditeur'
AND p.nom_permission IN (
    'AUDIT_REPORTING', 'GENERATION_RAPPORTS', 'CONSULTATION_HISTORIQUE',
    'CONTROLE_INTERNE', 'ETATS_FINANCIERS', 'ANALYSE_FINANCIERE',
    'GESTION_ARCHIVAGE', 'CONSULTATION_ARCHIVES',
    'JOURNAL_COMPTE', 'FILTRE_CONFORMITE'
)
ON CONFLICT (id_role, id_permission) DO NOTHING;

-- =====================================================
-- 4. CRÉATION DES ENTITÉS ORGANISATIONNELLES
-- =====================================================

-- Créer d'abord les types d'entités
INSERT INTO type_entites (nom_type, description) VALUES
('Ministère', 'Ministère du gouvernement'),
('Direction', 'Direction générale'),
('Service', 'Service spécialisé'),
('Inspection', 'Service d''inspection')
ON CONFLICT (nom_type) DO NOTHING;

-- Créer les entités
INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
SELECT 
    'Ministère du Budget', 
    te.id_type, 
    'Avenue de la Nation, Kinshasa', 
    '+243 81 234 5678', 
    'contact@budget.gouv.cd', 
    true
FROM type_entites te WHERE te.nom_type = 'Ministère'
ON CONFLICT (nom_entite) DO NOTHING;

INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
SELECT 
    'Ministère de la Santé', 
    te.id_type, 
    'Boulevard du 30 Juin, Kinshasa', 
    '+243 81 345 6789', 
    'contact@sante.gouv.cd', 
    true
FROM type_entites te WHERE te.nom_type = 'Ministère'
ON CONFLICT (nom_entite) DO NOTHING;

INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
SELECT 
    'Ministère de l''Éducation', 
    te.id_type, 
    'Avenue des Écoles, Kinshasa', 
    '+243 81 456 7890', 
    'contact@education.gouv.cd', 
    true
FROM type_entites te WHERE te.nom_type = 'Ministère'
ON CONFLICT (nom_entite) DO NOTHING;

INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
SELECT 
    'Ministère des Infrastructures', 
    te.id_type, 
    'Avenue des Travaux, Kinshasa', 
    '+243 81 567 8901', 
    'contact@infrastructure.gouv.cd', 
    true
FROM type_entites te WHERE te.nom_type = 'Ministère'
ON CONFLICT (nom_entite) DO NOTHING;

INSERT INTO entites (nom_entite, type_entite, adresse, telephone, email, statut)
SELECT 
    'Inspection Générale des Finances', 
    te.id_type, 
    'Place de l''Indépendance, Kinshasa', 
    '+243 81 678 9012', 
    'contact@igf.gouv.cd', 
    true
FROM type_entites te WHERE te.nom_type = 'Inspection'
ON CONFLICT (nom_entite) DO NOTHING;

-- =====================================================
-- 5. CRÉATION DES UTILISATEURS AVEC MOTS DE PASSE
-- =====================================================

-- ADMINISTRATEUR SYSTÈME
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'ADMIN', 'Système', 'admin@sigfp.cd', 'Admin2024!', 'Administrateur',
    e.id_entite, 'Siège Central SIGFP', '+243 81 000 0001'
FROM entites e WHERE e.nom_entite = 'Ministère du Budget'
ON CONFLICT (email) DO NOTHING;

-- IGF (INSPECTEUR GÉNÉRAL DES FINANCES)
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'TSHISEKEDI', 'Félix', 'igf@sigfp.cd', 'IGF2024!', 'IGF',
    e.id_entite, 'Place de l''Indépendance', '+243 81 000 0002'
FROM entites e WHERE e.nom_entite = 'Inspection Générale des Finances'
ON CONFLICT (email) DO NOTHING;

-- CONTRÔLEURS
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'MUKENDI', 'Jean-Pierre', 'controleur1@sigfp.cd', 'Ctrl2024!', 'Contrôleur',
    e.id_entite, 'Avenue du Contrôle', '+243 81 111 1001'
FROM entites e WHERE e.nom_entite = 'Inspection Générale des Finances'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'KABILA', 'Marie-Claire', 'controleur2@sigfp.cd', 'Ctrl2024!', 'Contrôleur',
    e.id_entite, 'Avenue du Contrôle', '+243 81 111 1002'
FROM entites e WHERE e.nom_entite = 'Inspection Générale des Finances'
ON CONFLICT (email) DO NOTHING;

-- COMPTABLES
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'LUMUMBA', 'Patrice', 'comptable1@sigfp.cd', 'Cmpt2024!', 'Comptable',
    e.id_entite, 'Avenue de la Comptabilité', '+243 81 222 2001'
FROM entites e WHERE e.nom_entite = 'Ministère du Budget'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'MOBUTU', 'Françoise', 'comptable2@sigfp.cd', 'Cmpt2024!', 'Comptable',
    e.id_entite, 'Avenue de la Comptabilité', '+243 81 222 2002'
FROM entites e WHERE e.nom_entite = 'Ministère du Budget'
ON CONFLICT (email) DO NOTHING;

-- RESPONSABLES D'ENTITÉ
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'NGOZI', 'Albert', 'resp.budget@sigfp.cd', 'Resp2024!', 'Responsable',
    e.id_entite, 'Avenue de la Nation', '+243 81 333 3001'
FROM entites e WHERE e.nom_entite = 'Ministère du Budget'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'MBUYI', 'Christine', 'resp.sante@sigfp.cd', 'Resp2024!', 'Responsable',
    e.id_entite, 'Boulevard du 30 Juin', '+243 81 333 3002'
FROM entites e WHERE e.nom_entite = 'Ministère de la Santé'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'KASONGO', 'Paul', 'resp.education@sigfp.cd', 'Resp2024!', 'Responsable',
    e.id_entite, 'Avenue des Écoles', '+243 81 333 3003'
FROM entites e WHERE e.nom_entite = 'Ministère de l''Éducation'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'ILUNGA', 'Sophie', 'resp.infrastructure@sigfp.cd', 'Resp2024!', 'Responsable',
    e.id_entite, 'Avenue des Travaux', '+243 81 333 3004'
FROM entites e WHERE e.nom_entite = 'Ministère des Infrastructures'
ON CONFLICT (email) DO NOTHING;

-- AUDITEURS
INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'KATANGA', 'Michel', 'auditeur1@sigfp.cd', 'Audit2024!', 'Auditeur',
    e.id_entite, 'Place de l''Indépendance', '+243 81 444 4001'
FROM entites e WHERE e.nom_entite = 'Inspection Générale des Finances'
ON CONFLICT (email) DO NOTHING;

INSERT INTO utilisateurs (
    nom, prenom, email, mot_de_passe, role, 
    id_entite, adresse, telephone
)
SELECT 
    'BANDUNDU', 'Jeanne', 'auditeur2@sigfp.cd', 'Audit2024!', 'Auditeur',
    e.id_entite, 'Place de l''Indépendance', '+243 81 444 4002'
FROM entites e WHERE e.nom_entite = 'Inspection Générale des Finances'
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 6. CONFIGURATION DES POLITIQUES RLS
-- =====================================================

-- Activer RLS sur les tables sensibles si pas déjà fait
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs : seuls les admins peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users" ON utilisateurs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM utilisateurs u 
            WHERE u.id_utilisateur = auth.uid() 
            AND u.role = 'Administrateur'
        )
    );

-- Politique pour les utilisateurs : chacun peut voir son propre profil
CREATE POLICY "Users can view own profile" ON utilisateurs
    FOR SELECT USING (id_utilisateur = auth.uid());

-- Politique pour les logs : les utilisateurs peuvent voir leurs propres logs
CREATE POLICY "Users can view own logs" ON logs
    FOR SELECT USING (id_utilisateur = auth.uid());

-- Politique pour les notifications : les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (id_utilisateur = auth.uid());

-- =====================================================
-- 7. CRÉATION D'UNE FONCTION POUR VÉRIFIER LES PERMISSIONS
-- =====================================================

CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM utilisateurs u
        JOIN utilisateurs_roles ur ON u.role = ur.nom_role
        JOIN role_permissions rp ON ur.id_role = rp.id_role
        JOIN permissions p ON rp.id_permission = p.id_permission
        WHERE u.id_utilisateur = user_id 
        AND p.nom_permission = permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. INSERTION DE DONNÉES DE TEST POUR LES MODULES
-- =====================================================

-- Quelques postes budgétaires de test
INSERT INTO budgets (code, intitule, allocation, montant_total, annee, statut, id_entite)
SELECT 
    'BUD-2024-001', 'Médicaments et Équipements Médicaux', 500000000, 350000000, 2024, 'En cours',
    e.id_entite
FROM entites e WHERE e.nom_entite = 'Ministère de la Santé'
ON CONFLICT DO NOTHING;

INSERT INTO budgets (code, intitule, allocation, montant_total, annee, statut, id_entite)
SELECT 
    'BUD-2024-002', 'Construction et Réhabilitation d''Écoles', 800000000, 600000000, 2024, 'Approuvé',
    e.id_entite
FROM entites e WHERE e.nom_entite = 'Ministère de l''Éducation'
ON CONFLICT DO NOTHING;

-- Quelques contribuables de test
INSERT INTO contribuables (nom, type, numero_fiscal, adresse, telephone, statut)
VALUES 
('SONAS SARL', 'Personne Morale', 'NF-001-2024', 'Avenue du Commerce, Kinshasa', '+243 81 555 0001', 'Actif'),
('CONSTRUCTA SPRL', 'Personne Morale', 'NF-002-2024', 'Boulevard des Bâtisseurs, Kinshasa', '+243 81 555 0002', 'Actif'),
('MUKENDI Jean-Pierre', 'Personne Physique', 'NF-003-2024', 'Commune de Gombe, Kinshasa', '+243 81 555 0003', 'Actif')
ON CONFLICT DO NOTHING;