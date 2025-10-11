import { BilanActif, BilanPassif, CompteResultat, FluxTresorerie } from '../../types/finance';

export const prepareExcelData = (
  actif: BilanActif[],
  passif: BilanPassif[],
  resultat: CompteResultat[],
  flux: FluxTresorerie[]
) => {
  return {
    'Bilan Actif': actif.map(a => ({
      Réf: a.ref,
      Catégorie: a.categorie,
      Libellé: a.libelle,
      Brut: a.brut,
      Amortissement: a.amortissement,
      Net: a.net,
    })),
    'Bilan Passif': passif.map(p => ({
      Réf: p.ref,
      Catégorie: p.categorie,
      Libellé: p.libelle,
      Montant: p.montant,
    })),
    'Compte de Résultat': resultat.map(r => ({
      Réf: r.ref,
      Type: r.type,
      Libellé: r.libelle,
      Montant: r.montant,
    })),
    'Flux de Trésorerie': flux.map(f => ({
      Réf: f.ref,
      Catégorie: f.categorie,
      Libellé: f.libelle,
      Sens: f.sens,
      Montant: f.montant,
    })),
  };
};
