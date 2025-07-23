
import React from 'react';
import { Lightbulb, TrendingUp, Target, Star, Clock, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  type: 'skill' | 'project' | 'optimization' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  impact: string;
  action: string;
  category: string;
}

export const RecommendationsEngine: React.FC = () => {
  const recommendations: Recommendation[] = [
    {
      id: 1,
      title: 'Expand AI/ML Expertise',
      description: 'Based on market trends, AI/ML projects are growing 45% this quarter. Consider taking specialized courses.',
      type: 'skill',
      priority: 'high',
      impact: 'Potential 30% earnings increase',
      action: 'Explore AI/ML courses',
      category: 'Skill Development'
    },
    {
      id: 2,
      title: 'Optimize Response Time',
      description: 'Your average response time is 2.3h. Top performers respond within 1.5h for better client satisfaction.',
      type: 'optimization',
      priority: 'medium',
      impact: 'Improve client ratings by 0.2 points',
      action: 'Set up notification alerts',
      category: 'Performance'
    },
    {
      id: 3,
      title: 'Target Mobile App Projects',
      description: 'You excel in mobile testing with 4.9/5 ratings. More mobile projects are available in your preferred categories.',
      type: 'opportunity',
      priority: 'high',
      impact: 'Access to 23 new projects',
      action: 'Browse mobile projects',
      category: 'Project Selection'
    },
    {
      id: 4,
      title: 'Join Team Collaborations',
      description: 'Collaborative projects offer 25% higher rewards. Your teamwork score is excellent for group projects.',
      type: 'project',
      priority: 'medium',
      impact: 'Increase average project value',
      action: 'Apply for team projects',
      category: 'Collaboration'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'skill': return Star;
      case 'project': return Target;
      case 'optimization': return TrendingUp;
      case 'opportunity': return Lightbulb;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'skill': return 'bg-purple-50 text-purple-600';
      case 'project': return 'bg-blue-50 text-blue-600';
      case 'optimization': return 'bg-green-50 text-green-600';
      case 'opportunity': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
          <p className="text-gray-600">Personalized insights to boost your success</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          AI-Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((recommendation) => {
          const IconComponent = getTypeIcon(recommendation.type);
          
          return (
            <Card key={recommendation.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                      <p className="text-sm text-gray-600">{recommendation.category}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority} priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{recommendation.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      {recommendation.impact}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Recommended action: {recommendation.action}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  Take Action
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Weekly Insight</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-gray-700">
              You're performing 23% better than similar users this week! Your strengths in mobile testing and quick response times are setting you apart.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">Top 15% performer</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">94% completion rate</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">2.3h avg response</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
