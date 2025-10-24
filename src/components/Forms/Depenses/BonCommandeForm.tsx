import React from 'react';
import { ShoppingCart, X } from 'lucide-react';

interface BonCommandeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BonCommandeData) => void;
}

export interface BonCommandeData {
  numeroBon: string;
  fournisseur: string;
  dateCommande: string;
  dateLivraison: string;
  objet: string;
  articles: ArticleCommande[];
  montantTotal: number;
  observations: string;
}

export interface ArticleCommande {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

export default function BonCommandeForm({
  isOpen,
  onClose,
  onSubmit
}: BonCommandeFormProps) {
  const [formData, setFormData] = React.useState<BonCommandeData>({
    numeroBon: '',
    fournisseur: '',
    dateCommande: new Date().toISOString().split('T')[0],
    dateLivraison: '',
    objet: '',
    articles: [{ designation: '', quantite: 1, prixUnitaire: 0, montant: 0 }],
    montantTotal: 0,
    observations: ''
  });

  const handleArticleChange = (index: number, field: keyof ArticleCommande, value: string | number) => {
    const newArticles = [...formData.articles];
    newArticles[index] = { ...newArticles[index], [field]: value };
    
    // Recalculer le montant de l'article
    if (field === 'quantite' || field === 'prixUnitaire') {
      newArticles[index].montant = newArticles[index].quantite * newArticles[index].prixUnitaire;
    }
    
    // Recalculer le montant total
    const montantTotal = newArticles.reduce((sum, article) => sum + article.montant, 0);
    
    setFormData({ ...formData, articles: newArticles, montantTotal });
  };

  const addArticle = () => {
    setFormData({
      ...formData,
      articles: [...formData.articles, { designation: '', quantite: 1, prixUnitaire: 0, montant: 0 }]
    });
  };

  const removeArticle = (index: number) => {
    if (formData.articles.length > 1) {
      const newArticles = formData.articles.filter((_, i) => i !== index);
      const montantTotal = newArticles.reduce((sum, article) => sum + article.montant, 0);
      setFormData({ ...formData, articles: newArticles, montantTotal });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      numeroBon: '',
      fournisseur: '',
      dateCommande: new Date().toISOString().split('T')[0],
      dateLivraison: '',
      objet: '',
      articles: [{ designation: '', quantite: 1, prixUnitaire: 0, montant: 0 }],
      montantTotal: 0,
      observations: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
            Bon de Commande
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer le formulaire"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro du Bon *
              </label>
              <input
                type="text"
                value={formData.numeroBon}
                onChange={(e) => setFormData({ ...formData, numeroBon: e.target.value })}
                placeholder="Ex: BC-2025-001"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Numéro du bon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fournisseur *
              </label>
              <input
                type="text"
                value={formData.fournisseur}
                onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                placeholder="Nom du fournisseur"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Nom du fournisseur"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Commande *
              </label>
              <input
                type="date"
                value={formData.dateCommande}
                onChange={(e) => setFormData({ ...formData, dateCommande: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Date de commande"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de Livraison Souhaitée *
              </label>
              <input
                type="date"
                value={formData.dateLivraison}
                onChange={(e) => setFormData({ ...formData, dateLivraison: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                aria-label="Date de livraison"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Objet de la Commande *
            </label>
            <input
              type="text"
              value={formData.objet}
              onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
              placeholder="Description de la commande"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              aria-label="Objet de la commande"
            />
          </div>

          {/* Articles */}
          <div className="border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Articles</h4>
              <button
                type="button"
                onClick={addArticle}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                aria-label="Ajouter un article"
              >
                + Ajouter
              </button>
            </div>

            <div className="space-y-3">
              {formData.articles.map((article, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Désignation *
                    </label>
                    <input
                      type="text"
                      value={article.designation}
                      onChange={(e) => handleArticleChange(index, 'designation', e.target.value)}
                      placeholder="Nom de l'article"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      aria-label={`Désignation article ${index + 1}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Qté *
                    </label>
                    <input
                      type="number"
                      value={article.quantite}
                      onChange={(e) => handleArticleChange(index, 'quantite', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      min="1"
                      aria-label={`Quantité article ${index + 1}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      P.U. *
                    </label>
                    <input
                      type="number"
                      value={article.prixUnitaire}
                      onChange={(e) => handleArticleChange(index, 'prixUnitaire', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                      min="0"
                      aria-label={`Prix unitaire article ${index + 1}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Montant
                    </label>
                    <input
                      type="text"
                      value={article.montant.toLocaleString()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                      aria-label={`Montant article ${index + 1}`}
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.articles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArticle(index)}
                        className="w-full px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label={`Supprimer article ${index + 1}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Montant Total:</span>
                <span className="text-xl font-bold text-blue-700">
                  {formData.montantTotal.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={2}
              placeholder="Observations complémentaires..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Observations"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>OHADA:</strong> Le bon de commande formalise l'engagement d'achat et précède la réception des biens ou services.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md"
              aria-label="Émettre le bon de commande"
            >
              Émettre le Bon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
