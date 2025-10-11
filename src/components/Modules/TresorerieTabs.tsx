import React, { useState, useEffect } from 'react';
import { TresorerieService } from '../../services/TresorerieService';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface TabContentProps {
  exerciceId: string;
}

// Composant pour l'onglet "Par Nature"
const ParNatureTab: React.FC<TabContentProps> = ({ exerciceId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await TresorerieService.getFluxParNature(exerciceId);
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erreur lors du chargement des flux par nature:', error);
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [exerciceId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nature" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="encaissements" fill="#4CAF50" name="Encaissements" />
          <Bar dataKey="decaissements" fill="#f44336" name="Décaissements" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Composant pour l'onglet "Évolution Mensuelle"
const EvolutionMensuelleTab: React.FC<TabContentProps> = ({ exerciceId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await TresorerieService.getResumeMensuel(exerciceId);
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erreur lors du chargement de l\'évolution mensuelle:', error);
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [exerciceId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mois" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="encaissements" stroke="#4CAF50" name="Encaissements" />
          <Line type="monotone" dataKey="decaissements" stroke="#f44336" name="Décaissements" />
          <Line type="monotone" dataKey="solde" stroke="#2196F3" name="Solde" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Composant pour l'onglet "Prévisions vs Réalisations"
const PrevisionsTab: React.FC<TabContentProps> = ({ exerciceId }) => {
  const [data, setData] = useState<{
    montantPrevu: number;
    montantRealise: number;
    ecart: number;
    pourcentageRealisation: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const result = await TresorerieService.getPrevisionsFlux(exerciceId);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Erreur lors du chargement des prévisions:', error);
          setError('Erreur lors du chargement des données');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [exerciceId]);

  if (loading) return <div className="flex justify-center items-center h-96">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>;

  if (error) return <div className="text-red-600 p-4">{error}</div>;

  if (!data) return <div className="text-gray-600 p-4">Aucune donnée disponible</div>;

  const pieData = [
    { name: 'Réalisé', value: data.montantRealise },
    { name: 'Non Réalisé', value: Math.max(0, data.montantPrevu - data.montantRealise) }
  ];

  const colors = ['#4CAF50', '#f44336'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((_item, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">Réalisation des Objectifs</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Montant Prévu</p>
              <p className="text-lg font-semibold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(data.montantPrevu)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Montant Réalisé</p>
              <p className="text-lg font-semibold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(data.montantRealise)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Écart</p>
              <p className={`text-lg font-semibold ${data.ecart >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(data.ecart)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux de Réalisation</p>
              <p className="text-lg font-semibold">{data.pourcentageRealisation.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal pour gérer les onglets
const TresorerieTabs: React.FC<TabContentProps> = ({ exerciceId }) => {
  const [activeTab, setActiveTab] = useState('nature');

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('nature')}
            className={`${
              activeTab === 'nature'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Par Nature
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`${
              activeTab === 'evolution'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Évolution Mensuelle
          </button>
          <button
            onClick={() => setActiveTab('previsions')}
            className={`${
              activeTab === 'previsions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Prévisions vs Réalisations
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'nature' && <ParNatureTab exerciceId={exerciceId} />}
        {activeTab === 'evolution' && <EvolutionMensuelleTab exerciceId={exerciceId} />}
        {activeTab === 'previsions' && <PrevisionsTab exerciceId={exerciceId} />}
      </div>
    </div>
  );
};

export default TresorerieTabs;