
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-50 rounded-xl">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
          {trend && (
            <div className="text-xs text-green-600 font-medium mt-1">
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
