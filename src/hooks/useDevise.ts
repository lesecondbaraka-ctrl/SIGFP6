import { useState } from 'react';
import { DeviseCode } from '../utils/exportUtils';

export const useDevise = (defaultDevise: DeviseCode = 'USD') => {
  const [devise, setDevise] = useState<DeviseCode>(defaultDevise);
  const [taux, setTaux] = useState<number>(2500); // Taux de change USD/CDF par défaut

  const toggleDevise = () => {
    setDevise(prev => prev === 'USD' ? 'CDF' : 'USD');
  };

  const formatMontantDevise = (montant: number) => {
    if (devise === 'CDF') {
      return montant * taux;
    }
    return montant;
  };

  return {
    devise,
    setDevise,
    taux,
    setTaux,
    toggleDevise,
    formatMontantDevise
  };
};