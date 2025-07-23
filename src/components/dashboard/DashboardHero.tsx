
import React from 'react';
import { Zap, Award, Star, Search, Users, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { AnimatedNetworkNodes } from './AnimatedNetworkNodes';
import { InteractiveProjectExplorer } from './InteractiveProjectExplorer';

interface DashboardHeroProps {
  user: {
    full_name?: string;
    completion_percentage?: number;
  };
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ user }) => {
  // Mock stats for now - these would come from actual data
  const stats = {
    activeProjects: 3,
    totalEarnings: 1247,
    completedProjects: 8
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 mb-8">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <AnimatedNetworkNodes />
      </div>
      
      {/* Content */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Welcome Content */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {user.full_name || 'Explorer'}
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Ready to explore groundbreaking products and shape the future of technology?
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard 
              icon={<Zap className="w-5 h-5 text-yellow-500" />}
              value={stats.activeProjects}
              label="Active Projects"
              trend="+2 this week"
            />
            <StatCard 
              icon={<Award className="w-5 h-5 text-green-500" />}
              value={`$${stats.totalEarnings}`}
              label="Total Earned"
              trend="+$156 this month"
            />
            <StatCard 
              icon={<Star className="w-5 h-5 text-purple-500" />}
              value={stats.completedProjects}
              label="Completed"
              trend="95% success rate"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
              <Search className="w-4 h-4 mr-2" />
              Browse New Projects
            </Button>
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <Users className="w-4 h-4 mr-2" />
              View Invitations
            </Button>
          </div>
        </div>
        
        {/* Interactive Illustration */}
        <div className="flex justify-center">
          <InteractiveProjectExplorer />
        </div>
      </div>
    </div>
  );
};
