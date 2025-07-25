
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Clock, CheckCircle, Users, MessageSquare } from "lucide-react";
import ActiveProjectCard from './ActiveProjectCard';
import CompletedProjectCard from './CompletedProjectCard';
import InvitationCard from './InvitationCard';
import EmptyStateBrowse from './EmptyStateBrowse';

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('active');

  // Mock data with proper IDs
  const activeProjects = [
    {
      id: '1', // Ensure this has a proper string ID
      name: 'AI Product Testing Mission',
      description: 'Test and provide feedback on cutting-edge AI tools to help shape the future of artificial intelligence',
      reward: 15,
      progress: 75,
      status: 'active'
    },
    {
      id: '2',
      name: 'Mobile App User Experience Study',
      description: 'Evaluate the user interface and experience of a new mobile application',
      reward: 12,
      progress: 40,
      status: 'active'
    }
  ];

  const completedProjects = [
    {
      id: '3',
      name: 'Voice Assistant Evaluation',
      description: 'Test voice recognition accuracy and response quality',
      reward: 18,
      completedDate: '2024-01-15',
      rating: 4.8,
      status: 'completed',
      paymentStatus: 'paid'
    }
  ];

  const invitations = [
    {
      id: '4',
      name: 'Smart Home Device Testing',
      description: 'Test IoT devices and smart home integration',
      reward: 25,
      deadline: '2024-02-10',
      difficulty: 'Medium',
      expiresIn: '3 days',
      isNew: true
    }
  ];

  console.log('Active projects with IDs:', activeProjects);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active
            <Badge variant="secondary" className="ml-1">
              {activeProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed
            <Badge variant="secondary" className="ml-1">
              {completedProjects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Invitations
            <Badge variant="secondary" className="ml-1">
              {invitations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Browse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Active Projects</h2>
            <p className="text-muted-foreground">
              Continue working on your current assignments
            </p>
          </div>
          
          {activeProjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((project) => (
                <ActiveProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <EmptyStateBrowse />
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Completed Projects</h2>
            <p className="text-muted-foreground">
              Review your finished work and earnings
            </p>
          </div>
          
          {completedProjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedProjects.map((project) => (
                <CompletedProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No Completed Projects</CardTitle>
                <CardDescription>
                  Complete your first project to see it here
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Project Invitations</h2>
            <p className="text-muted-foreground">
              Accept invitations to join new projects
            </p>
          </div>
          
          {invitations.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => (
                <InvitationCard key={invitation.id} invitation={invitation} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No Invitations</CardTitle>
                <CardDescription>
                  Project invitations will appear here
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="browse">
          <EmptyStateBrowse />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardTabs;
