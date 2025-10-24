import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Save } from 'lucide-react';
import { TresorerieService } from '../../services/TresorerieService';
import { useDevise } from '../../hooks/useDevise';

/**
 * Composant de gestion des taux de change
 * Permet de visualiser et mettre à jour les taux de change
 * Conforme aux normes IFRS pour la conversion des devises
 */
export default function GestionTauxChange(): React.ReactElement {
  const { taux: tauxActuel } = useDevise();
  const [montantUSD, setMontantUSD] = useState<string>('');
  const [montantCDF, setMontantCDF] = useState<string>('');
  const [nouveauTaux, setNouveauTaux] = useState<string>('');
  const [source, setSource] = useState<'banque_centrale' | 'marche' | 'manuel'>('manuel');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Conversion USD vers CDF
  const convertirUSDversCDF = (usd: string) => {
    const montant = parseFloat(usd);
    if (!isNaN(montant) && tauxActuel) {
      setMontantCDF((montant * tauxActuel).toFixed(2));
    } else {
      setMontantCDF('');
    }
  };

  // Conversion CDF vers USD
  const convertirCDFversUSD = (cdf: string) => {
    const montant = parseFloat(cdf);
    if (!isNaN(montant) && tauxActuel) {
      setMontantUSD((montant / tauxActuel).toFixed(2));
    } else {
      setMontantUSD('');
    }
  };

  const mettreAJourTaux = async () => {
    const taux = parseFloat(nouveauTaux);
    if (isNaN(taux) || taux <= 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un taux valide' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await TresorerieService.updateTauxChange('USD', 'CDF', taux, source);
      setMessage({ type: 'success', text: 'Taux de change mis à jour avec succès' });
      setNouveauTaux('');
      // Rafraîchir les conversions avec le nouveau taux
      if (montantUSD) convertirUSDversCDF(montantUSD);
      if (montantCDF) convertirCDFversUSD(montantCDF);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Erreur lors de la mise à jour du taux' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number, devise: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' ' + devise;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Gestion des Taux de Change</h2>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <TrendingUp className="text-blue-600" size={20} />
          <div>
            <p className="text-xs text-gray-600">Taux actuel USD/CDF</p>
            <p className="text-lg font-bold text-blue-700">{tauxActuel.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Mise à jour du taux */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Mettre à jour le taux de change</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau taux USD/CDF
            </label>
            <input
              type="number"
              value={nouveauTaux}
              onChange={(e) => setNouveauTaux(e.target.value)}
              placeholder={tauxActuel.toFixed(2)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              1 USD = ? CDF
            </p>
          </div>

          <div>
            <label htmlFor="source-taux" className="block text-sm font-medium text-gray-700 mb-2">
              Source du taux
            </label>
            <select
              id="source-taux"
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              aria-label="Source du taux de change"
            >
              <option value="manuel">Saisie manuelle</option>
              <option value="banque_centrale">Banque Centrale</option>
              <option value="marche">Marché</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={mettreAJourTaux}
              disabled={loading || !nouveauTaux}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </div>

      {/* Convertisseur de devises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USD vers CDF */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">USD → CDF</h3>
            <TrendingUp className="text-green-600" size={24} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant en USD
              </label>
              <input
                type="number"
                value={montantUSD}
                onChange={(e) => {
                  setMontantUSD(e.target.value);
                  convertirUSDversCDF(e.target.value);
                }}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-medium"
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="bg-white rounded-full p-2 shadow-md">
                <RefreshCw className="text-green-600" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équivalent en CDF
              </label>
              <div className="bg-white px-4 py-3 border-2 border-green-300 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {montantCDF ? formatCurrency(parseFloat(montantCDF), 'CDF') : '0.00 CDF'}
                </p>
              </div>
            </div>

            {montantUSD && (
              <div className="bg-white rounded-lg p-3 text-sm text-gray-600">
                <p>Taux appliqué: <span className="font-semibold">{tauxActuel.toFixed(2)}</span></p>
                <p className="text-xs mt-1">
                  {montantUSD} USD × {tauxActuel.toFixed(2)} = {montantCDF} CDF
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CDF vers USD */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">CDF → USD</h3>
            <TrendingDown className="text-blue-600" size={24} />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant en CDF
              </label>
              <input
                type="number"
                value={montantCDF}
                onChange={(e) => {
                  setMontantCDF(e.target.value);
                  convertirCDFversUSD(e.target.value);
                }}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg font-medium"
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="bg-white rounded-full p-2 shadow-md">
                <RefreshCw className="text-blue-600" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Équivalent en USD
              </label>
              <div className="bg-white px-4 py-3 border-2 border-blue-300 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">
                  {montantUSD ? formatCurrency(parseFloat(montantUSD), 'USD') : '0.00 USD'}
                </p>
              </div>
            </div>

            {montantCDF && (
              <div className="bg-white rounded-lg p-3 text-sm text-gray-600">
                <p>Taux appliqué: <span className="font-semibold">{tauxActuel.toFixed(2)}</span></p>
                <p className="text-xs mt-1">
                  {montantCDF} CDF ÷ {tauxActuel.toFixed(2)} = {montantUSD} USD
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations complémentaires */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Informations importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le taux de change est utilisé pour toutes les conversions dans le système</li>
          <li>• Les prévisions et rapports multi-devises utilisent ce taux pour les équivalences</li>
          <li>• Assurez-vous de mettre à jour régulièrement le taux pour refléter les conditions du marché</li>
          <li>• Tous les changements de taux sont tracés et historisés pour l'audit</li>
        </ul>
      </div>
    </div>
  );
}
