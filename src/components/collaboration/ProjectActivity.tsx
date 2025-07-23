import React, { useState, useEffect } from 'react';
import { Activity, User, FileText, CheckCircle, MessageSquare, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'created' | 'updated' | 'completed' | 'comment' | 'file_upload' | 'status_change';

interface ProjectActivityItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
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
      const { data: activitiesData, error } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user profiles for the activities
      const userIds = [...new Set(activitiesData?.map(a => a.user_id).filter(Boolean) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine activities with user profiles and ensure proper typing
      const activitiesWithUsers: ProjectActivityItem[] = (activitiesData || [])
        .filter(activity => 
          activity.id && 
          activity.user_id && 
          activity.activity_type && 
          activity.description && 
          activity.created_at
        )
        .map(activity => ({
          ...activity,
          activity_type: activity.activity_type as ActivityType,
          user: profiles?.find(p => p.user_id === activity.user_id) || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        }));

      setActivities(activitiesWithUsers);
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
      }, async (payload) => {
        const newActivity = payload.new;
        
        // Validate that all required fields are present
        if (!newActivity.id || !newActivity.user_id || !newActivity.activity_type || !newActivity.description || !newActivity.created_at) {
          console.warn('Incomplete activity data received:', newActivity);
          return;
        }

        // Fetch the user profile for the new activity
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', newActivity.user_id)
          .single();

        // Create complete ProjectActivityItem object
        const typedActivity: ProjectActivityItem = {
          id: newActivity.id,
          user_id: newActivity.user_id,
          activity_type: newActivity.activity_type as ActivityType,
          description: newActivity.description,
          data: newActivity.data,
          created_at: newActivity.created_at,
          user: profile || {
            full_name: 'Unknown User',
            avatar_url: null
          }
        };

        setActivities(prev => [typedActivity, ...prev]);
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
