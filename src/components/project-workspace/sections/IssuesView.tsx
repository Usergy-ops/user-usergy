import React, { useState } from 'react';
import { Bug, AlertTriangle, Info, CheckCircle, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { IssueModal } from '../modals/IssueModal';
import { cn } from '@/lib/utils';

interface IssuesViewProps {
  project: any;
}

const EmptyState: React.FC<{ icon: any; title: string; description: string }> = ({ 
  icon: Icon, 
  title, 
  description 
}) => {
  return (
    <Card className="bg-muted/30 border border-border/50">
      <CardContent className="p-12 text-center">
        <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const IssueCard: React.FC<{ issue: any }> = ({ issue }) => {
  const severityConfig = {
    low: {
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: Info,
      label: 'Low'
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: AlertTriangle,
      label: 'Medium'
    },
    high: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      icon: Bug,
      label: 'High'
    },
    critical: {
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      icon: AlertTriangle,
      label: 'Critical'
    }
  };

  const statusConfig = {
    open: {
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      label: 'Open'
    },
    in_progress: {
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      label: 'In Progress'
    },
    resolved: {
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      label: 'Resolved'
    }
  };

  const severity = severityConfig[issue.severity as keyof typeof severityConfig];
  const status = statusConfig[issue.status as keyof typeof statusConfig];
  const SeverityIcon = severity.icon;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <SeverityIcon className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">{issue.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={severity.color}>
              {severity.label}
            </Badge>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{issue.description}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Reported by {issue.reporter}</span>
          <span>{issue.date}</span>
        </div>
        
        {issue.steps && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Steps to Reproduce:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              {issue.steps.map((step: string, index: number) => (
                <li key={index} className="flex">
                  <span className="mr-2">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const IssuesView: React.FC<IssuesViewProps> = ({ project }) => {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [issues, setIssues] = useState([
    {
      id: '1',
      title: 'AI response timeout on complex queries',
      description: 'When submitting queries with more than 500 words, the AI takes over 30 seconds to respond and sometimes times out completely.',
      severity: 'high',
      status: 'open',
      reporter: 'Sarah Chen',
      date: '2025-07-20',
      steps: [
        'Open the AI query interface',
        'Paste a complex text with 500+ words',
        'Submit the query',
        'Wait for response - timeout occurs after 30s'
      ]
    },
    {
      id: '2',
      title: 'Feature suggestion: Dark mode toggle',
      description: 'It would be great to have a dark mode option in the settings for better usability during night testing sessions.',
      severity: 'low',
      status: 'in_progress',
      reporter: 'Marcus Johnson',
      date: '2025-07-19',
      steps: null
    },
    {
      id: '3',
      title: 'Memory leak in continuous testing mode',
      description: 'After running tests for 2+ hours, the application becomes sluggish and eventually crashes. Memory usage increases continuously.',
      severity: 'critical',
      status: 'open',
      reporter: 'Emily Rodriguez',
      date: '2025-07-18',
      steps: [
        'Enable continuous testing mode',
        'Run tests for 2+ hours',
        'Monitor memory usage in task manager',
        'Observe performance degradation and eventual crash'
      ]
    }
  ]);

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || issue.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const issueStats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Report Issues
          </h1>
          <p className="text-muted-foreground">
            Help improve the product by reporting bugs and suggesting features.
          </p>
        </div>
        <Button 
          onClick={() => setShowIssueModal(true)}
          className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit Issue
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{issueStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{issueStats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{issueStats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{issueStats.resolved}</div>
            <div className="text-sm text-muted-foreground">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className={cn(
                'capitalize',
                selectedFilter === filter && 'bg-gradient-to-r from-[#00C6FB] to-[#005BEA]'
              )}
            >
              {filter.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Issues List */}
      {filteredIssues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Bug}
          title={searchTerm || selectedFilter !== 'all' ? 'No matching issues found' : 'No issues reported yet'}
          description={searchTerm || selectedFilter !== 'all' 
            ? 'Try adjusting your search or filter criteria.' 
            : 'If you encounter any problems, please report them using the button above.'
          }
        />
      )}
      
      {/* Issue submission modal */}
      <IssueModal 
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        onSubmit={(issueData) => {
          const newIssue = {
            ...issueData,
            id: Date.now().toString(),
            status: 'open',
            reporter: 'You',
            date: new Date().toISOString().split('T')[0]
          };
          setIssues([newIssue, ...issues]);
          setShowIssueModal(false);
        }}
      />
    </div>
  );
};