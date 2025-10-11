import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  const trendColor = trend?.direction === 'up' ? 'text-green-600' : 'text-red-600';
  const bgColor = trend?.direction === 'up' ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm ${trend ? bgColor : 'bg-gray-50'} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {trend && (
            <p className={`text-sm ${trendColor} font-medium`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}