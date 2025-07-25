import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle, CircleDot, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CompletionCelebration } from '../shared/CompletionCelebration';

interface TasksViewProps {
  project: any;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const TaskCard: React.FC<{ task: any; onComplete: (task: any) => void }> = ({ task, onComplete }) => {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: CircleDot,
      label: 'Pending'
    },
    in_progress: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: AlertCircle,
      label: 'In Progress'
    },
    completed: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: CheckCircle,
      label: 'Completed'
    }
  };

  const status = statusConfig[task.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {task.title}
              </h3>
              <Badge variant="outline" className="text-xs">
                {task.type}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{task.estimatedTime}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due {formatDate(task.dueDate)}</span>
              </span>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {task.description}
              </p>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-3 ml-4">
            <Badge className={cn("flex items-center space-x-1", status.color)}>
              <StatusIcon className="w-3 h-3" />
              <span>{status.label}</span>
            </Badge>
            
            <Button 
              className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
              disabled={task.status === 'completed'}
              onClick={() => task.status !== 'completed' && onComplete(task)}
            >
              {task.status === 'completed' ? 'Completed' : 'Start Task'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const TasksView: React.FC<TasksViewProps> = ({ project }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTask, setCompletedTask] = useState<any>(null);

  const handleTaskComplete = (task: any) => {
    setCompletedTask(task);
    setShowCelebration(true);
  };
  const tasks = [
    {
      id: '1',
      title: 'Initial Product Evaluation',
      type: 'survey',
      status: 'pending',
      dueDate: '2025-08-10',
      estimatedTime: '15 mins',
      description: 'Complete the initial evaluation survey to provide your first impressions of the AI product.'
    },
    {
      id: '2',
      title: 'Feature Testing Checklist',
      type: 'task',
      status: 'in_progress',
      dueDate: '2025-08-12',
      estimatedTime: '30 mins',
      description: 'Go through the comprehensive feature testing checklist and document your findings.'
    },
    {
      id: '3',
      title: 'Performance Benchmark Test',
      type: 'task',
      status: 'pending',
      dueDate: '2025-08-14',
      estimatedTime: '20 mins',
      description: 'Run performance benchmark tests and record response times and accuracy metrics.'
    },
    {
      id: '4',
      title: 'Final Feedback Survey',
      type: 'survey',
      status: 'pending',
      dueDate: '2025-08-15',
      estimatedTime: '10 mins',
      description: 'Submit your final comprehensive feedback about the overall product experience.'
    }
  ];

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Tasks & Surveys
        </h1>
        <p className="text-muted-foreground">
          Complete all assigned tasks and surveys to progress through the project.
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress Overview</span>
            <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00C6FB] to-[#005BEA] transition-all duration-1000"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedTasks} of {totalTasks} tasks completed</span>
              <span>{totalTasks - completedTasks} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
        ))}
      </div>

      {/* Completion Celebration */}
      <CompletionCelebration
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type="task"
        title="Task Completed!"
        description={`Great work on "${completedTask?.title}"`}
        reward={5}
      />

      {/* Help Section */}
      <Card className="bg-muted/30 border border-border/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
          <p className="text-muted-foreground mb-4">
            If you encounter any issues with the tasks or need clarification, don't hesitate to reach out.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};