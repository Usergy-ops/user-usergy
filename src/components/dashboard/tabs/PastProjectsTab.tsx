
import React, { useState } from 'react';
import { Trophy, Calendar, DollarSign, Star, Award, Target, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { EmptyStateWithIllustration } from '../EmptyStateWithIllustration';

interface CompletedProject {
  id: number;
  title: string;
  description: string;
  client: string;
  reward: number;
  completedAt: Date;
  rating: number;
  feedback: string;
  category: string;
  difficulty: string;
  pointsEarned: number;
  achievements: string[];
  collaborators: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  earned: boolean;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const PastProjectsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock completed projects data
  const completedProjects: CompletedProject[] = [
    {
      id: 1,
      title: 'AI-Powered Recipe Generator',
      description: 'Tested and validated an AI model for personalized recipe generation',
      client: 'FoodTech Innovation',
      reward: 250,
      completedAt: new Date('2024-01-15'),
      rating: 4.9,
      feedback: 'Exceptional attention to detail and thorough testing. Would love to work again!',
      category: 'AI',
      difficulty: 'Medium',
      pointsEarned: 450,
      achievements: ['AI Pioneer', 'Detail Master', 'Client Favorite'],
      collaborators: 3
    },
    {
      id: 2,
      title: 'Mobile Banking Security Testing',
      description: 'Comprehensive security testing for mobile banking application',
      client: 'SecureBank',
      reward: 320,
      completedAt: new Date('2024-01-08'),
      rating: 4.8,
      feedback: 'Outstanding security expertise and professional communication.',
      category: 'Security',
      difficulty: 'Hard',
      pointsEarned: 580,
      achievements: ['Security Expert', 'Perfect Score', 'Team Player'],
      collaborators: 5
    }
  ];

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: 1,
      title: 'First Project Complete',
      description: 'Successfully complete your first project',
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      progress: 1,
      maxProgress: 1,
      earned: true,
      earnedAt: new Date('2024-01-08'),
      rarity: 'common'
    },
    {
      id: 2,
      title: 'AI Pioneer',
      description: 'Complete 5 AI-related projects',
      icon: <Target className="w-6 h-6 text-blue-500" />,
      progress: 1,
      maxProgress: 5,
      earned: false,
      rarity: 'rare'
    },
    {
      id: 3,
      title: 'Perfect Score',
      description: 'Achieve a 5.0 rating on a project',
      icon: <Star className="w-6 h-6 text-purple-500" />,
      progress: 0,
      maxProgress: 1,
      earned: false,
      rarity: 'epic'
    },
    {
      id: 4,
      title: 'Team Leader',
      description: 'Lead 10 collaborative projects',
      icon: <Users className="w-6 h-6 text-green-500" />,
      progress: 2,
      maxProgress: 10,
      earned: false,
      rarity: 'legendary'
    },
    {
      id: 5,
      title: 'High Earner',
      description: 'Earn $1,000 in total rewards',
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      progress: 570,
      maxProgress: 1000,
      earned: false,
      rarity: 'rare'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats
  const totalEarned = completedProjects.reduce((sum, p) => sum + p.reward, 0);
  const totalPoints = completedProjects.reduce((sum, p) => sum + p.pointsEarned, 0);
  const averageRating = completedProjects.reduce((sum, p) => sum + p.rating, 0) / completedProjects.length;
  const earnedAchievements = achievements.filter(a => a.earned).length;

  if (completedProjects.length === 0) {
    return <EmptyStateWithIllustration type="history" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Explorer Journey</h2>
          <p className="text-gray-600">
            {completedProjects.length} project{completedProjects.length !== 1 ? 's' : ''} completed • 
            {earnedAchievements} achievement{earnedAchievements !== 1 ? 's' : ''} earned
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">${totalEarned}</div>
            <div className="text-sm text-gray-500">Total Earned</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
            <div className="text-sm text-gray-500">Total Points</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{completedProjects.length}</div>
                <div className="text-sm text-gray-500">Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-500">Avg Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{earnedAchievements}</div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(averageRating * 20)}%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${project.client}&background=random`} />
                      <AvatarFallback>{project.client.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-gray-500">{project.client}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(project.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{project.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">${project.reward}</div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(project.completedAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.filter(a => a.earned).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-gray-500">{achievement.description}</div>
                      <Badge className={`mt-1 ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {achievement.earnedAt && formatDistanceToNow(achievement.earnedAt, { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          {completedProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(project.difficulty)}>
                        {project.difficulty}
                      </Badge>
                      <Badge variant="outline">{project.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${project.reward}</div>
                    <div className="text-sm text-gray-500">
                      Completed {formatDistanceToNow(project.completedAt, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Client and Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${project.client}&background=random`} />
                      <AvatarFallback>{project.client.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{project.client}</div>
                      <div className="text-sm text-gray-500">{project.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(project.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{project.rating}</span>
                  </div>
                </div>
                
                {/* Feedback */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 italic">"{project.feedback}"</div>
                </div>
                
                {/* Achievements */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Achievements Earned:</div>
                  <div className="flex flex-wrap gap-2">
                    {project.achievements.map((achievement, index) => (
                      <Badge key={index} variant="secondary">
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>{project.pointsEarned} points earned</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{project.collaborators} collaborators</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={`transition-all duration-300 ${
                achievement.earned ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.title}</div>
                      <Badge className={`mt-1 ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {achievement.earned && achievement.earnedAt && (
                    <div className="mt-4 text-xs text-green-600">
                      Earned {formatDistanceToNow(achievement.earnedAt, { addSuffix: true })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
