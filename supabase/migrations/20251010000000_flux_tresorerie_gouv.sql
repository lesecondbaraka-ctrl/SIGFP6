-- Création de la table des exercices comptables (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS exercices_comptables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    annee VARCHAR(4) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    CONSTRAINT unique_annee UNIQUE (annee)
);

-- Table des sources de financement
CREATE TABLE sources_financement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Table des imputations budgétaires
CREATE TABLE imputations_budgetaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL,
    nature VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Table des budgets
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercice_id UUID REFERENCES exercices_comptables(id),
    imputation_id UUID REFERENCES imputations_budgetaires(id),
    montant_initial DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_modifie DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_engage DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_ordonnance DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(20,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    CONSTRAINT unique_budget_exercice_imputation UNIQUE (exercice_id, imputation_id)
);

-- Table principale des flux de trésorerie
CREATE TABLE flux_tresorerie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercice_id UUID REFERENCES exercices_comptables(id),
    code_operation VARCHAR(50) NOT NULL UNIQUE,
    type_operation VARCHAR(20) NOT NULL CHECK (type_operation IN ('RECETTE', 'DEPENSE')),
    nature_flux VARCHAR(20) NOT NULL CHECK (nature_flux IN ('FONCTIONNEMENT', 'INVESTISSEMENT', 'FINANCEMENT')),
    imputation_id UUID REFERENCES imputations_budgetaires(id),
    source_financement_id UUID REFERENCES sources_financement(id),
    libelle VARCHAR(255) NOT NULL,
    montant_prevu DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_engage DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_ordonnance DECIMAL(20,2) NOT NULL DEFAULT 0,
    montant_paye DECIMAL(20,2) NOT NULL DEFAULT 0,
    date_operation DATE NOT NULL,
    date_valeur DATE NOT NULL,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('PREVISION', 'ENGAGEMENT', 'ORDONNANCEMENT', 'PAIEMENT')),
    beneficiaire VARCHAR(255),
    reference_piece VARCHAR(100) NOT NULL,
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Table des pièces justificatives
CREATE TABLE pieces_justificatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flux_id UUID REFERENCES flux_tresorerie(id),
    type_piece VARCHAR(50) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    date_piece DATE NOT NULL,
    url_document TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Table des journaux de modifications
CREATE TABLE journal_modifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flux_id UUID REFERENCES flux_tresorerie(id),
    type_modification VARCHAR(50) NOT NULL,
    ancien_statut VARCHAR(20),
    nouveau_statut VARCHAR(20),
    ancien_montant DECIMAL(20,2),
    nouveau_montant DECIMAL(20,2),
    utilisateur VARCHAR(100) NOT NULL,
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::TEXT, NOW())
);

-- Création des vues pour les rapports
CREATE VIEW vue_soldes_tresorerie AS
SELECT 
    f.exercice_id,
    SUM(CASE WHEN f.type_operation = 'RECETTE' THEN f.montant_paye ELSE 0 END) as total_recettes,
    SUM(CASE WHEN f.type_operation = 'DEPENSE' THEN f.montant_paye ELSE 0 END) as total_depenses,
    SUM(CASE WHEN f.type_operation = 'RECETTE' THEN f.montant_paye ELSE -f.montant_paye END) as solde
FROM flux_tresorerie f
GROUP BY f.exercice_id;

-- Triggers pour la mise à jour automatique des montants dans la table budgets
CREATE OR REPLACE FUNCTION maj_budgets() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE budgets
        SET 
            montant_engage = CASE 
                WHEN NEW.statut = 'ENGAGEMENT' THEN NEW.montant_engage 
                ELSE montant_engage 
            END,
            montant_ordonnance = CASE 
                WHEN NEW.statut = 'ORDONNANCEMENT' THEN NEW.montant_ordonnance 
                ELSE montant_ordonnance 
            END,
            montant_paye = CASE 
                WHEN NEW.statut = 'PAIEMENT' THEN NEW.montant_paye 
                ELSE montant_paye 
            END,
            updated_at = TIMEZONE('UTC'::TEXT, NOW())
        WHERE exercice_id = NEW.exercice_id AND imputation_id = NEW.imputation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_maj_budgets
AFTER INSERT OR UPDATE ON flux_tresorerie
FOR EACH ROW
EXECUTE FUNCTION maj_budgets();

-- Index pour améliorer les performances
CREATE INDEX idx_flux_exercice ON flux_tresorerie(exercice_id);
CREATE INDEX idx_flux_date_operation ON flux_tresorerie(date_operation);
CREATE INDEX idx_flux_type_nature ON flux_tresorerie(type_operation, nature_flux);
CREATE INDEX idx_budgets_exercice ON budgets(exercice_id);