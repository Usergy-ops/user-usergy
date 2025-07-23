
import React, { useState } from 'react';
import { Briefcase, Mail, Search, Archive, BarChart3 } from 'lucide-react';
import { YourProjectsTab } from './tabs/YourProjectsTab';
import { InvitationsTab } from './tabs/InvitationsTab';
import { BrowseProjectsTab } from './tabs/BrowseProjectsTab';
import { PastProjectsTab } from './tabs/PastProjectsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';

export const DashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');

  const tabs = [
    { id: 'projects', label: 'Your Projects', icon: Briefcase, count: 3 },
    { id: 'invitations', label: 'Invitations', icon: Mail, count: 2, badge: true },
    { id: 'browse', label: 'Browse Public Projects', icon: Search, count: 24 },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3, count: 0 },
    { id: 'history', label: 'Your Past Projects', icon: Archive, count: 12 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium
              ${activeTab === tab.id 
                ? 'bg-white shadow-sm text-blue-600' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}
              `}>
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'projects' && <YourProjectsTab />}
        {activeTab === 'invitations' && <InvitationsTab />}
        {activeTab === 'browse' && <BrowseProjectsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'history' && <PastProjectsTab />}
      </div>
    </div>
  );
};
