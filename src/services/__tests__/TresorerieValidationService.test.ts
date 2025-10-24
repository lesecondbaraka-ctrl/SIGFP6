import { describe, it, expect } from 'vitest';
import { TresorerieValidationService } from '../TresorerieValidationService';

describe('TresorerieValidationService', () => {
  describe('validateMontant', () => {
    it('devrait valider un montant positif valide', () => {
      const result = TresorerieValidationService.validateMontant(1000000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un montant négatif', () => {
      const result = TresorerieValidationService.validateMontant(-1000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant doit être supérieur à zéro');
    });

    it('devrait rejeter un montant de zéro', () => {
      const result = TresorerieValidationService.validateMontant(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant doit être supérieur à zéro');
    });

    it('devrait rejeter un montant non fini', () => {
      const result = TresorerieValidationService.validateMontant(Infinity);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant doit être un nombre valide');
    });

    it('devrait rejeter un montant anormalement élevé', () => {
      const result = TresorerieValidationService.validateMontant(2000000000000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant semble anormalement élevé');
    });
  });

  describe('validateDate', () => {
    it('devrait valider une date valide récente', () => {
      const today = new Date();
      const result = TresorerieValidationService.validateDate(today.toISOString());
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une date invalide', () => {
      const result = TresorerieValidationService.validateDate('invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La date est invalide');
    });

    it('devrait rejeter une date future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const result = TresorerieValidationService.validateDate(futureDate.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La date ne peut pas être dans le futur');
    });

    it('devrait rejeter une date trop ancienne', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      const result = TresorerieValidationService.validateDate(oldDate.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La date ne peut pas être antérieure à un an');
    });
  });

  describe('validateReferenceFormat', () => {
    it('devrait valider une référence au bon format', () => {
      const result = TresorerieValidationService.validateReferenceFormat('TR-2025/01');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une référence au mauvais format', () => {
      const result = TresorerieValidationService.validateReferenceFormat('INVALID');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La référence doit suivre le format XX-YYYY/NN');
    });
  });

  describe('validateImputationBudgetaire', () => {
    it('devrait valider une imputation au bon format', () => {
      const result = TresorerieValidationService.validateImputationBudgetaire('01-234-5678');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter une imputation au mauvais format', () => {
      const result = TresorerieValidationService.validateImputationBudgetaire('INVALID');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('L\'imputation budgétaire doit suivre le format NN-NNN-NNNN');
    });
  });

  describe('validateMontantParNature', () => {
    it('devrait valider un investissement au-dessus du minimum', () => {
      const result = TresorerieValidationService.validateMontantParNature(
        2000000,
        'INVESTISSEMENT',
        'DEPENSE'
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un investissement en dessous du minimum', () => {
      const result = TresorerieValidationService.validateMontantParNature(
        500000,
        'INVESTISSEMENT',
        'DEPENSE'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant minimum pour un investissement est de 1 000 000');
    });

    it('devrait rejeter un fonctionnement anormalement élevé', () => {
      const result = TresorerieValidationService.validateMontantParNature(
        150000000,
        'FONCTIONNEMENT',
        'DEPENSE'
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le montant de fonctionnement semble anormalement élevé');
    });
  });

  describe('validateAll', () => {
    it('devrait valider toutes les données valides', () => {
      const result = TresorerieValidationService.validateAll({
        montant: 2000000,
        date: new Date().toISOString(),
        reference: 'TR-2025/01',
        imputation: '01-234-5678',
        nature: 'INVESTISSEMENT',
        type: 'DEPENSE'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait collecter toutes les erreurs', () => {
      const result = TresorerieValidationService.validateAll({
        montant: -1000,
        date: 'invalid',
        reference: 'INVALID',
        imputation: 'INVALID',
        nature: 'INVESTISSEMENT',
        type: 'DEPENSE'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
