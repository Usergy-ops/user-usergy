
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  reward_amount: number;
  deadline: string;
  required_skills: string[];
  status: string;
  client_name: string;
  client_avatar_url?: string;
  max_participants: number;
  current_participants: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('Fetching projects...');
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }

      console.log('Projects fetched:', data);
      return data as Project[];
    },
  });
};

export const useProjectInvitations = () => {
  return useQuery({
    queryKey: ['project-invitations'],
    queryFn: async () => {
      console.log('Fetching project invitations...');
      const { data, error } = await supabase
        .from('project_invitations')
        .select(`
          *,
          projects!inner(
            id,
            title,
            description,
            category,
            difficulty_level,
            reward_amount,
            client_name,
            client_avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project invitations:', error);
        throw error;
      }

      console.log('Project invitations fetched:', data);
      return data;
    },
  });
};
