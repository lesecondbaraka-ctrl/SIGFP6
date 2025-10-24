import { useState, useEffect } from "react";
import { 
  TrendingUp, AlertCircle, CheckCircle, 
  DollarSign, PieChart, BarChart3, FileText, 
  Download, Plus, RefreshCw, X, Clock,
  Edit, Target, ArrowRightLeft, Eye, TrendingDown
} from 'lucide-react';
import '../../styles/utilities.css';
// Importations commentées car non utilisées
import { getProgressDataAttrs } from '../../utils/progressBarUtils';
// import { exportToExcel, generateFilename } from '../../utils/exportUtils';
import { exportBudgetReportToPDF } from '../../utils/pdfExport';

// Service temporaire pour la démo
const BudgetAdvancedService = {
  getKPIsBudgetaires: async (): Promise<{
    totalBudget: number;
    totalEngage: number;
    totalRealise: number;
    totalDisponible: number;
    tauxEngagement: number;
    tauxRealisation: number;
    tauxDisponible: number;
    lignesEnAlerte: number;
    lignesEnDepassement: number;
    virementsEnAttente: number;
    dernierMiseAJour: string;
  }> => ({
    totalBudget: 25000000,
    totalEngage: 18000000,
    totalRealise: 15000000,
    totalDisponible: 7000000,
    tauxEngagement: 72,
    tauxRealisation: 60,
    tauxDisponible: 28,
    lignesEnAlerte: 8,
    lignesEnDepassement: 3,
    virementsEnAttente: 2,
    dernierMiseAJour: '2025-10-23T15:30:00'
  })
};

/**
 * Module Gestion Budgétaire Avancé
 * Conforme IPSAS 24 - Présentation de l'information budgétaire dans les états financiers
 * 
 * FONCTIONNALITÉS:
 * - Dashboard KPIs avec analyses
 * - Allocation et suivi budgétaire
 * - Virements de crédits
 * - Révisions budgétaires
 * - Analyses d'écarts (favorable/défavorable)
 * - Rapports conformes IPSAS 24
 * - Alertes automatiques
 */

type TabKey = 'dashboard' | 'allocation' | 'realisation' | 'controle' | 'justification' | 'approbation' | 'reports' | 'virements' | 'revisions' | 'execution';

// Type pour les KPIs budgétaires

interface KPIsBudgetaires {
  totalBudgetInitial: number;
  totalBudgetRevise: number;
  totalEngagement: number;
  totalRealisation: number;
  totalDisponible: number;
  tauxEngagement: number;
  tauxRealisation: number;
  tauxDisponibilite: number;
  lignesAlerte: number;
  lignesDepassement: number;
  revisionBudgetaire: number;
}

interface LigneBudgetaire {
  id: string;
  code: string;
  libelle: string;
  budgetInitial: number;
  budgetRevise: number;
  realisation: number;
  ecart: number;
  pourcentageRealisation: number;
  engagement: number;
  disponible: number;
  pourcentageEngagement: number;
  statut: 'En attente' | 'Approuvé' | 'Rejeté';
}

interface RubriqueBudgetaire {
  id: string;
  nom: string;
  categorie: 'Fonctionnement' | 'Personnel' | 'Investissement' | 'Transfert';
  lignes: LigneBudgetaire[];
  totalBudget: number;
  totalRealisation: number;
  totalEngagement: number;
  totalDisponible: number;
  totalEcart: number;
  tauxExecution: number;
}

interface VirementBudgetaire {
  id: string;
  date: string;
  reference: string;
  ligneSource: string;
  ligneDestination: string;
  montant: number;
  motif: string;
  statut: 'En attente' | 'Approuvé' | 'Rejeté';
  demandeur: string;
  approbateur?: string;
}

interface RevisionBudgetaire {
  id: string;
  date: string;
  type: 'Augmentation' | 'Diminution' | 'Réaffectation';
  lignesBudgetaires: string[];
  montantTotal: number;
  motif: string;
  statut: 'Brouillon' | 'Soumis' | 'Approuvé' | 'Rejeté';
  documents: string[];
}

