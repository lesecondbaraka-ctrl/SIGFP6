export type DeviseCode = 'USD' | 'CDF';

interface FormatOptions {
  devise?: DeviseCode;
  decimales?: number;
}

export const formatMontant = (montant: number, options: FormatOptions = {}) => {
  const { devise = 'USD', decimales = 2 } = options;

  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(montant);
};