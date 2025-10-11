import React from 'react';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import type { Alert } from '../../lib/supabase';

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export default function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Alertes et Notifications</h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p>Aucune alerte en cours</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 ${getAlertStyles(alert.type)} border-l-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{alert.entity}</span>
                        <span>•</span>
                        <span>{new Date(alert.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="ml-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}