// Données de démonstration
const rubriquesBudgetaires: RubriqueBudgetaire[] = [
  {
    id: "personnel",
    nom: "Personnel",
    categorie: 'Personnel',
    totalBudget: 5000000,
    totalRealisation: 4200000,
    totalEcart: 800000,
    totalEngagement: 4500000,
    totalDisponible: 500000,
    tauxExecution: 84,
    lignes: [
      { 
        id: "1", 
        code: "211", 
        libelle: "Salaires et appointements", 
        budgetInitial: 5000000, 
        budgetRevise: 5000000, 
        realisation: 4200000, 
        ecart: 800000, 
        pourcentageRealisation: 84,
        engagement: 4500000,
        disponible: 500000,
        pourcentageEngagement: 90,
        statut: 'Approuvé'
      },
      { 
        id: "2", 
        code: "212", 
        libelle: "Charges sociales", 
        budgetInitial: 750000, 
        budgetRevise: 750000, 
        realisation: 630000, 
        ecart: 120000, 
        pourcentageRealisation: 84,
        engagement: 700000,
        disponible: 50000,
        pourcentageEngagement: 93.33,
        statut: 'Approuvé'
      },
      { 
        id: "3", 
        code: "213", 
        libelle: "Indemnités et primes", 
        budgetInitial: 300000, 
        budgetRevise: 300000, 
        realisation: 250000, 
        ecart: 50000, 
        pourcentageRealisation: 83.33,
        engagement: 280000,
        disponible: 20000,
        pourcentageEngagement: 93.33,
        statut: 'Approuvé'
      }
    ]
  },
  {
    id: "voyage",
    nom: "Voyage",
    categorie: 'Fonctionnement',
    totalBudget: 300000,
    totalRealisation: 230000,
    totalEcart: 70000,
    totalEngagement: 270000,
    totalDisponible: 30000,
    tauxExecution: 76.67,
    lignes: [
      { 
        id: "4", 
        code: "221", 
        libelle: "Frais de déplacement", 
        budgetInitial: 200000, 
        budgetRevise: 200000, 
        realisation: 150000, 
        ecart: 50000, 
        pourcentageRealisation: 75,
        engagement: 180000,
        disponible: 20000,
        pourcentageEngagement: 90,
        statut: 'Approuvé'
      },
      { 
        id: "5", 
        code: "222", 
        libelle: "Frais de mission", 
        budgetInitial: 100000, 
        budgetRevise: 100000, 
        realisation: 80000, 
        ecart: 20000, 
        pourcentageRealisation: 80,
        engagement: 90000,
        disponible: 10000,
        pourcentageEngagement: 90,
        statut: 'Approuvé'
      }
    ]
  },
  {
    id: "equipement",
    nom: "Équipement",
    categorie: 'Investissement',
    totalBudget: 1150000,
    totalRealisation: 1020000,
    totalEcart: 130000,
    totalEngagement: 1090000,
    totalDisponible: 60000,
    tauxExecution: 88.7,
    lignes: [
      { 
        id: "6", 
        code: "231", 
        libelle: "Achat d'équipements", 
        budgetInitial: 1000000, 
        budgetRevise: 1000000, 
        realisation: 900000, 
        ecart: 100000, 
        pourcentageRealisation: 90,
        engagement: 950000,
        disponible: 50000,
        pourcentageEngagement: 95,
        statut: 'Approuvé'
      },
      { 
        id: "7", 
        code: "232", 
        libelle: "Maintenance équipements", 
        budgetInitial: 150000, 
        budgetRevise: 150000, 
        realisation: 120000, 
        ecart: 30000, 
        pourcentageRealisation: 80,
        engagement: 140000,
        disponible: 10000,
        pourcentageEngagement: 93.33,
        statut: 'Approuvé'
      }
    ]
  },
  {
    id: "investissement",
    nom: "Investissement",
    categorie: 'Investissement',
    totalBudget: 2500000,
    totalRealisation: 2250000,
    totalEcart: 250000,
    totalEngagement: 2380000,
    totalDisponible: 120000,
    tauxExecution: 90,
    lignes: [
      { 
        id: "8", 
        code: "241", 
        libelle: "Investissements immobiliers", 
        budgetInitial: 2000000, 
        budgetRevise: 2000000, 
        realisation: 1800000, 
        ecart: 200000, 
        pourcentageRealisation: 90,
        engagement: 1900000,
        disponible: 100000,
        pourcentageEngagement: 95,
        statut: 'Approuvé'
      },
      { 
        id: "9", 
        code: "242", 
        libelle: "Investissements mobiliers", 
        budgetInitial: 500000, 
        budgetRevise: 500000, 
        realisation: 450000, 
        ecart: 50000, 
        pourcentageRealisation: 90,
        engagement: 480000,
        disponible: 20000,
        pourcentageEngagement: 96,
        statut: 'Approuvé'
      }
    ]
  },
  {
    id: "activites",
    nom: "Activités ordinaires",
    categorie: 'Fonctionnement',
    totalBudget: 500000,
    totalRealisation: 460000,
    totalEcart: 40000,
    totalEngagement: 480000,
    totalDisponible: 20000,
    tauxExecution: 92,
    lignes: [
      { 
        id: "10", 
        code: "251", 
        libelle: "Fonctionnement général", 
        budgetInitial: 300000, 
        budgetRevise: 300000, 
        realisation: 280000, 
        ecart: 20000, 
        pourcentageRealisation: 93.33,
        engagement: 290000,
        disponible: 10000,
        pourcentageEngagement: 96.67,
        statut: 'Approuvé'
      },
      { 
        id: "11", 
        code: "252", 
        libelle: "Formation du personnel", 
        budgetInitial: 200000, 
        budgetRevise: 200000, 
        realisation: 180000, 
        ecart: 20000, 
        pourcentageRealisation: 90,
        engagement: 190000,
        disponible: 10000,
        pourcentageEngagement: 95,
        statut: 'Approuvé'
      }
    ]
  }
];

