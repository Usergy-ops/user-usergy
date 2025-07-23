
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const CategoryAnalytics: React.FC = () => {
  const categoryData = [
    { name: 'AI & ML', value: 35, earnings: 1200, projects: 12, color: '#3b82f6' },
    { name: 'Mobile', value: 25, earnings: 850, projects: 8, color: '#10b981' },
    { name: 'Web', value: 20, earnings: 680, projects: 7, color: '#f59e0b' },
    { name: 'IoT', value: 15, earnings: 520, projects: 5, color: '#8b5cf6' },
    { name: 'Other', value: 5, earnings: 180, projects: 2, color: '#ef4444' }
  ];

  const skillData = [
    { skill: 'User Testing', proficiency: 95, demand: 88 },
    { skill: 'AI/ML', proficiency: 87, demand: 92 },
    { skill: 'Mobile Apps', proficiency: 82, demand: 85 },
    { skill: 'Web Development', proficiency: 78, demand: 80 },
    { skill: 'IoT Devices', proficiency: 75, demand: 75 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Category Analytics</h2>
        <p className="text-gray-600">Your expertise distribution and market insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Distribution</CardTitle>
            <p className="text-sm text-gray-600">Your work across different categories</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <p className="text-sm text-gray-600">Earnings by category over time</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                  <Bar dataKey="earnings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Proficiency & Market Demand</CardTitle>
          <p className="text-sm text-gray-600">Your skill levels vs market demand</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillData.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {skill.proficiency}% proficient
                    </Badge>
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {skill.demand}% demand
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Your Proficiency</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${skill.proficiency}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Market Demand</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${skill.demand}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
