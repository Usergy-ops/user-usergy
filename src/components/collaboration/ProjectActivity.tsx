
import React, { useState, useEffect } from 'react';
import { Activity, User, FileText, CheckCircle, MessageSquare, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ProjectActivityItem {
  id: string;
  user_id: string;
  activity_type: 'created' | 'updated' | 'completed' | 'comment' | 'file_upload' | 'status_change';
  description: string;
  data: any;
  created_at: string;
  user: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ProjectActivityProps {
  projectId: string;
}

export const ProjectActivity: React.FC<ProjectActivityProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ProjectActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    subscribeToActivities();
  }, [projectId]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select(`
          *,
          user:profiles!project_activities_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToActivities = () => {
    const channel = supabase
      .channel(`project_activities:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_activities',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Fetch the new activity with user info
        supabase
          .from('project_activities')
          .select(`
            *,
            user:profiles!project_activities_user_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setActivities(prev => [data, ...prev]);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <User className="w-4 h-4" />;
      case 'updated':
        return <FileText className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'file_upload':
        return <Upload className="w-4 h-4" />;
      case 'status_change':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'created':
        return 'text-blue-600';
      case 'updated':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'comment':
        return 'text-purple-600';
      case 'file_upload':
        return 'text-indigo-600';
      case 'status_change':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Project Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user.avatar_url} />
                    <AvatarFallback>
                      {activity.user.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={getActivityColor(activity.activity_type)}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <span className="font-medium text-sm">{activity.user.full_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.activity_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
