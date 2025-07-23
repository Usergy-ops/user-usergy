
import React, { useState } from 'react';
import { Target, Calendar, DollarSign, Trophy, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Goal {
  id: number;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'earnings' | 'projects' | 'rating' | 'skills';
  deadline: Date;
  status: 'active' | 'completed' | 'overdue';
  category: string;
}

export const GoalsTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: 1,
      title: 'Monthly Earnings Target',
      description: 'Reach $1,500 in earnings this month',
      target: 1500,
      current: 1200,
      type: 'earnings',
      deadline: new Date('2024-02-29'),
      status: 'active',
      category: 'Financial'
    },
    {
      id: 2,
      title: 'Project Completion Goal',
      description: 'Complete 15 projects by month end',
      target: 15,
      current: 12,
      type: 'projects',
      deadline: new Date('2024-02-29'),
      status: 'active',
      category: 'Productivity'
    },
    {
      id: 3,
      title: 'Skill Development',
      description: 'Master 3 new AI/ML skills',
      target: 3,
      current: 2,
      type: 'skills',
      deadline: new Date('2024-03-15'),
      status: 'active',
      category: 'Professional'
    }
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings': return DollarSign;
      case 'projects': return Target;
      case 'rating': return Trophy;
      case 'skills': return Calendar;
      default: return Target;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'earnings': return `$${value}`;
      case 'projects': return `${value} projects`;
      case 'rating': return `${value}/5`;
      case 'skills': return `${value} skills`;
      default: return `${value}`;
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goals & Targets</h2>
          <p className="text-gray-600">Track your progress and achievements</p>
        </div>
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input id="title" placeholder="Enter goal title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Describe your goal" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Goal Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="earnings">Earnings</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="skills">Skills</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target Value</Label>
                  <Input id="target" type="number" placeholder="Enter target" />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddingGoal(false)}>
                  Add Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const IconComponent = getTypeIcon(goal.type);
          const progress = calculateProgress(goal.current, goal.target);
          
          return (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <p className="text-sm text-gray-600">{goal.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{goal.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress</span>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{formatValue(goal.current, goal.type)}</span>
                    <span>{formatValue(goal.target, goal.type)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {goal.deadline.toLocaleDateString()}</span>
                  </div>
                  <span className="font-medium text-blue-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
