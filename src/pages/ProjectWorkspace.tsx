
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectWorkspace as ProjectWorkspaceComponent } from '@/components/project-workspace/ProjectWorkspace';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useProject } from '@/hooks/useProject';

const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { project, loading, error } = useProject(id || '');
  
  console.log('ProjectWorkspace route accessed with ID:', id);
  
  // Update document title and meta tags based on project data
  useEffect(() => {
    if (project) {
      document.title = `Project: ${project.title} | Usergy`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `${project.description.substring(0, 150)}... | Join this AI product insights project on Usergy.`
        );
      }
      
      // Add structured data for JobPosting
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": project.title,
        "description": project.description,
        "datePosted": project.created_at,
        "validThrough": project.deadline,
        "hiringOrganization": {
          "@type": "Organization",
          "name": "Usergy",
          "sameAs": "https://user.usergy.ai"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Remote",
            "addressRegion": "Worldwide"
          }
        },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "value": project.reward,
            "unitText": "USD"
          }
        },
        "employmentType": "CONTRACT",
        "workHours": "Flexible"
      };
      
      // Remove existing structured data script if it exists
      const existingScript = document.querySelector('script[data-project-schema]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Add new structured data script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-project-schema', 'true');
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [project]);
  
  if (!id) {
    console.error('No project ID provided in route');
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h1>
            <p className="text-muted-foreground">The requested project could not be found.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Loading Project...</h1>
            <p className="text-muted-foreground">Please wait while we load the project details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Project</h1>
            <p className="text-muted-foreground">There was an error loading the project. Please try again.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ProjectWorkspaceComponent projectId={id} />
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
