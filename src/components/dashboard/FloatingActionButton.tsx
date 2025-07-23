
import React, { useState } from 'react';
import { Plus, Search, Mail, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FloatingActionButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    { icon: Search, label: 'Browse Projects', color: 'from-blue-500 to-indigo-600' },
    { icon: Mail, label: 'Check Invitations', color: 'from-purple-500 to-pink-600' },
    { icon: Zap, label: 'Quick Apply', color: 'from-green-500 to-teal-600' }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        
        {/* Expanded Actions */}
        {isExpanded && (
          <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-5">
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 animate-in slide-in-from-right-5"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="bg-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700 whitespace-nowrap">
                    {action.label}
                  </span>
                  <button
                    className={`
                      w-12 h-12 bg-gradient-to-r ${action.color} rounded-full shadow-lg 
                      flex items-center justify-center hover:scale-110 transition-transform duration-200
                    `}
                  >
                    <ActionIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
            rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
            ${isExpanded ? 'rotate-45' : 'hover:scale-110'}
          `}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};
