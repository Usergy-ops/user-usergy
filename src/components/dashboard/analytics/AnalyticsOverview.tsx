
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, Award, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsMetric {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const AnalyticsOverview: React.FC = () => {
  const metrics: AnalyticsMetric[] = [
    {
      title: 'Total Earnings',
      value: '$2,847',
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Projects Completed',
      value: '47',
      change: 8.2,
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Average Rating',
      value: '4.8',
      change: 0.3,
      trend: 'up',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      title: 'Time Invested',
      value: '142h',
      change: -5.1,
      trend: 'down',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'Active Projects',
      value: '4',
      change: 25.0,
      trend: 'up',
      icon: Users,
      color: 'text-indigo-600'
    },
    {
      title: 'This Month',
      value: '12',
      change: 15.8,
      trend: 'up',
      icon: Calendar,
      color: 'text-rose-600'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-gray-600">Your performance metrics and insights</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Last 30 days
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                  <metric.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
