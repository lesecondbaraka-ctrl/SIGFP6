import React, { useState } from 'react';
import { useValidationTresorerie } from '../../hooks/useValidationTresorerie';
import { TypeOperation, NatureFlux, StatutOperation } from '../../types/tresorerie';
import { TresorerieService } from '../../services/TresorerieService';
import { useImputations } from '../../hooks/useImputations';
import { useSourcesFinancement } from '../../hooks/useSourcesFinancement';

interface FormData {
  code_operation: string;
  type_operation: TypeOperation;
  nature_flux: NatureFlux;
  libelle: string;
  montant_prevu: number;
  montant_engage: number;
  montant_ordonnance: number;
  montant_paye: number;
  devise: 'USD' | 'CDF';
  taux_change: number;
  montant_non_engage?: number;
  montant_restant?: number;
  taux_execution?: number;
  date_operation: string;
  date_valeur: string;
  date_engagement?: string;
  date_ordonnancement?: string;
  date_paiement?: string;
  imputation_id: string;
  source_financement_id: string;
  beneficiaire: string;
  reference_piece: string;
  numero_engagement?: string;
  numero_ordonnancement?: string;
  numero_paiement?: string;
  mode_paiement?: 'CASH' | 'CHEQUE' | 'VIREMENT';
  compte_bancaire?: string;
  numero_cheque?: string;
  commentaire: string;
  statut: 'PREVISION' | 'ENGAGEMENT' | 'ORDONNANCEMENT' | 'PAIEMENT';
  exercice_id: string;
  pieces_justificatives?: string[];
}

const initialFormData: FormData = {
  code_operation: '',
  type_operation: 'RECETTE',
  nature_flux: 'FONCTIONNEMENT',
  libelle: '',
  montant_prevu: 0,
  montant_engage: 0,
  montant_ordonnance: 0,
  montant_paye: 0,
  devise: 'USD',
  taux_change: 1,
  montant_non_engage: 0,
  montant_restant: 0,
  taux_execution: 0,
  date_operation: new Date().toISOString().split('T')[0],
  date_valeur: new Date().toISOString().split('T')[0],
  date_engagement: '',
  date_ordonnancement: '',
  date_paiement: '',
  imputation_id: '',
  source_financement_id: '',
  beneficiaire: '',
  reference_piece: '',
  numero_engagement: '',
  numero_ordonnancement: '',
  numero_paiement: '',
  mode_paiement: 'VIREMENT',
  compte_bancaire: '',
  numero_cheque: '',
  commentaire: '',
  statut: 'PREVISION',
  exercice_id: '',
  pieces_justificatives: []
};

interface SaisieFluxTresorerieProps {
  exerciceId: string;
}

