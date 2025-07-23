
import React from 'react';
import { Filter, Calendar, DollarSign, Play, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '../ProjectCard';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

export const YourProjectsTab: React.FC = () => {
  // Mock data for now
  const activeProjects = [
    {
      id: 1,
      title: 'AI-Powered Recipe Generator',
      description: 'Help test and improve our revolutionary AI that creates personalized recipes based on dietary preferences.',
      progress: 75,
      deadline: new Date('2024-02-15'),
      reward: 250,
      completedTasks: 6,
      totalTasks: 8,
      pointsEarned: 450,
      category: 'ai',
      client: 'FoodTech Innovation'
    },
    {
      id: 2,
      title: 'Mobile Banking App Testing',
      description: 'Comprehensive testing of new mobile banking features including biometric authentication.',
      progress: 40,
      deadline: new Date('2024-02-20'),
      reward: 180,
      completedTasks: 3,
      totalTasks: 7,
      pointsEarned: 220,
      category: 'mobile',
      client: 'SecureBank'
    },
    {
      id: 3,
      title: 'E-commerce Platform UX Review',
      description: 'Evaluate user experience and provide feedback on checkout flow optimization.',
      progress: 90,
      deadline: new Date('2024-02-10'),
      reward: 320,
      completedTasks: 9,
      totalTasks: 10,
      pointsEarned: 680,
      category: 'web',
      client: 'ShopNext'
    }
  ];

  const loading = false;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (activeProjects.length === 0) {
    return <EmptyStateWithIllustration type="projects" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Active Projects</h2>
          <p className="text-gray-600">Projects you're currently exploring and contributing to</p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter & Sort
        </Button>
      </div>
      
      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};
