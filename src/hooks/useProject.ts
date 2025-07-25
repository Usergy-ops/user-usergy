
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

        // Fetch project data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          throw projectError;
        }

        // Fetch project attachments
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from('project_attachments')
          .select('*')
          .eq('project_id', projectId);

        if (attachmentsError) {
          console.error('Error fetching attachments:', attachmentsError);
          throw attachmentsError;
        }

        // Format file sizes for display
        const formattedAttachments = attachmentsData?.map(attachment => ({
          ...attachment,
          size: formatFileSize(attachment.file_size),
          type: attachment.file_type,
          url: attachment.file_path
        })) || [];

        const fullProject = {
          ...projectData,
          attachments: formattedAttachments
        };

        console.log('Successfully fetched project:', fullProject);
        setProject(fullProject);
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

// Helper function to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