export default function SaisieFluxTresorerie({ exerciceId }: SaisieFluxTresorerieProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeStep, setActiveStep] = useState<StatutOperation>('PREVISION');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Chargement des données des tables liées
  const { imputations, loading: loadingImputations } = useImputations();
  const { sourcesFinancement, loading: loadingSourcesFinancement } = useSourcesFinancement();

  const calculateDerivedValues = (data: FormData) => {
    const montant_non_engage = data.montant_prevu - data.montant_engage;
    const montant_restant = data.montant_engage - data.montant_paye;
    const taux_execution = data.montant_prevu > 0 
      ? (data.montant_paye / data.montant_prevu) * 100 
      : 0;

    return {
      ...data,
      montant_non_engage,
      montant_restant,
      taux_execution: Math.round(taux_execution * 100) / 100
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newValue = name.includes('montant') ? parseFloat(value) || 0 : value;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: newValue
      };
      return calculateDerivedValues(newData);
    });
  };

  const validation = useValidationTresorerie();

  const validateForm = () => {
    const errors: string[] = [];

    // Validation de base
    if (!formData.code_operation) errors.push('Le code opération est requis');
    if (!formData.libelle) errors.push('Le libellé est requis');
    if (!formData.imputation_id) errors.push('L\'imputation budgétaire est requise');
    if (!formData.reference_piece) errors.push('La référence de la pièce est requise');

    // Validation du montant
    const montantValidation = validation.validateMontant(formData.montant_prevu);
    if (!montantValidation.isValid) {
      errors.push(...montantValidation.errors);
    }

    // Validation de la date
    const dateValidation = validation.validateDate(formData.date_operation);
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors);
    }

    // Validation de la nature du flux
    const natureValidation = validation.validateNatureFlux(formData.nature_flux, formData.montant_prevu);
    if (!natureValidation.isValid) {
      errors.push(...natureValidation.errors);
    }

    return errors;
  };

  const mapTypeOperationToBasicType = (type: TypeOperation): 'RECETTE' | 'DEPENSE' => {
    switch (type) {
      case 'RECETTE':
        return 'RECETTE';
      case 'AVANCE':
        return 'DEPENSE'; // Une avance est considérée comme une sortie temporaire
      case 'REGULARISATION':
        return 'RECETTE'; // Par défaut, on considère une régularisation comme une entrée
      case 'REMBOURSEMENT':
        return 'RECETTE'; // Un remboursement est une entrée
      case 'VIREMENT':
        return 'DEPENSE'; // Un virement est considéré comme une sortie
      case 'DEPENSE':
      default:
        return 'DEPENSE';
    }
  };

  const mapNatureFluxToBasicType = (nature: NatureFlux): 'FONCTIONNEMENT' | 'INVESTISSEMENT' | 'FINANCEMENT' => {
    switch (nature) {
      case 'DETTE':
      case 'FISCALITE':
        return 'FONCTIONNEMENT';
      case 'SUBVENTION':
      case 'TRANSFERT':
        return 'FINANCEMENT';
      default:
        return nature; // FONCTIONNEMENT, INVESTISSEMENT, FINANCEMENT sont déjà valides
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparation des montants selon le statut
      let montant_engage = 0;
      let montant_ordonnance = 0;
      let montant_paye = 0;

      switch (activeStep) {
        case 'ENGAGEMENT':
          montant_engage = formData.montant_prevu;
          break;
        case 'ORDONNANCEMENT':
          montant_engage = formData.montant_prevu;
          montant_ordonnance = formData.montant_prevu;
          break;
        case 'PAIEMENT':
          montant_engage = formData.montant_prevu;
          montant_ordonnance = formData.montant_prevu;
          montant_paye = formData.montant_prevu;
          break;
      }

      // Préparation des données pour l'insertion en base de données
      const operationData = {
        exercice_id: exerciceId,
        code_operation: formData.code_operation,
        type_operation: formData.type_operation,
        nature_flux: formData.nature_flux,
        libelle: formData.libelle,
        montant_prevu: formData.montant_prevu,
        montant_engage,
        montant_ordonnance,
        montant_paye,
        date_operation: new Date(formData.date_operation),
        date_valeur: new Date(formData.date_valeur),
        statut: activeStep,
        imputation_id: formData.imputation_id,
        source_financement_id: formData.source_financement_id || undefined,
        beneficiaire: formData.beneficiaire || undefined,
        reference_piece: formData.reference_piece,
        commentaire: formData.commentaire || undefined
      };
      
      // Conversion des types en types de base
      const baseTypeOperation = mapTypeOperationToBasicType(formData.type_operation);
      const baseNatureFlux = mapNatureFluxToBasicType(formData.nature_flux);
      
      const finalOperationData = {
        ...operationData,
        type_operation: baseTypeOperation,
        nature_flux: baseNatureFlux,
        // Ajout d'un commentaire pour tracer les types originaux
        commentaire: `Type original: ${formData.type_operation}, Nature originale: ${formData.nature_flux}${operationData.commentaire ? ' - ' + operationData.commentaire : ''}`
      };

      await TresorerieService.creerOperation(finalOperationData);
      setError(null);
      setSuccessMessage('Opération créée avec succès');
      setFormData(initialFormData);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur lors de la création de l\'opération:', err);
      let errorMessage = 'Une erreur inattendue est survenue';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message);
      }

      // Gestion spécifique des erreurs de validation
      if (errorMessage.includes('montant')) {
        errorMessage = 'Erreur de validation des montants : ' + errorMessage;
      }

      setError(errorMessage);
      setSuccessMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saisie des Flux de Trésorerie</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enregistrement des opérations financières avec suivi des étapes de validation
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur de saisie</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Opération réussie</h3>
              <p className="mt-1 text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}



      {/* Étapes du processus */}
      <div className="mb-6">
        <div className="flex justify-between">
          {['PREVISION', 'ENGAGEMENT', 'ORDONNANCEMENT', 'PAIEMENT'].map((step) => (
            <button
              key={step}
              className={`px-4 py-2 rounded ${
                activeStep === step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
              onClick={() => setActiveStep(step as StatutOperation)}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Première ligne */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Code Opération</label>
            <input
              type="text"
              name="code_operation"
              value={formData.code_operation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type d'Opération</label>
            <select
              name="type_operation"
              value={formData.type_operation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un type</option>
              <option value="RECETTE">Recette</option>
              <option value="DEPENSE">Dépense</option>
              <option value="AVANCE">Avance de fonds</option>
              <option value="REGULARISATION">Régularisation</option>
              <option value="VIREMENT">Virement interne</option>
              <option value="REMBOURSEMENT">Remboursement</option>
            </select>
          </div>
        </div>

        {/* Deuxième ligne */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nature du Flux</label>
            <select
              name="nature_flux"
              value={formData.nature_flux}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionnez une nature</option>
              <option value="FONCTIONNEMENT">Fonctionnement</option>
              <option value="INVESTISSEMENT">Investissement</option>
              <option value="FINANCEMENT">Financement</option>
              <option value="DETTE">Dette</option>
              <option value="FISCALITE">Fiscalité</option>
              <option value="SUBVENTION">Subvention</option>
              <option value="TRANSFERT">Transfert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Montant</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                name="montant_prevu"
                value={formData.montant_prevu}
                onChange={handleInputChange}
                className="block w-full pr-12 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                {formData.devise}
              </div>
            </div>
            {formData.devise === 'CDF' && formData.taux_change > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                ≈ {(formData.montant_prevu / formData.taux_change).toFixed(2)} USD
              </p>
            )}
          </div>
        </div>

        {/* Libellé */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Libellé</label>
          <input
            type="text"
            name="libelle"
            value={formData.libelle}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date d'Opération</label>
            <input
              type="date"
              name="date_operation"
              value={formData.date_operation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de Valeur</label>
            <input
              type="date"
              name="date_valeur"
              value={formData.date_valeur}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Imputation et Source de financement */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Imputation Budgétaire</label>
            <select
              name="imputation_id"
              value={formData.imputation_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={loadingImputations}
            >
              <option value="">Sélectionnez une imputation</option>
              {imputations.map(imp => (
                <option key={imp.id} value={imp.id}>
                  {imp.code} - {imp.libelle}
                </option>
              ))}
            </select>
            {loadingImputations && (
              <p className="text-sm text-gray-500 mt-1">Chargement des imputations...</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source de Financement</label>
            <select
              name="source_financement_id"
              value={formData.source_financement_id}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loadingSourcesFinancement}
            >
              <option value="">Sélectionnez une source de financement</option>
              {sourcesFinancement.map(src => (
                <option key={src.id} value={src.id}>
                  {src.code} - {src.libelle}
                </option>
              ))}
            </select>
            {loadingSourcesFinancement && (
              <p className="text-sm text-gray-500 mt-1">Chargement des sources de financement...</p>
            )}
          </div>
        </div>

        {/* Informations monétaires */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Informations monétaires</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Devise</label>
              <select
                name="devise"
                value={formData.devise}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="USD">Dollar Américain (USD)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Taux de change (USD/CDF)</label>
              <input
                type="number"
                name="taux_change"
                value={formData.taux_change}
                onChange={handleInputChange}
                min="0"
                step="0.0001"
                placeholder="Ex: 2500"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={formData.devise === 'CDF'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mode de paiement</label>
              <select
                name="mode_paiement"
                value={formData.mode_paiement}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required={activeStep === 'PAIEMENT'}
              >
                <option value="CASH">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="VIREMENT">Virement bancaire</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Montant non engagé</label>
              <input
                type="number"
                name="montant_non_engage"
                value={formData.montant_non_engage}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Montant restant</label>
              <input
                type="number"
                name="montant_restant"
                value={formData.montant_restant}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Taux d'exécution (%)</label>
              <input
                type="number"
                name="taux_execution"
                value={formData.taux_execution}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Numéros de documents */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">N° Engagement</label>
            <input
              type="text"
              name="numero_engagement"
              value={formData.numero_engagement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStep === 'PREVISION'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">N° Ordonnancement</label>
            <input
              type="text"
              name="numero_ordonnancement"
              value={formData.numero_ordonnancement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!['ORDONNANCEMENT', 'PAIEMENT'].includes(activeStep)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">N° Paiement</label>
            <input
              type="text"
              name="numero_paiement"
              value={formData.numero_paiement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStep !== 'PAIEMENT'}
            />
          </div>
        </div>

        {/* Dates supplémentaires */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date d'engagement</label>
            <input
              type="date"
              name="date_engagement"
              value={formData.date_engagement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStep === 'PREVISION'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date d'ordonnancement</label>
            <input
              type="date"
              name="date_ordonnancement"
              value={formData.date_ordonnancement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!['ORDONNANCEMENT', 'PAIEMENT'].includes(activeStep)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de paiement</label>
            <input
              type="date"
              name="date_paiement"
              value={formData.date_paiement}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={activeStep !== 'PAIEMENT'}
            />
          </div>
        </div>

        {/* Informations de paiement */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Informations de paiement</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Bénéficiaire</label>
              <input
                type="text"
                name="beneficiaire"
                value={formData.beneficiaire}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nom du bénéficiaire"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Référence Pièce</label>
              <input
                type="text"
                name="reference_piece"
                value={formData.reference_piece}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ex: FACT-2024-001"
                required
              />
            </div>
          </div>

          {/* Détails du paiement conditionnels */}
          {formData.mode_paiement === 'CHEQUE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Numéro de chèque</label>
                <input
                  type="text"
                  name="numero_cheque"
                  value={formData.numero_cheque}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: 123456789"
                  required={formData.mode_paiement === 'CHEQUE'}
                />
              </div>
            </div>
          )}
          
          {formData.mode_paiement === 'VIREMENT' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Compte bancaire</label>
                <input
                  type="text"
                  name="compte_bancaire"
                  value={formData.compte_bancaire}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: FR76 1234 5678 9012 3456 7890 123"
                  required={formData.mode_paiement === 'VIREMENT'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Commentaire</label>
          <textarea
            name="commentaire"
            value={formData.commentaire}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded text-white ${
              isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}