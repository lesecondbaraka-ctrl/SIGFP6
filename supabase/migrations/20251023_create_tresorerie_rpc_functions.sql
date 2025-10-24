-- =============================================
-- FONCTIONS RPC POUR MODULE TRÉSORERIE
-- Date: 23 Octobre 2025
-- Objectif: Optimiser les performances des requêtes
-- =============================================

-- =============================================
-- 1. FONCTION: get_soldes_par_compte()
-- Retourne les soldes de tous les comptes avec équivalence CDF
-- =============================================

CREATE OR REPLACE FUNCTION get_soldes_par_compte()
RETURNS TABLE (
  compte_id UUID,
  intitule TEXT,
  banque TEXT,
  numero_compte TEXT,
  solde NUMERIC(15,2),
  devise TEXT,
  solde_equivalence_cdf NUMERIC(15,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_taux_usd NUMERIC(10,4);
  v_taux_eur NUMERIC(10,4);
BEGIN
  -- Récupérer les taux de change les plus récents
  SELECT taux INTO v_taux_usd
  FROM taux_change
  WHERE devise_source = 'USD' AND devise_cible = 'CDF'
  ORDER BY date DESC
  LIMIT 1;
  
  SELECT taux INTO v_taux_eur
  FROM taux_change
  WHERE devise_source = 'EUR' AND devise_cible = 'CDF'
  ORDER BY date DESC
  LIMIT 1;
  
  -- Valeurs par défaut si pas de taux en base
  v_taux_usd := COALESCE(v_taux_usd, 2500);
  v_taux_eur := COALESCE(v_taux_eur, 2800);
  
  -- Retourner les soldes avec équivalence
  RETURN QUERY
  SELECT 
    ct.id AS compte_id,
    ct.intitule,
    ct.banque,
    ct.numero_compte,
    ct.solde_actuel AS solde,
    ct.devise,
    CASE 
      WHEN ct.devise = 'CDF' THEN ct.solde_actuel
      WHEN ct.devise = 'USD' THEN ct.solde_actuel * v_taux_usd
      WHEN ct.devise = 'EUR' THEN ct.solde_actuel * v_taux_eur
      ELSE ct.solde_actuel
    END AS solde_equivalence_cdf
  FROM comptes_tresorerie ct
  WHERE ct.actif = true
  ORDER BY ct.banque, ct.devise;
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_soldes_par_compte() IS 
'Retourne les soldes de tous les comptes de trésorerie actifs avec leur équivalence en CDF';

-- =============================================
-- 2. FONCTION: get_flux_mensuels(p_exercice_id UUID)
-- Agrégation mensuelle des flux de trésorerie
-- =============================================

CREATE OR REPLACE FUNCTION get_flux_mensuels(p_exercice_id UUID)
RETURNS TABLE (
  mois TEXT,
  mois_numero INTEGER,
  encaissements NUMERIC(15,2),
  decaissements NUMERIC(15,2),
  solde NUMERIC(15,2),
  nombre_operations INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH mois_data AS (
    SELECT 
      TO_CHAR(date_operation, 'Month YYYY') AS mois_libelle,
      EXTRACT(MONTH FROM date_operation)::INTEGER AS mois_num,
      EXTRACT(YEAR FROM date_operation)::INTEGER AS annee,
      CASE 
        WHEN type_operation = 'RECETTE' THEN montant_paye 
        ELSE 0 
      END AS recette,
      CASE 
        WHEN type_operation = 'DEPENSE' THEN montant_paye 
        ELSE 0 
      END AS depense
    FROM flux_tresorerie
    WHERE exercice_id = p_exercice_id
      AND statut = 'PAIEMENT'
      AND date_operation IS NOT NULL
  )
  SELECT 
    mois_libelle AS mois,
    mois_num AS mois_numero,
    SUM(recette)::NUMERIC(15,2) AS encaissements,
    SUM(depense)::NUMERIC(15,2) AS decaissements,
    (SUM(recette) - SUM(depense))::NUMERIC(15,2) AS solde,
    COUNT(*)::INTEGER AS nombre_operations
  FROM mois_data
  GROUP BY mois_libelle, mois_num, annee
  ORDER BY annee, mois_num;
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_flux_mensuels(UUID) IS 
'Agrège les flux de trésorerie par mois pour un exercice donné';

-- =============================================
-- 3. FONCTION: get_previsions_vs_realise(p_exercice_id UUID)
-- Compare les prévisions avec les réalisations
-- =============================================

CREATE OR REPLACE FUNCTION get_previsions_vs_realise(p_exercice_id UUID)
RETURNS TABLE (
  mois TEXT,
  mois_numero INTEGER,
  prevu_recettes NUMERIC(15,2),
  realise_recettes NUMERIC(15,2),
  prevu_depenses NUMERIC(15,2),
  realise_depenses NUMERIC(15,2),
  ecart_recettes NUMERIC(15,2),
  ecart_depenses NUMERIC(15,2),
  taux_realisation_recettes NUMERIC(5,2),
  taux_execution_depenses NUMERIC(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH previsions AS (
    SELECT 
      mois,
      SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) AS prevu_rec,
      SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) AS prevu_dep
    FROM previsions_tresorerie
    WHERE exercice_id = p_exercice_id
      AND statut = 'approuve'
    GROUP BY mois
  ),
  realisations AS (
    SELECT 
      EXTRACT(MONTH FROM date_operation)::INTEGER AS mois,
      SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END) AS realise_rec,
      SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END) AS realise_dep
    FROM flux_tresorerie
    WHERE exercice_id = p_exercice_id
      AND statut = 'PAIEMENT'
    GROUP BY EXTRACT(MONTH FROM date_operation)
  ),
  mois_list AS (
    SELECT generate_series(1, 12) AS mois_num
  )
  SELECT 
    CASE ml.mois_num
      WHEN 1 THEN 'Janvier'
      WHEN 2 THEN 'Février'
      WHEN 3 THEN 'Mars'
      WHEN 4 THEN 'Avril'
      WHEN 5 THEN 'Mai'
      WHEN 6 THEN 'Juin'
      WHEN 7 THEN 'Juillet'
      WHEN 8 THEN 'Août'
      WHEN 9 THEN 'Septembre'
      WHEN 10 THEN 'Octobre'
      WHEN 11 THEN 'Novembre'
      WHEN 12 THEN 'Décembre'
    END AS mois,
    ml.mois_num AS mois_numero,
    COALESCE(p.prevu_rec, 0)::NUMERIC(15,2) AS prevu_recettes,
    COALESCE(r.realise_rec, 0)::NUMERIC(15,2) AS realise_recettes,
    COALESCE(p.prevu_dep, 0)::NUMERIC(15,2) AS prevu_depenses,
    COALESCE(r.realise_dep, 0)::NUMERIC(15,2) AS realise_depenses,
    (COALESCE(r.realise_rec, 0) - COALESCE(p.prevu_rec, 0))::NUMERIC(15,2) AS ecart_recettes,
    (COALESCE(r.realise_dep, 0) - COALESCE(p.prevu_dep, 0))::NUMERIC(15,2) AS ecart_depenses,
    CASE 
      WHEN COALESCE(p.prevu_rec, 0) > 0 
      THEN (COALESCE(r.realise_rec, 0) / p.prevu_rec * 100)::NUMERIC(5,2)
      ELSE 0
    END AS taux_realisation_recettes,
    CASE 
      WHEN COALESCE(p.prevu_dep, 0) > 0 
      THEN (COALESCE(r.realise_dep, 0) / p.prevu_dep * 100)::NUMERIC(5,2)
      ELSE 0
    END AS taux_execution_depenses
  FROM mois_list ml
  LEFT JOIN previsions p ON p.mois = ml.mois_num
  LEFT JOIN realisations r ON r.mois = ml.mois_num
  ORDER BY ml.mois_num;
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_previsions_vs_realise(UUID) IS 
'Compare les prévisions budgétaires avec les réalisations mensuelles';

-- =============================================
-- 4. FONCTION: get_statistiques_tresorerie(p_exercice_id UUID)
-- Statistiques globales de trésorerie
-- =============================================

CREATE OR REPLACE FUNCTION get_statistiques_tresorerie(p_exercice_id UUID)
RETURNS TABLE (
  total_recettes NUMERIC(15,2),
  total_depenses NUMERIC(15,2),
  solde_net NUMERIC(15,2),
  ratio_liquidite NUMERIC(5,2),
  nombre_operations INTEGER,
  moyenne_recette NUMERIC(15,2),
  moyenne_depense NUMERIC(15,2),
  plus_grosse_recette NUMERIC(15,2),
  plus_grosse_depense NUMERIC(15,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END)::NUMERIC(15,2) AS total_recettes,
    SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END)::NUMERIC(15,2) AS total_depenses,
    (SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END) - 
     SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END))::NUMERIC(15,2) AS solde_net,
    CASE 
      WHEN SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END) > 0
      THEN (SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END) / 
            SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END))::NUMERIC(5,2)
      ELSE 0
    END AS ratio_liquidite,
    COUNT(*)::INTEGER AS nombre_operations,
    AVG(CASE WHEN type_operation = 'RECETTE' THEN montant_paye END)::NUMERIC(15,2) AS moyenne_recette,
    AVG(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye END)::NUMERIC(15,2) AS moyenne_depense,
    MAX(CASE WHEN type_operation = 'RECETTE' THEN montant_paye END)::NUMERIC(15,2) AS plus_grosse_recette,
    MAX(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye END)::NUMERIC(15,2) AS plus_grosse_depense
  FROM flux_tresorerie
  WHERE exercice_id = p_exercice_id
    AND statut = 'PAIEMENT';
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_statistiques_tresorerie(UUID) IS 
'Retourne les statistiques globales de trésorerie pour un exercice';