// Composant pour l'allocation budgétaire
const AllocationBudgetaire = () => {
  const [rubriques, setRubriques] = useState(rubriquesBudgetaires);
  void setRubriques;

  const calculerTotaux = () => {
    return rubriques.map(rubrique => {
      const totalBudget = rubrique.lignes.reduce((sum, ligne) => sum + ligne.budgetInitial, 0);
      const totalRealisation = rubrique.lignes.reduce((sum, ligne) => sum + ligne.realisation, 0);
      const totalEcart = totalBudget - totalRealisation;
      
      return {
        ...rubrique,
        totalBudget,
        totalRealisation,
        totalEcart
      };
    });
  };

  const rubriquesAvecTotaux = calculerTotaux();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 text-green-700">Allocation Budgétaire</h3>
        
        {rubriquesAvecTotaux.map((rubrique) => (
          <div key={rubrique.id} className="mb-6 border rounded-lg p-4">
            <h4 className="text-lg font-medium mb-3 text-gray-800">{rubrique.nom}</h4>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Code</th>
                    <th className="border p-2 text-left">Libellé</th>
                    <th className="border p-2 text-right">Budget Initial</th>
                    <th className="border p-2 text-right">Budget Révisé</th>
                    <th className="border p-2 text-right">Réalisation</th>
                    <th className="border p-2 text-right">Écart</th>
                    <th className="border p-2 text-right">% Réalisation</th>
                  </tr>
                </thead>
                <tbody>
                  {rubrique.lignes.map((ligne) => (
                    <tr key={ligne.id}>
                      <td className="border p-2 font-mono">{ligne.code}</td>
                      <td className="border p-2">{ligne.libelle}</td>
                      <td className="border p-2 text-right">{ligne.budgetInitial.toLocaleString()} FCFA</td>
                      <td className="border p-2 text-right">{ligne.budgetRevise.toLocaleString()} FCFA</td>
                      <td className="border p-2 text-right">{ligne.realisation.toLocaleString()} FCFA</td>
                      <td className={`border p-2 text-right ${ligne.ecart >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ligne.ecart.toLocaleString()} FCFA
                      </td>
                      <td className="border p-2 text-right">{ligne.pourcentageRealisation.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border p-2" colSpan={2}>Total {rubrique.nom}</td>
                    <td className="border p-2 text-right">{rubrique.totalBudget.toLocaleString()} FCFA</td>
                    <td className="border p-2 text-right">{rubrique.totalBudget.toLocaleString()} FCFA</td>
                    <td className="border p-2 text-right">{rubrique.totalRealisation.toLocaleString()} FCFA</td>
                    <td className={`border p-2 text-right ${rubrique.totalEcart >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rubrique.totalEcart.toLocaleString()} FCFA
                    </td>
                    <td className="border p-2 text-right">
                      {((rubrique.totalRealisation / rubrique.totalBudget) * 100).toFixed(2)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant pour la réalisation
const RealisationBudgetaire = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-blue-700">Réalisation Budgétaire</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Budget Total</h4>
          <p className="text-2xl font-bold text-green-600">10,500,000 FCFA</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Réalisation</h4>
          <p className="text-2xl font-bold text-blue-600">9,200,000 FCFA</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Écart</h4>
          <p className="text-2xl font-bold text-orange-600">1,300,000 FCFA</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">% Réalisation</h4>
          <p className="text-2xl font-bold text-purple-600">87.62%</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium">Graphique de réalisation par rubrique</h4>
        <div className="space-y-2">
          {rubriquesBudgetaires.map((rubrique) => {
            const totalBudget = rubrique.lignes.reduce((sum, ligne) => sum + ligne.budgetInitial, 0);
            const totalRealisation = rubrique.lignes.reduce((sum, ligne) => sum + ligne.realisation, 0);
            const pourcentage = (totalRealisation / totalBudget) * 100;
            
            return (
              <div key={rubrique.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{rubrique.nom}</span>
                  <span>{pourcentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar-dynamic"
                    {...getProgressDataAttrs(pourcentage)}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Composant pour le contrôle
const ControleBudgetaire = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-red-700">Contrôle Budgétaire</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-medium text-red-800">Dépassements</h4>
            <p className="text-sm text-red-600">3 lignes en dépassement</p>
            <p className="text-lg font-bold text-red-700">450,000 FCFA</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800">Alertes</h4>
            <p className="text-sm text-yellow-600">5 lignes en alerte</p>
            <p className="text-lg font-bold text-yellow-700">80% réalisation</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800">Conformes</h4>
            <p className="text-sm text-green-600">8 lignes conformes</p>
            <p className="text-lg font-bold text-green-700">85% du budget</p>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Tableau de bord de contrôle</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Rubrique</th>
                  <th className="border p-2 text-left">Ligne</th>
                  <th className="border p-2 text-right">Budget</th>
                  <th className="border p-2 text-right">Réalisation</th>
                  <th className="border p-2 text-right">Écart</th>
                  <th className="border p-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rubriquesBudgetaires.flatMap(rubrique => 
                  rubrique.lignes.map(ligne => (
                    <tr key={ligne.id}>
                      <td className="border p-2">{rubrique.nom}</td>
                      <td className="border p-2">{ligne.libelle}</td>
                      <td className="border p-2 text-right">{ligne.budgetInitial.toLocaleString()} FCFA</td>
                      <td className="border p-2 text-right">{ligne.realisation.toLocaleString()} FCFA</td>
                      <td className={`border p-2 text-right ${ligne.ecart >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ligne.ecart.toLocaleString()} FCFA
                      </td>
                      <td className="border p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ligne.pourcentageRealisation > 100 
                            ? 'bg-red-100 text-red-800' 
                            : ligne.pourcentageRealisation > 90 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ligne.pourcentageRealisation > 100 ? 'Dépassement' : 
                           ligne.pourcentageRealisation > 90 ? 'Alerte' : 'Conforme'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour la justification des écarts
const JustificationEcarts = () => {
  const [justifications, setJustifications] = useState([
    {
      id: "1",
      rubrique: "Personnel",
      ligne: "Salaires et appointements",
      ecart: 800000,
      typeEcart: "Défavorable",
      justification: "Augmentation des effectifs non prévue au budget initial",
      actionCorrective: "Demande de révision budgétaire pour l'exercice suivant",
      statut: "En cours"
    },
    {
      id: "2",
      rubrique: "Voyage",
      ligne: "Frais de déplacement",
      ecart: 50000,
      typeEcart: "Défavorable",
      justification: "Mission d'urgence non programmée",
      actionCorrective: "Renforcement des procédures de planification",
      statut: "Traité"
    }
  ]);
  void setJustifications;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-orange-700">Justification des Écarts</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-800">Écarts Défavorables</h4>
            <p className="text-2xl font-bold text-orange-600">850,000 FCFA</p>
            <p className="text-sm text-orange-600">2 justifications</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Écarts Favorables</h4>
            <p className="text-2xl font-bold text-green-600">450,000 FCFA</p>
            <p className="text-sm text-green-600">3 justifications</p>
          </div>
        </div>

        <div className="space-y-4">
          {justifications.map((justification) => (
            <div key={justification.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{justification.rubrique} - {justification.ligne}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  justification.statut === 'Traité' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {justification.statut}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Écart:</span> {justification.ecart.toLocaleString()} FCFA</p>
                  <p><span className="font-medium">Type:</span> {justification.typeEcart}</p>
                </div>
                <div>
                  <p><span className="font-medium">Justification:</span> {justification.justification}</p>
                  <p><span className="font-medium">Action corrective:</span> {justification.actionCorrective}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
            Ajouter une justification
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant pour l'approbation
const ApprobationBudgetaire = () => {
  const [approbations, setApprobations] = useState([
    {
      id: "1",
      niveau: "Direction Financière",
      approbateur: "M. DIALLO",
      date: "2024-01-15",
      statut: "Approuvé",
      commentaire: "Budget conforme aux orientations stratégiques"
    },
    {
      id: "2",
      niveau: "Direction Générale",
      approbateur: "Mme TRAORE",
      date: "2024-01-20",
      statut: "En attente",
      commentaire: "En cours d'examen"
    }
  ]);
  void setApprobations;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4 text-purple-700">Approbation Budgétaire</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Approuvés</h4>
            <p className="text-2xl font-bold text-green-600">1</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800">En attente</h4>
            <p className="text-2xl font-bold text-yellow-600">1</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800">Rejetés</h4>
            <p className="text-2xl font-bold text-red-600">0</p>
          </div>
        </div>

        <div className="space-y-4">
          {approbations.map((approbation) => (
            <div key={approbation.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{approbation.niveau}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  approbation.statut === 'Approuvé' ? 'bg-green-100 text-green-800' : 
                  approbation.statut === 'Rejeté' ? 'bg-red-100 text-red-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {approbation.statut}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Approbateur:</span> {approbation.approbateur}</p>
                  <p><span className="font-medium">Date:</span> {approbation.date}</p>
                </div>
                <div>
                  <p><span className="font-medium">Commentaire:</span> {approbation.commentaire}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Approuver
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            Rejeter
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Ajouter commentaire
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant Virements Budgétaires - Utilisé dynamiquement dans le rendu
// @ts-ignore - Ignorer l'erreur de non-utilisation car utilisé dynamiquement
const VirementsBudgetaires = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [virements, _setVirements] = useState<VirementBudgetaire[]>([
    {
      id: '1',
      date: '2025-10-20',
      reference: 'VIR-2025-001',
      ligneSource: 'Personnel - Salaires',
      ligneDestination: 'Fonctionnement - Fournitures',
      montant: 500000,
      motif: 'Réaffectation pour urgence administrative',
      statut: 'En attente',
      demandeur: 'Jean KABILA'
    },
    {
      id: '2',
      date: '2025-10-18',
      reference: 'VIR-2025-002',
      ligneSource: 'Investissement - Équipements',
      ligneDestination: 'Personnel - Primes',
      montant: 300000,
      motif: 'Ajustement budgétaire trimestriel',
      statut: 'Approuvé',
      demandeur: 'Marie TSHISEKEDI',
      approbateur: 'Directeur Financier'
    },
    {
      id: '3',
      date: '2025-10-15',
      reference: 'VIR-2025-003',
      ligneSource: 'Fonctionnement - Formation',
      ligneDestination: 'Investissement - Véhicules',
      montant: 800000,
      motif: 'Acquisition urgente véhicule service',
      statut: 'Rejeté',
      demandeur: 'Paul MUKENDI',
      approbateur: 'Directeur Général'
    }
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showModal, setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedVirement, _setSelectedVirement] = useState<VirementBudgetaire | null>(null);

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'En attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approuvé':
        return 'bg-green-100 text-green-800';
      case 'Rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statsVirements = {
    enAttente: virements.filter(v => v.statut === 'En attente').length,
    approuves: virements.filter(v => v.statut === 'Approuvé').length,
    rejetes: virements.filter(v => v.statut === 'Rejeté').length,
    montantTotal: virements.reduce((sum, v) => sum + v.montant, 0)
  };

  return (
    <div className="space-y-6">
      {/* KPIs Virements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">En Attente</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{statsVirements.enAttente}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Approuvés</h4>
          </div>
          <p className="text-3xl font-bold text-green-700">{statsVirements.approuves}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Rejetés</h4>
          </div>
          <p className="text-3xl font-bold text-red-700">{statsVirements.rejetes}</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-800">Montant Total</h4>
          </div>
          <p className="text-2xl font-bold text-blue-700">{statsVirements.montantTotal.toLocaleString()} CDF</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Virement
        </button>
        <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Tableau des virements */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Référence</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Ligne Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Ligne Destination</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Montant</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Statut</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {virements.map((virement) => (
                <tr key={virement.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{virement.reference}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(virement.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{virement.ligneSource}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{virement.ligneDestination}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {virement.montant.toLocaleString()} CDF
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutBadge(virement.statut)}`}>
                      {virement.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => {
                        console.log('Virement sélectionné:', virement);
                      }}
                      aria-label={`Voir les détails du virement ${virement.reference}`}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Composant Révisions Budgétaires - Utilisé dynamiquement dans le rendu
// @ts-ignore - Ignorer l'erreur de non-utilisation car utilisé dynamiquement
const RevisionsBudgetaires = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [revisions, _setRevisions] = useState<RevisionBudgetaire[]>([
    {
      id: '1',
      date: '2025-10-22',
      type: 'Augmentation',
      lignesBudgetaires: ['Personnel - Salaires', 'Personnel - Charges sociales'],
      montantTotal: 1000000,
      motif: 'Augmentation des effectifs',
      statut: 'Soumis',
      documents: ['justificatif_recrutement.pdf', 'decision_dg.pdf']
    },
    {
      id: '2',
      date: '2025-10-15',
      type: 'Diminution',
      lignesBudgetaires: ['Fonctionnement - Formation'],
      montantTotal: -500000,
      motif: 'Réduction des activités de formation',
      statut: 'Approuvé',
      documents: ['note_service.pdf']
    },
    {
      id: '3',
      date: '2025-10-10',
      type: 'Réaffectation',
      lignesBudgetaires: ['Investissement - Équipements', 'Investissement - Véhicules'],
      montantTotal: 2000000,
      motif: 'Réorientation stratégique des investissements',
      statut: 'Brouillon',
      documents: []
    }
  ]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Augmentation':
        return 'bg-green-100 text-green-800';
      case 'Diminution':
        return 'bg-red-100 text-red-800';
      case 'Réaffectation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'Brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'Soumis':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approuvé':
        return 'bg-green-100 text-green-800';
      case 'Rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statsRevisions = {
    brouillons: revisions.filter(r => r.statut === 'Brouillon').length,
    soumis: revisions.filter(r => r.statut === 'Soumis').length,
    approuves: revisions.filter(r => r.statut === 'Approuvé').length,
    rejetes: revisions.filter(r => r.statut === 'Rejeté').length
  };

  return (
    <div className="space-y-6">
      {/* KPIs Révisions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Edit className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-800">Brouillons</h4>
          </div>
          <p className="text-3xl font-bold text-gray-700">{statsRevisions.brouillons}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Soumis</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{statsRevisions.soumis}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Approuvés</h4>
          </div>
          <p className="text-3xl font-bold text-green-700">{statsRevisions.approuves}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Rejetés</h4>
          </div>
          <p className="text-3xl font-bold text-red-700">{statsRevisions.rejetes}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          Nouvelle Révision
        </button>
        <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exporter
        </button>
      </div>

      {/* Liste des révisions */}
      <div className="space-y-4">
        {revisions.map((revision) => (
          <div key={revision.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Révision {revision.date}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeBadge(revision.type)}`}>
                    {revision.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutBadge(revision.statut)}`}>
                    {revision.statut}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{revision.motif}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    <span className="font-medium">Montant:</span> {Math.abs(revision.montantTotal).toLocaleString()} CDF
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium">Lignes:</span> {revision.lignesBudgetaires.length}
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium">Documents:</span> {revision.documents.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  aria-label={`Voir les détails de la révision du ${new Date(revision.date).toLocaleDateString()}`}
                  title="Voir les détails"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {revision.statut === 'Brouillon' && (
                  <button 
                    aria-label={`Modifier la révision du ${new Date(revision.date).toLocaleDateString()}`}
                    title="Modifier"
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Lignes budgétaires concernées */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Lignes budgétaires concernées:</p>
              <div className="flex flex-wrap gap-2">
                {revision.lignesBudgetaires.map((ligne, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {ligne}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard KPIs Component
const DashboardKPIs = ({ kpis, loading }: { kpis: KPIsBudgetaires | null; loading: boolean }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!kpis) return null;

  return (
    <div className="space-y-6">
      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded">Budget</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Budget Révisé</h3>
          <p className="text-2xl font-bold text-blue-700">{kpis.totalBudgetRevise.toLocaleString()} CDF</p>
          <p className="text-xs text-gray-500 mt-1">
            Initial: {kpis.totalBudgetInitial.toLocaleString()} CDF
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-600" />
            <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded">Engagement</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Engagements</h3>
          <p className="text-2xl font-bold text-green-700">{kpis.totalEngagement.toLocaleString()} CDF</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Taux</span>
              <span className="font-medium">{kpis.tauxEngagement.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpis.tauxEngagement, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded">Réalisation</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Réalisations</h3>
          <p className="text-2xl font-bold text-purple-700">{kpis.totalRealisation.toLocaleString()} CDF</p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Taux</span>
              <span className="font-medium">{kpis.tauxRealisation.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(kpis.tauxRealisation, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-8 h-8 text-orange-600" />
            <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded">Disponible</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Crédits Disponibles</h3>
          <p className="text-2xl font-bold text-orange-700">{kpis.totalDisponible.toLocaleString()} CDF</p>
          <p className="text-xs text-gray-500 mt-1">
            {kpis.tauxDisponibilite.toFixed(1)}% du budget
          </p>
        </div>
      </div>

      {/* Alertes et Révisions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Lignes en Alerte</h4>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{kpis.lignesAlerte}</p>
          <p className="text-xs text-yellow-600 mt-1">
            Taux &gt; 95%
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-800">Dépassements</h4>
          </div>
          <p className="text-3xl font-bold text-red-700">{kpis.lignesDepassement}</p>
          <p className="text-xs text-red-600 mt-1">
            Taux &gt; 100%
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h4 className="font-medium text-indigo-800">Révision Budgétaire</h4>
          </div>
          <p className="text-3xl font-bold text-indigo-700">{kpis.revisionBudgetaire.toLocaleString()} CDF</p>
          <p className="text-xs text-indigo-600 mt-1">
            Révisé - Initial
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={() => exportBudgetReportToPDF({
            lignes: [],
            totaux: {
              budgetInitial: kpis.totalBudgetInitial,
              budgetRevise: kpis.totalBudgetRevise,
              realisation: kpis.totalRealisation,
              engagement: kpis.totalEngagement,
              disponible: kpis.totalDisponible
            },
            exercice: '2025'
          })}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
          <FileText className="w-4 h-4" />
          Rapport Complet
        </button>
      </div>
    </div>
  );
};

// Composant principal BudgetModule
const BudgetModule = () => {
  const [ongletActif, setOngletActif] = useState<TabKey>('dashboard');
  const [kpis, setKPIs] = useState<KPIsBudgetaires | null>(null);
  const [loading, setLoading] = useState(false);
  const [exercice] = useState('2025');
  
  // États pour les modals
  const [showNewLigneModal, setShowNewLigneModal] = useState(false);
  const [showVirementModal, setShowVirementModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  
  // États pour les formulaires
  const [newLigne, setNewLigne] = useState({
    code: '',
    libelle: '',
    budgetInitial: 0,
    categorie: 'Fonctionnement' as 'Fonctionnement' | 'Personnel' | 'Investissement' | 'Transfert',
    entite: ''
  });
  
  const [newVirement, setNewVirement] = useState({
    ligneSource: '',
    ligneDestination: '',
    montant: 0,
    justification: ''
  });
  
  const [newRevision, setNewRevision] = useState({
    type: 'Augmentation' as 'Augmentation' | 'Diminution' | 'Réaffectation',
    lignesBudgetaires: [] as string[],
    montant: 0,
    justification: '',
    documents: [] as string[]
  });
  
  const [newEngagement, setNewEngagement] = useState({
    ligneBudgetaire: '',
    montant: 0,
    beneficiaire: '',
    date: new Date().toISOString().split('T')[0],
    reference: ''
  });

  useEffect(() => {
    loadKPIs();
  }, [exercice]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await BudgetAdvancedService.getKPIsBudgetaires();
      setKPIs({
        totalBudgetInitial: data.totalBudget,
        totalBudgetRevise: data.totalBudget,
        totalEngagement: data.totalEngage,
        totalRealisation: data.totalRealise,
        totalDisponible: data.totalDisponible,
        tauxEngagement: data.tauxEngagement,
        tauxRealisation: data.tauxRealisation,
        tauxDisponibilite: data.tauxDisponible,
        lignesAlerte: data.lignesEnAlerte,
        lignesDepassement: data.lignesEnDepassement,
        revisionBudgetaire: 0 // Valeur par défaut
      });
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onglets: { id: TabKey; label: string; icon: JSX.Element }[] = [
    { id: "allocation", label: "Allocation", icon: <DollarSign className="w-4 h-4" /> },
    { id: "realisation", label: "Réalisation", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "controle", label: "Contrôle", icon: <AlertCircle className="w-4 h-4" /> },
    { id: "justification", label: "Justification", icon: <FileText className="w-4 h-4" /> },
    { id: "approbation", label: "Approbation", icon: <CheckCircle className="w-4 h-4" /> }
  ];

  const renderContenu = () => {
    switch (ongletActif) {
      case 'dashboard':
        return <DashboardKPIs kpis={kpis} loading={loading} />;
      case 'allocation':
        return <AllocationBudgetaire />;
      case 'realisation':
        return <RealisationBudgetaire />;
      case 'controle':
        return <ControleBudgetaire />;
      case 'justification':
        return <JustificationEcarts />;
      case 'approbation':
        return <ApprobationBudgetaire />;
      case "reports":
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Rapports Budgétaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => exportBudgetReportToPDF({
                    lignes: [],
                    totaux: kpis ? {
                      budgetInitial: kpis.totalBudgetInitial,
                      budgetRevise: kpis.totalBudgetRevise,
                      realisation: kpis.totalRealisation,
                      engagement: kpis.totalEngagement,
                      disponible: kpis.totalDisponible
                    } : {
                      budgetInitial: 0,
                      budgetRevise: 0,
                      realisation: 0,
                      engagement: 0,
                      disponible: 0
                    },
                    exercice: '2025'
                  })}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors"
                >
                  <FileText className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Rapport d'Exécution Budgétaire</p>
                    <p className="text-sm text-red-100">Conforme IPSAS 24 - Format PDF</p>
                  </div>
                </button>
                <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors">
                  <BarChart3 className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Analyse des Écarts</p>
                    <p className="text-sm text-green-100">Favorable vs Défavorable</p>
                  </div>
                </button>
                <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors">
                  <PieChart className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Répartition par Catégorie</p>
                    <p className="text-sm text-blue-100">Personnel, Fonctionnement, Investissement</p>
                  </div>
                </button>
                <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg transition-colors">
                  <Download className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Export Excel Complet</p>
                    <p className="text-sm text-indigo-100">Toutes les données détaillées</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Onglet non reconnu</div>;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Target className="w-8 h-8" />
                Gestion Budgétaire
              </h1>
              <p className="text-green-100 mt-1">
                Conforme IPSAS 24 - Présentation de l'information budgétaire
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(ongletActif === 'allocation') && (
                <button 
                  onClick={() => setShowNewLigneModal(true)}
                  className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle Ligne
                </button>
              )}
              {(ongletActif === 'virements') && (
                <button 
                  onClick={() => setShowVirementModal(true)}
                  className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau Virement
                </button>
              )}
              {(ongletActif === 'revisions') && (
                <button 
                  onClick={() => setShowRevisionModal(true)}
                  className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle Révision
                </button>
              )}
              {ongletActif === 'execution' && (
                <button 
                  onClick={() => setShowEngagementModal(true)}
                  className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Nouvel Engagement
                </button>
              )}
              <button 
                onClick={loadKPIs}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Navigation par onglets */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 px-4">
              {onglets.map((onglet) => (
                <button
                  key={onglet.id}
                  onClick={() => setOngletActif(onglet.id)}
                  className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-all ${
                    ongletActif === onglet.id
                      ? 'border-green-500 text-green-600 bg-green-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {onglet.icon}
                  {onglet.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu de l'onglet actif */}
        {renderContenu()}
      </div>
      </div>

      {/* Modal Nouvelle Ligne Budgétaire */}
      {showNewLigneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Plus className="h-6 w-6 mr-2 text-green-600" />
              Nouvelle Ligne Budgétaire
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                  <div className="flex flex-col">
                    <label htmlFor="code-ligne" className="text-sm font-medium text-gray-700 mb-1">
                      Code de la ligne budgétaire <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="code-ligne"
                      type="text"
                      value={newLigne.code}
                      onChange={(e) => setNewLigne({...newLigne, code: e.target.value})}
                      placeholder="Ex: 6211"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      aria-required="true"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="categorie-ligne" className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select
                    id="categorie-ligne"
                    value={newLigne.categorie}
                    onChange={(e) => setNewLigne({...newLigne, categorie: e.target.value as any})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Fonctionnement">Fonctionnement</option>
                    <option value="Personnel">Personnel</option>
                    <option value="Investissement">Investissement</option>
                    <option value="Transfert">Transfert</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="libelle-ligne" className="block text-sm font-medium text-gray-700 mb-2">Libellé *</label>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Libellé de la ligne budgétaire <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="libelle-ligne"
                    type="text"
                    value={newLigne.libelle}
                    onChange={(e) => setNewLigne({...newLigne, libelle: e.target.value})}
                    placeholder="Ex: Salaires et traitements"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budgetinitial-ligne" className="block text-sm font-medium text-gray-700 mb-2">Budget Initial (FCFA) *</label>
                  <input
                    id="budgetinitial-ligne"
                    type="number"
                    value={newLigne.budgetInitial}
                    onChange={(e) => setNewLigne({...newLigne, budgetInitial: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="entite-ligne" className="block text-sm font-medium text-gray-700 mb-2">Entité *</label>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      Code entité
                    </label>
                    <input
                      id="entite-ligne"
                      type="text"
                      value={newLigne.entite}
                      onChange={(e) => setNewLigne({...newLigne, entite: e.target.value})}
                      placeholder="Ex: MIN-BUDGET"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>IPSAS 24:</strong> Chaque ligne budgétaire doit avoir un code unique et un montant initial positif.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewLigneModal(false);
                  setNewLigne({ code: '', libelle: '', budgetInitial: 0, categorie: 'Fonctionnement', entite: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle ligne:', newLigne);
                  setShowNewLigneModal(false);
                  setNewLigne({ code: '', libelle: '', budgetInitial: 0, categorie: 'Fonctionnement', entite: '' });
                }}
                disabled={!newLigne.code || !newLigne.libelle || newLigne.budgetInitial <= 0 || !newLigne.entite}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-medium"
              >
                Créer la Ligne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Virement Budgétaire */}
      {showVirementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <ArrowRightLeft className="h-6 w-6 mr-2 text-blue-600" />
              Nouveau Virement Budgétaire
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ligne-source-virement" className="block text-sm font-medium text-gray-700 mb-2">Ligne Source *</label>
                  <select
                    id="ligne-source-virement"
                    value={newVirement.ligneSource}
                    onChange={(e) => setNewVirement({...newVirement, ligneSource: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="6211">6211 - Salaires et traitements</option>
                    <option value="6221">6221 - Primes et gratifications</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ligne-destination-virement" className="block text-sm font-medium text-gray-700 mb-2">Ligne Destination *</label>
                  <select
                    id="ligne-destination-virement"
                    value={newVirement.ligneDestination}
                    onChange={(e) => setNewVirement({...newVirement, ligneDestination: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="6211">6211 - Salaires et traitements</option>
                    <option value="6221">6221 - Primes et gratifications</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="montant-virement" className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                <input
                  id="montant-virement"
                  type="number"
                  value={newVirement.montant}
                  onChange={(e) => setNewVirement({...newVirement, montant: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="justification-virement" className="block text-sm font-medium text-gray-700 mb-2">Justification *</label>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Justification du virement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="justification-virement"
                    value={newVirement.justification}
                    onChange={(e) => setNewVirement({...newVirement, justification: e.target.value})}
                    rows={4}
                    placeholder="Motif du virement..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Contrôle:</strong> Le crédit disponible de la ligne source doit être supérieur ou égal au montant du virement.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowVirementModal(false);
                  setNewVirement({ ligneSource: '', ligneDestination: '', montant: 0, justification: '' });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouveau virement:', newVirement);
                  setShowVirementModal(false);
                  setNewVirement({ ligneSource: '', ligneDestination: '', montant: 0, justification: '' });
                }}
                disabled={!newVirement.ligneSource || !newVirement.ligneDestination || newVirement.montant <= 0 || !newVirement.justification}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium"
              >
                Soumettre le Virement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Révision Budgétaire */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Edit className="h-6 w-6 mr-2 text-purple-600" />
              Nouvelle Révision Budgétaire
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="type-revision" className="block text-sm font-medium text-gray-700 mb-2">Type de révision *</label>
                <select
                  id="type-revision"
                  value={newRevision.type}
                  onChange={(e) => setNewRevision({...newRevision, type: e.target.value as any})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  aria-label="Type de révision"
                >
                  <option value="Augmentation">Augmentation</option>
                  <option value="Diminution">Diminution</option>
                  <option value="Réaffectation">Réaffectation</option>
                </select>
              </div>
              <div>
                <label htmlFor="montant-revision" className="block text-sm font-medium text-gray-700 mb-2">Montant total (FCFA) *</label>
                <input
                  id="montant-revision"
                  type="number"
                  value={newRevision.montant}
                  onChange={(e) => setNewRevision({...newRevision, montant: parseFloat(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="justification-revision" className="block text-sm font-medium text-gray-700 mb-2">Justification *</label>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Justification de la révision <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="justification-revision"
                    value={newRevision.justification}
                    onChange={(e) => setNewRevision({...newRevision, justification: e.target.value})}
                    rows={4}
                    placeholder="Motif de la révision budgétaire..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    aria-required="true"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="documents-revision" className="block text-sm font-medium text-gray-700 mb-2">Documents justificatifs</label>
                <input
                  id="documents-revision"
                  type="file"
                  multiple
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, Word, Excel</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>IPSAS 24:</strong> Toute révision budgétaire doit être documentée et approuvée selon le workflow hiérarchique.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setNewRevision({ type: 'Augmentation', lignesBudgetaires: [], montant: 0, justification: '', documents: [] });
                }}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  console.log('Nouvelle révision:', newRevision);
                  setShowRevisionModal(false);
                  setNewRevision({ type: 'Augmentation', lignesBudgetaires: [], montant: 0, justification: '', documents: [] });
                }}
                disabled={newRevision.montant <= 0 || !newRevision.justification}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 font-medium"
              >
                Soumettre la Révision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Engagement Budgétaire */}
      {showEngagementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="h-6 w-6 mr-2 text-orange-600" />
              Nouvel Engagement Budgétaire
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="ligne-budgetaire-engagement" className="block text-sm font-medium text-gray-700 mb-2">Ligne budgétaire *</label>
                <select
                  id="ligne-budgetaire-engagement"
                  value={newEngagement.ligneBudgetaire}
                  onChange={(e) => setNewEngagement({...newEngagement, ligneBudgetaire: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  aria-label="Ligne budgétaire"
                >
                  <option value="">Sélectionner...</option>
                  <option value="6211">6211 - Salaires et traitements</option>
                  <option value="6221">6221 - Primes et gratifications</option>
                  <option value="6241">6241 - Fournitures de bureau</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="montant-engagement" className="block text-sm font-medium text-gray-700 mb-2">Montant (FCFA) *</label>
                  <input
                    id="montant-engagement"
                    type="number"
                    value={newEngagement.montant}
                    onChange={(e) => setNewEngagement({...newEngagement, montant: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="date-engagement" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    id="date-engagement"
                    type="date"
                    value={newEngagement.date}
                    onChange={(e) => setNewEngagement({...newEngagement, date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="beneficiaire-engagement" className="block text-sm font-medium text-gray-700 mb-2">Bénéficiaire *</label>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Bénéficiaire <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="beneficiaire-engagement"
                    type="text"
                    value={newEngagement.beneficiaire}
                    onChange={(e) => setNewEngagement({...newEngagement, beneficiaire: e.target.value})}
                    placeholder="Nom du fournisseur ou bénéficiaire"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    aria-required="true"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
                <div className="flex flex-col">
                  <label htmlFor="reference-engagement" className="text-sm font-medium text-gray-700 mb-1">
                    Référence <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reference-engagement"
                    type="text"
                    value={newEngagement.reference}
                    onChange={(e) => setNewEngagement({...newEngagement, reference: e.target.value})}
                    placeholder="Numéro de bon de commande ou référence"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEngagementModal(false);
                    setNewEngagement({ ligneBudgetaire: '', montant: 0, beneficiaire: '', date: new Date().toISOString().split('T')[0], reference: '' });
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    console.log('Nouvel engagement:', newEngagement);
                    setShowEngagementModal(false);
                    setNewEngagement({ ligneBudgetaire: '', montant: 0, beneficiaire: '', date: new Date().toISOString().split('T')[0], reference: '' });
                  }}
                  disabled={!newEngagement.ligneBudgetaire || newEngagement.montant <= 0 || !newEngagement.beneficiaire}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 font-medium"
                >
                  Créer l'Engagement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BudgetModule;
