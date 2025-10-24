import { useState } from 'react';
import { X, Save, FileText, Tag } from 'lucide-react';

export interface NoteAnnexeData {
  reference: string;
  titre: string;
  categorie: 'METHODES_COMPTABLES' | 'IMMOBILISATIONS' | 'STOCKS' | 'CREANCES' | 'DETTES' | 'CAPITAUX' | 'RESULTAT' | 'AUTRE';
  contenu: string;
  comptesReferences: string[];
  montants: {
    compte: string;
    libelle: string;
    montant: number;
  }[];
  dateCreation: string;
  auteur: string;
  etatFinancier: 'BILAN' | 'COMPTE_RESULTAT' | 'FLUX_TRESORERIE' | 'TOUS';
}

interface NoteAnnexeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteAnnexeData) => void;
  initialData?: Partial<NoteAnnexeData>;
}

/**
 * Formulaire de création de note annexe
 * Conforme IPSAS 1 - Notes aux états financiers
 */
export default function NoteAnnexeForm({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: NoteAnnexeFormProps) {
  const [formData, setFormData] = useState<NoteAnnexeData>({
    reference: initialData?.reference || `NOTE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    titre: initialData?.titre || '',
    categorie: initialData?.categorie || 'AUTRE',
    contenu: initialData?.contenu || '',
    comptesReferences: initialData?.comptesReferences || [],
    montants: initialData?.montants || [],
    dateCreation: initialData?.dateCreation || new Date().toISOString().split('T')[0],
    auteur: initialData?.auteur || '',
    etatFinancier: initialData?.etatFinancier || 'TOUS'
  });

  const [nouveauMontant, setNouveauMontant] = useState({
    compte: '',
    libelle: '',
    montant: 0
  });

  const handleChange = (field: keyof NoteAnnexeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAjouterMontant = () => {
    if (!nouveauMontant.compte || !nouveauMontant.libelle) {
      alert('Veuillez remplir le compte et le libellé');
      return;
    }

    setFormData(prev => ({
      ...prev,
      montants: [...prev.montants, { ...nouveauMontant }]
    }));

    setNouveauMontant({ compte: '', libelle: '', montant: 0 });
  };

  const handleSupprimerMontant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      montants: prev.montants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titre) {
      alert('Le titre est obligatoire');
      return;
    }

    if (!formData.contenu) {
      alert('Le contenu est obligatoire');
      return;
    }

    if (!formData.auteur) {
      alert('Veuillez indiquer l\'auteur');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-green-600" />
            Note Annexe aux États Financiers (IPSAS 1)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Fermer"
            aria-label="Fermer le formulaire"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Référence et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Référence
              </label>
              <input
                type="text"
                value={formData.reference}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                aria-label="Référence de la note"
                title="Référence générée automatiquement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Création
              </label>
              <input
                type="date"
                value={formData.dateCreation}
                onChange={(e) => handleChange('dateCreation', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-label="Date de création"
                title="Date de création de la note"
              />
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la Note <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
              placeholder="Ex: Méthodes d'évaluation des stocks, Détail des immobilisations..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              aria-label="Titre de la note"
              title="Titre descriptif de la note annexe"
            />
          </div>

          {/* Catégorie et État Financier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categorie}
                onChange={(e) => handleChange('categorie', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                aria-label="Catégorie de la note"
              >
                <option value="METHODES_COMPTABLES">Méthodes Comptables</option>
                <option value="IMMOBILISATIONS">Immobilisations</option>
                <option value="STOCKS">Stocks</option>
                <option value="CREANCES">Créances</option>
                <option value="DETTES">Dettes</option>
                <option value="CAPITAUX">Capitaux Propres</option>
                <option value="RESULTAT">Résultat</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État Financier Concerné
              </label>
              <select
                value={formData.etatFinancier}
                onChange={(e) => handleChange('etatFinancier', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                aria-label="État financier concerné"
              >
                <option value="TOUS">Tous les états</option>
                <option value="BILAN">Bilan</option>
                <option value="COMPTE_RESULTAT">Compte de Résultat</option>
                <option value="FLUX_TRESORERIE">Flux de Trésorerie</option>
              </select>
            </div>
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu de la Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.contenu}
              onChange={(e) => handleChange('contenu', e.target.value)}
              rows={8}
              placeholder="Rédigez le contenu détaillé de la note annexe..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              aria-label="Contenu de la note"
              title="Contenu détaillé de la note annexe"
            />
          </div>

          {/* Comptes Référencés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comptes Référencés
            </label>
            <input
              type="text"
              value={formData.comptesReferences.join(', ')}
              onChange={(e) => handleChange('comptesReferences', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
              placeholder="Ex: 211, 215, 281..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              aria-label="Comptes référencés"
              title="Numéros de comptes référencés (séparés par des virgules)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez les numéros de comptes par des virgules
            </p>
          </div>

          {/* Montants Détaillés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Montants Détaillés (optionnel)
            </label>
            
            {/* Formulaire d'ajout */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={nouveauMontant.compte}
                  onChange={(e) => setNouveauMontant(prev => ({ ...prev, compte: e.target.value }))}
                  placeholder="N° Compte"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Numéro de compte"
                  title="Numéro de compte"
                />
                <input
                  type="text"
                  value={nouveauMontant.libelle}
                  onChange={(e) => setNouveauMontant(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="Libellé"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Libellé"
                  title="Libellé du compte"
                />
                <input
                  type="number"
                  value={nouveauMontant.montant}
                  onChange={(e) => setNouveauMontant(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                  placeholder="Montant"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  aria-label="Montant"
                  title="Montant en CDF"
                />
                <button
                  type="button"
                  onClick={handleAjouterMontant}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Tag className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Liste des montants */}
            {formData.montants.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-green-50 to-green-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                        Compte
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                        Libellé
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                        Montant (CDF)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.montants.map((montant, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {montant.compte}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {montant.libelle}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {montant.montant.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSupprimerMontant(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr className="font-bold">
                      <td colSpan={2} className="px-4 py-3 text-sm text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formData.montants.reduce((sum, m) => sum + m.montant, 0).toLocaleString('fr-FR')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Auteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auteur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.auteur}
              onChange={(e) => handleChange('auteur', e.target.value)}
              placeholder="Nom du rédacteur"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              aria-label="Auteur de la note"
              title="Nom du rédacteur de la note"
            />
          </div>

          {/* Informations IPSAS */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-900 mb-2">
              📋 Conformité IPSAS 1
            </h4>
            <ul className="text-xs text-green-800 space-y-1">
              <li>• Les notes annexes complètent les états financiers</li>
              <li>• Elles fournissent des informations détaillées sur les postes</li>
              <li>• Obligatoires pour la présentation fidèle des comptes</li>
              <li>• Doivent être claires, pertinentes et compréhensibles</li>
            </ul>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer la Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
