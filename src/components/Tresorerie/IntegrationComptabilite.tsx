import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Link2, Settings } from 'lucide-react';
import { IntegrationComptaTresoService, ValidationCroisee, MappingCompte } from '../../services/IntegrationComptaTresoService';

/**
 * Composant de gestion de l'intégration Comptabilité ↔ Trésorerie
 * Conforme SYSCOHADA (comptes classe 5)
 */
export default function IntegrationComptabilite(): React.ReactElement {
  const [validation, setValidation] = useState<ValidationCroisee | null>(null);
  const [mappings, setMappings] = useState<MappingCompte[]>([]);
  const [rapport, setRapport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [synchroEnCours, setSynchroEnCours] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [validationData, mappingsData, rapportData] = await Promise.all([
        IntegrationComptaTresoService.validerCoherence(),
        IntegrationComptaTresoService.getMappingComptes(),
        IntegrationComptaTresoService.genererRapportSynchronisation()
      ]);

      setValidation(validationData);
      setMappings(mappingsData);
      setRapport(rapportData);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const lancerSynchronisation = async () => {
    setSynchroEnCours(true);
    try {
      const resultat = await IntegrationComptaTresoService.synchroniserTousFlux();
      alert(`Synchronisation terminée:\n✓ ${resultat.succes} flux synchronisés\n✗ ${resultat.echecs} échecs`);
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSynchroEnCours(false);
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'OK':
        return <CheckCircle2 className="text-green-600" size={24} />;
      case 'ALERTE':
        return <AlertTriangle className="text-yellow-600" size={24} />;
      case 'ERREUR':
        return <XCircle className="text-red-600" size={24} />;
      default:
        return null;
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'OK':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ALERTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ERREUR':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Link2 className="mr-3" size={28} />
              Intégration Comptabilité ↔ Trésorerie
            </h2>
            <p className="text-indigo-100 mt-2">
              Synchronisation temps réel - Conforme SYSCOHADA (Classe 5)
            </p>
          </div>
          <button
            onClick={lancerSynchronisation}
            disabled={synchroEnCours}
            className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <RefreshCw className={`mr-2 ${synchroEnCours ? 'animate-spin' : ''}`} size={20} />
            {synchroEnCours ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        </div>
      </div>

      {/* Validation Croisée */}
      {validation && (
        <div className={`border-2 rounded-xl p-6 ${getStatutColor(validation.statut)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getStatutIcon(validation.statut)}
              <h3 className="text-lg font-bold ml-3">Validation Croisée des Soldes</h3>
            </div>
            <span className="text-sm">
              {new Date(validation.date_validation).toLocaleString('fr-FR')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Solde Trésorerie</p>
              <p className="text-2xl font-bold">{formatCurrency(validation.solde_tresorerie)}</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Solde Comptable</p>
              <p className="text-2xl font-bold">{formatCurrency(validation.solde_comptable)}</p>
            </div>
            <div className="bg-white bg-opacity-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Écart</p>
              <p className="text-2xl font-bold">{formatCurrency(validation.ecart)}</p>
            </div>
          </div>

          {validation.details_ecarts && validation.details_ecarts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Détails des écarts par compte:</h4>
              <div className="bg-white bg-opacity-70 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold">Compte</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold">Libellé</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold">Trésorerie</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold">Comptabilité</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validation.details_ecarts.map((ecart, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2 text-sm font-mono">{ecart.compte_numero}</td>
                        <td className="px-4 py-2 text-sm">{ecart.libelle}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(ecart.solde_tresorerie)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(ecart.solde_comptable)}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-red-600">
                          {formatCurrency(ecart.ecart)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rapport de Synchronisation */}
      {rapport && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Settings className="mr-2 text-indigo-600" size={20} />
            Rapport de Synchronisation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
              <p className="text-sm text-gray-600 mb-1">Total Flux</p>
              <p className="text-3xl font-bold text-blue-700">{rapport.total_flux}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-1">Synchronisés</p>
              <p className="text-3xl font-bold text-green-700">{rapport.synchronises}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-300">
              <p className="text-sm text-gray-600 mb-1">Non Synchronisés</p>
              <p className="text-3xl font-bold text-orange-700">{rapport.non_synchronises}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-300">
              <p className="text-sm text-gray-600 mb-1">Taux</p>
              <p className="text-3xl font-bold text-purple-700">{rapport.taux_synchronisation.toFixed(1)}%</p>
            </div>
          </div>

          {rapport.derniere_synchro && (
            <div className="mt-4 text-sm text-gray-600">
              Dernière synchronisation: {new Date(rapport.derniere_synchro).toLocaleString('fr-FR')}
            </div>
          )}
        </div>
      )}

      {/* Mapping des Comptes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold mb-4">Mapping Comptes Trésorerie ↔ Comptabilité</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Banque</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Compte Comptable</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Devise</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type Flux</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Aucun mapping configuré
                  </td>
                </tr>
              ) : (
                mappings.map((mapping, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{mapping.banque}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-indigo-600">
                      {mapping.compte_comptable}
                    </td>
                    <td className="px-4 py-3 text-sm">{mapping.devise}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        mapping.type_flux === 'RECETTE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {mapping.type_flux}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {mapping.actif ? (
                        <CheckCircle2 className="inline text-green-600" size={20} />
                      ) : (
                        <XCircle className="inline text-gray-400" size={20} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informations SYSCOHADA */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold mb-3 text-purple-900">
          📚 Référence SYSCOHADA - Comptes de Trésorerie (Classe 5)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="font-mono font-semibold">50</span> - Titres de placement</div>
          <div><span className="font-mono font-semibold">51</span> - Valeurs à encaisser</div>
          <div><span className="font-mono font-semibold">52</span> - Banques, établissements financiers</div>
          <div><span className="font-mono font-semibold">53</span> - Établissements financiers et assimilés</div>
          <div><span className="font-mono font-semibold">54</span> - Instruments de trésorerie</div>
          <div><span className="font-mono font-semibold">57</span> - Caisse</div>
          <div><span className="font-mono font-semibold">58</span> - Régies d'avances</div>
          <div><span className="font-mono font-semibold">59</span> - Dépréciations et risques</div>
        </div>
      </div>
    </div>
  );
}
