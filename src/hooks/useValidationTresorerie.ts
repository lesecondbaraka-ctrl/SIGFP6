import { LigneFluxTresorerie, NatureFlux } from '../types/tresorerie';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const useValidationTresorerie = () => {
  const validateMontant = (montant: number): ValidationResult => {
    const errors: string[] = [];
    
    if (montant <= 0) {
      errors.push('Le montant doit être supérieur à zéro');
    }
    
    if (!Number.isFinite(montant)) {
      errors.push('Le montant doit être un nombre valide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateDate = (date: Date | string): ValidationResult => {
    const errors: string[] = [];
    const dateOperation = typeof date === 'string' ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (isNaN(dateOperation.getTime())) {
      errors.push('La date est invalide');
      return { isValid: false, errors };
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateNatureFlux = (nature: NatureFlux, montant: number): ValidationResult => {
    const errors: string[] = [];

    switch (nature) {
      case 'FONCTIONNEMENT':
        // Règles spécifiques pour le fonctionnement
        break;
      case 'INVESTISSEMENT':
        if (montant < 1000000) { // Exemple: minimum 1M Ar pour investissement
          errors.push('Le montant minimum pour un investissement est de 1 000 000 Ar');
        }
        break;
      case 'FINANCEMENT':
        // Règles spécifiques pour le financement
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateLigneFlux = (ligne: LigneFluxTresorerie): ValidationResult => {
    const errors: string[] = [];

    // Valider le montant
    const montantValidation = validateMontant(ligne.montant_paye);
    errors.push(...montantValidation.errors);

    // Valider la date
    const dateValidation = validateDate(ligne.date_operation);
    errors.push(...dateValidation.errors);

    // Valider la nature du flux
    const natureValidation = validateNatureFlux(ligne.nature_flux, ligne.montant_paye);
    errors.push(...natureValidation.errors);

    // Vérifier que le libellé n'est pas vide
    if (!ligne.libelle || ligne.libelle.trim() === '') {
      errors.push('Le libellé est obligatoire');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    validateMontant,
    validateDate,
    validateNatureFlux,
    validateLigneFlux
  };
};