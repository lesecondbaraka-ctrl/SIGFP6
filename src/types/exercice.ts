export interface ExerciceComptable {
  id: string;
  annee: number;
  date_debut: string;
  date_fin: string;
  est_cloture: boolean;
  date_cloture?: string;
  commentaire_cloture?: string;
  reports_valides: boolean;
  devise: string;
  statut: 'brouillon' | 'valide' | 'archivé';
  created_at: string;
}