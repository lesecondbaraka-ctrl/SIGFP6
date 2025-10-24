/**
 * Formulaire Engagement de Dépense
 * 
 * Phase 1 du cycle OHADA: ENGAGEMENT
 * Réservation du crédit budgétaire avant toute dépense
 * 
 * NORMES:
 * - OHADA: Phase 1 obligatoire
 * - SYSCOHADA: Traçabilité complète
 * - Contrôle interne: Vérification crédit disponible
 */

import { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, CheckCircle, DollarSign, FileText, User } from 'lucide-react';

interface LigneBudgetaire {
  id: string;
  code: string;
  libelle: string;
  disponible: number;
}

interface Fournisseur {
  id: string;
  nom: string;
  nif: string;
}

interface FormEngagementDepenseProps {
  onClose: () => void;
  onSubmit: (data: EngagementData) => void;
  lignesBudgetaires: LigneBudgetaire[];
  fournisseurs: Fournisseur[];
}

export interface EngagementData {
  ligneBudgetaireId: string;
  categorie: 'Personnel' | 'Fonctionnement' | 'Investissement' | 'Transfert';
  fournisseurId: string;
  montant: number;
  objet: string;
  dateEngagement: string;
  reference: string;
  pieceJustificative?: File;
  observations?: string;
}

export default function FormEngagementDepense({
  onClose,
  onSubmit,
  lignesBudgetaires,
  fournisseurs
}: FormEngagementDepenseProps) {
  const [formData, setFormData] = useState<EngagementData>({
    ligneBudgetaireId: '',
    categorie: 'Fonctionnement',
    fournisseurId: '',
    montant: 0,
    objet: '',
    dateEngagement: new Date().toISOString().split('T')[0],
    reference: `ENG-${Date.now()}`,
    observations: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creditDisponible, setCreditDisponible] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);

  // Calculer le crédit disponible
  useEffect(() => {
    if (formData.ligneBudgetaireId) {
      const ligne = lignesBudgetaires.find(l => l.id === formData.ligneBudgetaireId);
      setCreditDisponible(ligne?.disponible || 0);
    }
  }, [formData.ligneBudgetaireId, lignesBudgetaires]);

  // Vérifier si montant > disponible
  useEffect(() => {
    if (formData.montant > creditDisponible && creditDisponible > 0) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [formData.montant, creditDisponible]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'montant' ? parseFloat(value) || 0 : value
    }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, pieceJustificative: e.target.files![0] }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ligneBudgetaireId) {
      newErrors.ligneBudgetaireId = 'Ligne budgétaire obligatoire';
    }

    if (!formData.fournisseurId) {
      newErrors.fournisseurId = 'Fournisseur obligatoire';
    }

    if (formData.montant <= 0) {
      newErrors.montant = 'Montant doit être supérieur à 0';
    }

    if (formData.montant > creditDisponible) {
      newErrors.montant = 'Montant supérieur au crédit disponible';
    }

    if (!formData.objet || formData.objet.trim().length < 10) {
      newErrors.objet = 'Objet obligatoire (minimum 10 caractères)';
    }

    if (!formData.dateEngagement) {
      newErrors.dateEngagement = 'Date obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="w-7 h-7" />
                Engagement de Dépense
              </h2>
              <p className="text-blue-100 text-sm mt-1">Phase 1 - Cycle OHADA | Réservation crédit budgétaire</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Alerte crédit insuffisant */}
          {showAlert && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800">Crédit insuffisant</h4>
                <p className="text-sm text-red-700">
                  Le montant demandé ({formData.montant.toLocaleString()} CDF) dépasse le crédit disponible ({creditDisponible.toLocaleString()} CDF).
                </p>
              </div>
            </div>
          )}

          {/* Ligne budgétaire */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ligne Budgétaire <span className="text-red-500">*</span>
            </label>
            <select
              name="ligneBudgetaireId"
              value={formData.ligneBudgetaireId}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.ligneBudgetaireId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner une ligne budgétaire</option>
              {lignesBudgetaires.map(ligne => (
                <option key={ligne.id} value={ligne.id}>
                  {ligne.code} - {ligne.libelle} (Disponible: {ligne.disponible.toLocaleString()} CDF)
                </option>
              ))}
            </select>
            {errors.ligneBudgetaireId && (
              <p className="text-red-500 text-sm mt-1">{errors.ligneBudgetaireId}</p>
            )}
            {creditDisponible > 0 && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Crédit disponible: {creditDisponible.toLocaleString()} CDF
                </p>
              </div>
            )}
          </div>

          {/* Catégorie et Fournisseur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Personnel">Personnel</option>
                <option value="Fonctionnement">Fonctionnement</option>
                <option value="Investissement">Investissement</option>
                <option value="Transfert">Transfert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fournisseur <span className="text-red-500">*</span>
              </label>
              <select
                name="fournisseurId"
                value={formData.fournisseurId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.fournisseurId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un fournisseur</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nom} (NIF: {f.nif})
                  </option>
                ))}
              </select>
              {errors.fournisseurId && (
                <p className="text-red-500 text-sm mt-1">{errors.fournisseurId}</p>
              )}
            </div>
          </div>

          {/* Montant et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Montant (CDF) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="montant"
                value={formData.montant || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.montant ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.montant && (
                <p className="text-red-500 text-sm mt-1">{errors.montant}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d'Engagement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateEngagement"
                value={formData.dateEngagement}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.dateEngagement ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateEngagement && (
                <p className="text-red-500 text-sm mt-1">{errors.dateEngagement}</p>
              )}
            </div>
          </div>

          {/* Référence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Référence
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ENG-2025-001"
            />
          </div>

          {/* Objet */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Objet de la Dépense <span className="text-red-500">*</span>
            </label>
            <textarea
              name="objet"
              value={formData.objet}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.objet ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Description détaillée de l'objet de la dépense (minimum 10 caractères)"
            />
            {errors.objet && (
              <p className="text-red-500 text-sm mt-1">{errors.objet}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.objet.length} / 10 caractères minimum
            </p>
          </div>

          {/* Pièce justificative */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pièce Justificative
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Formats acceptés: PDF, JPG, PNG (max 5MB)
            </p>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observations complémentaires (optionnel)"
            />
          </div>

          {/* Informations OHADA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Contrôles OHADA
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ Phase 1: Engagement (Réservation crédit budgétaire)</li>
              <li>✓ Vérification crédit disponible obligatoire</li>
              <li>✓ Pièce justificative recommandée</li>
              <li>✓ Traçabilité complète assurée</li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={showAlert}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                showAlert
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md'
              }`}
            >
              <Save className="w-5 h-5" />
              Engager la Dépense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
