
import React, { useState, useMemo } from 'react';
import { Filter, Calendar, DollarSign, Play, MoreVertical, Search, SortAsc, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { EnhancedProjectCard } from '../EnhancedProjectCard';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

export const YourProjectsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [filterByStatus, setFilterByStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Enhanced mock data with more realistic project information
  const activeProjects = [
    {
      id: 1,
      title: 'AI-Powered Recipe Generator',
      description: 'Help test and improve our revolutionary AI that creates personalized recipes based on dietary preferences, allergies, and cooking skills.',
      progress: 75,
      deadline: new Date('2024-02-15'),
      reward: 250,
      completedTasks: 6,
      totalTasks: 8,
      pointsEarned: 450,
      category: 'ai',
      client: 'FoodTech Innovation',
      status: 'active',
      difficulty: 'Medium',
      estimatedTime: '2-3 hours',
      tags: ['AI', 'Food', 'Machine Learning'],
      urgency: 'high',
      collaboration: true,
      teamSize: 5,
      feedback: 4.8
    },
    {
      id: 2,
      title: 'Mobile Banking App Security Testing',
      description: 'Comprehensive security and usability testing of new mobile banking features including biometric authentication and transaction monitoring.',
      progress: 40,
      deadline: new Date('2024-02-20'),
      reward: 180,
      completedTasks: 3,
      totalTasks: 7,
      pointsEarned: 220,
      category: 'mobile',
      client: 'SecureBank',
      status: 'active',
      difficulty: 'High',
      estimatedTime: '4-5 hours',
      tags: ['Mobile', 'Security', 'Banking'],
      urgency: 'medium',
      collaboration: false,
      teamSize: 1,
      feedback: 4.9
    },
    {
      id: 3,
      title: 'E-commerce Platform UX Review',
      description: 'Evaluate user experience and provide detailed feedback on checkout flow optimization and mobile responsiveness improvements.',
      progress: 90,
      deadline: new Date('2024-02-10'),
      reward: 320,
      completedTasks: 9,
      totalTasks: 10,
      pointsEarned: 680,
      category: 'web',
      client: 'ShopNext',
      status: 'completing',
      difficulty: 'Easy',
      estimatedTime: '1-2 hours',
      tags: ['UX', 'E-commerce', 'Mobile'],
      urgency: 'low',
      collaboration: true,
      teamSize: 3,
      feedback: 4.7
    },
    {
      id: 4,
      title: 'Smart Home IoT Device Testing',
      description: 'Test the functionality and user interface of next-generation smart home devices including voice control and automation features.',
      progress: 25,
      deadline: new Date('2024-02-25'),
      reward: 280,
      completedTasks: 2,
      totalTasks: 8,
      pointsEarned: 150,
      category: 'iot',
      client: 'HomeTech Solutions',
      status: 'active',
      difficulty: 'Medium',
      estimatedTime: '3-4 hours',
      tags: ['IoT', 'Smart Home', 'Voice Control'],
      urgency: 'medium',
      collaboration: true,
      teamSize: 4,
      feedback: 4.6
    }
  ];

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = activeProjects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterByStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterByStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return a.deadline.getTime() - b.deadline.getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'reward':
          return b.reward - a.reward;
        case 'urgency':
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, sortBy, filterByStatus]);

  const loading = false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return <EmptyStateWithIllustration type="projects" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">Your Active Projects</h2>
          <p className="text-gray-600">
            {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? 's' : ''} • 
            ${activeProjects.reduce((sum, p) => sum + p.reward, 0)} total value
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search projects, tags, or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={filterByStatus} onValueChange={setFilterByStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completing">Completing</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="reward">Reward</SelectItem>
              <SelectItem value="urgency">Urgency</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project Results */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
            : 'space-y-4'
          }
        `}>
          {filteredAndSortedProjects.map((project) => (
            <EnhancedProjectCard 
              key={project.id} 
              project={project} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
