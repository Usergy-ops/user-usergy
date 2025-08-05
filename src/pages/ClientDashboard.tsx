
import React from 'react';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, TrendingUp, Clock } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const stats = [
    { title: 'Active Projects', value: '8', icon: Clock, trend: '+12%' },
    { title: 'Total Contributors', value: '24', icon: Users, trend: '+8%' },
    { title: 'Success Rate', value: '94%', icon: TrendingUp, trend: '+2%' },
    { title: 'Projects Completed', value: '156', icon: Plus, trend: '+18%' },
  ];

  return (
    <UnifiedLayout showSidebar>
      <div className="space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your projects and collaborate with talented contributors
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-green-600 font-medium">
                        {stat.trend}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your latest project activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">Project Alpha {i}</h4>
                    <p className="text-sm text-muted-foreground">
                      Active • {i + 2} contributors
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
};

export default ClientDashboard;
