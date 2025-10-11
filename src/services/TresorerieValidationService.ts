import { NatureFlux, TypeOperation } from '../types/tresorerie';

export class TresorerieValidationService {
  static validateMontant(montant: number) {
    const errors: string[] = [];
    
    if (montant <= 0) {
      errors.push('Le montant doit être supérieur à zéro');
    }
    
    if (!Number.isFinite(montant)) {
      errors.push('Le montant doit être un nombre valide');
    }
    
    if (montant > 1000000000000) { // 1 trillion
      errors.push('Le montant semble anormalement élevé');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDate(date: string) {
    const errors: string[] = [];
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      errors.push('La date est invalide');
      return {
        isValid: false,
        errors
      };
    }

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    if (dateObj > today) {
      errors.push('La date ne peut pas être dans le futur');
    }
    
    if (dateObj < oneYearAgo) {
      errors.push('La date ne peut pas être antérieure à un an');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateReferenceFormat(reference: string) {
    const errors: string[] = [];
    const format = /^[A-Z0-9]{2,}-[0-9]{4}\/[0-9]{2}$/; // Example: TR-2025/01
    
    if (!format.test(reference)) {
      errors.push('La référence doit suivre le format XX-YYYY/NN');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateImputationBudgetaire(imputation: string) {
    const errors: string[] = [];
    const format = /^[0-9]{2}-[0-9]{3}-[0-9]{4}$/; // Example: 01-234-5678
    
    if (!format.test(imputation)) {
      errors.push('L\'imputation budgétaire doit suivre le format NN-NNN-NNNN');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateMontantParNature(montant: number, nature: NatureFlux, type: TypeOperation) {
    const errors: string[] = [];
    
    switch (nature) {
      case 'INVESTISSEMENT':
        if (montant < 1000000) { // 1 million
          errors.push('Le montant minimum pour un investissement est de 1 000 000');
        }
        break;
      
      case 'FONCTIONNEMENT':
        if (montant > 100000000) { // 100 millions
          errors.push('Le montant de fonctionnement semble anormalement élevé');
        }
        break;
      
      case 'FINANCEMENT':
        if (type === 'RECETTE' && montant < 10000000) { // 10 millions
          errors.push('Le montant minimum pour un financement est de 10 000 000');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAll(data: {
    montant: number;
    date: string;
    reference: string;
    imputation: string;
    nature: NatureFlux;
    type: TypeOperation;
  }) {
    const validations = [
      this.validateMontant(data.montant),
      this.validateDate(data.date),
      this.validateReferenceFormat(data.reference),
      this.validateImputationBudgetaire(data.imputation),
      this.validateMontantParNature(data.montant, data.nature, data.type)
    ];

    const errors = validations.flatMap(v => v.errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}