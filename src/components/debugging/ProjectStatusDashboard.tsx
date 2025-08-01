
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, FileText, Database, Code, Layers, Settings } from 'lucide-react';

interface PhaseStatus {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: React.ReactNode;
  items: Array<{
    name: string;
    completed: boolean;
    description?: string;
  }>;
}

export const ProjectStatusDashboard: React.FC = () => {
  const phases: PhaseStatus[] = [
    {
      id: 'phase1',
      title: 'Phase 1: Backend Setup & Edge Functions',
      description: 'Core backend infrastructure and authentication',
      status: 'completed',
      icon: <Database className="w-5 h-5" />,
      items: [
        { name: 'Unified Auth Edge Function', completed: true, description: 'Handles sign up/sign in with OTP' },
        { name: 'Rate Limiting System', completed: true, description: 'Enhanced rate limiting with escalation' },
        { name: 'Error Handling System', completed: true, description: 'Centralized error management' },
        { name: 'Email Integration', completed: true, description: 'Resend email service integration' },
        { name: 'Account Type Detection', completed: true, description: 'Domain-based account type assignment' }
      ]
    },
    {
      id: 'phase2',
      title: 'Phase 2: Database Schema & Migrations',
      description: 'Database structure and security policies',
      status: 'completed',
      icon: <FileText className="w-5 h-5" />,
      items: [
        { name: 'Authentication Tables', completed: true, description: 'OTP verification and account types' },
        { name: 'Profile Management Schema', completed: true, description: 'User profiles with completion tracking' },
        { name: 'Rate Limiting Tables', completed: true, description: 'Standard and enhanced rate limiting' },
        { name: 'Error Logging Schema', completed: true, description: 'Comprehensive error tracking' },
        { name: 'Client Workflow Integration', completed: true, description: 'Client-specific data structures' },
        { name: 'RLS Policies', completed: true, description: 'Row-level security for all tables' },
        { name: 'Database Functions', completed: true, description: 'Utility functions for system operations' }
      ]
    },
    {
      id: 'phase3',
      title: 'Phase 3: Frontend Component Updates',
      description: 'React components and authentication flow',
      status: 'completed',
      icon: <Code className="w-5 h-5" />,
      items: [
        { name: 'Enhanced Authentication Forms', completed: true, description: 'Sign up/sign in with account type detection' },
        { name: 'OTP Verification Component', completed: true, description: 'Real-time OTP verification with rate limiting' },
        { name: 'Account Type Management', completed: true, description: 'Account type guards and status displays' },
        { name: 'System Monitoring Dashboard', completed: true, description: 'Admin tools for system health' },
        { name: 'Error Boundary Updates', completed: true, description: 'Enhanced error handling in components' },
        { name: 'Profile Management UI', completed: true, description: 'User and client profile interfaces' }
      ]
    },
    {
      id: 'phase4',
      title: 'Phase 4: Type System Completion',
      description: 'TypeScript definitions and validation',
      status: 'completed',
      icon: <Layers className="w-5 h-5" />,
      items: [
        { name: 'API Response Types', completed: true, description: 'Comprehensive API type definitions' },
        { name: 'Component Interface Types', completed: true, description: 'Props and state type definitions' },
        { name: 'Hook Return Types', completed: true, description: 'Custom hook type definitions' },
        { name: 'Utility Types', completed: true, description: 'Helper types for enhanced type safety' },
        { name: 'Validation Schema Types', completed: true, description: 'Form and data validation types' },
        { name: 'Error Types', completed: true, description: 'Structured error handling types' }
      ]
    },
    {
      id: 'phase5',
      title: 'Phase 5: Performance & Monitoring',
      description: 'Performance optimization and system monitoring',
      status: 'completed',
      icon: <Settings className="w-5 h-5" />,
      items: [
        { name: 'Performance Utilities', completed: true, description: 'Debounce, throttle, memoization' },
        { name: 'Resource Management', completed: true, description: 'Memory and resource optimization' },
        { name: 'Monitoring System', completed: true, description: 'Real-time system health monitoring' },
        { name: 'Automated Cleanup', completed: true, description: 'Background cleanup of expired records' },
        { name: 'Error Analytics', completed: true, description: 'Error tracking and analysis' }
      ]
    }
  ];

  const getStatusIcon = (status: PhaseStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PhaseStatus['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedItems = phases.reduce((acc, phase) => 
    acc + phase.items.filter(item => item.completed).length, 0
  );

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Project Implementation Status</span>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{completedPhases}/{phases.length} Phases</Badge>
              <Badge variant="default">{completedItems}/{totalItems} Items</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round((completedItems / totalItems) * 100)}%</div>
              <div className="text-sm text-green-700">Overall Completion</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedPhases}</div>
              <div className="text-sm text-blue-700">Completed Phases</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{completedItems}</div>
              <div className="text-sm text-purple-700">Completed Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Details */}
      <div className="grid grid-cols-1 gap-6">
        {phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {phase.icon}
                  <span>{phase.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(phase.status)}
                  {getStatusBadge(phase.status)}
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phase.items.map((item, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-start space-x-3">
                      {item.completed ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                        )}
                      </div>
                    </div>
                    {item.completed && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Done
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">All core phases completed successfully!</span>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Implementation Complete</h4>
              <p className="text-sm text-green-700">
                The project now has a robust, production-ready authentication system with:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                <li>Secure authentication with OTP verification</li>
                <li>Advanced rate limiting and security measures</li>
                <li>Comprehensive error handling and monitoring</li>
                <li>Type-safe TypeScript implementation</li>
                <li>Performance optimizations and cleanup systems</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🚀 Ready for Production</h4>
              <p className="text-sm text-blue-700">
                The system is now ready for production use with all security measures, 
                monitoring, and performance optimizations in place.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
