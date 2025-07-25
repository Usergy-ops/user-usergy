
import { useState, useEffect } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface Project {
  id: string;
  title: string;
  description: string;
  instructions: string;
  deadline: string;
  reward: number;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
  attachments?: ProjectAttachment[];
}

interface ProjectAttachment {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

export const useProject = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching project with ID:', projectId);

        // Mock project data for demonstration
        const mockProject: Project = {
          id: projectId,
          title: 'AI Product Testing Mission',
          description: 'Test and provide feedback on cutting-edge AI products before they launch to the public.',
          instructions: 'This is a comprehensive project where you will test various AI products and provide detailed feedback. Please follow the instructions carefully and document your findings.',
          deadline: '2024-12-31',
          reward: 500,
          status: 'active',
          progress: 35,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z',
          attachments: [
            {
              id: '1',
              name: 'project-brief.pdf',
              file_path: '/attachments/project-brief.pdf',
              file_size: 2048000,
              file_type: 'application/pdf',
              created_at: '2024-01-15T10:00:00Z'
            },
            {
              id: '2',
              name: 'requirements.docx',
              file_path: '/attachments/requirements.docx',
              file_size: 1024000,
              file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              created_at: '2024-01-15T10:05:00Z'
            }
          ]
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Successfully fetched project:', mockProject);
        setProject(mockProject);
      } catch (err) {
        console.error('Error in fetchProject:', err);
        const error = err as Error;
        setError(error);
        handleError(error, 'useProject');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, handleError]);

  return { project, loading, error };
};
