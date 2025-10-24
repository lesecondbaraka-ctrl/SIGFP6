import React, { useState, useEffect } from 'react';
import { Plus, X, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { EcritureComptableService } from '../../services/EcritureComptableService';
import { PlanComptableService } from '../../services/PlanComptableService';
import type { EcritureComptable, CompteComptable } from '../../types/comptabilite';

type Props = {
  exerciceId: string;
  onCancel: () => void;
  onCreated: (ecriture: EcritureComptable) => void;
};

interface LigneFormulaire {
  id: string;
  compte_numero: string;
  compte_libelle: string;
  libelle: string;
  sens: 'DEBIT' | 'CREDIT';
  montant: number;
}

export default function CreateEcritureFormV2({ exerciceId, onCancel, onCreated }: Props) {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comptes, setComptes] = useState<CompteComptable[]>([]);

  // Informations générales de l'écriture
  const [dateEcriture, setDateEcriture] = useState<string>(new Date().toISOString().split('T')[0]);
  const [journalCode, setJournalCode] = useState<string>('OD');
  const [referencePiece, setReferencePiece] = useState<string>('');
  const [libelle, setLibelle] = useState<string>('');

  // Lignes d'écriture
  const [lignes, setLignes] = useState<LigneFormulaire[]>([]);
  
  // Ligne en cours de saisie
  const [ligneCourante, setLigneCourante] = useState<LigneFormulaire>({
    id: crypto.randomUUID(),
    compte_numero: '',
    compte_libelle: '',
    libelle: '',
    sens: 'DEBIT',
    montant: 0
  });

  // Pièce justificative
  const [pieceJustificative, setPieceJustificative] = useState<File | null>(null);

  // Messages
  const [messageErreur, setMessageErreur] = useState<string>('');

  // Charger les comptes disponibles
  useEffect(() => {
    const chargerComptes = async () => {
      try {
        const comptesData = await PlanComptableService.getComptes(exerciceId);
        setComptes(comptesData.filter(c => c.est_actif));
      } catch (error) {
        console.error('Erreur chargement comptes:', error);
      }
    };
    if (exerciceId) chargerComptes();
  }, [exerciceId]);

  // Calculs
  const totalDebit = lignes.filter(l => l.sens === 'DEBIT').reduce((sum, l) => sum + l.montant, 0);
  const totalCredit = lignes.filter(l => l.sens === 'CREDIT').reduce((sum, l) => sum + l.montant, 0);
  const estEquilibree = totalDebit === totalCredit && totalDebit > 0;
  const ecart = Math.abs(totalDebit - totalCredit);

  // Ajouter une ligne
  const ajouterLigne = () => {
    if (!ligneCourante.compte_numero) {
      setMessageErreur('⚠️ Vous devez sélectionner un compte');
      return;
    }
    if (ligneCourante.montant <= 0) {
      setMessageErreur('⚠️ Le montant doit être supérieur à 0');
      return;
    }

    setLignes([...lignes, ligneCourante]);
    setLigneCourante({
      id: crypto.randomUUID(),
      compte_numero: '',
      compte_libelle: '',
      libelle: ligneCourante.libelle, // Garder le même libellé
      sens: ligneCourante.sens === 'DEBIT' ? 'CREDIT' : 'DEBIT', // Alterner
      montant: 0
    });
    setMessageErreur(''); // Effacer le message d'erreur
  };

  // Supprimer une ligne
  const supprimerLigne = (id: string) => {
    setLignes(lignes.filter(l => l.id !== id));
  };

  // Sélection du compte
  const selectionnerCompte = (numero: string) => {
    const compte = comptes.find(c => c.numero === numero);
    if (compte) {
      setLigneCourante({
        ...ligneCourante,
        compte_numero: compte.numero,
        compte_libelle: compte.libelle
      });
    }
  };

  // Soumettre l'écriture
  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estEquilibree) {
      alert('L\'écriture n\'est pas équilibrée (Débit ≠ Crédit)');
      return;
    }

    if (lignes.length < 2) {
      alert('Une écriture doit contenir au moins 2 lignes (principe de partie double)');
      return;
    }

    if (!libelle.trim()) {
      alert('Le libellé général est obligatoire');
      return;
    }

    setLoading(true);
    try {
      const userId = authState.user?.id_utilisateur || 'system';
      const refFinal = referencePiece.trim() || `REF-${Date.now()}`;

      // Mapper les journaux
      const journalLibelle = 
        journalCode === 'ACH' ? 'Achats' :
        journalCode === 'VEN' ? 'Ventes' :
        journalCode === 'BNQ' ? 'Banque' :
        journalCode === 'CAIS' ? 'Caisse' :
        journalCode === 'OD' ? 'Opérations Diverses' :
        'Général';

      const ecritureData = {
        journal_code: journalCode,
        journal_libelle: journalLibelle,
        type: 'OPERATION' as const,
        date_ecriture: new Date(dateEcriture).toISOString(),
        date_piece: new Date(dateEcriture).toISOString(),
        periode: dateEcriture.substring(0, 7),
        exercice_id: exerciceId,
        libelle: libelle.trim(),
        reference_piece: refFinal,
        montant_total: totalDebit,
        statut: 'BROUILLON' as const,
        created_by: userId
      };

      const lignesData = lignes.map((ligne, index) => ({
        numero_ligne: index + 1,
        compte_numero: ligne.compte_numero,
        compte_libelle: ligne.compte_libelle,
        libelle: ligne.libelle || libelle,
        sens: ligne.sens,
        montant: ligne.montant,
        devise: 'XAF',
        piece_justificative: refFinal
      }));

      const created = await EcritureComptableService.creerEcriture(ecritureData, lignesData);
      if (!created) {
        throw new Error('Échec de la création de l\'écriture');
      }
      onCreated(created);
    } catch (error) {
      console.error('Erreur création écriture:', error);
      alert((error as Error).message || 'Erreur lors de la création de l\'écriture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="space-y-6 max-h-[85vh] overflow-y-auto px-1">
      {/* En-tête - Principe de Partie Double */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-blue-700 rounded-xl p-5 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="bg-white rounded-lg p-2">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white text-base">Principe de Partie Double (SYSCOHADA)</h4>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Toute écriture comptable doit respecter l'équilibre fondamental : <strong className="text-white">Total Débit = Total Crédit</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-5 pb-3 border-b-2 border-gray-200">
          <div className="w-1 h-6 bg-blue-600 rounded"></div>
          <h3 className="font-bold text-gray-900 text-lg">Informations Générales</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date-ecriture" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'écriture <span className="text-red-500">*</span>
            </label>
            <input
              id="date-ecriture"
              type="date"
              value={dateEcriture}
              onChange={(e) => setDateEcriture(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="journal" className="block text-sm font-medium text-gray-700 mb-1">
              Journal <span className="text-red-500">*</span>
            </label>
            <select
              id="journal"
              value={journalCode}
              onChange={(e) => setJournalCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="ACH">Achats</option>
              <option value="VEN">Ventes</option>
              <option value="BNQ">Banque</option>
              <option value="CAIS">Caisse</option>
              <option value="OD">Opérations Diverses</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="libelle" className="block text-sm font-medium text-gray-700 mb-1">
              Libellé général <span className="text-red-500">*</span>
            </label>
            <input
              id="libelle"
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Description de l'opération"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              N° Pièce justificative
            </label>
            <input
              id="reference"
              type="text"
              value={referencePiece}
              onChange={(e) => setReferencePiece(e.target.value)}
              placeholder="FACT-2024-001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Pièce justificative (fichier) */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <label htmlFor="piece-fichier" className="block text-sm font-semibold text-gray-700 mb-2">
            📎 Joindre la pièce justificative
          </label>
          <input
            id="piece-fichier"
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setPieceJustificative(e.target.files ? e.target.files[0] : null)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-blue-400 transition-colors"
            aria-label="Joindre une pièce justificative"
          />
          <p className="text-xs text-gray-500 mt-2">📄 Formats acceptés : PDF, images (JPG, PNG)</p>
          {pieceJustificative && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700 font-medium">Fichier sélectionné : {pieceJustificative.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Saisie de ligne */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-5 pb-3 border-b-2 border-gray-200">
          <div className="w-1 h-6 bg-green-600 rounded"></div>
          <h3 className="font-bold text-gray-900 text-lg">Ajouter une Ligne d'Écriture</h3>
        </div>
        
        {/* Message d'erreur */}
        {messageErreur && (
          <div 
            role="alert" 
            aria-live="polite"
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 mb-4 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{messageErreur}</p>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="compte" className="block text-sm font-medium text-gray-700 mb-1">
                Compte <span className="text-red-500">*</span>
              </label>
              <select
                id="compte"
                value={ligneCourante.compte_numero}
                onChange={(e) => selectionnerCompte(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un compte</option>
                {comptes.map((compte) => (
                  <option key={compte.id} value={compte.numero}>
                    {compte.numero} - {compte.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sens" className="block text-sm font-medium text-gray-700 mb-1">
                Sens <span className="text-red-500">*</span>
              </label>
              <select
                id="sens"
                value={ligneCourante.sens}
                onChange={(e) => setLigneCourante({ ...ligneCourante, sens: e.target.value as 'DEBIT' | 'CREDIT' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="DEBIT">Débit</option>
                <option value="CREDIT">Crédit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="libelle-ligne" className="block text-sm font-medium text-gray-700 mb-1">
                Libellé de la ligne
              </label>
              <input
                id="libelle-ligne"
                type="text"
                value={ligneCourante.libelle}
                onChange={(e) => setLigneCourante({ ...ligneCourante, libelle: e.target.value })}
                placeholder="Laisser vide pour utiliser le libellé général"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="montant" className="block text-sm font-medium text-gray-700 mb-1">
                Montant (XAF) <span className="text-red-500">*</span>
              </label>
              <input
                id="montant"
                type="number"
                min="0"
                step="0.01"
                value={ligneCourante.montant || ''}
                onChange={(e) => setLigneCourante({ ...ligneCourante, montant: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={ajouterLigne}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                ajouterLigne();
              }
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            title="Ctrl + Entrée pour ajouter rapidement"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter la ligne</span>
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">💡 Astuce : Ctrl + Entrée pour ajouter rapidement</p>
        </div>
      </div>

      {/* Tableau des lignes */}
      {lignes.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-6 bg-purple-600 rounded"></div>
              <h3 className="font-bold text-gray-900 text-lg">Lignes d'Écriture</h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">{lignes.length}</span>
            </div>
          </div>
          
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Compte</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Libellé</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider">Débit</th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-red-700 uppercase tracking-wider">Crédit</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lignes.map((ligne) => (
                  <tr key={ligne.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{ligne.compte_numero}</div>
                      <div className="text-gray-500 text-xs">{ligne.compte_libelle}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{ligne.libelle || libelle}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                      {ligne.sens === 'DEBIT' ? ligne.montant.toLocaleString() + ' XAF' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                      {ligne.sens === 'CREDIT' ? ligne.montant.toLocaleString() + ' XAF' : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => supprimerLigne(ligne.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Supprimer cette ligne"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold border-t-4 border-gray-400">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-base text-right text-gray-900 uppercase tracking-wide">
                    TOTAUX :
                  </td>
                  <td className={`px-4 py-4 text-base text-right font-bold ${estEquilibree ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {totalDebit.toLocaleString()} XAF
                  </td>
                  <td className={`px-4 py-4 text-base text-right font-bold ${estEquilibree ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                    {totalCredit.toLocaleString()} XAF
                  </td>
                  <td className="px-4 py-4 text-center">
                    {estEquilibree ? (
                      <div className="flex items-center justify-center space-x-1">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <span className="text-xs font-semibold text-red-700">KO</span>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Message d'équilibre */}
          {!estEquilibree && lignes.length >= 2 && (
            <div 
              role="alert" 
              aria-live="polite"
              className="mt-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 shadow-md"
            >
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-base font-bold text-red-900">❌ Écriture non équilibrée</p>
                <p className="text-sm text-red-700 mt-2 font-medium">
                  Écart détecté : <span className="font-bold">{ecart.toLocaleString()} XAF</span>
                </p>
                <p className="text-xs text-red-600 mt-1">
                  L'écriture doit être équilibrée avant validation (Débit = Crédit)
                </p>
              </div>
            </div>
          )}

          {estEquilibree && (
            <div 
              role="status" 
              aria-live="polite"
              className="mt-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4 flex items-start space-x-3 shadow-md"
            >
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-base font-bold text-green-900">✅ Écriture équilibrée</p>
                <p className="text-sm text-green-700 mt-2">
                  L'écriture respecte le principe de partie double (Débit = Crédit)
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  Montant total : {totalDebit.toLocaleString()} XAF
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 border-t-4 border-gray-300 rounded-b-xl p-6 flex items-center justify-between sticky bottom-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 border-2 border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition-all shadow-sm hover:shadow-md"
        >
          ✖ Annuler
        </button>

        <button
          type="submit"
          disabled={loading || !estEquilibree || lignes.length < 2}
          className={`px-8 py-3 rounded-lg font-bold flex items-center space-x-2 transition-all shadow-md ${
            estEquilibree && lignes.length >= 2
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:shadow-lg transform hover:-translate-y-0.5'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
          }`}
          title={!estEquilibree ? 'L\'écriture doit être équilibrée' : lignes.length < 2 ? 'Minimum 2 lignes requises' : 'Enregistrer l\'écriture'}
        >
          {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
          <span>{loading ? '⏳ Enregistrement...' : '✓ Enregistrer l\'écriture'}</span>
        </button>
      </div>
    </form>
  );
}
