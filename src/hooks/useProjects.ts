
import { useState, useEffect } from 'react';
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

        // Mock data for demonstration
        const mockActiveProjects: Project[] = [
          {
            id: '1',
            title: 'AI Product Testing Mission',
            description: 'Test and provide feedback on cutting-edge AI products before they launch to the public.',
            reward: 500,
            status: 'active',
            progress: 35,
            deadline: '2024-12-31',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            title: 'Mobile App UX Review',
            description: 'Evaluate the user experience of a new mobile application and provide detailed feedback.',
            reward: 300,
            status: 'active',
            progress: 60,
            deadline: '2024-11-30',
            created_at: '2024-01-10T09:00:00Z'
          }
        ];

        const mockInvitations: ProjectInvitation[] = [
          {
            id: '1',
            project_id: '3',
            email: 'user@example.com',
            status: 'pending',
            expires_at: '2024-02-15T10:00:00Z',
            created_at: '2024-01-25T10:00:00Z',
            projects: {
              title: 'Web Platform Beta Testing',
              description: 'Test a new web platform and provide comprehensive feedback on functionality and usability.',
              reward: 750
            }
          }
        ];

        const mockCompletedProjects: Project[] = [
          {
            id: '4',
            title: 'E-commerce Site Testing',
            description: 'Comprehensive testing of an e-commerce platform focusing on checkout process and user flow.',
            reward: 400,
            status: 'completed',
            progress: 100,
            deadline: '2024-01-15',
            created_at: '2023-12-01T10:00:00Z'
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        console.log('Successfully fetched projects data:', {
          active: mockActiveProjects.length,
          completed: mockCompletedProjects.length,
          invitations: mockInvitations.length
        });

        setActiveProjects(mockActiveProjects);
        setCompletedProjects(mockCompletedProjects);
        setInvitations(mockInvitations);
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
