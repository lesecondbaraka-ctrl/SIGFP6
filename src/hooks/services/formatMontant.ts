export const formatMontant = (valeur: number, devise: string = 'FC') => {
  return `${valeur.toLocaleString('fr-CD')} ${devise}`;
};