-- =============================================
-- 5. FONCTION: get_flux_par_nature(p_exercice_id UUID)
-- Répartition des flux par nature (IPSAS)
-- =============================================

CREATE OR REPLACE FUNCTION get_flux_par_nature(p_exercice_id UUID)
RETURNS TABLE (
  nature_flux TEXT,
  encaissements NUMERIC(15,2),
  decaissements NUMERIC(15,2),
  solde NUMERIC(15,2),
  nombre_operations INTEGER,
  pourcentage_total NUMERIC(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total NUMERIC(15,2);
BEGIN
  -- Calculer le total pour les pourcentages
  SELECT SUM(montant_paye) INTO v_total
  FROM flux_tresorerie
  WHERE exercice_id = p_exercice_id
    AND statut = 'PAIEMENT';
  
  v_total := COALESCE(v_total, 1); -- Éviter division par zéro
  
  RETURN QUERY
  SELECT 
    ft.nature_flux::TEXT,
    SUM(CASE WHEN ft.type_operation = 'RECETTE' THEN ft.montant_paye ELSE 0 END)::NUMERIC(15,2) AS encaissements,
    SUM(CASE WHEN ft.type_operation = 'DEPENSE' THEN ft.montant_paye ELSE 0 END)::NUMERIC(15,2) AS decaissements,
    (SUM(CASE WHEN ft.type_operation = 'RECETTE' THEN ft.montant_paye ELSE 0 END) - 
     SUM(CASE WHEN ft.type_operation = 'DEPENSE' THEN ft.montant_paye ELSE 0 END))::NUMERIC(15,2) AS solde,
    COUNT(*)::INTEGER AS nombre_operations,
    (SUM(ft.montant_paye) / v_total * 100)::NUMERIC(5,2) AS pourcentage_total
  FROM flux_tresorerie ft
  WHERE ft.exercice_id = p_exercice_id
    AND ft.statut = 'PAIEMENT'
  GROUP BY ft.nature_flux
  ORDER BY SUM(ft.montant_paye) DESC;
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_flux_par_nature(UUID) IS 
'Répartition des flux de trésorerie par nature (FONCTIONNEMENT, INVESTISSEMENT, FINANCEMENT) conforme IPSAS';

-- =============================================
-- 6. FONCTION: get_evolution_tresorerie(p_exercice_id UUID, p_periode TEXT)
-- Évolution de la trésorerie sur une période
-- =============================================

CREATE OR REPLACE FUNCTION get_evolution_tresorerie(
  p_exercice_id UUID,
  p_periode TEXT DEFAULT 'MENSUEL' -- 'JOURNALIER', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL'
)
RETURNS TABLE (
  periode TEXT,
  date_debut DATE,
  date_fin DATE,
  solde_debut NUMERIC(15,2),
  encaissements NUMERIC(15,2),
  decaissements NUMERIC(15,2),
  solde_fin NUMERIC(15,2),
  variation NUMERIC(15,2),
  variation_pourcentage NUMERIC(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Cette fonction sera implémentée selon les besoins spécifiques
  -- Pour l'instant, retour mensuel par défaut
  RETURN QUERY
  SELECT 
    TO_CHAR(date_operation, 'Month YYYY') AS periode,
    DATE_TRUNC('month', date_operation)::DATE AS date_debut,
    (DATE_TRUNC('month', date_operation) + INTERVAL '1 month - 1 day')::DATE AS date_fin,
    0::NUMERIC(15,2) AS solde_debut, -- À calculer avec solde cumulé
    SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END)::NUMERIC(15,2) AS encaissements,
    SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END)::NUMERIC(15,2) AS decaissements,
    0::NUMERIC(15,2) AS solde_fin, -- À calculer avec solde cumulé
    (SUM(CASE WHEN type_operation = 'RECETTE' THEN montant_paye ELSE 0 END) - 
     SUM(CASE WHEN type_operation = 'DEPENSE' THEN montant_paye ELSE 0 END))::NUMERIC(15,2) AS variation,
    0::NUMERIC(5,2) AS variation_pourcentage -- À calculer
  FROM flux_tresorerie
  WHERE exercice_id = p_exercice_id
    AND statut = 'PAIEMENT'
  GROUP BY DATE_TRUNC('month', date_operation), TO_CHAR(date_operation, 'Month YYYY')
  ORDER BY DATE_TRUNC('month', date_operation);
END;
$$;

-- Commentaire de la fonction
COMMENT ON FUNCTION get_evolution_tresorerie(UUID, TEXT) IS 
'Retourne l''évolution de la trésorerie sur une période donnée';

-- =============================================
-- PERMISSIONS
-- =============================================

-- Accorder les permissions d'exécution aux rôles appropriés
GRANT EXECUTE ON FUNCTION get_soldes_par_compte() TO authenticated;
GRANT EXECUTE ON FUNCTION get_flux_mensuels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_previsions_vs_realise(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_statistiques_tresorerie(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flux_par_nature(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_evolution_tresorerie(UUID, TEXT) TO authenticated;

-- =============================================
-- INDEX POUR OPTIMISATION
-- =============================================

-- Index sur flux_tresorerie pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_flux_tresorerie_exercice_statut 
  ON flux_tresorerie(exercice_id, statut);

CREATE INDEX IF NOT EXISTS idx_flux_tresorerie_date_operation 
  ON flux_tresorerie(date_operation) 
  WHERE statut = 'PAIEMENT';

CREATE INDEX IF NOT EXISTS idx_flux_tresorerie_type_nature 
  ON flux_tresorerie(type_operation, nature_flux) 
  WHERE statut = 'PAIEMENT';

-- Index sur previsions_tresorerie
CREATE INDEX IF NOT EXISTS idx_previsions_tresorerie_exercice_statut 
  ON previsions_tresorerie(exercice_id, statut);

CREATE INDEX IF NOT EXISTS idx_previsions_tresorerie_mois 
  ON previsions_tresorerie(mois) 
  WHERE statut = 'approuve';

-- Index sur comptes_tresorerie
CREATE INDEX IF NOT EXISTS idx_comptes_tresorerie_actif 
  ON comptes_tresorerie(actif) 
  WHERE actif = true;

-- Index sur taux_change
CREATE INDEX IF NOT EXISTS idx_taux_change_devise_date 
  ON taux_change(devise_source, devise_cible, date DESC);

-- =============================================
-- FIN DU SCRIPT
-- =============================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Fonctions RPC de trésorerie créées avec succès !';
  RAISE NOTICE '6 fonctions disponibles:';
  RAISE NOTICE '  1. get_soldes_par_compte()';
  RAISE NOTICE '  2. get_flux_mensuels(exercice_id)';
  RAISE NOTICE '  3. get_previsions_vs_realise(exercice_id)';
  RAISE NOTICE '  4. get_statistiques_tresorerie(exercice_id)';
  RAISE NOTICE '  5. get_flux_par_nature(exercice_id)';
  RAISE NOTICE '  6. get_evolution_tresorerie(exercice_id, periode)';
END $$;
