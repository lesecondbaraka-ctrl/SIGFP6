-- =============================================
-- MIGRATION: Tables Budget Avancé
-- Date: 23 Octobre 2025
-- Description: Tables pour gestion budgétaire avancée conforme IPSAS 24
-- =============================================

-- =============================================
-- 1. TABLE: lignes_budgetaires
-- =============================================

CREATE TABLE IF NOT EXISTS lignes_budgetaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,
  libelle TEXT NOT NULL,
  categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('Fonctionnement', 'Personnel', 'Investissement', 'Transfert')),
  budget_initial NUMERIC(15,2) NOT NULL DEFAULT 0,
  budget_revise NUMERIC(15,2) NOT NULL DEFAULT 0,
  engagement NUMERIC(15,2) NOT NULL DEFAULT 0,
  realisation NUMERIC(15,2) NOT NULL DEFAULT 0,
  disponible NUMERIC(15,2) NOT NULL DEFAULT 0,
  ecart_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  ecart_engagement NUMERIC(15,2) NOT NULL DEFAULT 0,
  taux_realisation NUMERIC(5,2) NOT NULL DEFAULT 0,
  taux_engagement NUMERIC(5,2) NOT NULL DEFAULT 0,
  statut VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (statut IN ('Normal', 'Alerte', 'Dépassement')),
  exercice VARCHAR(4) NOT NULL,
  departement VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_lignes_budgetaires_exercice ON lignes_budgetaires(exercice);
CREATE INDEX IF NOT EXISTS idx_lignes_budgetaires_code ON lignes_budgetaires(code);
CREATE INDEX IF NOT EXISTS idx_lignes_budgetaires_categorie ON lignes_budgetaires(categorie);
CREATE INDEX IF NOT EXISTS idx_lignes_budgetaires_statut ON lignes_budgetaires(statut);

-- Commentaires
COMMENT ON TABLE lignes_budgetaires IS 'Lignes budgétaires avec suivi budget initial, révisé, engagements et réalisations - Conforme IPSAS 24';
COMMENT ON COLUMN lignes_budgetaires.budget_initial IS 'Budget voté en début d''exercice';
COMMENT ON COLUMN lignes_budgetaires.budget_revise IS 'Budget après virements et révisions';
COMMENT ON COLUMN lignes_budgetaires.engagement IS 'Montant des engagements (réservations de crédit)';
COMMENT ON COLUMN lignes_budgetaires.realisation IS 'Montant réellement dépensé';
COMMENT ON COLUMN lignes_budgetaires.disponible IS 'Crédit disponible = Budget Révisé - Engagement';

-- =============================================
-- 2. TABLE: virements_budgetaires
-- =============================================

CREATE TABLE IF NOT EXISTS virements_budgetaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  ligne_source_id UUID NOT NULL REFERENCES lignes_budgetaires(id) ON DELETE RESTRICT,
  ligne_destination_id UUID NOT NULL REFERENCES lignes_budgetaires(id) ON DELETE RESTRICT,
  montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
  motif TEXT NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Approuvé', 'Rejeté')),
  demandeur VARCHAR(100) NOT NULL,
  approbateur VARCHAR(100),
  date_approbation TIMESTAMP WITH TIME ZONE,
  commentaire TEXT,
  exercice VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_virements_exercice ON virements_budgetaires(exercice);
CREATE INDEX IF NOT EXISTS idx_virements_statut ON virements_budgetaires(statut);
CREATE INDEX IF NOT EXISTS idx_virements_date ON virements_budgetaires(date DESC);
CREATE INDEX IF NOT EXISTS idx_virements_source ON virements_budgetaires(ligne_source_id);
CREATE INDEX IF NOT EXISTS idx_virements_destination ON virements_budgetaires(ligne_destination_id);

-- Commentaires
COMMENT ON TABLE virements_budgetaires IS 'Virements de crédits entre lignes budgétaires avec workflow d''approbation';
COMMENT ON COLUMN virements_budgetaires.reference IS 'Référence unique du virement (ex: VIR-2025-001)';
COMMENT ON COLUMN virements_budgetaires.ligne_source_id IS 'Ligne budgétaire dont on prélève le crédit';
COMMENT ON COLUMN virements_budgetaires.ligne_destination_id IS 'Ligne budgétaire qui reçoit le crédit';

-- Contrainte: Source et destination différentes
ALTER TABLE virements_budgetaires 
ADD CONSTRAINT chk_virement_lignes_differentes 
CHECK (ligne_source_id != ligne_destination_id);

