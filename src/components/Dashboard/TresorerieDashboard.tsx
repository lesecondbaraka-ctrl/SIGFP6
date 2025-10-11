import React, { useMemo } from 'react';
import { formatMontant } from '../../services/formatMontant';
import { useDevise } from '../../hooks/useDevise';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ActivityIcon } from 'lucide-react';
import { StatCard } from './StatCard';
import { RecentOperationsTable } from './RecentOperationsTable';
import { LigneFluxTresorerie } from '../../types/tresorerie';

interface TresorerieDashboardProps {
  fluxFonctionnement: LigneFluxTresorerie[];
  fluxInvestissement: LigneFluxTresorerie[];
  fluxFinancement: LigneFluxTresorerie[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const TresorerieDashboard: React.FC<TresorerieDashboardProps> = ({
  fluxFonctionnement,
  fluxInvestissement,
  fluxFinancement
}) => {
  const { devise, toggleDevise, formatMontantDevise } = useDevise();
  
  // Bouton pour changer de devise
  const DeviseToggle = () => (
    <button
      onClick={toggleDevise}
      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-sm font-medium"
    >
      {devise === 'USD' ? 'Voir en CDF' : 'Voir en USD'}
    </button>
  );
  // Préparation des données pour le graphique d'évolution des flux
  const preparerDonneesEvolution = () => {
    const tousLesFlux = [...fluxFonctionnement, ...fluxInvestissement, ...fluxFinancement]
      .sort((a, b) => new Date(a.date_operation).getTime() - new Date(b.date_operation).getTime());

    const donnees = new Map();
    let soldeProgressif = 0;

    tousLesFlux.forEach(flux => {
      const date = new Date(flux.date_operation).toLocaleDateString();
      const montant = flux.type_operation === 'RECETTE' ? flux.montant_paye : -flux.montant_paye;
      soldeProgressif += montant;

      if (!donnees.has(date)) {
        donnees.set(date, {
          date,
          solde: soldeProgressif,
          recettes: 0,
          depenses: 0
        });
      }

      const donneesDuJour = donnees.get(date);
      if (flux.type_operation === 'RECETTE') {
        donneesDuJour.recettes += flux.montant_paye;
      } else {
        donneesDuJour.depenses += flux.montant_paye;
      }
    });

    return Array.from(donnees.values());
  };

  // Préparation des données pour le graphique de répartition par nature
  const preparerDonneesRepartition = () => {
    const calculerTotal = (flux: LigneFluxTresorerie[]) =>
      flux.reduce((acc, f) => acc + f.montant_paye, 0);

    return [
      { name: 'Fonctionnement', value: calculerTotal(fluxFonctionnement) },
      { name: 'Investissement', value: calculerTotal(fluxInvestissement) },
      { name: 'Financement', value: calculerTotal(fluxFinancement) }
    ];
  };

  // Préparation des données pour le graphique par nature et type
  const preparerDonneesParNature = () => {
    const calculerTotaux = (flux: LigneFluxTresorerie[]) => ({
      recettes: flux.filter(f => f.type_operation === 'RECETTE')
        .reduce((acc, f) => acc + f.montant_paye, 0),
      depenses: flux.filter(f => f.type_operation === 'DEPENSE')
        .reduce((acc, f) => acc + f.montant_paye, 0)
    });

    return [
      { 
        name: 'Fonctionnement',
        ...calculerTotaux(fluxFonctionnement)
      },
      {
        name: 'Investissement',
        ...calculerTotaux(fluxInvestissement)
      },
      {
        name: 'Financement',
        ...calculerTotaux(fluxFinancement)
      }
    ];
  };

  const donneesEvolution = preparerDonneesEvolution();
  const donneesRepartition = preparerDonneesRepartition();
  const donneesParNature = preparerDonneesParNature();

  // Calcul des statistiques
  const stats = useMemo(() => {
    const tousLesFlux = [...fluxFonctionnement, ...fluxInvestissement, ...fluxFinancement];
    
    const totalRecettes = tousLesFlux
      .filter(f => f.type_operation === 'RECETTE')
      .reduce((acc, f) => acc + f.montant_paye, 0);
    
    const totalDepenses = tousLesFlux
      .filter(f => f.type_operation === 'DEPENSE')
      .reduce((acc, f) => acc + f.montant_paye, 0);

    const soldeCumule = totalRecettes - totalDepenses;

    const variationMensuelle = (() => {
      const maintenant = new Date();
      const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      const fluxDuMois = tousLesFlux.filter(f => new Date(f.date_operation) >= debutMois);
      
      const recettesMois = fluxDuMois
        .filter(f => f.type_operation === 'RECETTE')
        .reduce((acc, f) => acc + f.montant_paye, 0);
      
      const depensesMois = fluxDuMois
        .filter(f => f.type_operation === 'DEPENSE')
        .reduce((acc, f) => acc + f.montant_paye, 0);

      return recettesMois - depensesMois;
    })();

    return {
      totalRecettes,
      totalDepenses,
      soldeCumule,
      variationMensuelle
    };
  }, [fluxFonctionnement, fluxInvestissement, fluxFinancement]);

  // Récupération des opérations récentes
  const operationsRecentes = useMemo(() => {
    return [...fluxFonctionnement, ...fluxInvestissement, ...fluxFinancement]
      .sort((a, b) => new Date(b.date_operation).getTime() - new Date(a.date_operation).getTime())
      .slice(0, 5);
  }, [fluxFonctionnement, fluxInvestissement, fluxFinancement]);

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de devise */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Tableau de bord de la trésorerie</h2>
        <DeviseToggle />
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total des recettes"
          value={formatMontant(formatMontantDevise(stats.totalRecettes), { devise })}
          icon={<TrendingUpIcon className="w-6 h-6 text-green-500" />}
          trend={{
            value: "+100%",
            direction: "up"
          }}
        />
        <StatCard
          title="Total des dépenses"
          value={formatMontant(formatMontantDevise(stats.totalDepenses), { devise })}
          icon={<TrendingDownIcon className="w-6 h-6 text-red-500" />}
          trend={{
            value: "+75%",
            direction: "up"
          }}
        />
        <StatCard
          title="Solde cumulé"
          value={formatMontant(formatMontantDevise(stats.soldeCumule), { devise })}
          icon={<DollarSignIcon className="w-6 h-6 text-blue-500" />}
          trend={{
            value: stats.soldeCumule > 0 ? "+25%" : "-25%",
            direction: stats.soldeCumule > 0 ? "up" : "down"
          }}
        />
        <StatCard
          title="Variation mensuelle"
          value={formatMontant(formatMontantDevise(stats.variationMensuelle), { devise })}
          icon={<ActivityIcon className="w-6 h-6 text-purple-500" />}
          trend={{
            value: stats.variationMensuelle > 0 ? "+10%" : "-10%",
            direction: stats.variationMensuelle > 0 ? "up" : "down"
          }}
        />
      </div>

      {/* Tableau des opérations récentes */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Opérations récentes</h3>
        <RecentOperationsTable operations={operationsRecentes} />
      </div>

      {/* Graphique d'évolution des soldes */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Évolution des soldes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={donneesEvolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value) => {
              const formattedValue = formatMontant(formatMontantDevise(value), { devise });
              return typeof formattedValue === 'string' ? formattedValue : '';
            }} />
            <Tooltip 
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return formatMontant(formatMontantDevise(value), { devise });
                }
                return '';
              }} />
            <Legend />
            <Line
              type="monotone"
              dataKey="solde"
              stroke="#8884d8"
              name="Solde progressif"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphiques de répartition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Répartition par nature */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Répartition par nature</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donneesRepartition}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: any) => {
                  const entry = props.payload;
                  if (entry && typeof entry === 'object' && 'name' in entry && 'value' in entry) {
                    return `${entry.name}: ${formatMontant(formatMontantDevise(entry.value), { devise })}`;
                  }
                  return '';
                }}
              >
                {donneesRepartition.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatMontant(formatMontantDevise(value), { devise })} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recettes et dépenses par nature */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recettes et dépenses par nature</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={donneesParNature}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatMontant(formatMontantDevise(value), { devise })} />
              <Tooltip 
                formatter={(value: any) => {
                  if (typeof value === 'number') {
                    return formatMontant(formatMontantDevise(value), { devise });
                  }
                  return '';
                }}
              />
              <Legend />
              <Bar dataKey="recettes" fill="#82ca9d" name="Recettes" />
              <Bar dataKey="depenses" fill="#8884d8" name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TresorerieDashboard;