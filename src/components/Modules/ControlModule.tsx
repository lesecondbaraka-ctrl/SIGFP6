import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

interface ControlCheck {
  id: string;
  type: 'automatic' | 'manual';
  category: string;
  description: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  entity: string;
  timestamp: string;
  details?: string;
}

export default function ControlModule() {
  const [activeTab, setActiveTab] = useState('realtime');

  const controlChecks: ControlCheck[] = [
    {
      id: '1',
      type: 'automatic',
      category: 'Conformité Budgétaire',
      description: 'Vérification des limites budgétaires - Ministère de la Santé',
      status: 'failed',
      entity: 'MIN-SANTE',
      timestamp: '2024-01-15 14:30',
      details: 'Dépassement de 15% du budget alloué pour les médicaments'
    },
    {
      id: '2',
      type: 'automatic',
      category: 'Validation Documentaire',
      description: 'Contrôle des pièces justificatives - Achat équipements',
      status: 'warning',
      entity: 'MIN-EDUC',
      timestamp: '2024-01-15 13:45',
      details: 'Documents incomplets - Facture manquante'
    },
    {
      id: '3',
      type: 'automatic',
      category: 'Contrôle de Signature',
      description: 'Validation des signatures électroniques',
      status: 'passed',
      entity: 'MIN-INFRA',
      timestamp: '2024-01-15 12:15'
    },
    {
      id: '4',
      type: 'manual',
      category: 'Audit Seuil',
      description: 'Transaction dépassant le seuil automatique (>100M CDF)',
      status: 'pending',
      entity: 'MIN-MINES',
      timestamp: '2024-01-15 11:00',
      details: 'Demande d\'approbation IGF requise'
    }
  ];

  const getStatusIcon = (status: ControlCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ControlCheck['status']) => {
    const styles = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    };

    const labels = {
      passed: 'Validé',
      failed: 'Rejeté',
      warning: 'Attention',
      pending: 'En attente'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeIcon = (type: ControlCheck['type']) => {
    return type === 'automatic' ? (
      <div className="bg-blue-100 p-1 rounded-full">
        <Shield className="h-3 w-3 text-blue-600" />
      </div>
    ) : (
      <div className="bg-purple-100 p-1 rounded-full">
        <Shield className="h-3 w-3 text-purple-600" />
      </div>
    );
  };

  const stats = {
    total: controlChecks.length,
    passed: controlChecks.filter(c => c.status === 'passed').length,
    failed: controlChecks.filter(c => c.status === 'failed').length,
    warning: controlChecks.filter(c => c.status === 'warning').length,
    pending: controlChecks.filter(c => c.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contrôle Interne</h2>
        <p className="text-gray-600">Vérifications automatiques et alertes en cas d'anomalies</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Contrôles</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.passed}</p>
            <p className="text-sm text-gray-600">Validés</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-600">Rejetés</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            <p className="text-sm text-gray-600">Avertissements</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">En attente</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('realtime')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'realtime'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Contrôles en Temps Réel
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Historique
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'config'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Configuration
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'realtime' && (
            <div className="space-y-4">
              {controlChecks.map((check) => (
                <div key={check.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(check.status)}
                        {getTypeIcon(check.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {check.description}
                          </h4>
                          {getStatusBadge(check.status)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                          <span className="bg-gray-200 px-2 py-1 rounded">
                            {check.category}
                          </span>
                          <span>{check.entity}</span>
                          <span>•</span>
                          <span>{check.timestamp}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {check.type === 'automatic' ? 'Automatique' : 'Manuel'}
                          </span>
                        </div>
                        
                        {check.details && (
                          <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                            {check.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Historique des contrôles des 30 derniers jours</p>
              <button className="mt-4 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Générer Rapport
              </button>
            </div>
          )}
          
          {activeTab === 'config' && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Configuration des règles de contrôle</p>
              <button className="mt-4 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                Modifier Configuration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}