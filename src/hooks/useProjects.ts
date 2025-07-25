
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from './useErrorHandler';

interface Project {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  progress: number;
  deadline: string;
  created_at: string;
}

interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  projects?: {
    title: string;
    description: string;
    reward: number;
  };
}

export const useProjects = () => {
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching user projects...');

        // Fetch active projects the user participates in
        const { data: activeProjectsData, error: activeError } = await supabase
          .from('projects')
          .select(`
            *,
            project_participants!inner(user_id, status)
          `)
          .eq('project_participants.user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'active');

        if (activeError) {
          console.error('Error fetching active projects:', activeError);
          throw activeError;
        }

        // Fetch completed projects
        const { data: completedProjectsData, error: completedError } = await supabase
          .from('projects')
          .select(`
            *,
            project_participants!inner(user_id, status)
          `)
          .eq('project_participants.user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('status', 'completed');

        if (completedError) {
          console.error('Error fetching completed projects:', completedError);
          throw completedError;
        }

        // Fetch invitations
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('project_invitations')
          .select(`
            *,
            projects(title, description, reward)
          `)
          .eq('email', (await supabase.auth.getUser()).data.user?.email)
          .eq('status', 'pending');

        if (invitationsError) {
          console.error('Error fetching invitations:', invitationsError);
          throw invitationsError;
        }

        console.log('Successfully fetched projects data:', {
          active: activeProjectsData?.length || 0,
          completed: completedProjectsData?.length || 0,
          invitations: invitationsData?.length || 0
        });

        setActiveProjects(activeProjectsData || []);
        setCompletedProjects(completedProjectsData || []);
        setInvitations(invitationsData || []);
      } catch (err) {
        console.error('Error in fetchProjects:', err);
        const error = err as Error;
        setError(error);
        handleError(error, 'useProjects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [handleError]);

  return { 
    activeProjects, 
    invitations, 
    completedProjects, 
    loading, 
    error 
  };
};