-- =============================================
-- 3. TABLE: revisions_budgetaires
-- =============================================

CREATE TABLE IF NOT EXISTS revisions_budgetaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Augmentation', 'Diminution', 'Réaffectation')),
  lignes_budgetaires TEXT[] NOT NULL,
  montant_total NUMERIC(15,2) NOT NULL,
  motif TEXT NOT NULL,
  justification TEXT NOT NULL,
  statut VARCHAR(20) NOT NULL DEFAULT 'Brouillon' CHECK (statut IN ('Brouillon', 'Soumis', 'Approuvé', 'Rejeté')),
  documents TEXT[],
  demandeur VARCHAR(100) NOT NULL,
  approbateur VARCHAR(100),
  date_approbation TIMESTAMP WITH TIME ZONE,
  exercice VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_revisions_exercice ON revisions_budgetaires(exercice);
CREATE INDEX IF NOT EXISTS idx_revisions_statut ON revisions_budgetaires(statut);
CREATE INDEX IF NOT EXISTS idx_revisions_date ON revisions_budgetaires(date DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_type ON revisions_budgetaires(type);

-- Commentaires
COMMENT ON TABLE revisions_budgetaires IS 'Révisions budgétaires (augmentation, diminution, réaffectation) avec documentation complète';
COMMENT ON COLUMN revisions_budgetaires.reference IS 'Référence unique de la révision (ex: REV-2025-001)';
COMMENT ON COLUMN revisions_budgetaires.lignes_budgetaires IS 'IDs des lignes budgétaires concernées';
COMMENT ON COLUMN revisions_budgetaires.documents IS 'Chemins des documents justificatifs';

-- =============================================
-- 4. FONCTIONS UTILITAIRES
-- =============================================

-- Fonction: Générer référence virement
CREATE OR REPLACE FUNCTION generate_virement_reference(p_exercice VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_count INTEGER;
  v_reference VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM virements_budgetaires
  WHERE exercice = p_exercice;
  
  v_reference := 'VIR-' || p_exercice || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Générer référence révision
CREATE OR REPLACE FUNCTION generate_revision_reference(p_exercice VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_count INTEGER;
  v_reference VARCHAR;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM revisions_budgetaires
  WHERE exercice = p_exercice;
  
  v_reference := 'REV-' || p_exercice || '-' || LPAD((v_count + 1)::TEXT, 3, '0');
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Calculer KPIs budgétaires
CREATE OR REPLACE FUNCTION get_kpis_budgetaires(p_exercice VARCHAR)
RETURNS TABLE (
  total_budget_initial NUMERIC,
  total_budget_revise NUMERIC,
  total_engagement NUMERIC,
  total_realisation NUMERIC,
  total_disponible NUMERIC,
  taux_engagement NUMERIC,
  taux_realisation NUMERIC,
  taux_disponibilite NUMERIC,
  lignes_alerte INTEGER,
  lignes_depassement INTEGER,
  revision_budgetaire NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(budget_initial),
    SUM(budget_revise),
    SUM(engagement),
    SUM(realisation),
    SUM(disponible),
    CASE WHEN SUM(budget_revise) > 0 
      THEN (SUM(engagement) / SUM(budget_revise)) * 100 
      ELSE 0 
    END,
    CASE WHEN SUM(budget_revise) > 0 
      THEN (SUM(realisation) / SUM(budget_revise)) * 100 
      ELSE 0 
    END,
    CASE WHEN SUM(budget_revise) > 0 
      THEN (SUM(disponible) / SUM(budget_revise)) * 100 
      ELSE 0 
    END,
    COUNT(*) FILTER (WHERE statut = 'Alerte')::INTEGER,
    COUNT(*) FILTER (WHERE statut = 'Dépassement')::INTEGER,
    SUM(budget_revise) - SUM(budget_initial)
  FROM lignes_budgetaires
  WHERE exercice = p_exercice;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Statistiques par catégorie
CREATE OR REPLACE FUNCTION get_stats_by_categorie(p_exercice VARCHAR)
RETURNS TABLE (
  categorie VARCHAR,
  budget NUMERIC,
  engagement NUMERIC,
  realisation NUMERIC,
  disponible NUMERIC,
  taux_realisation NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.categorie,
    SUM(l.budget_revise),
    SUM(l.engagement),
    SUM(l.realisation),
    SUM(l.disponible),
    CASE WHEN SUM(l.budget_revise) > 0 
      THEN (SUM(l.realisation) / SUM(l.budget_revise)) * 100 
      ELSE 0 
    END
  FROM lignes_budgetaires l
  WHERE l.exercice = p_exercice
  GROUP BY l.categorie
  ORDER BY l.categorie;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Trigger: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lignes_budgetaires_updated_at
BEFORE UPDATE ON lignes_budgetaires
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Vérifier crédit disponible avant virement
CREATE OR REPLACE FUNCTION check_credit_disponible()
RETURNS TRIGGER AS $$
DECLARE
  v_disponible NUMERIC;
BEGIN
  IF NEW.statut = 'Approuvé' THEN
    SELECT disponible INTO v_disponible
    FROM lignes_budgetaires
    WHERE id = NEW.ligne_source_id;
    
    IF v_disponible < NEW.montant THEN
      RAISE EXCEPTION 'Crédit disponible insuffisant sur la ligne source (Disponible: %, Demandé: %)', 
        v_disponible, NEW.montant;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_credit_virement
BEFORE INSERT OR UPDATE ON virements_budgetaires
FOR EACH ROW
EXECUTE FUNCTION check_credit_disponible();

-- =============================================
-- 6. DONNÉES DE DÉMONSTRATION (Optionnel)
-- =============================================

-- Insérer des lignes budgétaires de test
INSERT INTO lignes_budgetaires (code, libelle, categorie, budget_initial, budget_revise, engagement, realisation, exercice)
VALUES
  ('611', 'Salaires et traitements', 'Personnel', 5000000, 5200000, 4800000, 4500000, '2025'),
  ('612', 'Charges sociales', 'Personnel', 750000, 780000, 720000, 680000, '2025'),
  ('613', 'Indemnités et primes', 'Personnel', 300000, 320000, 310000, 290000, '2025'),
  ('621', 'Fournitures de bureau', 'Fonctionnement', 150000, 150000, 145000, 140000, '2025'),
  ('622', 'Loyers et charges', 'Fonctionnement', 400000, 400000, 400000, 380000, '2025'),
  ('623', 'Entretien et maintenance', 'Fonctionnement', 250000, 280000, 290000, 285000, '2025'),
  ('631', 'Équipements informatiques', 'Investissement', 800000, 850000, 820000, 800000, '2025'),
  ('632', 'Mobilier et matériel', 'Investissement', 500000, 500000, 480000, 450000, '2025'),
  ('633', 'Véhicules', 'Investissement', 2000000, 2100000, 2050000, 2000000, '2025'),
  ('641', 'Subventions aux organismes', 'Transfert', 1000000, 1000000, 950000, 900000, '2025')
ON CONFLICT DO NOTHING;

-- Mettre à jour les champs calculés
UPDATE lignes_budgetaires
SET
  disponible = budget_revise - engagement,
  ecart_budget = budget_revise - realisation,
  ecart_engagement = engagement - realisation,
  taux_realisation = CASE WHEN budget_revise > 0 THEN (realisation / budget_revise) * 100 ELSE 0 END,
  taux_engagement = CASE WHEN budget_revise > 0 THEN (engagement / budget_revise) * 100 ELSE 0 END,
  statut = CASE
    WHEN (engagement / NULLIF(budget_revise, 0)) > 1.0 OR (realisation / NULLIF(budget_revise, 0)) > 1.0 THEN 'Dépassement'
    WHEN (engagement / NULLIF(budget_revise, 0)) > 0.95 OR (realisation / NULLIF(budget_revise, 0)) > 0.95 THEN 'Alerte'
    ELSE 'Normal'
  END
WHERE exercice = '2025';

-- =============================================
-- 7. PERMISSIONS RLS (Row Level Security)
-- =============================================

-- Activer RLS
ALTER TABLE lignes_budgetaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE virements_budgetaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions_budgetaires ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire
CREATE POLICY "Lecture publique lignes_budgetaires" ON lignes_budgetaires
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique virements" ON virements_budgetaires
  FOR SELECT USING (true);

CREATE POLICY "Lecture publique revisions" ON revisions_budgetaires
  FOR SELECT USING (true);

-- Politique: Seuls les utilisateurs authentifiés peuvent modifier
CREATE POLICY "Modification authentifiée lignes_budgetaires" ON lignes_budgetaires
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Modification authentifiée virements" ON virements_budgetaires
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Modification authentifiée revisions" ON revisions_budgetaires
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================

-- Vérification
SELECT 'Migration budget_advanced_tables complétée avec succès!' AS message;
SELECT COUNT(*) AS lignes_budgetaires_count FROM lignes_budgetaires;
SELECT * FROM get_kpis_budgetaires('2025');
