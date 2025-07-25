
import React, { useState } from 'react';
import { Rocket, Mail, Search, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveProjectCard from './ActiveProjectCard';
import InvitationCard from './InvitationCard';
import EmptyStateBrowse from './EmptyStateBrowse';
import CompletedProjectCard from './CompletedProjectCard';
import { useProjects } from '@/hooks/useProjects';

const DashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const { activeProjects, invitations, completedProjects, loading, error } = useProjects();
  
  const tabs = [
    { id: 'projects', label: 'Your Projects', icon: Rocket },
    { id: 'invitations', label: 'Invitations', icon: Mail },
    { id: 'browse', label: 'Browse Public Projects', icon: Search },
    { id: 'past', label: 'Your Past Projects', icon: Clock }
  ];

  // Format invitations for display
  const formattedInvitations = invitations.map(invitation => ({
    id: invitation.id,
    name: invitation.projects?.title || 'Unknown Project',
    description: invitation.projects?.description || '',
    reward: invitation.projects?.reward || 0,
    expiresIn: formatTimeRemaining(invitation.expires_at),
    isNew: new Date(invitation.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  }));

  // Format completed projects for display
  const formattedCompletedProjects = completedProjects.map(project => ({
    id: project.id,
    name: project.title,
    description: project.description,
    completedDate: new Date(project.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    status: 'approved' as const,
    paymentStatus: 'paid' as const,
    reward: project.reward
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-1 border border-border/50 mb-6">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => (
              <Skeleton key={tab.id} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Projects</h3>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred while loading your projects.'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Custom tab navigation with premium styling */}
        <div className="relative bg-card/50 backdrop-blur-sm rounded-xl p-1 border border-border/50 mb-6">
          <TabsList className="grid grid-cols-4 gap-1 bg-transparent p-0 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg 
                          transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00C6FB] 
                          data-[state=active]:to-[#005BEA] data-[state=active]:text-white text-muted-foreground 
                          hover:text-foreground data-[state=active]:shadow-lg"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {/* Tab Content - Keep content mounted to prevent reload */}
        <div className="min-h-[400px]">
          <TabsContent value="projects" className="mt-0" forceMount>
            <div className={`${activeTab === 'projects' ? 'block' : 'hidden'}`}>
              {activeProjects.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Active Projects</h3>
                  <p className="text-muted-foreground">You don't have any active projects at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProjects.map((project) => (
                    <ActiveProjectCard 
                      key={project.id}
                      project={{
                        id: project.id,
                        name: project.title,
                        description: project.description,
                        reward: project.reward,
                        progress: project.progress,
                        status: project.status
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="invitations" className="mt-0" forceMount>
            <div className={`${activeTab === 'invitations' ? 'block' : 'hidden'}`}>
              {formattedInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Invitations</h3>
                  <p className="text-muted-foreground">You don't have any pending invitations.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formattedInvitations.map((invitation) => (
                    <InvitationCard key={invitation.id} invitation={invitation} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="browse" className="mt-0" forceMount>
            <div className={activeTab === 'browse' ? 'block' : 'hidden'}>
              <EmptyStateBrowse />
            </div>
          </TabsContent>
          
          <TabsContent value="past" className="mt-0" forceMount>
            <div className={`${activeTab === 'past' ? 'block' : 'hidden'}`}>
              {formattedCompletedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Projects</h3>
                  <p className="text-muted-foreground">You haven't completed any projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formattedCompletedProjects.map((project) => (
                    <CompletedProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Helper function to format time remaining
const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Expired';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    return `${hours}h`;
  }
};

export default DashboardTabs;
