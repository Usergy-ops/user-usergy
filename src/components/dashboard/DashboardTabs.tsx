import React, { Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveProjectCard from './ActiveProjectCard';
import InvitationCard from './InvitationCard';
import PublicProjectCard from './PublicProjectCard';
import CompletedProjectCard from './CompletedProjectCard';
import EmptyState from './EmptyState';
import { Briefcase, Mail, Globe, Archive } from 'lucide-react';

// Mock data - placeholder projects as requested
const mockActiveProject = {
  id: '1',
  name: 'E-commerce Platform Redesign',
  progress: 75,
  status: 'Active'
};

const mockPublicProject = {
  id: '1',
  name: 'Mobile App User Testing',
  reward: 25,
  description: 'Help test a new mobile application and provide feedback on user experience, interface design, and overall functionality.'
};

const mockCompletedProject = {
  id: '1',
  name: 'Website Accessibility Audit',
  completionDate: 'March 15, 2024',
  status: 'Approved' as const,
  paymentStatus: 'Paid' as const
};

const DashboardTabs: React.FC = () => {
  return (
    <div className="w-full">
      <Tabs defaultValue="active" className="w-full">
        {/* Premium Tab Interface */}
        <div className="bg-background/50 backdrop-blur-sm rounded-xl p-2 mb-8 border border-border/50">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 h-auto p-0">
            <TabsTrigger 
              value="active" 
              className="relative px-4 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5CF6] data-[state=active]:to-[#D946EF] data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-primary hover:shadow-sm rounded-lg"
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Your Projects
              {/* Animated underline for active state */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="invitations" 
              className="relative px-4 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5CF6] data-[state=active]:to-[#D946EF] data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-primary hover:shadow-sm rounded-lg"
            >
              <Mail className="mr-2 h-4 w-4" />
              Invitations
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="browse" 
              className="relative px-4 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5CF6] data-[state=active]:to-[#D946EF] data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-primary hover:shadow-sm rounded-lg"
            >
              <Globe className="mr-2 h-4 w-4" />
              Browse Public Projects
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="completed" 
              className="relative px-4 py-3 text-sm font-medium tracking-[0.02em] transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8B5CF6] data-[state=active]:to-[#D946EF] data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-primary hover:shadow-sm rounded-lg"
            >
              <Archive className="mr-2 h-4 w-4" />
              Your Past Projects
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-left"></div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents with Lazy Loading */}
        <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>}>
          
          {/* Your Projects Tab */}
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActiveProjectCard project={mockActiveProject} />
            </div>
          </TabsContent>

          {/* Invitations Tab - Empty state for validation */}
          <TabsContent value="invitations" className="mt-6">
            <EmptyState
              title="No Invitations Yet"
              message="You'll see project invitations here when creators want to work with you. Check back soon!"
              icon={<Mail className="h-6 w-6" />}
            />
          </TabsContent>

          {/* Browse Public Projects Tab */}
          <TabsContent value="browse" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PublicProjectCard project={mockPublicProject} />
            </div>
          </TabsContent>

          {/* Your Past Projects Tab */}
          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CompletedProjectCard project={mockCompletedProject} />
            </div>
          </TabsContent>
          
        </Suspense>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;