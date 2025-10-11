
import { supabase } from '../../lib/supabase';
import { RatioFinancier } from '../../types/finance';

export const calculateRatios = async (exerciceId: string) => {
  const { data: actif } = await supabase.from('bilan_actif').select('*').eq('exercice_id', exerciceId);
  const { data: passif } = await supabase.from('bilan_passif').select('*').eq('exercice_id', exerciceId);
  const { data: resultat } = await supabase.from('compte_resultat').select('*').eq('exercice_id', exerciceId);

  if (!actif || !passif || !resultat) return;

  const totalActif = actif.reduce((sum, a) => sum + (a.net || 0), 0);
  const totalCirculant = actif.filter(a => a.categorie === 'circulant').reduce((sum, a) => sum + (a.net || 0), 0);
  const totalTresorerie = actif.filter(a => a.categorie === 'tresorerie').reduce((sum, a) => sum + (a.net || 0), 0);
  const totalPassifCourant = passif.filter(p => p.categorie === 'passifs_circulants').reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalDettes = passif.filter(p => p.categorie === 'dettes_financieres').reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalCapitauxPropres = passif.filter(p => p.categorie === 'capitaux_propres').reduce((sum, p) => sum + (p.montant || 0), 0);
  const resultatNet = resultat.find(r => r.libelle.toLowerCase().includes('résultat'))?.montant || 0;
  const chiffreAffaires = resultat.filter(r => r.type === 'produit').reduce((sum, r) => sum + (r.montant || 0), 0);

  const ratios: Omit<RatioFinancier, 'id' | 'created_at'>[] = [
    {
      exercice_id: exerciceId,
      categorie: 'liquidité',
      libelle: 'Ratio de liquidité générale',
      valeur: totalCirculant / totalPassifCourant,
      commentaire: 'Solvabilité à court terme',
    },
    {
      exercice_id: exerciceId,
      categorie: 'liquidité',
      libelle: 'Ratio de liquidité réduite',
      valeur: (totalCirculant - totalTresorerie) / totalPassifCourant,
      commentaire: 'Exclut les stocks',
    },
    {
      exercice_id: exerciceId,
      categorie: 'rentabilité',
      libelle: 'Rentabilité des actifs (ROA)',
      valeur: (resultatNet / totalActif) * 100,
      commentaire: 'Efficacité globale',
    },
    {
      exercice_id: exerciceId,
      categorie: 'rentabilité',
      libelle: 'Marge nette',
      valeur: (resultatNet / chiffreAffaires) * 100,
      commentaire: 'Performance commerciale',
    },
    {
      exercice_id: exerciceId,
      categorie: 'endettement',
      libelle: 'Ratio d’endettement',
      valeur: (totalDettes / totalActif) * 100,
      commentaire: 'Part des dettes',
    },
    {
      exercice_id: exerciceId,
      categorie: 'endettement',
      libelle: 'Autonomie financière',
      valeur: (totalCapitauxPropres / totalActif) * 100,
      commentaire: 'Capacité à financer sans dettes',
    },
  ];

  await supabase.from('ratios_financiers').delete().eq('exercice_id', exerciceId);
  await supabase.from('ratios_financiers').insert(ratios);
};
