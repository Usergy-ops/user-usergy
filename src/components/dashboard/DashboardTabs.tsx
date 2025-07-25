import React, { useState } from 'react';
import { Rocket, Mail, Search, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActiveProjectCard from './ActiveProjectCard';
import InvitationCard from './InvitationCard';
import EmptyStateBrowse from './EmptyStateBrowse';
import CompletedProjectCard from './CompletedProjectCard';

// Mock data
const mockActiveProject = {
  id: '1',
  name: 'AI Product Testing Mission',
  description: 'Test and provide feedback on cutting-edge AI tools',
  reward: 15,
  progress: 75,
  status: 'active'
};

const mockInvitation = {
  id: '2',
  name: 'Mobile App Usability Study',
  description: 'Help shape the future of mobile productivity apps',
  reward: 15,
  expiresIn: '2d 14h',
  isNew: true
};

const mockCompletedProject = {
  id: '3',
  name: 'E-commerce Platform Review',
  description: 'Evaluated checkout flow and user experience',
  completedDate: 'July 20, 2025',
  status: 'approved',
  paymentStatus: 'paid',
  reward: 15
};

const DashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  
  const tabs = [
    { id: 'projects', label: 'Your Projects', icon: Rocket },
    { id: 'invitations', label: 'Invitations', icon: Mail },
    { id: 'browse', label: 'Browse Public Projects', icon: Search },
    { id: 'past', label: 'Your Past Projects', icon: Clock }
  ];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="projects" className="w-full">
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
        
        {/* Tab Content */}
        <div className="min-h-[400px]">
          <TabsContent value="projects" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActiveProjectCard project={mockActiveProject} />
              {/* Add more active projects here */}
            </div>
          </TabsContent>
          
          <TabsContent value="invitations" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InvitationCard invitation={mockInvitation} />
              {/* Add more invitations here */}
            </div>
          </TabsContent>
          
          <TabsContent value="browse" className="mt-0">
            <EmptyStateBrowse />
          </TabsContent>
          
          <TabsContent value="past" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CompletedProjectCard project={mockCompletedProject} />
              {/* Add more completed projects here */}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;