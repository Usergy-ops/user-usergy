
import React from 'react';
import { TrendingUp, Target, Clock, Star, Award, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export const PerformanceInsights: React.FC = () => {
  const insights = [
    {
      title: 'Completion Rate',
      value: 94,
      benchmark: 87,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Above average completion rate'
    },
    {
      title: 'Average Rating',
      value: 4.8,
      benchmark: 4.2,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Excellent client feedback'
    },
    {
      title: 'Response Time',
      value: 2.3,
      benchmark: 4.1,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Faster than average response'
    },
    {
      title: 'Collaboration Score',
      value: 91,
      benchmark: 78,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Strong team collaboration'
    }
  ];

  const achievements = [
    { title: 'Top Performer', description: 'Ranked in top 10% this month', icon: Award, color: 'bg-gold-100 text-gold-800' },
    { title: 'Speed Demon', description: 'Completed 5 projects ahead of schedule', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { title: 'Quality Expert', description: 'Maintained 4.8+ rating for 3 months', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
    { title: 'Team Player', description: 'Participated in 12 collaborative projects', icon: Users, color: 'bg-purple-100 text-purple-800' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Performance Insights</h2>
        <p className="text-gray-600">Your key performance metrics and achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${insight.bgColor} ${insight.color}`}>
                    <insight.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {insight.title === 'Response Time' ? 'Fast' : 'Excellent'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {insight.title === 'Response Time' ? `${insight.value}h` : 
                     insight.title === 'Average Rating' ? insight.value : `${insight.value}%`}
                  </span>
                  <span className="text-sm text-gray-500">
                    vs {insight.title === 'Response Time' ? `${insight.benchmark}h` : 
                         insight.title === 'Average Rating' ? insight.benchmark : `${insight.benchmark}%`} avg
                  </span>
                </div>
                <Progress 
                  value={insight.title === 'Response Time' ? 
                    (insight.benchmark / insight.value) * 100 : 
                    (insight.value / (insight.title === 'Average Rating' ? 5 : 100)) * 100
                  } 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <p className="text-sm text-gray-600">Your latest accomplishments and milestones</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className={`p-2 rounded-lg ${achievement.color}`}>
                  <achievement.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
