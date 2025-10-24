import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  change?: string;
  changeType?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change, changeType, trend }) => {
  const bgColor = trend?.direction === 'up' ? 'bg-green-50' : 'bg-red-50';
  
  // Support pour l'ancien format avec change et changeType
  const displayTrend = trend || (change && changeType ? {
    value: change,
    direction: changeType === 'increase' ? 'up' as const : 'down' as const
  } : undefined);

  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm ${trend ? bgColor : 'bg-gray-50'} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {displayTrend && (
            <p className={`text-sm ${displayTrend.direction === 'up' ? 'text-green-600' : 'text-red-600'} font-medium`}>
              {displayTrend.value}
            </p>
          )}
        </div>
        <div className={`p-3 ${color || 'bg-blue-100'} rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );
}