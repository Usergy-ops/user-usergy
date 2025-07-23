
import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Award } from 'lucide-react';
import { AnalyticsOverview } from '../analytics/AnalyticsOverview';
import { EarningsChart } from '../analytics/EarningsChart';
import { PerformanceInsights } from '../analytics/PerformanceInsights';
import { CategoryAnalytics } from '../analytics/CategoryAnalytics';

export const AnalyticsTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'categories', label: 'Categories', icon: PieChart }
  ];

  return (
    <div className="space-y-6">
      
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-xl">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium
              ${activeSection === section.id 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            <section.icon className="w-4 h-4" />
            <span>{section.label}</span>
          </button>
        ))}
      </div>
      
      {/* Section Content */}
      <div className="min-h-[600px]">
        {activeSection === 'overview' && <AnalyticsOverview />}
        {activeSection === 'earnings' && <EarningsChart />}
        {activeSection === 'performance' && <PerformanceInsights />}
        {activeSection === 'categories' && <CategoryAnalytics />}
      </div>
    </div>
  );
};
