import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { TresorerieService } from '../../services/TresorerieService';

/**
 * Composant de graphiques interactifs pour le module Trésorerie
 * Conforme IPSAS 2 - Présentation des flux de trésorerie
 */

interface GraphiquesTresorerieProps {
  exerciceId: string;
}

// Couleurs professionnelles pour les graphiques
const COLORS = {
  recettes: '#10b981', // green-500
  depenses: '#ef4444', // red-500
  solde: '#3b82f6', // blue-500
  fonctionnement: '#8b5cf6', // violet-500
  investissement: '#f59e0b', // amber-500
  financement: '#06b6d4', // cyan-500
  dette: '#ec4899', // pink-500
  fiscalite: '#14b8a6', // teal-500
  subvention: '#a855f7', // purple-500
  transfert: '#6366f1', // indigo-500
};

export default function GraphiquesTresorerie({ exerciceId }: GraphiquesTresorerieProps): React.ReactElement {
  const [fluxMensuels, setFluxMensuels] = useState<any[]>([]);
  const [fluxParNature, setFluxParNature] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerDonnees();
  }, [exerciceId]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      // Charger les données depuis les fonctions RPC
      const [mensuels, nature] = await Promise.all([
        TresorerieService.getResumeMensuel(exerciceId),
        TresorerieService.getRepartitionFluxParNature(exerciceId)
      ]);

      setFluxMensuels(mensuels || []);
      setFluxParNature(nature || []);
    } catch (error) {
      console.error('Erreur chargement graphiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des graphiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique 1: Évolution Mensuelle des Flux */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <TrendingUp className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Évolution Mensuelle des Flux</h3>
            <p className="text-sm text-gray-600">Encaissements vs Décaissements (Conforme IPSAS 2)</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={fluxMensuels} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="mois" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="encaissements" 
              stroke={COLORS.recettes}
              strokeWidth={3}
              name="Encaissements"
              dot={{ fill: COLORS.recettes, r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="decaissements" 
              stroke={COLORS.depenses}
              strokeWidth={3}
              name="Décaissements"
              dot={{ fill: COLORS.depenses, r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="solde" 
              stroke={COLORS.solde}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Solde Net"
              dot={{ fill: COLORS.solde, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Encaissements</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(fluxMensuels.reduce((sum, m) => sum + m.encaissements, 0))}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Décaissements</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(fluxMensuels.reduce((sum, m) => sum + m.decaissements, 0))}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Solde Net</p>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(fluxMensuels.reduce((sum, m) => sum + m.solde, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Graphique 2: Répartition par Nature (IPSAS) */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-3 rounded-lg mr-4">
            <PieChartIcon className="text-purple-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Répartition des Flux par Nature</h3>
            <p className="text-sm text-gray-600">Classification conforme IPSAS 2 / SYSCOHADA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fluxParNature}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, pourcentage_total }: any) => `${name}: ${formatPercent(Number(pourcentage_total) || 0)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="solde"
              >
                {fluxParNature.map((entry, index) => {
                  const colorKey = entry.nature_flux.toLowerCase() as keyof typeof COLORS;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[colorKey] || COLORS.solde} 
                    />
                  );
                })}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {fluxParNature.map((nature, index) => {
              const colorKey = nature.nature_flux.toLowerCase() as keyof typeof COLORS;
              const color = COLORS[colorKey] || COLORS.solde;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{nature.nature_flux}</p>
                      <p className="text-xs text-gray-500">{nature.nombre_operations} opérations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color }}>
                      {formatCurrency(nature.solde)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPercent(nature.pourcentage_total)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graphique 3: Comparaison Encaissements vs Décaissements */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-amber-100 p-3 rounded-lg mr-4">
            <BarChart3 className="text-amber-600" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Comparaison Mensuelle</h3>
            <p className="text-sm text-gray-600">Analyse des flux mensuels</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={fluxMensuels} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="mois" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="encaissements" 
              fill={COLORS.recettes}
              name="Encaissements"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="decaissements" 
              fill={COLORS.depenses}
              name="Décaissements"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>📊 Analyse:</strong> Les graphiques ci-dessus présentent les flux de trésorerie conformément à 
            la norme IPSAS 2 (Tableau des flux de trésorerie) et au SYSCOHADA révisé.
          </p>
        </div>
      </div>
    </div>
  );
}
